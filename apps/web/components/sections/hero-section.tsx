'use client';

import { SECTION_DEFAULTS } from '@/lib/section-defaults';

import { text } from '@/lib/media-url';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

type ActiveCell = { id: string; row: number; column: number; image: string };

function InteractiveCells({ images }: { images: string[] }) {
  const lastCell = useRef('');
  const imageIndex = useRef(0);
  const preloaded = useRef(false);
  const [activeCells, setActiveCells] = useState<ActiveCell[]>([]);

  const revealCell = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== 'mouse' || images.length === 0 || navigator.maxTouchPoints > 0 ||
      !window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches
    ) return;

    if (!preloaded.current) {
      preloaded.current = true;
      images.forEach((src) => {
        const image = new Image();
        image.src = src;
        image.decode?.().catch(() => undefined);
      });
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const columns = 8;
    const rows = 5;
    const column = Math.min(columns - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * columns));
    const row = Math.min(rows - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * rows));
    const key = `${row}-${column}`;

    if (key === lastCell.current) return;
    lastCell.current = key;

    const next = {
      id: `${key}-${performance.now()}`,
      row,
      column,
      image: images[imageIndex.current++ % images.length],
    };

    setActiveCells((current) => [...current.slice(-2), next]);
    window.setTimeout(() => {
      setActiveCells((current) => current.filter((cell) => cell.id !== next.id));
    }, 680);
  }, [images]);

  return (
    <div className="cell-stage" onPointerMove={revealCell} onPointerLeave={() => { lastCell.current = ''; }} aria-hidden="true">
      <AnimatePresence>
        {activeCells.map((cell) => (
          <motion.div
            key={cell.id}
            className="image-cell"
            style={{
              '--cell-row': cell.row,
              '--cell-column': cell.column,
              backgroundImage: `url("${cell.image}")`,
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 0.82, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function HeroSection({ data }: { data: Record<string, any> }) {
  const galleryImages =
    Array.isArray(data.galleryImages) && data.galleryImages.length
      ? data.galleryImages
      : SECTION_DEFAULTS.hero.galleryImages;

  return (
    <section id="hero" className="hero-shell">
      <InteractiveCells images={galleryImages} />
      <div className="hero-sphere" aria-hidden="true" />

      <div className="h-[54px]" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-kicker"><span className="kicker-dot" />{text(data.eyebrow, SECTION_DEFAULTS.hero.eyebrow)}<span className="kicker-index">V</span></div>

        <motion.div
          className="hero-lockup"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="brands-row">
            <h1>{text(data.title, SECTION_DEFAULTS.hero.title)}</h1>
            <div className="hero-meta">
              <span>© 2026</span>
              <p>{text(data.description, SECTION_DEFAULTS.hero.description)}</p>
            </div>
          </div>
          <h2><span>{text(data.accent, SECTION_DEFAULTS.hero.accent)}</span> {text(data.subtitle, SECTION_DEFAULTS.hero.subtitle)}</h2>
        </motion.div>

        <div className="scroll-cue"><i /><span>Scroll Down</span></div>
      </div>
    </section>
  );
}
