'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Spline } from 'lucide-react';
import { EXPERTISE } from './page-content';

export function ExpertiseList({ label, title, accent }: { label: string; title: string; accent: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <section id="what-we-do" aria-labelledby="expertise-list-heading" className="bg-[#0b2420] text-white">
      <div className="flex flex-col gap-10 px-6 py-[90px] md:flex-row md:items-start md:justify-between md:px-[50px]">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em]">
          <span className="h-2 w-2 bg-mint" aria-hidden="true" />{label}
        </div>
        <h2 id="expertise-list-heading" className="min-w-0 break-words text-right text-[clamp(40px,4vw,64px)] font-light leading-tight tracking-[-0.04em]">
          <span className="block">{title}</span>
          <span className="block font-semibold text-mint">{accent}</span>
        </h2>
      </div>
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
