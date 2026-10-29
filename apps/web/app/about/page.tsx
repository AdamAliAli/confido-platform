import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { AboutIntro } from '@/components/sections/about-intro';
import { ExpertiseList } from '@/components/sections/expertise-list';
import { ClarityMarquee } from '@/components/sections/clarity-section';
import { LocationSection } from '@/components/sections/location-section';
import { FAQSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getHomeBlocks } from '@/lib/api';
import { text } from '@/lib/media-url';

export const metadata = { title: 'About Us — Confido' };

export default async function About() {
  const blocks = await getHomeBlocks();
  return (
    <main id="top">
      <SiteHeader />
      <PageHero label="ABOUT US" line1="Built on" accent="Clarity" rest="Defined" scrollTarget="#how-we-think" fitSecondLine />
      <AboutIntro id="how-we-think" />
      <ExpertiseList showHeader={false} />
      <div className="overflow-hidden bg-[#0b2420] px-6 py-16 md:px-0 md:py-0">
        <ClarityMarquee text={text(blocks.clarity?.heading, 'Built on Clarity — Built to Scale')} />
      </div>
      <LocationSection data={blocks.location || {}} />
      <FAQSection data={blocks.faq || {}} />
      <ContactSection data={blocks.contact || {}} />
      <SiteFooter />
    </main>
  );
}
