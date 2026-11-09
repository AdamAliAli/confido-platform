import { image, srcSet, type GalleryItem } from './cloudinary';
import { imageUrl, safeHref, siteImage, text } from './media-url';
import { caseStudySlug } from './case-studies';

export type ProjectWorkItem = {
  id: string; section: 'work'; mediaType: 'image'; imageUrl: string;
  title: string; client: string; category: string; width: number; height: number; href?: string; year?: string; caseStudy?: boolean;
};
export type WorkItem = GalleryItem | ProjectWorkItem;

// Ignore Cloudinary delivery transformations, version and image format when comparing assets.
function cloudinaryKey(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return;
    const match = url.pathname.match(/^\/([^/]+)\/image\/upload\/(.+)$/);
    if (!match) return;
    const parts = match[2].split('/');
    const version = parts.findIndex(part => /^v\d+$/.test(part));
    if (version >= 0) parts.splice(0, version + 1);
    else while (parts.length > 1 && /^(?:[a-z]{1,3}_|\$)/.test(parts[0])) parts.shift();
    return `${match[1]}/${parts.join('/').replace(/\.(?:avif|webp|png|jpe?g|gif|svg|heic)$/i, '')}`;
  } catch { return; }
}

export function workImage(item: WorkItem, width: number): string {
  return 'imageUrl' in item ? siteImage(item.imageUrl, width) : image(item.publicId, width, item.cloudName);
}

export function workSrcSet(item: WorkItem): string | undefined {
  if (!('imageUrl' in item)) return srcSet(item);
  // Other hosts and local files have no resizing service; use their original URL.
  return cloudinaryKey(item.imageUrl)
    ? [400, 800, 1200, 1600].map(width => `${siteImage(item.imageUrl, width)} ${width}w`).join(', ')
    : undefined;
}

export function combineWorkItems(projectData: unknown, gallery: GalleryItem[]): WorkItem[] {
  const projects = Array.isArray(projectData) ? projectData : [];
  const galleryDimensions = new Map(gallery.filter(item => item.mediaType === 'image').map(item => [cloudinaryKey(image(item.publicId, 800, item.cloudName)), item]));
  const seen = new Set<string>();
  const result: WorkItem[] = [];
  for (const [index, project] of projects.entries()) {
    if (!project || typeof project !== 'object') continue;
    const src = [project.image, project.imageUrl, project.cover, project.thumbnail, project.coverImage, project.galleryImages?.[0]]
      .map(value => imageUrl(value, '')).find(Boolean);
    if (!src) continue;
    const cloud = cloudinaryKey(src);
    const key = cloud ? `image:${cloud}` : `url:${src}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const known = cloud ? galleryDimensions.get(cloud) : undefined;
    const dimensions = cloud && Number.isSafeInteger(project.width) && project.width > 0 && Number.isSafeInteger(project.height) && project.height > 0
      ? { width: project.width, height: project.height } : known || { width: 1200, height: 800 };
    result.push({
      id: `project:${index}`, section: 'work', mediaType: 'image', imageUrl: src,
      title: text(project.title, text(project.name, `Project ${index + 1}`)), client: '',
      category: text(project.category, 'Branding'), width: dimensions.width, height: dimensions.height,
      href: caseStudySlug(project.slug) ? `/work/${project.slug}` : safeHref(project.href ?? project.url),
      caseStudy: !!caseStudySlug(project.slug),
      year: typeof project.year === 'string' || typeof project.year === 'number' ? String(project.year).trim() || undefined : undefined,
    });
  }
  for (const item of gallery) {
    // Brand logos remain separate, even when the same asset is also used in a project.
    if (item.section === 'work' && item.mediaType === 'image') {
      const key = cloudinaryKey(image(item.publicId, 800, item.cloudName));
      if (key && seen.has(`image:${key}`)) continue;
      if (key) seen.add(`image:${key}`);
    }
    result.push(item);
  }
  return result;
}
