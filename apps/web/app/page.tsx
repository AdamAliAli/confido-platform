import { pageMetadata } from '@/lib/seo';
import { BlockRenderer } from '@/components/block-renderer';
import { getPage, getTeam } from '@/lib/api';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata = pageMetadata("Confido — Brand Strategy & Social Media Agency in Malaysia", "Confido is a Kuala Lumpur brand consultancy for strategy, positioning and social media management, working with businesses in Malaysia and the Gulf.", "/", true);

type PageBlock = { id: string; type: string; enabled?: boolean; data: Record<string, unknown> };

const CANONICAL_TYPES = ['hero', 'services', 'projects', 'clarity', 'location', 'team', 'process', 'faq', 'contact'];

function collectProjectImages(value: unknown): string[] {
  if (typeof value === 'string') {
    return (/^https:\/\/.+\.(?:png|jpe?g|webp|avif|gif)(?:\?.*)?$/i.test(value) || value.startsWith('/images/') || /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(value)) ? [value] : [];
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
  const blocks: PageBlock[] = page !== null ? apiBlocks.filter((block) => block.enabled !== false) : CANONICAL_TYPES.map((type) => ({ id: type, type, data: {} }));
  const galleryImages = [...new Set(blocks.filter((block) => block.type === 'projects').flatMap((block) => collectProjectImages(block.data)))];
  const renderedBlocks = blocks.map((block) => block.type === 'hero'
    ? { ...block, data: { ...block.data, galleryImages } }
    : block);

  return (
    <main id="top">
      <SiteHeader />
      <BlockRenderer blocks={renderedBlocks} members={members} />
      <SiteFooter />
      {!blocks.some(block => block.type === 'hero') && <h1 className="sr-only">Brands With Direction — Confido, brand strategy and social media agency in Kuala Lumpur, Malaysia</h1>}
    </main>
  );
}
