'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, UIEvent } from 'react';
import type { TeamMember } from '@/lib/api';

function SocialLink({ href, label, children }: { href?: string | null; label: string; children: ReactNode }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white transition-colors hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
    >
      {children}
    </a>
  );
}

function MemberPortrait({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-b from-[#183b35] to-[#0b1d1a] text-7xl font-light text-mint/60" role="img" aria-label={`${member.name} portrait unavailable`}>
        {member.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={member.photoUrl}
      alt={member.name}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function TeamSlider({ members }: { members: TeamMember[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const showControls = members.length > 1;

  function goTo(index: number) {
    if (!members.length) return;

    const nextIndex = (index + members.length) % members.length;
    const track = trackRef.current;
    const slide = track?.children.item(nextIndex) as HTMLElement | null;

    slide?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    setActiveIndex(nextIndex);
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    if (!track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const bounded = Math.max(0, Math.min(index, members.length - 1));
    if (bounded !== activeIndex) setActiveIndex(bounded);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  }

  return (
    <section
      aria-labelledby="team-heading"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative min-h-[760px] overflow-hidden bg-gradient-to-b from-[#0a1f1c] to-[#0d3b31] px-5 py-20 text-paper outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint md:min-h-[900px] md:px-12 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="absolute left-[calc(50%_-_160px)] top-0 h-[76%] w-px bg-white/[0.06]" />
        <span className="absolute right-[calc(50%_-_160px)] top-0 h-[76%] w-px bg-white/[0.06]" />
        <span className="absolute left-0 top-1/2 h-px w-full bg-white/[0.06]" />
        <span className="absolute bottom-[14%] left-0 h-px w-full bg-white/[0.06]" />
      </div>

      <div id="team-heading" className="relative z-10 mx-auto mb-16 flex w-full max-w-[320px] items-center justify-center gap-2 text-sm font-medium tracking-[0.08em] md:mb-[100px]">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />
        TEAM MEMBERS
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          animate={reducedMotion ? { y: 0 } : { y: [0, -50, 0] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
          className="pointer-events-none absolute left-1/2 top-[52%] z-0 md:top-[56%]"
          aria-hidden="true"
        >
          <Image
            src="/images/ribbon.webp"
            width={745}
            height={732}
            alt=""
            aria-hidden="true"
            className="h-auto w-[140vw] max-w-none -translate-x-1/2 -translate-y-[32%] select-none sm:w-[105vw] md:w-[820px]"
          />
        </motion.div>

        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="relative z-10 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {members.map((member, index) => (
            <div key={member.id} className="flex w-full shrink-0 snap-center justify-center px-1 sm:px-14">
              <motion.article
                initial={false}
                animate={reducedMotion || index === activeIndex ? { opacity: 1, scale: 1 } : { opacity: 0.72, scale: 0.975 }}
                transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full max-w-[470px] flex-col overflow-hidden bg-[radial-gradient(120%_70%_at_100%_100%,#2d4b3e_0%,transparent_60%),linear-gradient(to_bottom,#101e1d_0%,#10201f_55%,#1f3731_100%)] p-6 shadow-2xl shadow-black/25 sm:px-12 sm:pb-10 sm:pt-12"
              >
                <div className="flex min-h-11 items-start justify-between gap-4">
                  <p className="line-clamp-2 max-w-[210px] pt-2 text-xl font-semibold leading-6 text-white/80">{member.role}</p>
                  <div className="flex gap-2">
                    <SocialLink href={member.xUrl} label={`${member.name} on X`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                      </svg>
                    </SocialLink>
                    <SocialLink href={member.dribbbleUrl} label={`${member.name} on Dribbble`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.79 4.61a8.47 8.47 0 0 1 1.68 5.15 19.2 19.2 0 0 0-5.01-.24 22.64 22.64 0 0 0-.65-1.45 15.64 15.64 0 0 0 3.98-3.46ZM12 3.53c2.2 0 4.2.84 5.7 2.22a13.77 13.77 0 0 1-3.55 3.1 44.13 44.13 0 0 0-2.52-4.05 8.3 8.3 0 0 1 .37-1.27Zm-2.15.75a37.9 37.9 0 0 1 2.56 4.03 31.98 31.98 0 0 1-8.63 1.14 8.5 8.5 0 0 1 6.07-5.17Zm-6.3 7.12v-.42a33.12 33.12 0 0 0 9.6-1.34l.55 1.17.4.9a14.78 14.78 0 0 0-7.58 5.86 8.42 8.42 0 0 1-2.97-6.17Zm4.22 7.08a13.02 13.02 0 0 1 6.94-5.24 27.97 27.97 0 0 1 1.1 5.83A8.44 8.44 0 0 1 7.77 18.48Zm9.55-.28a29.65 29.65 0 0 0-1.02-5.35 16.3 16.3 0 0 1 4.07.31 8.48 8.48 0 0 1-3.05 5.04Z" />
                      </svg>
                    </SocialLink>
                    <SocialLink href={member.linkedinUrl} label={`${member.name} on LinkedIn`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.41v1.57h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.04H3.54V8.98H7.1v11.47Z" />
                      </svg>
                    </SocialLink>
                  </div>
                </div>

                <div className="mx-auto mt-10 aspect-[200/252] w-full max-w-[200px] shrink-0 overflow-hidden bg-[#10231f]">
                  <MemberPortrait member={member} />
                </div>

                <div className="pt-12 text-center">
                  {member.quote && <p className="mx-auto mb-4 max-w-[320px] text-lg leading-7 text-white/[0.55]">{member.quote}</p>}
                  <h2 className="text-[40px] font-normal tracking-tight">{member.name}</h2>
                </div>
              </motion.article>
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            aria-label="Previous team member"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-6 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#0a1512] text-white transition-colors hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next team member"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-6 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#0a1512] text-white transition-colors hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
}
