import type { MetadataRoute } from 'next';
import { getHomeBlocks } from '@/lib/api';
import { getCaseStudies } from '@/lib/case-studies';

const LAST_MODIFIED = new Date();
export const revalidate = 300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const priorities: Record<string, number> = { '/': 1.0, '/services': 0.9, '/work': 0.9, '/about': 0.8, '/contact': 0.8, '/pricing': 0.8, '/privacy-policy': 0.3 };
  const fixed = Object.entries(priorities).map(([path, priority]) => ({ url: new URL(path, base).href, lastModified: LAST_MODIFIED, priority }));
  const blocks = await getHomeBlocks();
  return [...fixed, ...getCaseStudies(blocks.projects?.projects).map(({ slug }) => ({ url: new URL(`/work/${slug}`, base).href, lastModified: LAST_MODIFIED, priority: 0.7 }))];
}
