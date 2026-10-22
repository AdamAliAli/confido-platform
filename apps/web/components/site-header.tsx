'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function ConfidoLogo() {
  return (
    <a className="brand" href="/" aria-label="Confido home">
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

const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/#about-us' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Services', href: '/#services' },
  { label: 'Contact', href: '/#contact' },
];

function MenuPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.button
        className="menu-backdrop" style={{ position: 'fixed', inset: '54px 0 0' }}
        aria-label="Close menu"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="menu-panel" style={{ maxHeight: 'calc(100dvh - 54px)', minHeight: 0, overflowY: 'auto' }}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="menu-heading"><i />MENU</div>
        <nav className="menu-links" aria-label="Main navigation">
          {MENU_ITEMS.map((item) => (
            <a key={item.label} href={item.href} onClick={onClose}>
              <span className="menu-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="menu-cta">
          <p>Let’s Build<br /><strong>With Confido</strong></p>
        </div>
      </motion.aside>
    </>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const syncScroll = () => setScrolled(window.scrollY > 40);
    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="fixed left-0 top-0 z-50 w-full">
      <header
        className="hero-nav"
        style={{
          backgroundColor: scrolled ? 'rgba(3,5,4,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      >
        <button className={`menu-button${menuOpen ? ' is-open' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
        <div className="nav-identity">
          <ConfidoLogo />
          <span className="nav-divider" />
          <span className="nav-label">Consultancy</span>
        </div>
        <a className="book-link" href="/#contact"><span>Book a Call</span></a>
        <a className="book-arrow" href="/#contact" aria-label="Book a Call">→</a>
      </header>
      <AnimatePresence>{menuOpen && <MenuPanel onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </div>
  );
}
