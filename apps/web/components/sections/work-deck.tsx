'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { safeHref } from '@/lib/media-url';
import { poster, srcSet } from '@/lib/cloudinary';
import { workImage, workSrcSet, type WorkItem } from '@/lib/work-items';

type WorkDeckProps = { items: WorkItem[]; onOpen: (index: number) => void; children: ReactNode; viewerOpen?: boolean };
type Shuffle = { index: number; direction: 1 | -1; token: number };
const spring = { type: 'spring', stiffness: 220, damping: 26 } as const;
const stageHeight = 520;

// Fit the actual rotated corners, including the larger highlighted card, inside the stage.
// Unconstrained fans use the requested angles and spacing; tighter stages reduce both.
export function deckGeometry(count: number, width: number, cardWidth: number, cardHeight: number) {
  const middle = (count - 1) / 2;
  const step = count > 1 ? Math.min(10, 70 / (count - 1)) : 0;
  const spread = Math.min(70, 900 / Math.max(count, 1));
  function bounds(fit: number) {
    let left = Infinity, right = -Infinity, bottom = -Infinity;
    for (let index = 0; index < count; index++) {
      const angle = (index - middle) * step * fit * Math.PI / 180;
      for (const scale of [0.85, 0.92]) for (const x of [-cardWidth / 2, cardWidth / 2]) for (const y of [-1.6 * cardHeight, -0.6 * cardHeight]) {
        const px = (index - middle) * spread * fit + scale * (x * Math.cos(angle) - y * Math.sin(angle));
        left = Math.min(left, px); right = Math.max(right, px);
        bottom = Math.max(bottom, (stageHeight - cardHeight) / 2 + 1.6 * cardHeight + scale * (x * Math.sin(angle) + y * Math.cos(angle)) - (scale === 0.92 ? 28 : 0));
      }
    }
    return { extent: Math.max(Math.abs(left), Math.abs(right)), bottom };
  }
  let low = 0, high = 1;
  const available = Math.max(0, width / 2 - 16);
  if (bounds(1).extent > available) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const fit = (low + high) / 2;
      if (bounds(fit).extent <= available) low = fit; else high = fit;
    }
  } else low = 1;
  return { step: step * low, spread: spread * low, y: -Math.max(0, bounds(low).bottom - stageHeight + 16) };
}

