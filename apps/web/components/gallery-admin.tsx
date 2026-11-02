'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { CATEGORIES, image, poster, type GalleryItem } from '@/lib/cloudinary';
import { uploadMedia, type UploadedMedia } from '@/lib/team-photo';
import { canDeleteInquiry } from '@/lib/inquiries';

type Upload = { id: number; name: string; progress: number; status: string };
const field = 'w-full rounded-lg border border-white/10 bg-zinc-950 p-2 focus:outline-none focus:ring-2 focus:ring-mint';
const button = 'min-h-10 rounded-lg border border-white/10 px-3 text-sm disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-mint';
const accepted = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

export function GalleryAdmin({ token }: { token: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [section, setSection] = useState<'brand' | 'work'>('work');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [status, setStatus] = useState('Loading gallery…');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirtyItems, setDirtyItems] = useState<string[]>([]);
  const [dirtyOrders, setDirtyOrders] = useState<string[]>([]);
  const dirty = dirtyItems.length > 0 || dirtyOrders.length > 0;
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const canDelete = canDeleteInquiry(token);
  useEffect(() => {
    const abort = new AbortController(); controller.current = abort;
    adminFetch('/gallery/admin', token, { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not load gallery.');
      const result = await response.json(); if (!abort.signal.aborted) { setItems(result); setStatus(''); }
    }).catch(error => { if (!abort.signal.aborted) setStatus(error.message); });
    return () => abort.abort();
  }, [token]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || uploading) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, uploading]);

  async function request(path: string, method: string, data?: unknown) {
    const response = await adminFetch(`/gallery${path}`, token, { method, body: data === undefined ? undefined : JSON.stringify(data), signal: controller.current?.signal });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(Array.isArray(result?.message) ? result.message.join(', ') : result?.message || 'Gallery request failed.');
    return result;
  }
  function edit(id: string, data: Partial<GalleryItem>) { setItems(current => current.map(item => item.id === id ? { ...item, ...data } : item)); setDirtyItems(current => Array.from(new Set([...current, id]))); }
  async function action(run: () => Promise<void>) {
    setBusy(true); setStatus('');
    try { await run(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Gallery request failed.'); }
    finally { setBusy(false); }
  }
  function move(id: string, delta: number) {
    setItems(current => {
      const next = [...current]; const index = next.findIndex(item => item.id === id);
      const siblings = next.map((item, i) => ({ item, i })).filter(entry => entry.item.section === next[index].section);
      const target = siblings[siblings.findIndex(entry => entry.i === index) + delta]?.i;
      if (target !== undefined) [next[index], next[target]] = [next[target], next[index]];
      return next;
    }); setDirtyOrders(current => Array.from(new Set([...current, items.find(item => item.id === id)!.section])));
  }

  async function pick(files: File[]) {
    if (uploading || !controller.current || controller.current.signal.aborted) return;
    const signal = controller.current.signal;
    const jobs = files.map(file => ({ file, id: ++sequence.current }));
    const update = (id: number, patch: Partial<Upload>) => { if (!signal.aborted) setUploads(current => current.map(job => job.id === id ? { ...job, ...patch } : job)); };
    setUploads(current => [...current, ...jobs.map(({ file, id }) => ({ id, name: file.name, progress: 0, status: 'Queued' }))]);
    setUploading(true);
    // Two workers share the queue; the database save is part of each upload job.
    let cursor = 0;
    const worker = async () => {
      while (cursor < jobs.length && !signal.aborted) {
        const { file, id } = jobs[cursor++];
        let uploaded: UploadedMedia | undefined;
        try {
          const maxMb = file.type === 'video/mp4' ? 100 : 10;
          if (!accepted.includes(file.type)) throw new Error('Choose JPEG, PNG, WebP or MP4 files.');
          if (file.size > maxMb * 1024 * 1024) throw new Error(`${file.type === 'video/mp4' ? 'Video' : 'Image'} must be ${maxMb} MB or smaller.`);
          update(id, { status: 'Uploading…' });
          uploaded = await uploadMedia(file, token, progress => update(id, { progress }), signal, { folder: 'confido/gallery', acceptedTypes: accepted, maxMb, resource: 'auto' });
          update(id, { status: 'Saving…' });
          const saved = await request('', 'POST', { section, ...(section === 'work' ? { category } : {}), publicId: uploaded.public_id, mediaType: uploaded.resource_type, width: uploaded.width, height: uploaded.height, title: (file.name.replace(/\.[^.]+$/, '') || 'Untitled').slice(0, 120) });
          if (!signal.aborted) setItems(current => [...current, saved]);
          update(id, { progress: 100, status: 'Saved' });
        } catch (error) { update(id, { status: `${uploaded ? 'Uploaded but not saved. ' : ''}${error instanceof Error ? error.message : 'Upload failed.'}` }); }
      }
    };
    await Promise.all([worker(), worker()]);
    if (!signal.aborted) setUploading(false);
  }

  return <section aria-label="Gallery editor" className="space-y-8">
    <div className="space-y-4 rounded-lg border border-white/10 bg-zinc-900 p-5"><h2 className="text-lg font-medium">Upload media</h2><div className="flex flex-wrap gap-4"><label>Section<select className={field} value={section} disabled={uploading} onChange={event => setSection(event.target.value as 'brand' | 'work')}><option value="brand">Brands</option><option value="work">Work</option></select></label>{section === 'work' && <label>Category<select className={field} value={category} disabled={uploading} onChange={event => setCategory(event.target.value)}>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>}</div>
      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-white/20 p-8 text-center focus-within:ring-2 focus-within:ring-mint" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void pick(Array.from(event.dataTransfer.files)); }}><span>Drop files here or choose files</span><input type="file" multiple accept={accepted.join(',')} disabled={uploading} className="mt-4 block w-full text-sm" onChange={event => { void pick(Array.from(event.target.files || [])); event.target.value = ''; }} /><span className="mt-3 block text-xs text-zinc-400">JPEG, PNG or WebP up to 10 MB. MP4 up to 100 MB. Two uploads at a time.</span></label>
      <ul className="space-y-3">{uploads.map(job => <li key={job.id} className="text-sm"><span className="break-all">{job.name} — {job.status} {job.status === 'Uploading…' && `${job.progress}%`}</span><progress aria-label={`${job.name} upload progress`} value={job.progress} max={100} className="block h-2 w-full accent-mint" /></li>)}</ul>
    </div>
    <p role="status" className="text-sm text-mint">{status}</p>
    {(['brand', 'work'] as const).map(group => { const list = items.filter(item => item.section === group); return <div key={group} className="space-y-4"><h2 className="text-lg font-medium">{group === 'brand' ? 'Brands' : 'Work'}</h2>{list.map((item, index) => <article key={item.id} className="grid gap-4 rounded-lg border border-white/10 bg-zinc-900 p-4 md:grid-cols-[96px_1fr]"><img src={item.mediaType === 'video' ? poster(item.publicId, 400) : image(item.publicId, 400)} alt={item.title} className="h-24 w-24 rounded-lg bg-zinc-950 object-contain" /><div className="space-y-3"><label className="block text-sm">Title<input className={field} value={item.title} maxLength={120} onChange={event => edit(item.id, { title: event.target.value })} /></label><label className="block text-sm">Client<input className={field} value={item.client || ''} maxLength={120} onChange={event => edit(item.id, { client: event.target.value })} /></label><label className="block text-sm">Category<select className={field} value={item.category || ''} onChange={event => edit(item.id, { category: event.target.value || null })}><option value="">None</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.enabled !== false} onChange={event => edit(item.id, { enabled: event.target.checked })} />Show on site</label><div className="flex flex-wrap gap-2"><button className={button} disabled={busy || uploading || !item.title.trim()} onClick={() => void action(async () => { await request(`/${item.id}`, 'PATCH', { title: item.title, client: item.client || '', category: item.category || null, enabled: item.enabled !== false }); setDirtyItems(current => current.filter(id => id !== item.id)); setStatus('Saved.'); })}>Save</button><button className={button} disabled={busy || uploading || index === 0} onClick={() => move(item.id, -1)}>Move up</button><button className={button} disabled={busy || uploading || index === list.length - 1} onClick={() => move(item.id, 1)}>Move down</button>{canDelete && <button className={button} disabled={busy || uploading} onClick={() => { if (window.confirm(`Permanently delete ${item.title} and its Cloudinary file?`)) void action(async () => { await request(`/${item.id}`, 'DELETE'); setItems(current => current.filter(entry => entry.id !== item.id)); setDirtyItems(current => current.filter(id => id !== item.id)); setStatus('Deleted.'); }); }}>Delete</button>}</div></div></article>)}{!list.length && <p className="text-sm text-zinc-400">No items yet.</p>}<button className={button} disabled={busy || uploading} onClick={() => void action(async () => { await request('/order', 'PATCH', { section: group, ids: list.map(item => item.id) }); setDirtyOrders(current => current.filter(section => section !== group)); setStatus('Order saved.'); })}>Save order</button></div>; })}
  </section>;
}
