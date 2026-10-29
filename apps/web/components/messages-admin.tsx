'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { canDeleteInquiry, type Inquiry } from '@/lib/inquiries';

export function MessagesAdmin({ token, onUnreadChange }: { token: string; onUnreadChange: (count: number) => void }) {
  const [messages, setMessages] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState('Loading messages…');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const allowDelete = canDeleteInquiry(token);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await adminFetch('/inquiries', token, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load messages.');
        const result: Inquiry[] = await response.json();
        if (!controller.signal.aborted) { setMessages(result); setStatus(''); setLoaded(true); }
      } catch (error) { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Could not load messages.'); }
    }
    void load(); return () => controller.abort();
  }, [token]);

  useEffect(() => { if (loaded) onUnreadChange(messages.filter(item => !item.read).length); }, [messages, loaded, onUnreadChange]);

  async function mark(item: Inquiry) {
    setBusy(true);
    try {
      const response = await adminFetch(`/inquiries/${item.id}`, token, { method: 'PATCH', body: JSON.stringify({ read: !item.read }) });
      if (!response.ok) throw new Error('Could not update message.');
      const saved: Inquiry = await response.json();
      setMessages(current => current.map(message => message.id === item.id ? saved : message));
      setStatus(saved.read ? 'Message marked as read.' : 'Message marked as unread.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not update message.'); }
    finally { setBusy(false); }
  }

  async function remove(item: Inquiry) {
    if (!allowDelete || !window.confirm(`Delete the message from ${item.email}?`)) return;
    setBusy(true);
    try {
      const response = await adminFetch(`/inquiries/${item.id}`, token, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete message.');
      setMessages(current => current.filter(message => message.id !== item.id)); setStatus('Message deleted.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete message.'); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-5xl space-y-4" aria-label="Contact messages">
    <h2 className="text-lg font-medium">Messages ({messages.length})</h2>
    {status && <p role="status" className="text-sm text-zinc-400">{status}</p>}
    {loaded && messages.length === 0 && <p className="rounded-lg border border-white/10 bg-zinc-900 p-5 text-zinc-400">No messages yet.</p>}
    {messages.map(item => <article key={item.id} className={`rounded-lg border border-white/10 bg-zinc-900 p-5 ${item.read ? 'font-normal' : 'font-semibold'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">{!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-label="Unread" />}<a href={`mailto:${item.email}`} className="break-all text-mint hover:underline">{item.email}</a></div>
        <time dateTime={item.createdAt} className="text-sm text-zinc-400">{new Date(item.createdAt).toLocaleString()}</time>
      </div>
      <p className="mt-3 text-sm">{item.interest}</p>
      {item.phone && <p className="mt-2 text-sm text-zinc-400">{item.phone}</p>}
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.message}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => mark(item)} className="h-10 rounded-lg border border-white/10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40">Mark as {item.read ? 'unread' : 'read'}</button>
        {allowDelete && <button type="button" disabled={busy} onClick={() => remove(item)} className="h-10 rounded-lg bg-red-950 px-3 text-sm text-red-200 focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40">Delete</button>}
      </div>
    </article>)}
  </section>;
}
