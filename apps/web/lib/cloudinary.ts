// Only our gallery namespace may be turned into a delivery URL.
export const validPublicId = (id: string) => /^confido\/gallery\/[\w\-/]+$/.test(id) && !id.split('/').includes('..');
function url(publicId: string, type: string, transform: string, cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  if (!cloud || !/^[\w-]+$/.test(cloud) || !validPublicId(publicId)) return '';
  return `https://res.cloudinary.com/${cloud}/${type}/upload/${transform}/${publicId}`;
}
export const image = (id: string, w: number, cloud?: string) => url(id, 'image', `f_auto,q_auto,w_${w}`, cloud);
export const video = (id: string, w: number, cloud?: string) => url(id, 'video', `f_auto:video,q_auto,w_${w}`, cloud);
export const poster = (id: string, w: number, cloud?: string) => { const src = url(id, 'video', `so_0,f_auto,q_auto,w_${w}`, cloud); return src ? `${src}.jpg` : ''; };
export type GalleryItem = { id: string; section: 'brand' | 'work'; mediaType: 'image' | 'video'; publicId: string; title: string; client?: string | null; category?: string | null; width: number; height: number; enabled?: boolean; cloudName?: string };
export const CATEGORIES = ['Reels', 'Posts', 'Campaigns', 'Branding'] as const;
export function srcSet(item: GalleryItem) { return [400, 800, 1200, 1600].map(w => `${item.mediaType === 'video' ? poster(item.publicId, w, item.cloudName) : image(item.publicId, w, item.cloudName)} ${w}w`).join(', '); }
