'use client';

import { useEffect, useState } from 'react';
import { API, adminFetch } from '@/lib/api';
import { PageBlocksEditor } from '@/components/page-blocks-editor';
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
  const [view, setView] = useState<'blocks' | 'team' | 'subscribers'>('blocks');

  const [loginError, setLoginError] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

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
    <main className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <header className="mb-6 grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div><p className="text-sm text-mint">Confido CMS</p><h1 className="text-lg font-medium">{view === 'blocks' ? 'Page blocks' : view === 'team' ? 'Team members' : 'Subscribers'}</h1></div>
        <nav aria-label="Admin tabs" className="flex flex-wrap gap-2">
          <button onClick={() => setView('blocks')} className={`h-10 rounded-lg px-4 text-sm focus-visible:ring-2 focus-visible:ring-mint ${view === 'blocks' ? 'bg-white text-black' : 'border border-white/10'}`}>Page blocks</button>
          <button onClick={() => setView('team')} className={`h-10 rounded-lg px-4 text-sm focus-visible:ring-2 focus-visible:ring-mint ${view === 'team' ? 'bg-white text-black' : 'border border-white/10'}`}>Team</button>
          <button onClick={() => setView('subscribers')} className={`h-10 rounded-lg px-4 text-sm focus-visible:ring-2 focus-visible:ring-mint ${view === 'subscribers' ? 'bg-white text-black' : 'border border-white/10'}`}>Subscribers</button>
        </nav>
        <div className="flex gap-2 lg:justify-end"><a href="/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-white/10 px-4 text-sm focus-visible:ring-2 focus-visible:ring-mint">View site ↗</a><button onClick={logout} className="h-10 rounded-lg border border-white/10 px-4 text-sm focus-visible:ring-2 focus-visible:ring-mint">Log out</button></div>
      </header>
      {orderStatus && <p role="status" className="mb-4 text-sm text-zinc-400">{orderStatus}</p>}
      <div hidden={view !== 'blocks'}><PageBlocksEditor key={pageId} pageId={pageId} token={token} initialBlocks={blocks} active={view === 'blocks'} onTeam={() => setView('team')} /></div>
      {view === 'team' && <TeamAdmin token={token} />}
      {view === 'subscribers' && <SubscribersAdmin token={token} />}
    </main>
  );
}
