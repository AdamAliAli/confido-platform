export function siteImage(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com') {
      parsed.pathname = parsed.pathname.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
      return parsed.toString();
    }
  } catch { /* Keep local paths and other URLs unchanged. */ }
  return url;
}

export function safeHref(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\\\u0000-\u0020\u007f]/.test(value)) return undefined;
  return value.startsWith('https://') || value.startsWith('mailto:') || /^\/(?!\/)/.test(value) ? value : undefined;
}

export function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function imageUrl(value: unknown, fallback: string): string {
  return typeof value === 'string' && (value.startsWith('https://') || value.startsWith('/images/')) ? value : fallback;
}
