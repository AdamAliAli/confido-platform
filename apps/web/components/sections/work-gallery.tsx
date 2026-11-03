'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { image, poster, srcSet, video, type GalleryItem } from '@/lib/cloudinary';
import { safeHref } from '@/lib/media-url';
import { workImage, workSrcSet, type WorkItem } from '@/lib/work-items';
import { SectionHeader } from './section-header';

const sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';
const WorkDeck = dynamic(() => import('./work-deck').then(module => module.WorkDeck), {
  loading: () => <div className="h-[520px]" role="status" aria-label="Loading work cards" />,
});

function GalleryVideo({ item }: { item: GalleryItem }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    let visible = false;
    const update = () => {
      const play = visible && !motion.matches && !connection?.saveData && !document.hidden;
      setActive(play);
      if (!play) element.pause();
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5; update(); }, { threshold: [0, 0.5] });
    observer.observe(element);
    motion.addEventListener('change', update);
    connection?.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); element.pause(); motion.removeEventListener('change', update); connection?.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => { if (active) void ref.current?.play().catch(() => {}); }, [active]);
  return <><img src={poster(item.publicId, 800, item.cloudName)} srcSet={srcSet(item)} sizes={sizes} width={item.width} height={item.height} loading="lazy" decoding="async" alt={item.title} className="h-full w-full object-cover" /><video ref={ref} src={active ? video(item.publicId, 800, item.cloudName) : undefined} muted loop playsInline preload="none" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover ${active ? '' : 'invisible'}`} /><Play aria-hidden="true" className="absolute right-3 top-3 h-6 w-6 rounded-full bg-black/50 p-1" /></>;
}

function Viewer({ items, start, close }: { items: WorkItem[]; start: number; close: () => void }) {
  const [index, setIndex] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const item = items[index];
  const href = 'href' in item ? safeHref(item.href) : undefined;
  function move(delta: number) { setIndex(current => (current + delta + items.length) % items.length); }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(current => (current - 1 + items.length) % items.length); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setIndex(current => (current + 1) % items.length); }
      if (event.key === 'Tab') {
        const focusable = ref.current?.querySelectorAll<HTMLElement>('button, a[href], video[controls], [tabindex="0"]');
        if (!focusable?.length) { event.preventDefault(); return; }
        const first = focusable[0], last = focusable[focusable.length - 1];
        const outside = !ref.current?.contains(document.activeElement);
        if (event.shiftKey && (outside || document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (outside || document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [close, items.length]);
  return createPortal(<div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="gallery-viewer-title" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-6 text-white outline-none" onClick={event => { if (event.target === event.currentTarget) close(); }} onTouchStart={event => { touch.current = event.changedTouches[0].clientX; }} onTouchEnd={event => { if (touch.current !== null) { const delta = event.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1); } touch.current = null; }}>
    <button aria-label="Close viewer" onClick={close} className="absolute right-4 top-4 rounded p-3 focus-visible:ring-2 focus-visible:ring-mint"><X /></button>
    {item.mediaType === 'video' ? <video key={item.id} src={video(item.publicId, 2000, item.cloudName)} controls autoPlay playsInline preload="none" poster={poster(item.publicId, 1200, item.cloudName)} className="max-h-[75vh] max-w-full" /> : <img src={workImage(item, 2000)} alt={item.title} width={item.width} height={item.height} className={`${href ? 'max-h-[65vh]' : 'max-h-[75vh]'} w-auto max-w-full object-contain`} />}
    <h3 id="gallery-viewer-title" className="mt-4 text-center text-lg">{item.title}</h3>{item.client && <p className="text-sm text-white/70">{item.client}</p>}
    {href && <a href={href} className="mt-3 rounded text-sm text-mint underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-mint">Visit project ↗</a>}
    {items.length > 1 && <div className="mt-4 flex gap-6"><button aria-label="Previous item" onClick={() => move(-1)} className="rounded p-2 focus-visible:ring-2 focus-visible:ring-mint"><ChevronLeft /></button><span aria-live="polite">{index + 1} / {items.length}</span><button aria-label="Next item" onClick={() => move(1)} className="rounded p-2 focus-visible:ring-2 focus-visible:ring-mint"><ChevronRight /></button></div>}
  </div>, document.body);
}

export function categoryKey(value: string | null | undefined) { return (value || '').trim().toLowerCase(); }

export function WorkGallery({ items }: { items: WorkItem[] }) {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<number | null>(null);
  const brands = items.filter((item): item is GalleryItem => item.section === 'brand');
  const work = items.filter(item => item.section === 'work');
  const labels = new Map<string, string>();
  for (const item of work) { const key = categoryKey(item.category); if (key && key !== 'all' && !labels.has(key)) labels.set(key, item.category!.trim()); }
  const categories = ['All', ...labels.values()];
  const filtered = work.filter(item => filter === 'All' || categoryKey(item.category) === categoryKey(filter));
  const close = useRef(() => setSelected(null)).current;
  return <>
    {brands.length > 0 && <section aria-label="Brands we worked with" className="bg-[#0b2420] px-6 py-[90px] md:px-[50px]"><p className="mb-10 flex items-center gap-2 text-xs uppercase"><i className="h-2 w-2 bg-mint" aria-hidden="true" />Brands we worked with</p><div className="grid grid-cols-3 md:grid-cols-6">{brands.map(item => <div key={item.id} className="flex min-w-0 items-center justify-center border border-white/[0.06] p-4 md:p-8"><img src={item.mediaType === 'video' ? poster(item.publicId, 400, item.cloudName) : image(item.publicId, 400, item.cloudName)} srcSet={srcSet(item)} sizes="(min-width: 768px) 16vw, 33vw" width={item.width} height={item.height} alt={item.title} loading="lazy" decoding="async" className="max-h-12 w-full object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0" /></div>)}</div></section>}
    <section id="work" aria-labelledby="work-heading" className="bg-[#0b2420] pb-8 text-white lg:min-h-screen"><div className="px-6 pb-5 pt-10 md:px-[50px]"><SectionHeader label="SELECTED WORK" title="Our Work" accent="In Motion" headingId="work-heading" padded={false} /></div><div className="px-6 md:px-[50px]"><div aria-label="Filter work" className="mb-5 flex flex-wrap gap-3">{categories.map(category => <button key={category} aria-pressed={categoryKey(filter) === categoryKey(category)} onClick={() => { setFilter(category); setSelected(null); }} className={`min-w-0 max-w-full break-words rounded-full border px-4 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-mint ${categoryKey(filter) === categoryKey(category) ? 'border-mint text-mint' : 'border-white/20 text-white/70 hover:text-mint'}`}>{category}</button>)}</div>
      {!work.length ? <p className="py-16 text-white/70">New work coming soon.</p> : <WorkDeck key={`${categoryKey(filter)}:${filtered.map(item => item.id).join('|')}`} items={filtered} onOpen={setSelected} viewerOpen={selected !== null}><div className="columns-1 gap-4 md:columns-2 lg:columns-3">{filtered.map((item, index) => <button key={item.id} aria-label={`View ${item.title}`} onClick={() => setSelected(index)} style={{ aspectRatio: `${item.width}/${item.height}` }} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-[#06100e] text-left focus-visible:ring-2 focus-visible:ring-mint">{item.mediaType === 'video' ? <GalleryVideo item={item} /> : <img src={workImage(item, 800)} srcSet={workSrcSet(item)} sizes={sizes} width={item.width} height={item.height} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"><span className="block text-lg">{item.title}</span><span className="text-xs text-white/70">{[item.client, item.category].filter(Boolean).join(' · ')}</span></span></button>)}</div></WorkDeck>}
    </div></section>{selected !== null && <Viewer items={filtered} start={selected} close={close} />}
  </>;
}
