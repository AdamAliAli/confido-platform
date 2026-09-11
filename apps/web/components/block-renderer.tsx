'use client';

import { motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

type Block = {
  id: string;
  type: string;
  data: Record<string, any>;
};

const PROJECT_IMAGES = [
  'https://framerusercontent.com/images/jJ7iXw4DvAMgulhCvEedvyNESw.png?width=1296&height=740',
  'https://framerusercontent.com/images/yfzBZc6F0VBzvzZKKzd9FBXIRas.png?width=1296&height=740',
  'https://framerusercontent.com/images/JmP3L3tgMpB8WTmZMk2np846IE.png?width=1296&height=740',
  'https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=1370&height=842',
];

type ActiveCell = {
  id: string;
  row: number;
  column: number;
  image: string;
};

function ConfidoLogo() {
  return (
    <a className="brand" href="#hero" aria-label="Confido home">
      <svg className="brand-mark" viewBox="0 0 170 80" aria-hidden="true">
        <path
          d="M7 47c30 20 67 21 99 5 15-8 27-18 37-33 4-7 13-10 20-6 8 4 10 13 6 21-12 22-32 38-55 47C72 97 30 84 7 52c-2-2-2-4 0-5Z"
          fill="currentColor"
        />
      </svg>
      <span className="brand-copy">
        <span className="brand-name">Confido</span>
        <span className="brand-tagline">Advertising &amp; Marketing Services</span>
      </span>
    </a>
  );
}

function InteractiveCells() {
  const lastCell = useRef('');
  const imageIndex = useRef(0);
  const [cells, setCells] = useState<ActiveCell[]>([]);

  const revealCell = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const columns = window.innerWidth < 768 ? 4 : 8;
    const rows = window.innerWidth < 768 ? 6 : 5;
    const column = Math.min(columns - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * columns));
    const row = Math.min(rows - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * rows));
    const key = `${row}-${column}`;

    if (key === lastCell.current) return;
    lastCell.current = key;

    const next: ActiveCell = {
      id: `${key}-${Date.now()}`,
      row,
      column,
      image: PROJECT_IMAGES[imageIndex.current % PROJECT_IMAGES.length],
    };

    imageIndex.current += 1;
    setCells((current) => [...current.slice(-5), next]);
    window.setTimeout(() => {
      setCells((current) => current.filter((cell) => cell.id !== next.id));
    }, 1150);
  }, []);

  return (
    <div className="cell-stage" onPointerMove={revealCell} aria-hidden="true">
      <div className="cell-grid" />
      {cells.map((cell) => (
        <motion.div
          key={cell.id}
          className="image-cell"
          style={{
            '--cell-row': cell.row,
            '--cell-column': cell.column,
            backgroundImage: `url("${cell.image}")`,
          } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 0.72, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function Hero({ data }: { data: Record<string, any> }) {
  return (
    <section id="hero" className="hero-shell">
      <InteractiveCells />
      <div className="hero-glow" aria-hidden="true" />

      <header className="hero-nav">
        <ConfidoLogo />
        <span className="nav-label">Consultancy</span>
        <a className="book-link" href="#contact">
          <span>Book a Call</span>
          <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="hero-content">
        <div className="hero-kicker">
          <span className="kicker-dot" />
          <span>{data.eyebrow}</span>
          <span className="kicker-index">V</span>
        </div>

        <motion.div
          className="headline-wrap"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="headline-row headline-top">
            <h1>{data.title}</h1>
            <span className="hero-year">© 2026</span>
          </div>

          <div className="hero-middle">
            <p>{data.description}</p>
            <span className="headline-with">{data.accent}</span>
          </div>

          <div className="headline-row headline-bottom">
            <span className="scroll-cue">Scroll Down</span>
            <h2>{data.subtitle}</h2>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function BlockRenderer({ blocks = [] }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) =>
        block.type === 'hero' ? <Hero key={block.id} data={block.data} /> : null,
      )}
    </>
  );
}