export function WorkDeck({ items, onOpen, children, viewerOpen = false }: WorkDeckProps) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [interactionFocus, setInteractionFocus] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [canHover, setCanHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [size, setSize] = useState({ width: 0, cardWidth: 260, cardHeight: 360 });
  const cards = items.slice(0, 12);
  const [order, setOrder] = useState(() => cards.map((_, index) => index));
  const [shuffle, setShuffle] = useState<Shuffle | null>(null);
  const orderRef = useRef(order);
  const shuffleRef = useRef<Shuffle | null>(null);
  const sequence = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const firstTouch = useRef(false);
  const middle = (cards.length - 1) / 2;
  const expanded = hovered || focusWithin || tapped;
  const active = hoveredCard ?? focusedCard;
  const topIndex = order[0] ?? 0;
  const current = cards[topIndex];
  const geometry = deckGeometry(cards.length, size.width, size.cardWidth, size.cardHeight);
  const exitDistance = Math.min(260, Math.max(160, size.width * 0.4));

  const cancelShuffle = useCallback(() => {
    if (shuffleRef.current) { shuffleRef.current = null; setShuffle(null); }
  }, []);
  const startShuffle = useCallback((direction: 1 | -1) => {
    if (cards.length < 2 || shuffleRef.current || viewerOpen || document.hidden || reducedMotion) return;
    const next = { index: orderRef.current[0], direction, token: ++sequence.current };
    shuffleRef.current = next;
    setShuffle(next);
  }, [cards.length, viewerOpen, reducedMotion]);
  const finishShuffle = useCallback((completed: Shuffle) => {
    if (shuffleRef.current !== completed) return;
    const previous = orderRef.current;
    const next = completed.direction === 1
      ? [...previous.slice(1), previous[0]]
      : [previous[previous.length - 1], ...previous.slice(0, -1)];
    orderRef.current = next;
    shuffleRef.current = null;
    setOrder(next); setShuffle(null);
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const visibility = () => { setHidden(document.hidden); if (document.hidden) cancelShuffle(); };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); shuffleRef.current = null; };
  }, [cancelShuffle]);
  useEffect(() => { if (viewerOpen || reducedMotion) cancelShuffle(); }, [viewerOpen, reducedMotion, cancelShuffle]);
  useEffect(() => {
    if (showGrid || reducedMotion) {
      cancelShuffle(); setHovered(false); setFocusWithin(false); setInteractionFocus(false);
      setTapped(false); setHoveredCard(null); setFocusedCard(null);
    }
  }, [showGrid, reducedMotion, cancelShuffle]);
  useEffect(() => {
    if (!mounted || hovered || interactionFocus || tapped || viewerOpen || hidden || reducedMotion || showGrid || cards.length < 2) return;
    const timer = window.setInterval(() => startShuffle(1), 4000);
    return () => window.clearInterval(timer);
  }, [mounted, hovered, interactionFocus, tapped, viewerOpen, hidden, reducedMotion, showGrid, cards.length, startShuffle]);
  useEffect(() => {
    const element = stage.current;
    if (!element || showGrid || reducedMotion) return;
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const desktop = window.matchMedia('(min-width: 768px)');
    const measure = () => {
      setCanHover(mouse.matches);
      setSize({ width: element.clientWidth, cardWidth: desktop.matches ? 260 : 200, cardHeight: desktop.matches ? 360 : 280 });
      if (!mouse.matches) setHovered(false);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    mouse.addEventListener('change', measure); desktop.addEventListener('change', measure);
    return () => { observer.disconnect(); mouse.removeEventListener('change', measure); desktop.removeEventListener('change', measure); };
  }, [showGrid, reducedMotion]);

  function closeFan() {
    cancelShuffle(); setTapped(false); setHovered(false); setFocusWithin(false);
    setHoveredCard(null); setFocusedCard(null);
    stage.current?.focus();
  }

  if ((mounted && reducedMotion) || !current) return children;
  if (showGrid) return <><button type="button" onClick={() => { closeFan(); setShowGrid(false); }} className="mb-6 rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Show card deck</button>{children}</>;

  const href = 'href' in current ? safeHref(current.href) : undefined;
  const year = 'year' in current && (typeof current.year === 'string' || typeof current.year === 'number') ? String(current.year).trim() : '';
  const actionClass = 'group mt-6 inline-flex h-9 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420] md:h-16 md:w-[354px]';
  const action = <><span className="flex w-[155px] items-center justify-center bg-mint text-[13px] text-[#070908] md:min-w-0 md:w-[290px] md:flex-1 md:text-[20px]">{href ? 'Visit project ↗' : 'View project'}</span><span className="flex w-9 shrink-0 items-center justify-center bg-[#d9eee9] text-[#070908] md:w-16" aria-hidden="true"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:h-5 md:w-5" /></span></>;

  return <>
    <div className="grid min-w-0 gap-4 motion-reduce:hidden lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center lg:gap-8"
      onFocusCapture={() => { setInteractionFocus(true); cancelShuffle(); }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteractionFocus(false); }}
    >
      <div aria-label="Current project" className="min-w-0 py-4 lg:py-0">
        <motion.div key={current.id} initial={mounted ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p aria-label={`Project ${topIndex + 1} of ${cards.length}`} className="text-[clamp(48px,6vw,96px)] font-light leading-none tracking-[-0.06em]"><span>{String(topIndex + 1).padStart(2, '0')}</span><span className="text-white/30"> / {String(cards.length).padStart(2, '0')}</span></p>
          <h3 className="mt-6 break-words text-[28px] leading-tight">{current.title}</h3>
          <p className="mt-3 break-words text-[14px] text-white/60">{[current.category?.trim(), year].filter(Boolean).join(' · ')}</p>
        </motion.div>
        {href ? <a href={href} className={actionClass}>{action}</a> : <button type="button" className={actionClass} onClick={() => { cancelShuffle(); onOpen(topIndex); }}>{action}</button>}
        <div className="mt-6 flex gap-3">
          <button type="button" aria-label="Previous project" disabled={cards.length < 2 || !!shuffle} onClick={() => startShuffle(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-mint hover:bg-mint hover:text-[#070908] focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-30"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" aria-label="Next project" disabled={cards.length < 2 || !!shuffle} onClick={() => startShuffle(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-mint hover:bg-mint hover:text-[#070908] focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-30"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="min-w-0"
        onFocusCapture={event => { if (event.target !== stage.current && event.target.matches(':focus-visible')) setFocusWithin(true); }}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setFocusWithin(false); setFocusedCard(null); } }}
      >
        <div
          ref={stage} role="group" aria-label="Selected work card deck" tabIndex={-1}
          data-open={expanded} data-top-index={topIndex} data-shuffling={!!shuffle} className="relative h-[520px] w-full overflow-hidden outline-none"
          onPointerEnter={event => { if (canHover && event.pointerType === 'mouse') { cancelShuffle(); setHovered(true); } }}
          onPointerLeave={event => { if (event.pointerType === 'mouse') { setHovered(false); setHoveredCard(null); setTapped(false); } }}
          onPointerDownCapture={event => { cancelShuffle(); firstTouch.current = event.pointerType !== 'mouse' && !expanded; }}
          onPointerUp={event => { if (event.pointerType !== 'mouse' && event.target === event.currentTarget) setTapped(true); }}
          onKeyDownCapture={event => { firstTouch.current = false; if (event.key === 'Escape') { event.preventDefault(); closeFan(); } }}
        >
          {cards.map((item, index) => {
            const slot = order.indexOf(index);
            const lifted = expanded && active === index;
            const outgoing = shuffle?.index === index;
            const exitX = shuffle ? shuffle.direction * exitDistance : 0;
            return <div key={item.id} className="absolute left-1/2 top-1/2 h-[280px] w-[200px] -translate-x-1/2 -translate-y-1/2 md:h-[360px] md:w-[260px]" style={{ zIndex: outgoing ? cards.length + 2 : lifted ? cards.length + 1 : expanded ? slot : cards.length - slot }}>
              <motion.button
                type="button" aria-label={`View ${item.title}`} data-card-index={index}
                initial={false}
                animate={outgoing ? { x: exitX, y: -24, rotate: shuffle.direction * 12, scale: 0.95 } : {
                  x: expanded ? (slot - middle) * geometry.spread : (slot - middle) * 2,
                  y: expanded ? geometry.y - (lifted ? 28 : 0) : (slot - middle) * 2,
                  rotate: expanded ? (slot - middle) * geometry.step : cards.length > 1 ? -4 + slot * 8 / (cards.length - 1) : 0,
                  scale: expanded ? lifted ? 0.92 : 0.85 : 1,
                }}
                transition={outgoing ? { duration: 0.4, ease: 'easeInOut' } : spring}
                onAnimationComplete={definition => { if (outgoing && shuffle && typeof definition === 'object' && 'x' in definition && definition.x === exitX) finishShuffle(shuffle); }}
                style={{ transformOrigin: '50% 160%' }}
                className="relative block h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#06100e] text-left shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                onPointerEnter={event => { if (canHover && event.pointerType === 'mouse') setHoveredCard(index); }}
                onPointerLeave={() => setHoveredCard(value => value === index ? null : value)}
                onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFocusedCard(index); }}
                onBlur={() => setFocusedCard(null)}
                onClick={() => {
                  if (firstTouch.current || (!canHover && !expanded)) { firstTouch.current = false; setTapped(true); return; }
                  cancelShuffle(); onOpen(index);
                }}
              >
                <img src={item.mediaType === 'video' ? poster(item.publicId, 800, item.cloudName) : workImage(item, 800)} srcSet={item.mediaType === 'video' ? srcSet(item) : workSrcSet(item)} sizes="(min-width: 768px) 260px, 200px" width={item.width} height={item.height} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                {item.mediaType === 'video' && <Play aria-hidden="true" className="absolute right-3 top-3 h-6 w-6 rounded-full bg-black/50 p-1" />}
                <span className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-5 pt-16 transition-opacity duration-200 ${!expanded || lifted ? 'opacity-100' : 'opacity-0'}`}><span className="block text-lg">{item.title}</span><span className="text-xs text-white/70">{item.category}</span></span>
              </motion.button>
            </div>;
          })}
        </div>
        {(items.length > 12 || (expanded && (!canHover || tapped))) && <div className="mt-3 flex flex-wrap justify-center gap-3">
          {expanded && (!canHover || tapped) && <button type="button" onClick={closeFan} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Close</button>}
          {items.length > 12 && <button type="button" onClick={() => { closeFan(); setShowGrid(true); }} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Show all as grid</button>}
        </div>}
      </div>
    </div>
    {!mounted && <div className="hidden motion-reduce:block">{children}</div>}
  </>;
}
