import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/sections/page-hero';
import { ContactSection } from '@/components/sections/contact-section';
import { WorkGallery } from '@/components/sections/work-gallery';
import { getGallery, getHomeBlocks } from '@/lib/api';
import { combineWorkItems } from '@/lib/work-items';

export const metadata = { title: 'Our Work', description: 'Selected social media, campaign and branding work by Confido.' };
export default async function Work() {
  const [items, blocks] = await Promise.all([getGallery(), getHomeBlocks()]);
  const work = combineWorkItems(blocks.projects?.projects, items);
  return <main id="top"><SiteHeader /><PageHero label="OUR WORK" line1="Selected" accent="Work" rest="Gallery" scrollTarget="#work" /><WorkGallery items={work} /><ContactSection data={blocks.contact || {}} /><SiteFooter /></main>;
}
