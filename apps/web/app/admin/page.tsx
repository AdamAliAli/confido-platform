'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { adminFetch } from '@/lib/api';
import { BlockForm } from '@/components/block-form';

const SUPPORTED_BLOCK_TYPES = ['hero', 'services', 'projects', 'clarity'] as const;
type SupportedBlockType = (typeof SUPPORTED_BLOCK_TYPES)[number];

type Block = {
  id: string;
  type: string;
  position: number;
  enabled: boolean;
  data: any;
};

const BLOCK_TEMPLATES: Record<SupportedBlockType, Record<string, unknown>> = {
  hero: {
    title: 'New headline',
    accent: 'With',
    subtitle: 'Direction',
    description: 'Add a clear description.',
    eyebrow: 'Brand consultancy',
  },
  services: {
    services: [
      { title: 'New service', description: 'Describe this service.' },
    ],
  },
  projects: { projects: [] },
  clarity: { heading: 'Built on Clarity — Built to Scale' },
};

function isSupportedBlock(block: Block) {
  return SUPPORTED_BLOCK_TYPES.includes(block.type as SupportedBlockType);
}

export default function Admin() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageId, setPageId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);

  async function login() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', result.accessToken);
      setToken(result.accessToken);
    }
  }

  async function load(activeToken = token) {
    const response = await adminFetch('/content/admin/pages', activeToken);
    const result = await response.json();

    if (result[0]) {
      setPageId(result[0].id);
      setBlocks((result[0].blocks as Block[]).filter(isSupportedBlock));
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken') || '';
    setToken(savedToken);
    if (savedToken) load(savedToken);
  }, []);

  async function save(block: Block) {
    await adminFetch(`/content/admin/blocks/${block.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        data: block.data,
        enabled: block.enabled,
        position: block.position,
      }),
    });
  }

  async function add(type: SupportedBlockType) {
    const response = await adminFetch(`/content/admin/pages/${pageId}/blocks`, token, {
      method: 'POST',
      body: JSON.stringify({
        type,
        position: blocks.length,
        data: BLOCK_TEMPLATES[type],
      }),
    });

    if (response.ok) {
      const created = await response.json();
      setBlocks((current) => [...current, created]);
    }
  }

  async function remove(id: string) {
    await adminFetch(`/content/admin/blocks/${id}`, token, { method: 'DELETE' });
    setBlocks((current) => current.filter((block) => block.id !== id));
  }

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 p-6">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-7">
          <h1 className="text-3xl">Admin login</h1>
          <input className="w-full rounded bg-black p-3" placeholder="Email" onChange={(event) => setEmail(event.target.value)} />
          <input className="w-full rounded bg-black p-3" type="password" placeholder="Password" onChange={(event) => setPassword(event.target.value)} />
          <button className="w-full rounded bg-mint p-3 text-black" onClick={login}>Sign in</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-10">
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-mint">CONFIDO CMS</p>
          <h1 className="text-3xl">Page blocks</h1>
        </div>
        <div className="flex gap-2">
          <select id="newType" className="rounded bg-zinc-800 px-3">
            {SUPPORTED_BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={() => add((document.getElementById('newType') as HTMLSelectElement).value as SupportedBlockType)}
            className="rounded border border-white/20 px-4"
          >
            Add block
          </button>
          <button
            onClick={() => adminFetch(`/content/admin/pages/${pageId}/publish`, token, { method: 'POST' })}
            className="rounded bg-mint px-5 py-3 text-black"
          >
            Publish
          </button>
        </div>
      </header>

      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(next) => setBlocks(next.map((block, index) => ({ ...block, position: index })))}
        className="mx-auto max-w-5xl space-y-4"
      >
        {blocks.map((block) => (
          <Reorder.Item value={block} key={block.id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="mb-5 flex items-center justify-between">
              <b className="capitalize">⠿ {block.type}</b>
              <div className="flex gap-2">
                <button onClick={() => save(block)} className="rounded bg-white px-3 py-2 text-black">Save</button>
                <button onClick={() => remove(block.id)} className="rounded bg-red-950 px-3 py-2 text-red-200">Delete</button>
              </div>
            </div>
            <BlockForm
              data={block.data}
              onChange={(data) => setBlocks((current) => current.map((value) => value.id === block.id ? { ...value, data } : value))}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </main>
  );
}
