'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ABOUT } from './page-content';
import { SectionHeader } from './section-header';
import { safeHref } from '@/lib/media-url';

export function AboutIntro({ id = 'how-we-think' }: { id?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="bg-[#0b2420] px-6 py-[90px] text-white md:px-[50px]">
      <SectionHeader label={ABOUT.label} title={ABOUT.title} accent={ABOUT.accent} headingId={`${id}-heading`} padded={false} />
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reducedMotion ? 0 : 0.7, ease: 'easeOut' }}
        className="mt-[70px] min-w-0 motion-reduce:!transform-none motion-reduce:!opacity-100 md:ml-[35%]"
      >
        <p className="max-w-[620px] text-[clamp(22px,2vw,30px)] leading-snug">{ABOUT.statement}</p>
        <a href={safeHref(ABOUT.ctaHref)} className="group mt-10 inline-flex h-9 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420] md:mt-14 md:h-16 md:w-[354px]">
          <span className="flex w-[155px] items-center justify-center bg-mint text-[13px] text-[#070908] md:min-w-0 md:w-[290px] md:flex-1 md:text-[20px]">{ABOUT.cta}</span>
          <span className="flex w-9 shrink-0 items-center justify-center bg-[#d9eee9] text-[#070908] md:w-16" aria-hidden="true">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:h-5 md:w-5" />
          </span>
        </a>
      </motion.div>
    </section>
  );
}
