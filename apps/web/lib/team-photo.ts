import { adminFetch } from './api';

export function validateTeamPhoto(file: File, maxMb = 8) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG or WebP image.');
  }
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Photo must be ${maxMb} MB or smaller.`);
}

export async function uploadTeamPhoto(file: File, token: string, onProgress: (percent: number) => void, signal: AbortSignal, folder: 'confido/team' | 'confido/gallery' | 'confido/site' = 'confido/team'): Promise<string> {
  validateTeamPhoto(file, folder === 'confido/team' ? 8 : 10);
  const response = await adminFetch('/media/sign', token, {
    method: 'POST', body: JSON.stringify({ folder }), signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Unable to prepare photo upload.');
  }
  const signed = await response.json();
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signed.apiKey);
  body.append('timestamp', String(signed.timestamp));
  body.append('folder', signed.folder);
  body.append('signature', signed.signature);

  // XMLHttpRequest provides actual upload progress, which browser fetch does not expose.
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    if (signal.aborted) { reject(new Error('Upload cancelled.')); return; }
    signal.addEventListener('abort', abort, { once: true });
    request.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`);
    request.timeout = 120000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round(event.loaded / event.total * 100)));
    };
    request.onloadend = () => signal.removeEventListener('abort', abort);
    request.onerror = () => reject(new Error('Photo upload failed. Check your connection and try again.'));
    request.ontimeout = () => reject(new Error('Photo upload timed out. Please try again.'));
    request.onabort = () => reject(new Error('Upload cancelled.'));
    request.onload = () => {
      try {
        const result = JSON.parse(request.responseText);
        if (request.status < 200 || request.status >= 300) throw new Error(result.error?.message || 'Photo upload failed.');
        if (typeof result.secure_url !== 'string' || !result.secure_url.startsWith('https://')) throw new Error('Upload did not return a secure photo URL.');
        onProgress(100);
        resolve(result.secure_url);
      } catch (error) { reject(error); }
    };
    request.send(body);
  });
}

export function teamPhotoUrl(photoUrl: string): string {
  try {
    const url = new URL(photoUrl);
    if (url.hostname === 'res.cloudinary.com' && url.protocol === 'https:') {
      url.pathname = url.pathname.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800,h_1000,c_fill,g_face/');
      return url.toString();
    }
  } catch { /* Leave non-Cloudinary URLs unchanged. */ }
  return photoUrl;
}
