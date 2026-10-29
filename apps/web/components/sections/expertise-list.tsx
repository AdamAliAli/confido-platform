'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Spline } from 'lucide-react';
import { EXPERTISE } from './page-content';
import { SectionHeader } from './section-header';

export function ExpertiseList({ label = 'OUR EXPERTISE', title = 'What We Do', accent = 'Why It Matters', showHeader = true }: { label?: string; title?: string; accent?: string; showHeader?: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <section id="what-we-do" aria-labelledby={showHeader ? 'expertise-list-heading' : undefined} aria-label={showHeader ? undefined : 'Our expertise'} className="bg-[#0b2420] text-white">
      {showHeader && <SectionHeader label={label} title={title} accent={accent} headingId="expertise-list-heading" />}
      {EXPERTISE.map((item, index) => (
        <motion.article
          key={item.title}
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reducedMotion ? 0 : 0.7, ease: 'easeOut' }}
          className="border-t border-white/[0.06] px-6 py-10 motion-reduce:!transform-none motion-reduce:!opacity-100 md:px-[50px]"
        >
          <div className="flex items-center justify-between text-[12px] text-white/50">
            <span>Expertise #{index + 1}</span>
            <Spline className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="mt-[70px]">
            <h3 className="text-[28px] font-medium">{item.title}</h3>
            <p className="mt-2 text-[12px] text-white/50">{item.tags}</p>
            {item.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-white/80">{paragraph}</p>)}
          </div>
        </motion.article>
      ))}
    </section>
  );
}
