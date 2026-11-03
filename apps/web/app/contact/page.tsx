import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { ContactForm } from '@/components/sections/contact-form';
import { FAQSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getHomeBlocks } from '@/lib/api';

export const metadata = pageMetadata("Contact Confido in Kuala Lumpur", "Contact Confido in Kuala Lumpur, Malaysia to discuss brand strategy, positioning or social media management. Start your project with a clear direction.", "/contact");

export default async function Contact() {
  const blocks = await getHomeBlocks();
  return <main id="top">
    <SiteHeader />
    <PageHero srTitle="Contact Confido in Kuala Lumpur" label="START A PROJECT" line1="Start With" accent="Clarity" rest="Now" scrollTarget="#contact-form" />
    <ContactForm />
    <FAQSection data={blocks.faq || {}} />
    <ContactSection data={blocks.contact || {}} />
    <SiteFooter />
  </main>;
}
