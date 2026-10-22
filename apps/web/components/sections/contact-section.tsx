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
      className="relative min-h-[640px] overflow-hidden border-b border-white/[0.06] bg-[#0b2420] px-6 pb-20 pt-16 text-white md:px-[50px] md:pb-0 md:pt-[120px]"
    >
      <div className="relative z-10 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] md:text-[14px]">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />
        CONTACT US
      </div>

      <h2 id={headingId} className="relative z-10 mt-[50px] break-words text-[48px] leading-[1.02] tracking-[-0.04em] md:mt-[90px] md:text-[clamp(48px,7.9vw,152px)]">
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          className="block font-light"
        >{title}</motion.span>
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, filter: 'blur(12px)', y: 24 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
          className="block font-medium text-mint"
        >{accent}</motion.span>
      </h2>

      <div className="mt-10 grid min-w-0 items-center md:-mb-[clamp(160px,22vw,380px)] md:mt-12 md:min-h-[calc(360px+clamp(160px,22vw,380px))] md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-x-[clamp(48px,12vw,240px)]">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        className="relative z-10 min-w-0 md:order-2 md:self-start md:pt-[clamp(48px,7vw,128px)]"
      >
        <p className="max-w-[240px] text-[13px] leading-relaxed text-white/[0.85] md:max-w-[320px] md:text-[18px]">{description}</p>
        <a
          href={`mailto:${email}`}
          className="group mt-10 inline-flex h-9 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420] md:mt-14 md:h-16 md:w-[354px]"
        >
          <span className="flex w-[155px] items-center justify-center bg-mint text-[13px] text-[#070908] md:min-w-0 md:w-[290px] md:flex-1 md:text-[20px]">Contact Us</span>
          <span className="flex w-9 shrink-0 items-center justify-center bg-[#d9eee9] text-[#070908] md:w-16" aria-hidden="true">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:h-5 md:w-5" />
          </span>
        </a>
      </motion.div>

      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { y: 0 } : { y: [0, -50, 0] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
        className="pointer-events-none relative z-0 mx-auto mt-12 w-[320px] max-w-full md:order-1 md:mt-0 md:w-full md:max-w-[900px]"
      >
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(19,187,161,0.2)_0%,transparent_70%)] md:h-[700px] md:w-[700px]" />
        <Image src="/images/ribbon.webp" width={745} height={732} alt="" aria-hidden="true" className="relative h-auto w-full select-none" />
      </motion.div>
      </div>
    </section>
  );
}
