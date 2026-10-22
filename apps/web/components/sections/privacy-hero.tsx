'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

export function PrivacyHero() {
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="privacy-title" className="relative isolate h-screen min-h-[640px] overflow-hidden bg-[#030504] text-white">
      <div className="hero-sphere" aria-hidden="true" />
      <div className="cell-stage pointer-events-none" aria-hidden="true" />

      <div className="absolute left-6 top-[22%] z-10 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] md:left-[50px]">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />PRIVACY POLICY
      </div>

      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { y: 0 } : { y: [0, -20, 0] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
        className="pointer-events-none absolute right-6 top-[6%] z-[3] w-[200px] md:left-[58%] md:right-auto md:top-[18%] md:w-[26vw] md:max-w-[500px] motion-reduce:!transform-none"
      >
        <Image src="/images/ribbon.webp" width={745} height={732} alt="" aria-hidden="true" className="h-auto w-full -rotate-[10deg] -scale-x-100" />
      </motion.div>

      <h1 id="privacy-title" className="absolute inset-x-6 top-[40%] z-10 text-[clamp(64px,10.5vw,200px)] font-light leading-[0.95] tracking-[-0.07em] md:left-[50px] md:right-0 md:top-[34%]">
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          className="block motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!filter-none"
        >Privacy</motion.span>
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="block md:ml-[35%] md:whitespace-nowrap motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!filter-none"
        ><span className="text-mint">Policy</span>{' '}<span className="block md:inline">Outline</span></motion.span>
      </h1>

      <a href="#policy" className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[12px] text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#030504] md:bottom-8">
        <motion.span
          aria-hidden="true"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
          className="h-[6px] w-[6px] rounded-full bg-mint motion-reduce:!opacity-100"
        />
        <span className="h-[90px] w-px bg-mint/40" aria-hidden="true" />
        <span>Scroll Down</span>
      </a>
    </section>
  );
}
