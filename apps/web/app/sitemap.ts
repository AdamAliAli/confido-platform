import type { MetadataRoute } from 'next';

const LAST_MODIFIED = new Date();
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const priorities: Record<string, number> = { '/': 1.0, '/services': 0.9, '/work': 0.9, '/about': 0.8, '/contact': 0.8, '/pricing': 0.8, '/privacy-policy': 0.3 };
  return Object.entries(priorities).map(([path, priority]) => ({ url: new URL(path, base).href, lastModified: LAST_MODIFIED, priority }));
}
