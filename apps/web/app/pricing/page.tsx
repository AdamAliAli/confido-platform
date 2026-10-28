import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { PricingSection } from '@/components/sections/pricing-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getPage } from '@/lib/api';

export const metadata = { title: 'Pricing — Confido' };

export default async function Pricing() {
  const page = await getPage();
  const blocks = (page?.blocks || []) as { type: string; data: Record<string, unknown> }[];
  const contact = blocks.find((block) => block.type === 'contact');

  return (
    <main id="top">
      <SiteHeader />
      <PageHero label="PRICING" line1="Simple" accent="Pricing" rest="Plans" scrollTarget="#plans" />
      <PricingSection />
      <ContactSection data={contact?.data || {}} />
      <SiteFooter />
    </main>
  );
}
