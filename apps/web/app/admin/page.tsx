'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { API, adminFetch } from '@/lib/api';
import { BlockForm } from '@/components/block-form';
import { TeamAdmin } from '@/components/team-admin';
import { SubscribersAdmin } from '@/components/subscribers-admin';

type Block = {
  id: string;
  type: string;
  position: number;
  enabled: boolean;
  data: any;
};

export default function Admin() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageId, setPageId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [view, setView] = useState<'blocks' | 'team' | 'subscribers'>('blocks');

  const [loginError, setLoginError] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  async function login() {
    setLoginError('');
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Login failed');
      const result = await response.json();
      localStorage.setItem('accessToken', result.accessToken);
      setToken(result.accessToken);
      setPassword('');
      await load(result.accessToken).catch(() => setOrderStatus('Failed to load pages'));
    } catch {
      setLoginError('Wrong email or password');
    }
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setToken('');
    setPassword('');
    setBlocks([]);
    setPageId('');
    setSaveStatus({});
    setOrderStatus('');
    setView('blocks');
  }

  async function load(activeToken = token) {
    const response = await adminFetch('/content/admin/pages', activeToken);
    if (!response.ok) throw new Error('Failed to load pages');
    const result = await response.json();

    const home = result.find((page: { slug: string }) => page.slug === 'home');
    if (home) {
      setPageId(home.id);
      setBlocks(home.blocks as Block[]);
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken') || '';
    setToken(savedToken);
    if (savedToken) load(savedToken).catch(() => setOrderStatus('Failed to load pages'));
  }, []);

  async function save(block: Block) {
    setSaveStatus((current) => ({ ...current, [block.id]: 'Saving…' }));

    const response = await adminFetch(`/content/admin/blocks/${block.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        data: block.data,
        enabled: block.enabled,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('Failed to save block', response.status, message);
      setSaveStatus((current) => ({
        ...current,
        [block.id]: `Save failed (${response.status})`,
      }));
      return;
    }

    const saved = (await response.json()) as Block;

    setBlocks((current) =>
      current.map((value) => (value.id === saved.id && value === block ? saved : value)),
    );
    setSaveStatus((current) => ({ ...current, [block.id]: current[block.id] === 'Saving…' ? 'Saved' : current[block.id] }));
  }

  async function saveOrder() {
    const ids = blocks.map((block) => block.id);
    setSavingOrder(true);
    setOrderStatus('Saving order…');
    try {
      const response = await adminFetch(`/content/admin/pages/${pageId}/order`, token, {
        method: 'PATCH',
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to save order');
      setOrderStatus('Order saved');
    } catch {
      setOrderStatus('Order save failed. Please try again.');
    } finally {
      setSavingOrder(false);
    }
  }

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 p-6">
        <form onSubmit={(event) => { event.preventDefault(); void login(); }} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-7">
          <h1 className="text-3xl">Admin login</h1>
          <input className="w-full rounded bg-black p-3" aria-label="Email" type="email" autoComplete="username" required placeholder="Email" onChange={(event) => setEmail(event.target.value)} />
          <input className="w-full rounded bg-black p-3" aria-label="Password" autoComplete="current-password" required type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" className="w-full rounded bg-mint p-3 text-black">Sign in</button>
          {loginError && <p role="alert" className="text-sm text-red-300">{loginError}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-10">
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-mint">CONFIDO CMS</p>
          <h1 className="text-3xl">{view === 'blocks' ? 'Page blocks' : view === 'team' ? 'Team members' : 'Subscribers'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setView('blocks')} className={`rounded px-4 py-3 ${view === 'blocks' ? 'bg-white text-black' : 'border border-white/20'}`}>Page blocks</button>
          <button onClick={() => setView('team')} className={`rounded px-4 py-3 ${view === 'team' ? 'bg-white text-black' : 'border border-white/20'}`}>Team</button>
          <button onClick={() => setView('subscribers')} className={`rounded px-4 py-3 ${view === 'subscribers' ? 'bg-white text-black' : 'border border-white/20'}`}>Subscribers</button>
          {view === 'blocks' && <>
            <span role="status" className="self-center text-sm text-zinc-400">{orderStatus}</span>
            <button onClick={saveOrder} disabled={!pageId || savingOrder} className="rounded bg-mint px-5 py-3 text-black disabled:opacity-50">Save order</button>
          </>}
          <button onClick={logout} className="rounded border border-white/20 px-4 py-3">Log out</button>
        </div>
      </header>

      {view === 'subscribers' ? <SubscribersAdmin token={token} /> : view === 'team' ? <TeamAdmin token={token} /> : (
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(next) => { if (!savingOrder) { setBlocks(next); setOrderStatus('Unsaved order'); } }}
        className="mx-auto max-w-5xl space-y-4"
      >
        {blocks.map((block) => (
          <Reorder.Item value={block} key={block.id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="mb-5 flex items-center justify-between">
              <b className="capitalize">⠿ {block.type}</b>
              <div className="flex items-center gap-2">
                {saveStatus[block.id] && (
                  <span className="text-sm text-zinc-400">{saveStatus[block.id]}</span>
                )}
                <button onClick={() => save(block)} className="rounded bg-white px-3 py-2 text-black">Save</button>

              </div>
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.enabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setBlocks((current) => current.map((value) => value.id === block.id ? { ...value, enabled } : value));
                  setSaveStatus((current) => ({ ...current, [block.id]: 'Unsaved changes' }));
                }}
              />
              Show on site
            </label>
            <BlockForm
              data={block.data}
              onChange={(data) => {
                setBlocks((current) => current.map((value) => value.id === block.id ? { ...value, data } : value));
                setSaveStatus((current) => ({ ...current, [block.id]: 'Unsaved changes' }));
              }}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
      )}
    </main>
  );
}
