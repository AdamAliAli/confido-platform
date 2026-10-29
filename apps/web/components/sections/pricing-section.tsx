'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { PRICING } from './pricing-data';

export function PricingSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="plans" aria-labelledby="plan-title" className="bg-[#0b2420] px-6 py-16 text-white md:px-[50px] md:py-[110px]">
      <div className="mx-auto max-w-[1300px]">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em]">
          <span className="h-2 w-2 bg-mint" aria-hidden="true" />PRICING
        </div>
        <motion.article
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          className="mx-auto mt-10 max-w-[560px] border border-white/[0.06] bg-[#06100e] p-6 motion-reduce:!transform-none motion-reduce:!opacity-100 md:p-10"
        >
          <h2 id="plan-title" className="text-[20px] font-normal text-mint">{PRICING.title}</h2>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 md:flex-nowrap md:items-end">
            <p className="min-w-0 text-[clamp(40px,4vw,56px)] font-light leading-tight tracking-[-0.04em] md:flex-1">{PRICING.price}</p>
            <span className="shrink-0 text-[14px] text-white/60 md:pb-2">{PRICING.period}</span>
          </div>
          <p className="mt-6 text-[14px] leading-relaxed text-white/80">{PRICING.description}</p>
          <div className="my-8 h-px bg-white/[0.06]" />
          <ul className="grid gap-4">
            {PRICING.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[15px] leading-relaxed">
                <Check className="mt-1 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <span>{feature}{feature === PRICING.freeFeature && <span className="ml-2 inline-block border border-mint px-2 text-[10px] uppercase text-mint">FREE</span>}</span>
              </li>
            ))}
          </ul>
          <a href="/contact?interest=Social%20Media%20Management" className="group mt-10 inline-flex h-9 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#06100e] md:mt-14 md:h-16 md:w-[354px]">
            <span className="flex w-[155px] items-center justify-center bg-mint px-2 text-center text-[13px] text-[#070908] md:min-w-0 md:w-[290px] md:flex-1 md:text-[20px]">{PRICING.cta}</span>
            <span className="flex w-9 shrink-0 items-center justify-center bg-[#d9eee9] text-[#070908] md:w-16" aria-hidden="true">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:h-5 md:w-5" />
            </span>
          </a>
        </motion.article>
        <p className="mx-auto mt-8 max-w-[560px] text-center text-[14px] leading-relaxed text-white/60">{PRICING.note}</p>
      </div>
    </section>
  );
}
