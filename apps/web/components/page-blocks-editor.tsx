'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { ADMIN_SCHEMA, blockSaveData, editorSectionData, moveItem } from '@/lib/admin-schema';
import { BlockForm } from './block-form';

export type PageBlock = { id: string; type: string; position: number; enabled: boolean; data: Record<string, unknown> };
const buttonStyle = 'inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40';
const sameContent = (a: PageBlock | undefined, b: PageBlock) => !!a && a.enabled === b.enabled && JSON.stringify(a.data) === JSON.stringify(b.data);

function BlockRow({ block, selected, dirty, disabled, onSelect, onToggle, onMove }: { block: PageBlock; selected: boolean; dirty: boolean; disabled: boolean; onSelect: () => void; onToggle: () => void; onMove: (direction: number) => void }) {
  const controls = useDragControls();
  const name = ADMIN_SCHEMA[block.type]?.name || block.type;
  return <Reorder.Item value={block} dragListener={false} dragControls={controls} className={`flex min-w-[250px] shrink-0 items-center gap-1 rounded-lg border p-2 md:min-w-0 ${selected ? 'border-mint/50 bg-white/5' : 'border-white/10 bg-zinc-900'}`}>
    <button type="button" aria-label={`Reorder ${name}`} title="Drag to reorder, or use arrow keys" disabled={disabled} onPointerDown={event => { if (!disabled) controls.start(event); }} onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); onMove(-1); } if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); onMove(1); } }} className="grid h-10 w-7 shrink-0 touch-none place-items-center rounded-lg text-zinc-500 focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40"><GripVertical className="h-4 w-4" /></button>
    <button type="button" onClick={onSelect} disabled={disabled} aria-pressed={selected} className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg text-left text-sm focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40">
      <span className={block.enabled ? '' : 'text-zinc-500'}>{name}</span>
      {dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-label="Unsaved changes" />}
    </button>
    <button type="button" disabled={disabled} onClick={onToggle} aria-label={`${block.enabled ? 'Hide' : 'Show'} ${name}`} aria-pressed={block.enabled} className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40">{block.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
  </Reorder.Item>;
}

