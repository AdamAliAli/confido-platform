import { imageUrl, siteImage, text } from './media-url';

export type CaseStudy = {
  slug: string; title: string; image: string; width: number; height: number;
  client: string; market: string; period: string; services: string; summary: string;
  challenge: string; approach: string; resultsNote: string;
  results: { value: string; label: string }[];
  gallery: { src: string; alt: string }[];
};

export function caseStudySlug(value: unknown): string | undefined {
  return typeof value === 'string' && value === value.trim() && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : undefined;
}

export function paragraphs(value: unknown): string[] {
  return text(value, '').split(/\r?\n\s*\r?\n/).map(part => part.trim()).filter(Boolean);
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const cleanText = (value: unknown, fallback = '') => text(value, fallback).trim();
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

// Only Cloudinary can resize these images; other approved URLs keep their original source.
export function caseImageSrcSet(src: string): string | undefined {
  return siteImage(src, 1200) !== src
    ? [400, 800, 1200, 1600].map(width => `${siteImage(src, width)} ${width}w`).join(', ')
    : undefined;
}

// Keep saved project order. A duplicate address always belongs to its first project.
export function getCaseStudies(projectsData: unknown): CaseStudy[] {
  const seen = new Set<string>();
  return list(projectsData).flatMap((item, index): CaseStudy[] => {
    const project = record(item);
    const slug = caseStudySlug(project.slug);
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    const image = [project.image, project.imageUrl, project.cover, project.thumbnail, project.coverImage, list(project.galleryImages)[0]]
      .map(value => imageUrl(value, '')).find(Boolean) || '';
    const title = cleanText(project.title, cleanText(project.name, `Project ${index + 1}`));
    return [{
      slug, title, image,
      width: Number.isSafeInteger(project.width) && Number(project.width) > 0 ? Number(project.width) : 1200,
      height: Number.isSafeInteger(project.height) && Number(project.height) > 0 ? Number(project.height) : 800,
      client: cleanText(project.client), market: cleanText(project.market), period: cleanText(project.period),
      services: cleanText(project.services), summary: cleanText(project.summary),
      challenge: cleanText(project.challenge), approach: cleanText(project.approach), resultsNote: cleanText(project.resultsNote),
      results: list(project.results).map(record).map(result => ({ value: cleanText(result.value), label: cleanText(result.label) }))
        .filter(result => result.value && result.label).slice(0, 6),
      gallery: list(project.gallery).map(record).map(photo => ({ src: imageUrl(photo.src, ''), alt: cleanText(photo.alt, title) }))
        .filter(photo => photo.src).slice(0, 8),
    }];
  });
}
