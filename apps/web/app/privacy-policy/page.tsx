import { Fragment } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ContactSection } from '@/components/sections/contact-section';
import { PageHero } from '@/components/sections/page-hero';
import { LAST_UPDATED, POLICY_INTRO, POLICY_SECTIONS } from '@/components/sections/privacy-content';
import { getPage } from '@/lib/api';

export const metadata = { title: 'Privacy Policy', description: 'Learn how Confido collects, uses and protects your personal data under Malaysia’s PDPA.' };

const EMAIL = 'info@confido-agency.com';

function PolicyText({ value }: { value: string }) {
  const parts = value.split(EMAIL);
  return <>{parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <a href={`mailto:${EMAIL}`} className="text-mint underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint">{EMAIL}</a>}
      {part}
    </Fragment>
  ))}</>;
}

export default async function PrivacyPolicy() {
  const page = await getPage();
  const blocks = (page?.blocks || []) as { type: string; data: Record<string, unknown> }[];
  const contact = blocks.find((block) => block.type === 'contact');

  return (
    <main id="top">
      <SiteHeader />
      <PageHero label="PRIVACY POLICY" line1="Privacy" accent="Policy" rest="Outline" scrollTarget="#policy" />
      <section id="policy" aria-labelledby="policy-updated" className="bg-[#0b2420] px-6 py-16 text-white md:px-[50px] md:py-[110px]">
        <div className="mx-auto max-w-[1300px]">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em]">
            <span className="h-2 w-2 bg-mint" aria-hidden="true" />PRIVACY POLICY
          </div>
          <h2 id="policy-updated" className="mt-8 text-[32px] font-normal leading-tight">Last Updated “{LAST_UPDATED}”</h2>
          <p className="mt-6 text-[14px] leading-relaxed text-white/80"><PolicyText value={POLICY_INTRO} /></p>
          {POLICY_SECTIONS.map((section, index) => (
            <section key={section.heading} aria-labelledby={`policy-section-${index}`} className="mt-14">
              <h2 id={`policy-section-${index}`} className="text-[28px] font-normal leading-tight">{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="mt-4 text-[14px] leading-relaxed text-white/80"><PolicyText value={paragraph} /></p>
              ))}
              {section.bullets && (
                <ul className="mt-6 grid gap-4">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-[14px] leading-relaxed">
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-white/20" aria-hidden="true" />
                      <span><PolicyText value={bullet} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </section>
      <ContactSection data={contact?.data || {}} />
      <SiteFooter />
    </main>
  );
}
