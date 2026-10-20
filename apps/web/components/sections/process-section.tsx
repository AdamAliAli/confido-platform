'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useEffect, useState } from 'react';
import type { FocusEvent, MouseEvent } from 'react';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
});

const PROCESS_STEPS = [
  {
    step: 'Step 1',
    title: 'Discover',
    description: 'We dive deep into your business, market, and gaps.',
    image: '/images/Process-1.avif',
  },
  {
    step: 'Step 2',
    title: 'Define',
    description: 'We build your positioning and strategic direction.',
    image: '/images/Process-2.avif',
  },
  {
    step: 'Step 3',
    title: 'Design',
    description: 'We translate strategy into a clear brand identity.',
    image: '/images/Process-3.avif',
  },
] as const;

export function ProcessSection() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');

    function syncViewport() {
      setIsMobile(media.matches);
      setActiveIndex((current) => (media.matches ? current ?? 0 : null));
    }

    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  function handleMouseLeave(event: MouseEvent<HTMLButtonElement>) {
    if (!isMobile && document.activeElement !== event.currentTarget) setActiveIndex(null);
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    if (!isMobile && !event.currentTarget.matches(':hover')) setActiveIndex(null);
  }

  return (
    <section
      aria-labelledby="process-heading"
      className={`${poppins.className} overflow-hidden border-y border-white/[0.06] bg-[#0b2420] text-white`}
    >
      <div className="grid md:grid-cols-[57%_43%]">
        <div className="relative min-w-0 p-6 md:min-h-[900px] md:border-r md:border-white/[0.06] md:p-10">
          <div className="flex items-center gap-2 text-sm font-medium tracking-[0.08em]">
            <span className="h-2 w-2 bg-mint" aria-hidden="true" />
            PROCESS
          </div>

          <div className="mt-16 md:sticky md:bottom-16 md:mt-[55vh] md:pb-16">
            <h2 id="process-heading" className="text-[42px] font-normal leading-[1.02] tracking-[-0.04em] md:text-[56px]">
              <span className="block">A Process Built</span>
              <span className="ml-[12%] block text-mint">on Clarity</span>
            </h2>
          </div>
        </div>

        <div className="min-w-0 border-t border-white/[0.06] md:border-t-0">
          {PROCESS_STEPS.map((item, index) => {
            const active = activeIndex === index;

            return (
              <button
                key={item.step}
                type="button"
                aria-expanded={active}
                onMouseEnter={() => !isMobile && setActiveIndex(index)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setActiveIndex(index)}
                onBlur={handleBlur}
                onClick={() => setActiveIndex(index)}
                className="block w-full border-b border-white/[0.06] text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint"
              >
                <motion.div layout={!reducedMotion} className="p-6">
                  <div className={`flex items-center gap-2 text-xs transition-colors ${active ? 'text-mint' : 'text-white/60'}`}>
                    <span className={`h-2 w-2 transition-colors ${active ? 'bg-mint' : 'bg-white/30'}`} aria-hidden="true" />
                    {item.step}
                  </div>

                  <AnimatePresence initial={false} mode="wait">
                    {active ? (
                      <motion.div
                        key="expanded"
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mx-auto mt-[30px] h-[100px] w-[150px] overflow-hidden">
                          <Image
                            src={item.image}
                            width={150}
                            height={100}
                            alt=""
                            className="h-full w-full object-cover grayscale"
                          />
                        </div>

                        <div className="mt-[30px] flex w-full flex-col gap-4 border-l border-mint bg-[#06100e] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-[22px] font-normal text-mint">{item.title}</span>
                          <span className="max-w-[220px] text-[13px] leading-5 text-white/80">{item.description}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        initial={reducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reducedMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
                        className="mt-[50px] text-[22px] font-normal text-white/70"
                      >
                        {item.title}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
