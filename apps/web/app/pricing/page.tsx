import { JsonLd } from '@/components/json-ld';
import { pageMetadata, serviceSchema } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { PricingSection } from '@/components/sections/pricing-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getPage } from '@/lib/api';

export const metadata = pageMetadata("Social Media Management Pricing", "Social media management in Malaysia from USD 1,000/month. Explore Confido’s services and book a free consultation to plan your next steps.", "/pricing");

export default async function Pricing() {
  const page = await getPage();
  const blocks = (page?.blocks || []) as { type: string; data: Record<string, unknown> }[];
  const contact = blocks.find((block) => block.type === 'contact');

  return (
    <main id="top">
      <SiteHeader />
      <JsonLd data={serviceSchema()} />
      <PageHero srTitle="Social media management pricing in Malaysia" label="PRICING" line1="Simple" accent="Pricing" rest="Plans" scrollTarget="#plans" />
      <PricingSection />
      <ContactSection data={contact?.data || {}} />
      <SiteFooter />
    </main>
  );
}
