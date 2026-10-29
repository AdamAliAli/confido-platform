'use client';

import { SECTION_DEFAULTS } from '@/lib/section-defaults';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useId, useState } from 'react';
import { FAQS } from './faq-data';
import { text } from '@/lib/media-url';

export function FAQSection({ data = {} }: { data?: Record<string, unknown> }) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const sectionId = useId();
  const supplied = Array.isArray(data.faqs) && data.faqs.length ? data.faqs : FAQS;
  const faqs = supplied.map((item, index) => ({ question: text(item?.question, FAQS[index]?.question || FAQS[0].question), answer: text(item?.answer, FAQS[index]?.answer || FAQS[0].answer) }));

  return (
    <section
      id="faq"
      aria-labelledby={`${sectionId}-heading`}
      className="overflow-hidden border-y border-white/[0.06] bg-[#0b2420] text-white"
    >
      <div className="grid py-12 md:grid-cols-2 md:py-32">
        <div className="min-w-0 px-6 py-8 md:border-r md:border-white/[0.06] md:px-16 md:py-10">
          <div className="flex items-center gap-2 text-base font-medium tracking-[0.08em] md:text-lg">
            <span className="h-2 w-2 bg-mint" aria-hidden="true" />
            {text(data.label, SECTION_DEFAULTS.faq.label)}
          </div>
          <h2
            id={`${sectionId}-heading`}
            className="mt-6 break-words text-[40px] font-normal leading-tight tracking-[-0.04em] md:text-[56px]"
          >
            <span className="block">{text(data.title, SECTION_DEFAULTS.faq.title)}</span>
            <span className="block font-semibold text-mint">{text(data.accent, SECTION_DEFAULTS.faq.accent)}</span>
          </h2>
        </div>

        <div className="min-w-0 border-t border-white/[0.06] md:border-t-0">
          {faqs.map((item, index) => {
            const active = activeIndex === index;

            return (
              <button
                key={`${item.question}-${index}`}
                type="button"
                aria-expanded={active}
                onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                className={`block w-full border-b border-l border-b-white/[0.06] px-6 py-7 text-left outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint md:px-9 md:py-8 ${
                  active ? 'border-l-mint bg-[#06100e]' : 'border-l-transparent hover:bg-white/[0.02]'
                }`}
              >
                <span className={`block break-words text-[18px] ${active ? 'text-mint' : 'text-white/80'}`}>
                  {item.question}
                </span>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      key="answer"
                      initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                      className="block overflow-hidden"
                    >
                      <span className="mt-3 block max-w-[420px] break-words text-[13px] leading-5 text-white/90">
                        {item.answer}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