export function PageBlocksEditor({ initialBlocks, pageId, token, active, onTeam }: { initialBlocks: PageBlock[]; pageId: string; token: string; active: boolean; onTeam: () => void }) {
  const resolved = (block: PageBlock) => ({ ...block, data: editorSectionData(block.type, block.data || {}).data });
  const [blocks, setBlocks] = useState(() => initialBlocks.map(resolved));
  const [saved, setSaved] = useState<Record<string, PageBlock>>(() => Object.fromEntries(initialBlocks.map(block => [block.id, resolved(block)])));
  const [showingDefaults, setShowingDefaults] = useState<Record<string, boolean>>(() => Object.fromEntries(initialBlocks.map(block => [block.id, editorSectionData(block.type, block.data || {}).showingDefaults])));
  const [savedOrder, setSavedOrder] = useState(initialBlocks.map(block => block.id));
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id || '');
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [preview, setPreview] = useState(true);
  const [revision, setRevision] = useState(0);
  const [desktop, setDesktop] = useState(false);
  const [wide, setWide] = useState(false);
  const [uploads, setUploads] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const uploadChange = useCallback((delta: number) => setUploads(count => Math.max(0, count + delta)), []);
  const selected = blocks.find(block => block.id === selectedId);
  const dirty = blocks.some(block => !sameContent(saved[block.id], block));
  const orderDirty = JSON.stringify(blocks.map(block => block.id)) !== JSON.stringify(savedOrder);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const wideQuery = window.matchMedia('(min-width: 1280px)');
    const update = () => { setDesktop(desktopQuery.matches); setWide(wideQuery.matches); };
    update(); desktopQuery.addEventListener('change', update); wideQuery.addEventListener('change', update);
    return () => { desktopQuery.removeEventListener('change', update); wideQuery.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    if (!dirty && !orderDirty && !uploads) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, orderDirty, uploads]);

  async function saveSelected() {
    if (!selected || saveLock.current || uploads || !form.current?.reportValidity()) return;
    saveLock.current = true; setSavingId(selected.id); setStatuses(current => ({ ...current, [selected.id]: 'Saving…' }));
    const sent = selected;
    try {
      const response = await adminFetch(`/content/admin/blocks/${sent.id}`, token, { method: 'PATCH', body: JSON.stringify({ data: blockSaveData(sent.type, sent.data), enabled: sent.enabled }) });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message || `Request failed (${response.status})`);
      }
      const result: PageBlock = await response.json();
      setSaved(current => ({ ...current, [sent.id]: result }));
      setShowingDefaults(current => ({ ...current, [sent.id]: false }));
      setBlocks(current => current.map(block => block.id === sent.id && sameContent(sent, block) ? { ...result, position: block.position } : block));
      setStatuses(current => ({ ...current, [sent.id]: 'Saved' }));
      setRevision(value => value + 1);
    } catch (error) { setStatuses(current => ({ ...current, [sent.id]: `Save failed: ${error instanceof Error ? error.message : 'Please try again.'}` })); }
    finally { saveLock.current = false; setSavingId(null); }
  }

  useEffect(() => {
    if (!active) return;
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void saveSelected(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  function edit(next: PageBlock) {
    setBlocks(current => current.map(block => block.id === next.id ? next : block));
    setStatuses(current => ({ ...current, [next.id]: '' }));
  }

  async function saveOrder() {
    if (savingOrder || uploads) return;
    const ids = blocks.map(block => block.id);
    setSavingOrder(true); setOrderStatus('Saving order…');
    try {
      const response = await adminFetch(`/content/admin/pages/${pageId}/order`, token, { method: 'PATCH', body: JSON.stringify({ ids }) });
      if (!response.ok) throw new Error();
      setSavedOrder(ids); setOrderStatus('Order saved'); setRevision(value => value + 1);
    } catch { setOrderStatus('Order save failed. Please try again.'); }
    finally { setSavingOrder(false); }
  }

  const schema = selected && ADMIN_SCHEMA[selected.type];
  const previewSrc = `/${schema?.section || ''}`;
  const selectedDirty = selected && !sameContent(saved[selected.id], selected);
  const status = selected ? savingId === selected.id ? 'Saving…' : statuses[selected.id]?.startsWith('Save failed') ? statuses[selected.id] : selectedDirty ? 'Unsaved changes' : 'Saved' : '';

  return <div className={`grid min-w-0 gap-4 md:h-[calc(100dvh-140px)] md:min-h-[560px] md:grid-cols-[18rem_minmax(0,1fr)] ${preview && wide ? 'xl:grid-cols-[18rem_minmax(360px,1fr)_minmax(320px,1fr)]' : ''}`}>
    <aside className="flex min-h-0 min-w-0 flex-col rounded-lg border border-white/10 bg-zinc-900 p-3" aria-label="Page sections">
      <h2 className="mb-3 px-1 text-lg font-medium">Page blocks</h2>
      <Reorder.Group axis={desktop ? 'y' : 'x'} values={blocks} onReorder={next => { if (!savingOrder && !uploads) { setBlocks(next); setOrderStatus(''); } }} className="flex min-h-0 gap-2 overflow-x-auto pb-2 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
        {blocks.map((block, index) => <BlockRow key={block.id} block={block} selected={block.id === selectedId} dirty={!sameContent(saved[block.id], block)} disabled={savingOrder || !!uploads} onSelect={() => setSelectedId(block.id)} onToggle={() => edit({ ...block, enabled: !block.enabled })} onMove={direction => { if (!savingOrder && !uploads) setBlocks(current => moveItem(current, index, index + direction)); }} />)}
      </Reorder.Group>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p role="status" className="mb-2 text-xs text-zinc-400">{orderDirty ? orderStatus || 'Unsaved order' : orderStatus || 'Order saved'}</p>
        <button type="button" disabled={!pageId || savingOrder || !!uploads || !orderDirty} onClick={saveOrder} className={`${buttonStyle} w-full bg-mint text-black`}>Save order</button>
      </div>
    </aside>
    <section className="min-h-0 min-w-0 overflow-y-auto rounded-lg border border-white/10 bg-zinc-900" aria-label="Section editor">
      {selected ? <form ref={form} onSubmit={event => { event.preventDefault(); void saveSelected(); }}>
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-white/10 bg-zinc-900 p-4">
          <h2 className="mr-auto text-lg font-medium">{schema?.name || selected.type}</h2>
          <button type="submit" disabled={!!savingId || !!uploads} className={`${buttonStyle} bg-mint text-black`}>Save</button>
          <button type="button" disabled={!selectedDirty || !!savingId || !!uploads} onClick={() => { const original = saved[selected.id]; if (original) edit({ ...original, position: selected.position }); }} className={buttonStyle}>Discard changes</button>
          <label className="hidden h-10 items-center gap-2 text-sm xl:flex"><input type="checkbox" checked={preview} onChange={event => setPreview(event.target.checked)} />Preview</label>
          <p role="status" className={`w-full break-words text-sm ${status.startsWith('Save failed') ? 'text-red-300' : selectedDirty ? 'text-mint' : 'text-zinc-400'}`}>{status}{uploads ? ' · Uploading…' : ''}</p>
        </div>
        <div className="p-5">
          {showingDefaults[selected.id] && <p className="mb-5 text-sm text-zinc-400">Showing the current site content. Edit and press Save to store it.</p>}
          <BlockForm key={selected.id} type={selected.type} data={selected.data || {}} token={token} disabled={!!uploads} onUploadChange={uploadChange} onChange={data => edit({ ...selected, data })} />
          {selected.type === 'team' && <div className="mt-6 rounded-lg border border-white/10 p-4"><p className="mb-3 text-sm text-zinc-400">Edit people in the Team tab</p><button type="button" className={buttonStyle} disabled={!!uploads} onClick={onTeam}>Open Team tab</button></div>}
        </div>
      </form> : <p className="p-5 text-zinc-400">No page blocks found.</p>}
    </section>
    {preview && wide && selected && <aside className="min-h-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-950" aria-label="Site preview"><iframe key={`${selected.id}-${revision}`} src={previewSrc} title="Selected section preview" className="h-full min-h-[560px] w-full border-0" /></aside>}
  </div>;
}
