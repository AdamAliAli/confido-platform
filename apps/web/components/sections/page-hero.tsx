'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

type PageHeroProps = { label: string; line1: string; accent: string; rest: string; scrollTarget: string; srTitle?: string; fitSecondLine?: boolean };

export function PageHero({ label, line1, accent, rest, scrollTarget, srTitle, fitSecondLine = false }: PageHeroProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="page-title" className="page-hero relative isolate flex h-screen min-h-[640px] flex-col overflow-hidden bg-[#030504] pb-6 text-white md:pb-8">
      <div className="hero-sphere" aria-hidden="true" />
      <div className="cell-stage pointer-events-none" aria-hidden="true" />

      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { y: 0 } : { y: [0, -20, 0] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
        className="pointer-events-none absolute right-6 top-[6%] z-[3] w-[200px] md:left-[58%] md:right-auto md:top-[18%] md:w-[26vw] md:max-w-[500px] motion-reduce:!transform-none"
      >
        <Image src="/images/ribbon.webp" width={745} height={732} alt="" aria-hidden="true" className="h-auto w-full -rotate-[10deg] -scale-x-100" />
      </motion.div>

      {/* Flow layout reserves space for the title and a 32px gap before the cue. */}
      <div className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-[max(140.8px,22vh)] md:pl-[50px] md:pr-0">
        <div className="flex shrink-0 items-center gap-2 self-start text-[12px] font-medium uppercase tracking-[0.08em]">
          <span className="h-2 w-2 bg-mint" aria-hidden="true" />{label}
        </div>
        <h1 id="page-title" className="page-hero-title shrink-0 break-words font-light leading-[0.95] tracking-[-0.07em]">
          <motion.span
            aria-hidden={srTitle ? true : undefined}
            initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
            className="block motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!filter-none"
          >{line1}</motion.span>
          <motion.span
            aria-hidden={srTitle ? true : undefined}
            initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className={`block md:ml-[35%] motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!filter-none ${fitSecondLine ? 'md:text-[0.86em]' : ''}`}
          ><span className="text-mint">{accent}</span>{' '}<span className="block md:inline">{rest}</span></motion.span>
          {srTitle && <span className="sr-only">{srTitle}</span>}
        </h1>
      </div>

      <a href={scrollTarget} className="scroll-cue !mb-0 !mt-auto z-10 shrink-0 self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#030504]">
        <i />
        <span>Scroll Down</span>
      </a>
    </section>
  );
}
