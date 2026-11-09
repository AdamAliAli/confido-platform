'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

// A small animation boundary keeps the case-study content rendered on the server.
export function CaseStudyReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.div
    initial={reducedMotion ? false : { opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: reducedMotion ? 0 : 0.7, ease: 'easeOut' }}
    className={`min-w-0 motion-reduce:!transform-none motion-reduce:!opacity-100 ${className}`}
  >{children}</motion.div>;
}
