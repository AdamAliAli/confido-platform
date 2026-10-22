'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useId } from 'react';

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function ContactSection({ data }: { data: Record<string, unknown> }) {
  const reducedMotion = useReducedMotion();
  const headingId = useId();
  const title = text(data.title, 'Let’s Build Something');
  const accent = text(data.accent, 'That Lasts');
  const description = text(data.description, 'We work with a limited number of clients to ensure clarity, focus, and real impact.');
  const email = text(data.email, 'hello@confido.studio');

  return (
    <section
      id="contact"
      aria-labelledby={headingId}
      className="relative min-h-[640px] overflow-hidden bg-[#0b2420] px-6 pt-16 text-white md:px-[50px] md:pt-[110px]"
    >
      <div className="relative z-10 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em]">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />
        CONTACT US
      </div>

      <h2 id={headingId} className="relative z-10 mt-[50px] break-words text-[48px] leading-[1] tracking-[-0.04em] md:text-[clamp(48px,6.7vw,96px)]">
        <span className="block font-light">{title}</span>
        <span className="block font-medium text-mint">{accent}</span>
      </h2>

      <div className="relative z-10 mt-10 md:absolute md:left-[66%] md:top-[62%] md:mt-0 md:pr-6">
        <p className="max-w-[240px] text-[13px] leading-relaxed text-white/[0.85]">{description}</p>
        <a
          href={`mailto:${email}`}
          className="group mt-10 inline-flex h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420]"
        >
          <span className="flex w-[155px] items-center justify-center bg-mint text-[13px] text-[#070908]">Contact Us</span>
          <span className="flex w-9 items-center justify-center bg-[#d9eee9] text-[#070908]" aria-hidden="true">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </a>
      </div>

      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { y: 0 } : { y: [0, -50, 0] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
        className="pointer-events-none relative z-0 mx-auto mt-12 w-[300px] max-w-full md:absolute md:-bottom-44 md:left-[5%] md:mx-0 md:mt-0 md:w-[500px]"
      >
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(19,187,161,0.15)_0%,transparent_70%)]" />
        <Image src="/images/ribbon.webp" width={745} height={732} alt="" aria-hidden="true" className="relative h-auto w-full select-none" />
      </motion.div>
    </section>
  );
}
