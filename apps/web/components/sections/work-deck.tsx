'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import { poster, srcSet } from '@/lib/cloudinary';
import { workImage, workSrcSet, type WorkItem } from '@/lib/work-items';

type WorkDeckProps = { items: WorkItem[]; onOpen: (index: number) => void; children: ReactNode };
const spring = { type: 'spring', stiffness: 220, damping: 26 } as const;
const stageHeight = 560;

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

export function WorkDeck({ items, onOpen, children }: WorkDeckProps) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [canHover, setCanHover] = useState(false);
  const [size, setSize] = useState({ width: 0, cardWidth: 260, cardHeight: 360 });
  const stage = useRef<HTMLDivElement>(null);
  const firstTouch = useRef(false);
  const instructions = 'work-deck-instructions';
  const cards = items.slice(0, 12);
  const middle = (cards.length - 1) / 2;
  const expanded = hovered || focusWithin || tapped;
  const active = hoveredCard ?? focusedCard;
  const geometry = deckGeometry(cards.length, size.width, size.cardWidth, size.cardHeight);

  useEffect(() => setMounted(true), []);
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
    setTapped(false); setHovered(false); setFocusWithin(false);
    setHoveredCard(null); setFocusedCard(null);
    stage.current?.focus();
  }

  if ((mounted && reducedMotion) || !cards.length) return children;
  if (showGrid) return <><button type="button" onClick={() => { closeFan(); setShowGrid(false); }} className="mb-6 rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Show card deck</button>{children}</>;

  return <>
    <div className="motion-reduce:hidden"
      onFocusCapture={event => { if (event.target !== stage.current && event.target.matches(':focus-visible')) setFocusWithin(true); }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setFocusWithin(false); setFocusedCard(null); } }}
    >
      <div
        ref={stage} role="group" aria-label="Selected work card deck" aria-describedby={instructions} tabIndex={-1}
        data-open={expanded} className="relative h-[560px] w-full outline-none"
        onPointerEnter={event => { if (canHover && event.pointerType === 'mouse') setHovered(true); }}
        onPointerLeave={event => { if (event.pointerType === 'mouse') { setHovered(false); setHoveredCard(null); setTapped(false); } }}
        onPointerDownCapture={event => { firstTouch.current = event.pointerType !== 'mouse' && !expanded; }}
        onPointerUp={event => { if (event.pointerType !== 'mouse' && event.target === event.currentTarget) setTapped(true); }}
        onKeyDownCapture={event => { firstTouch.current = false; if (event.key === 'Escape') { event.preventDefault(); closeFan(); } }}
      >
        {cards.map((item, index) => {
          const lifted = expanded && active === index;
          return <div key={item.id} className="absolute left-1/2 top-1/2 h-[280px] w-[200px] -translate-x-1/2 -translate-y-1/2 md:h-[360px] md:w-[260px]" style={{ zIndex: lifted ? cards.length + 1 : expanded ? index : cards.length - index }}>
            <motion.button
              type="button" aria-label={`View ${item.title}`} data-card-index={index}
              initial={false}
              animate={{
                x: expanded ? (index - middle) * geometry.spread : (index - middle) * 2,
                y: expanded ? geometry.y - (lifted ? 28 : 0) : (index - middle) * 2,
                rotate: expanded ? (index - middle) * geometry.step : cards.length > 1 ? -4 + index * 8 / (cards.length - 1) : 0,
                scale: expanded ? lifted ? 0.92 : 0.85 : 1,
              }}
              transition={spring} style={{ transformOrigin: '50% 160%' }}
              className="relative block h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#06100e] text-left shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
              onPointerEnter={event => { if (canHover && event.pointerType === 'mouse') setHoveredCard(index); }}
              onPointerLeave={() => setHoveredCard(current => current === index ? null : current)}
              onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFocusedCard(index); }}
              onBlur={() => setFocusedCard(null)}
              onClick={() => {
                if (firstTouch.current || (!canHover && !expanded)) { firstTouch.current = false; setTapped(true); return; }
                onOpen(index);
              }}
            >
              <img src={item.mediaType === 'video' ? poster(item.publicId, 800, item.cloudName) : workImage(item, 800)} srcSet={item.mediaType === 'video' ? srcSet(item) : workSrcSet(item)} sizes="(min-width: 768px) 260px, 200px" width={item.width} height={item.height} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              {item.mediaType === 'video' && <Play aria-hidden="true" className="absolute right-3 top-3 h-6 w-6 rounded-full bg-black/50 p-1" />}
              <span className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-5 pt-16 transition-opacity duration-200 ${!expanded || lifted ? 'opacity-100' : 'opacity-0'}`}><span className="block text-lg">{item.title}</span><span className="text-xs text-white/70">{item.category}</span></span>
            </motion.button>
          </div>;
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 pb-4 text-xs text-white/50">
        <p id={instructions}>{canHover ? 'Hover or tab through the cards to explore.' : 'Tap the deck to spread the cards, then tap a card to view it.'}</p>
        {expanded && (!canHover || tapped) && <button type="button" onClick={closeFan} className="rounded-full border border-white/20 px-4 py-2 text-white/80 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Close</button>}
      </div>
      {items.length > 12 && <div className="mt-4 text-center"><button type="button" onClick={() => setShowGrid(true)} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:text-mint focus-visible:ring-2 focus-visible:ring-mint">Show all as grid</button></div>}
    </div>
    {/* CSS selects the grid before hydration too, so reduced-motion visitors never see a deck. */}
    {!mounted && <div className="hidden motion-reduce:block">{children}</div>}
  </>;
}
