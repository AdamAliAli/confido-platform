'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ADMIN_SCHEMA, genericFields, moveItem, type Field } from '@/lib/admin-schema';
import { imageUrl } from '@/lib/media-url';
import { uploadTeamPhoto } from '@/lib/team-photo';

const inputStyle = 'w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-50';
const buttonStyle = 'h-10 rounded-lg border border-white/10 px-3 text-sm text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40';
type Values = Record<string, unknown>;
type Props = { data: Values; onChange: (value: Values) => void; type?: string; fields?: Field[]; token?: string; disabled?: boolean; onUploadChange?: (delta: number) => void };

function ImageField({ value, onChange, token, onUploadChange, id }: { value: string; onChange: (value: string) => void; token?: string; onUploadChange?: (delta: number) => void; id: string }) {
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => { request.current?.abort(); }, []);
  async function upload(file: File) {
    const controller = new AbortController();
    request.current = controller;
    setError(''); setProgress(0); onUploadChange?.(1);
    try {
      const url = await uploadTeamPhoto(file, token || '', setProgress, controller.signal, 'confido/site');
      if (!controller.signal.aborted) onChange(url);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Upload failed. Please try again.');
    } finally { request.current = null; setProgress(null); onUploadChange?.(-1); }
  }
  return <>
    <div className="flex flex-wrap items-center gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
        {imageUrl(value, '') && <img key={value} src={value} alt="Image preview" className="h-full w-full object-cover" />}
      </div>
      <input id={id} className={`${inputStyle} min-w-0 flex-1`} value={value} onChange={event => onChange(event.target.value)} placeholder="https://… or /images/…" />
      <button type="button" className={buttonStyle} disabled={!token || progress !== null} onClick={() => picker.current?.click()}>Upload</button>
      <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose image to upload" className="hidden" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} />
    </div>
    <p className="mt-2 text-xs text-zinc-500">JPEG, PNG or WebP, up to 10 MB. Save the section after uploading to publish.</p>
    {progress !== null && <p role="status" className="mt-2 text-sm text-mint">Uploading… {progress}%</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
  </>;
}

function ListField({ field, value, ...props }: Omit<Props, 'type' | 'fields'> & { field: Field; value: unknown }) {
  const items: Values[] = Array.isArray(value) ? value.map(item => item && typeof item === 'object' ? item : {}) : [];
  const update = (next: Values[]) => props.onChange({ ...props.data, [field.key]: next });
  const titleField = field.fields?.find(item => item.kind === 'text');
  const label = field.itemLabel || 'Item';
  return <div className="space-y-3">
    {items.map((item, index) => <details key={index} open className="rounded-lg border border-white/10 bg-zinc-950/40">
      <summary className="cursor-pointer break-words px-4 py-3 text-sm font-medium">{typeof item[titleField?.key || ''] === 'string' && String(item[titleField?.key || '']).trim() ? String(item[titleField!.key]) : `${label} ${index + 1}`}</summary>
      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className={buttonStyle} disabled={props.disabled || index === 0} onClick={() => update(moveItem(items, index, index - 1))}>Move up</button>
          <button type="button" className={buttonStyle} disabled={props.disabled || index === items.length - 1} onClick={() => update(moveItem(items, index, index + 1))}>Move down</button>
          <button type="button" className={`${buttonStyle} text-red-300`} disabled={props.disabled} onClick={() => { if (window.confirm(`Remove ${label.toLowerCase()} ${index + 1}?`)) update(items.filter((_, i) => i !== index)); }}>Remove</button>
        </div>
        <BlockForm data={item} fields={field.fields || []} token={props.token} disabled={props.disabled} onUploadChange={props.onUploadChange} onChange={next => update(items.map((old, i) => i === index ? next : old))} />
      </div>
    </details>)}
    <button type="button" className={buttonStyle} disabled={props.disabled || (field.max !== undefined && items.length >= field.max)} onClick={() => update([...items, {}])}>Add {label}</button>
    {field.max !== undefined && <p className="text-xs text-zinc-500">{items.length} / {field.max} items</p>}
  </div>;
}

export function BlockForm({ data, onChange, type, fields, token, disabled, onUploadChange }: Props) {
  const prefix = useId();
  const schemaFields = fields || (type && ADMIN_SCHEMA[type]?.fields) || genericFields(data || {});
  return <fieldset disabled={disabled} className="min-w-0 space-y-6">
    {schemaFields.map(field => {
      const id = `${prefix}-${field.key}`;
      const value = typeof data[field.key] === 'string' || typeof data[field.key] === 'number' ? String(data[field.key]) : '';
      const update = (next: string) => onChange({ ...data, [field.key]: next });
      return <div key={field.key}>
        {field.kind === 'list' ? <h3 className="mb-3 text-lg font-medium">{field.label}</h3> : <label htmlFor={id} className="mb-2 block text-sm font-medium">{field.label}</label>}
        {field.kind === 'list' ? <ListField field={field} value={data[field.key]} data={data} onChange={onChange} token={token} disabled={disabled} onUploadChange={onUploadChange} />
          : field.kind === 'image' ? <ImageField id={id} value={value} onChange={update} token={token} onUploadChange={onUploadChange} />
          : field.kind === 'textarea' ? <textarea id={id} rows={4} className={inputStyle} value={value} onChange={event => update(event.target.value)} />
          : <input id={id} type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'} inputMode={field.kind === 'url' ? 'url' : undefined} className={inputStyle} value={value} onChange={event => update(event.target.value)} />}
        {field.help && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{field.help}</p>}
      </div>;
    })}
  </fieldset>;
}
