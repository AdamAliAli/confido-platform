'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

type Subscriber = { id: string; email: string; createdAt: string };

export function SubscribersAdmin({ token }: { token: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [status, setStatus] = useState('Loading subscribers…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await adminFetch('/newsletter', token, { signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 403 ? 'Subscribers are available to admins only.' : 'Could not load subscribers.');
        const result: Subscriber[] = await response.json();
        if (!controller.signal.aborted) { setSubscribers(result); setStatus(''); }
      } catch (error) { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Could not load subscribers.'); }
    }
    void load();
    return () => controller.abort();
  }, [token]);

  async function remove(subscriber: Subscriber) {
    if (!window.confirm(`Delete subscriber ${subscriber.email}?`)) return;
    setBusy(true);
    try {
      const response = await adminFetch(`/newsletter/${subscriber.id}`, token, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete subscriber.');
      setSubscribers((current) => current.filter((item) => item.id !== subscriber.id));
      setStatus('Subscriber deleted.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete subscriber.'); }
    finally { setBusy(false); }
  }

  async function download() {
    setBusy(true);
    try {
      const response = await adminFetch('/newsletter/export', token);
      if (!response.ok) throw new Error('Could not download CSV.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'subscribers.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('CSV downloaded.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not download CSV.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="mx-auto max-w-5xl rounded-xl border border-white/10 bg-zinc-900 p-5" aria-label="Newsletter subscribers">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl">Subscribers ({subscribers.length})</h2>
        <button type="button" disabled={busy} onClick={download} className="rounded bg-mint px-4 py-3 text-black disabled:opacity-40">Download CSV</button>
      </div>
      {status && <p role="status" className="mb-4 text-sm text-zinc-400">{status}</p>}
      {!subscribers.length && !status && <p className="text-zinc-400">No subscribers yet.</p>}
      <ul className="divide-y divide-white/10">
        {subscribers.map((subscriber) => (
          <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0"><p className="break-all">{subscriber.email}</p><time dateTime={subscriber.createdAt} className="text-sm text-zinc-400">{new Date(subscriber.createdAt).toLocaleString()}</time></div>
            <button type="button" disabled={busy} onClick={() => remove(subscriber)} aria-label={`Delete ${subscriber.email}`} className="rounded bg-red-950 px-3 py-2 text-sm text-red-200 disabled:opacity-40">Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
