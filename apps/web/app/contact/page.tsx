import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { ContactForm } from '@/components/sections/contact-form';
import { FAQSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { getHomeBlocks } from '@/lib/api';
import { INQUIRY_INTERESTS } from '@/lib/inquiries';

export const metadata = { title: 'Contact', description: 'Tell Confido about your project and start building a brand with clear direction.' };

export default async function Contact({ searchParams }: { searchParams: Promise<{ interest?: string | string[] }> }) {
  const [blocks, query] = await Promise.all([getHomeBlocks(), searchParams]);
  const interest = typeof query.interest === 'string' && INQUIRY_INTERESTS.some(value => value === query.interest) ? query.interest : '';
  return <main id="top">
    <SiteHeader />
    <PageHero label="START A PROJECT" line1="Start With" accent="Clarity" rest="Now" scrollTarget="#contact-form" />
    <ContactForm key={interest} initialInterest={interest} />
    <FAQSection data={blocks.faq || {}} />
    <ContactSection data={blocks.contact || {}} />
    <SiteFooter />
  </main>;
}
