import { BlockRenderer } from '@/components/block-renderer';
import { getPage } from '@/lib/api';

type PageBlock = { id: string; type: string; data: Record<string, unknown> };

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
  const page = await getPage();
  const blocks = (page?.blocks || []) as PageBlock[];
  const hero = blocks.find((block) => block.type === 'hero') || fallbackHero;
  const services = blocks.find((block) => block.type === 'services') || fallbackServices;
  const projects = blocks.find((block) => block.type === 'projects');
  const galleryImages = [...new Set(collectProjectImages(projects?.data))];

  return (
    <main>
      <BlockRenderer blocks={[{ ...hero, data: { ...hero.data, galleryImages } }, services]} />
    </main>
  );
}
