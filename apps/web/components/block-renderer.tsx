'use client';

import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
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
  const [activeCells, setActiveCells] = useState<ActiveCell[]>([]);

  useEffect(() => {
    images.forEach((src) => {
      const image = new Image();
      image.src = src;
      image.decode?.().catch(() => undefined);
    });
  }, [images]);

  const revealCell = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || images.length === 0) return;

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

const MENU_ITEMS = ['Home', 'About Us', 'Pricing', 'Projects', 'Services', 'Contact', 'Blogs'];

function MenuPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.button
        className="menu-backdrop"
        aria-label="Close menu"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="menu-panel"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="menu-heading"><i />MENU</div>
        <nav className="menu-links" aria-label="Main navigation">
          {MENU_ITEMS.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={onClose}>
              <span className="menu-icon" aria-hidden="true" />
              <span>{item}</span>
            </a>
          ))}
        </nav>
        <div className="menu-cta">
          <p>Let’s Build<br /><strong>With Confido</strong></p>
          <a href="#social-media" onClick={onClose}><i />Social Media</a>
        </div>
      </motion.aside>
    </>
  );
}

function Hero({ data }: { data: Record<string, any> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const galleryImages =
    Array.isArray(data.galleryImages) && data.galleryImages.length
      ? data.galleryImages
      : PROJECT_IMAGES;

  return (
    <section id="hero" className="hero-shell">
      <InteractiveCells images={galleryImages} />
      <div className="hero-sphere" aria-hidden="true" />

      <header className="hero-nav">
        <button className={`menu-button${menuOpen ? ' is-open' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
        <div className="nav-identity">
          <ConfidoLogo />
          <span className="nav-divider" />
          <span className="nav-label">Consultancy</span>
        </div>
        <a className="book-link" href="#contact"><span>Book a Call</span></a>
        <a className="book-arrow" href="#contact" aria-label="Book a Call">→</a>
      </header>

      <AnimatePresence>{menuOpen && <MenuPanel onClose={() => setMenuOpen(false)} />}</AnimatePresence>

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


type Service = { title: string; description: string; icon: string };

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const x = useSpring(cursorX, { stiffness: 90, damping: 24, mass: 0.9 });
  const y = useSpring(cursorY, { stiffness: 90, damping: 24, mass: 0.9 });
  const [hovered, setHovered] = useState(false);

  const moveCursor = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    cursorX.set(event.clientX - bounds.left);
    cursorY.set(event.clientY - bounds.top);
  };

  return (
    <motion.article
      className="expertise-card"
      onPointerEnter={(event) => { moveCursor(event); if (event.pointerType !== 'touch') setHovered(true); }}
      onPointerMove={moveCursor}
      onPointerLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="expertise-card-top">
        <span>Service 0{index + 1}</span>
        <span className="expertise-icon" aria-hidden="true">{service.icon}</span>
      </div>
      <div className="expertise-card-copy">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>
      <motion.span
        className="expertise-cursor"
        aria-hidden="true"
        style={{ x, y }}
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.6 }}
        transition={{ opacity: { duration: 0.24 }, scale: { duration: 0.3 } }}
      >↗</motion.span>
    </motion.article>
  );
}

function Expertise({ data }: { data: Record<string, any> }) {
  const fallback: Service[] = [
    { title: 'Strategy', description: 'Clarity before complexity.', icon: '✳' },
    { title: 'Positioning', description: 'Stand for something, or disappear.', icon: '✎' },
    { title: 'Systems', description: 'Built to scale, built to last.', icon: '◇' },
  ];
  const services: Service[] = Array.isArray(data.services) && data.services.length
    ? data.services.slice(0, 3).map((item: any, index: number) => ({
        title: typeof item?.title === 'string' ? item.title : fallback[index].title,
        description: typeof item?.description === 'string' ? item.description : fallback[index].description,
        icon: fallback[index].icon,
      }))
    : fallback;

  return (
    <section id="services" className="expertise-section" aria-labelledby="expertise-title">
      <div className="expertise-heading">
        <motion.span className="expertise-kicker" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <i /> OUR SERVICES
        </motion.span>
        <motion.h2 id="expertise-title" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          What<br /><span>Our Expertise</span>
        </motion.h2>
      </div>
      <div className="expertise-grid">
        {services.map((service, index) => <ServiceCard key={service.title} service={service} index={index} />)}
      </div>
    </section>
  );
}

export function BlockRenderer({ blocks = [] }: { blocks: Block[] }) {
  return <>{blocks.map((block) => block.type === 'hero' ? <Hero key={block.id} data={block.data} /> : block.type === 'services' ? <Expertise key={block.id} data={block.data} /> : null)}</>;
}
