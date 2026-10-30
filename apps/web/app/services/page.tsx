import { SECTION_DEFAULTS } from '@/lib/section-defaults';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { ExpertiseList } from '@/components/sections/expertise-list';
import { ClarityMarquee } from '@/components/sections/clarity-section';
import { PricingSection } from '@/components/sections/pricing-section';
import { ProcessSection } from '@/components/sections/process-section';
import { FAQSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getHomeBlocks } from '@/lib/api';
import { text } from '@/lib/media-url';

export const metadata = { title: 'Services', description: 'Brand strategy, positioning and scalable brand systems built around clarity and direction.' };

export default async function Services() {
  const blocks = await getHomeBlocks();
  return (
    <main id="top">
      <SiteHeader />
      <PageHero label="OUR EXPERTISE" line1="Strategic" accent="Brand" rest="Expertise" scrollTarget="#what-we-do" fitSecondLine />
      <ExpertiseList label="OUR EXPERTISE" title="What We Do" accent="Why It Matters" />
      <div className="overflow-hidden bg-[#0b2420] px-6 py-16 md:px-0 md:py-0">
        <ClarityMarquee text={text(blocks.clarity?.heading, SECTION_DEFAULTS.clarity.heading)} />
      </div>
      <PricingSection />
      <ProcessSection data={blocks.process || {}} />
      <FAQSection data={blocks.faq || {}} />
      <ContactSection data={blocks.contact || {}} />
      <SiteFooter />
    </main>
  );
}
