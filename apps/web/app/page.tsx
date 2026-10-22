import { BlockRenderer } from '@/components/block-renderer';
import { getPage, getTeam } from '@/lib/api';
import { LocationSection } from '@/components/sections/location-section';
import { TeamSection } from '@/components/sections/team-section';
import { ProcessSection } from '@/components/sections/process-section';
import { FAQSection } from '@/components/sections/faq-section';
import { SiteFooter } from '@/components/site-footer';

type PageBlock = { id: string; type: string; enabled?: boolean; data: Record<string, unknown> };

const fallbackServices: PageBlock = {
  id: 'services',
  type: 'services',
  data: {
    services: [
      { title: 'Strategy', description: 'Clarity before complexity.' },
      { title: 'Positioning', description: 'Stand for something, or disappear.' },
      { title: 'Systems', description: 'Built to scale, built to last.' },
    ],
  },
};

const fallbackHero: PageBlock = {
  id: 'hero',
  type: 'hero',
  data: {
    eyebrow: 'Strategic brand consultancy',
    title: 'Brands',
    accent: 'With',
    subtitle: 'Direction',
    description: 'Confido helps businesses build clear positioning, strong direction, and scalable brand systems.',
  },
};

function collectProjectImages(value: unknown): string[] {
  if (typeof value === 'string') {
    return /^https?:\/\/.+\.(?:png|jpe?g|webp|avif|gif)(?:\?.*)?$/i.test(value) ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap(collectProjectImages);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(collectProjectImages);
  }
  return [];
}

export default async function Home() {
  const [page, members] = await Promise.all([getPage(), getTeam()]);
  const apiBlocks = (page?.blocks || []) as PageBlock[];
  const blocks: PageBlock[] = page !== null ? apiBlocks.filter((block) => block.enabled !== false) : [
    fallbackHero,
    fallbackServices,
    { id: 'projects', type: 'projects', data: {} },
    { id: 'clarity', type: 'clarity', data: {} },
  ];
  const galleryImages = [...new Set(blocks.filter((block) => block.type === 'projects').flatMap((block) => collectProjectImages(block.data)))];
  const renderedBlocks = blocks.map((block) => block.type === 'hero'
    ? { ...block, data: { ...block.data, galleryImages } }
    : block);
  const contact = blocks.find((block) => block.type === 'contact');

  return (
    <main id="top">
      <BlockRenderer blocks={renderedBlocks.filter((block) => block.type !== 'contact')} />
      <LocationSection />
      <TeamSection members={members} />
      <ProcessSection />
      <FAQSection />
      <BlockRenderer blocks={contact ? [contact] : []} />
      <SiteFooter />
    </main>
  );
}
