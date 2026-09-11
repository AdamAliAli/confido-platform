'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

type Block = { id: string; type: string; data: Record<string, any> };

const PROJECT_IMAGES = [
  'https://framerusercontent.com/images/jJ7iXw4DvAMgulhCvEedvyNESw.png?width=1296&height=740',
  'https://framerusercontent.com/images/yfzBZc6F0VBzvzZKKzd9FBXIRas.png?width=1296&height=740',
  'https://framerusercontent.com/images/JmP3L3tgMpB8WTmZMk2np846IE.png?width=1296&height=740',
];

type ActiveCell = { id: string; row: number; column: number; image: string };

function ConfidoLogo() {
  return (
    <a className="brand" href="#hero" aria-label="Confido home">
      <svg className="brand-mark" viewBox="0 0 170 80" aria-hidden="true">
        <path d="M7 47c30 20 67 21 99 5 15-8 27-18 37-33 4-7 13-10 20-6 8 4 10 13 6 21-12 22-32 38-55 47C72 97 30 84 7 52c-2-2-2-4 0-5Z" fill="currentColor" />
      </svg>
      <span className="brand-copy">
        <span className="brand-name">Confido</span>
        <span className="brand-tagline">Advertising &amp; Marketing Services</span>
      </span>
    </a>
  );
}

function InteractiveCells({ images }: { images: string[] }) {
  const lastCell = useRef('');
  const imageIndex = useRef(0);
  const lastRevealAt = useRef(0);
  const hideTimer = useRef<number | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

  useEffect(() => {
    images.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [images]);

  const revealCell = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || images.length === 0) return;

    const now = performance.now();
    if (now - lastRevealAt.current < 85) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const columns = 8;
    const rows = 5;
    const column = Math.min(columns - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * columns));
    const row = Math.min(rows - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * rows));
    const key = `${row}-${column}`;

    if (key === lastCell.current) return;

    lastCell.current = key;
    lastRevealAt.current = now;

    const next = {
      id: `${key}-${Date.now()}`,
      row,
      column,
      image: images[imageIndex.current++ % images.length],
    };

    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setActiveCell(next);
    hideTimer.current = window.setTimeout(() => setActiveCell(null), 430);
  }, [images]);

  return (
    <div className="cell-stage" onPointerMove={revealCell} aria-hidden="true">
      <AnimatePresence mode="wait">
        {activeCell && (
          <motion.div
            key={activeCell.id}
            className="image-cell"
            style={{
              '--cell-row': activeCell.row,
              '--cell-column': activeCell.column,
              backgroundImage: `url("${activeCell.image}")`,
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 0.76, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Hero({ data }: { data: Record<string, any> }) {
  const galleryImages =
    Array.isArray(data.galleryImages) && data.galleryImages.length
      ? data.galleryImages
      : PROJECT_IMAGES;

  return (
    <section id="hero" className="hero-shell">
      <InteractiveCells images={galleryImages} />
      <div className="hero-sphere" aria-hidden="true" />

      <header className="hero-nav">
        <button className="menu-button" aria-label="Open menu"><span /><span /></button>
        <div className="nav-identity">
          <ConfidoLogo />
          <span className="nav-divider" />
          <span className="nav-label">Consultancy</span>
        </div>
        <a className="book-link" href="#contact"><span>Book a Call</span></a>
        <a className="book-arrow" href="#contact" aria-label="Book a Call">→</a>
      </header>

      <div className="hero-content">
        <div className="hero-kicker"><span className="kicker-dot" />{data.eyebrow}<span className="kicker-index">V</span></div>

        <motion.div
          className="hero-lockup"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="brands-row">
            <h1>{data.title}</h1>
            <div className="hero-meta">
              <span>© 2026</span>
              <p>{data.description}</p>
            </div>
          </div>
          <h2><span>{data.accent}</span> {data.subtitle}</h2>
        </motion.div>

        <div className="scroll-cue"><i /><span>Scroll Down</span></div>
      </div>
    </section>
  );
}

export function BlockRenderer({ blocks = [] }: { blocks: Block[] }) {
  return <>{blocks.map((block) => block.type === 'hero' ? <Hero key={block.id} data={block.data} /> : null)}</>;
}
