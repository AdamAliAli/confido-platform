'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { KeyboardEvent, UIEvent } from 'react';
import type { TeamMember } from '@/lib/api';

function SocialLink({ href, label, children }: { href?: string | null; label: string; children: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-[11px] text-paper transition-colors hover:border-mint hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
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
    const nextIndex = Math.max(0, Math.min(index, members.length - 1));
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
      className="relative overflow-hidden bg-[#0b2420] px-5 py-24 text-paper outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint md:px-12 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(19,187,161,0.09),transparent_42%)]" aria-hidden="true" />

      <div id="team-heading" className="relative mb-14 flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.08em] md:mb-20">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />
        TEAM MEMBERS
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {members.map((member) => (
            <div key={member.id} className="flex w-full shrink-0 snap-center justify-center px-1 sm:px-14">
              <motion.article
                initial={reducedMotion ? false : { opacity: 0.72, scale: 0.975 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ amount: 0.65 }}
                transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[560px] w-full max-w-[380px] flex-col overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#172722] to-[#0d1512] p-5 shadow-2xl shadow-black/25 sm:min-h-[610px] sm:p-6"
              >
                <div className="flex min-h-9 items-start justify-between gap-4">
                  <p className="pt-2 text-xs uppercase tracking-[0.12em] text-white/55">{member.role}</p>
                  <div className="flex gap-2">
                    <SocialLink href={member.xUrl} label={`${member.name} on X`}>X</SocialLink>
                    <SocialLink href={member.dribbbleUrl} label={`${member.name} on Dribbble`}>Dr</SocialLink>
                    <SocialLink href={member.linkedinUrl} label={`${member.name} on LinkedIn`}>in</SocialLink>
                  </div>
                </div>

                <div className="mx-auto mt-8 h-[300px] w-full max-w-[290px] overflow-hidden rounded-lg bg-[#10231f] sm:h-[340px]">
                  <MemberPortrait member={member} />
                </div>

                <div className="mt-auto pt-7 text-center">
                  {member.quote && <p className="mx-auto mb-5 max-w-[290px] text-sm leading-6 text-white/50">“{member.quote}”</p>}
                  <h2 className="text-4xl font-light tracking-[-0.055em] sm:text-5xl">{member.name}</h2>
                </div>
              </motion.article>
            </div>
          ))}
        </div>

        {showControls && (
          <>
            <button
              type="button"
              aria-label="Previous team member"
              disabled={activeIndex === 0}
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#07110f]/90 text-2xl transition hover:border-mint hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:cursor-not-allowed disabled:opacity-25 md:h-14 md:w-14"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next team member"
              disabled={activeIndex === members.length - 1}
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#07110f]/90 text-2xl transition hover:border-mint hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:cursor-not-allowed disabled:opacity-25 md:h-14 md:w-14"
            >
              →
            </button>
          </>
        )}
      </div>
    </section>
  );
}
