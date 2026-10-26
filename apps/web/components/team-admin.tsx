'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch, type TeamMember } from '@/lib/api';
import { uploadTeamPhoto, validateTeamPhoto } from '@/lib/team-photo';

type TeamForm = {
  name: string;
  role: string;
  quote: string;
  photoUrl: string;
  xUrl: string;
  dribbbleUrl: string;
  linkedinUrl: string;
  sortOrder: number;
};

const EMPTY_FORM: TeamForm = {
  name: '',
  role: '',
  quote: '',
  photoUrl: '',
  xUrl: '',
  dribbbleUrl: '',
  linkedinUrl: '',
  sortOrder: 0,
};

function formFromMember(member: TeamMember): TeamForm {
  return {
    name: member.name,
    role: member.role,
    quote: member.quote || '',
    photoUrl: member.photoUrl,
    xUrl: member.xUrl || '',
    dribbbleUrl: member.dribbbleUrl || '',
    linkedinUrl: member.linkedinUrl || '',
    sortOrder: member.sortOrder,
  };
}

function payloadFromForm(form: TeamForm) {
  return {
    ...form,
    quote: form.quote.trim() || null,
    xUrl: form.xUrl.trim() || null,
    dribbbleUrl: form.dribbbleUrl.trim() || null,
    linkedinUrl: form.linkedinUrl.trim() || null,
  };
}

export function TeamAdmin({ token }: { token: string }) {
  const formSectionRef = useRef<HTMLElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await adminFetch('/team', token);
      if (!response.ok) throw new Error(`Unable to load team (${response.status})`);
      setMembers(await response.json());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load team');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => () => { uploadRef.current?.abort(); }, []);

  async function uploadPhoto(file: File) {
    setUploadError('');
    try { validateTeamPhoto(file); } catch (error) {
      setUploadError((error as Error).message);
      return;
    }
    const controller = new AbortController();
    uploadRef.current = controller;
    setUploading(true);
    setUploadProgress(0);
    try {
      const photoUrl = await uploadTeamPhoto(file, token, setUploadProgress, controller.signal);
      if (!controller.signal.aborted) {
        update('photoUrl', photoUrl);
        setStatus('Photo uploaded. Save changes to publish it.');
      }
    } catch (error) {
      if (!controller.signal.aborted) setUploadError(error instanceof Error ? error.message : 'Photo upload failed.');
    } finally {
      if (uploadRef.current === controller) {
        uploadRef.current = null;
        setUploading(false);
      }
    }
  }

  function update<K extends keyof TeamForm>(key: K, value: TeamForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(member: TeamMember) {
    setEditingId(member.id);
    setForm(formFromMember(member));
    setStatus('');
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function save() {
    setStatus('Saving…');
    const response = await adminFetch(editingId ? `/team/${editingId}` : '/team', token, {
      method: editingId ? 'PATCH' : 'POST',
      body: JSON.stringify(payloadFromForm(form)),
    });

    if (!response.ok) {
      const message = await response.text();
      setStatus(`Save failed (${response.status}): ${message}`);
      return;
    }

    setStatus(editingId ? 'Team member updated.' : 'Team member added.');
    resetForm();
    await load();
  }

  async function remove(member: TeamMember) {
    if (!window.confirm(`Delete ${member.name} from the team?`)) return;

    const response = await adminFetch(`/team/${member.id}`, token, { method: 'DELETE' });
    if (!response.ok) {
      setStatus(`Delete failed (${response.status}).`);
      return;
    }

    if (editingId === member.id) resetForm();
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setStatus('Team member deleted.');
  }

  const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-black p-3 text-white';

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section ref={formSectionRef} className="scroll-mt-6 rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl">{editingId ? 'Edit team member' : 'Add team member'}</h2>
          {editingId && <button type="button" disabled={uploading} onClick={resetForm} className="text-sm text-zinc-400 hover:text-white disabled:opacity-40">Cancel</button>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-400">Name
            <input className={inputClass} value={form.name} maxLength={100} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label className="text-sm text-zinc-400">Role
            <input className={inputClass} value={form.role} maxLength={100} onChange={(event) => update('role', event.target.value)} />
          </label>
          <label className="text-sm text-zinc-400 md:col-span-2">Quote
            <textarea className={`${inputClass} min-h-24`} value={form.quote} maxLength={320} onChange={(event) => update('quote', event.target.value)} />
          </label>
          <div className="text-sm text-zinc-400 md:col-span-2">
            <label htmlFor="team-photo-url">Photo URL</label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="team-photo-url" className={`${inputClass} min-w-0 flex-1`} disabled={uploading} type="url" value={form.photoUrl} placeholder="https://…" onChange={(event) => update('photoUrl', event.target.value)} />
              <button type="button" disabled={uploading} onClick={() => photoInputRef.current?.click()} className="mt-2 rounded border border-white/20 px-3 py-3 text-white disabled:opacity-40">Upload photo</button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose team photo" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void uploadPhoto(file);
            }} />
            <p className="mt-2 text-xs">JPEG, PNG or WebP, up to 8 MB.</p>
            {uploading && <p role="status" className="mt-2 text-mint">Uploading… {uploadProgress}%</p>}
            {uploadError && <p role="alert" className="mt-2 text-red-300">{uploadError}</p>}
            {form.photoUrl.startsWith('https://') && <img key={form.photoUrl} src={form.photoUrl} alt="Team photo preview" className="mt-3 h-28 w-24 rounded bg-black object-cover" />}
          </div>
          <label className="text-sm text-zinc-400">X URL
            <input className={inputClass} type="url" value={form.xUrl} placeholder="https://…" onChange={(event) => update('xUrl', event.target.value)} />
          </label>
          <label className="text-sm text-zinc-400">Dribbble URL
            <input className={inputClass} type="url" value={form.dribbbleUrl} placeholder="https://…" onChange={(event) => update('dribbbleUrl', event.target.value)} />
          </label>
          <label className="text-sm text-zinc-400">LinkedIn URL
            <input className={inputClass} type="url" value={form.linkedinUrl} placeholder="https://…" onChange={(event) => update('linkedinUrl', event.target.value)} />
          </label>
          <label className="text-sm text-zinc-400">Sort order
            <input className={inputClass} type="number" min={0} value={form.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} />
          </label>
        </div>

        <button
          type="button"
          disabled={uploading || !form.name.trim() || !form.role.trim() || !form.photoUrl.trim()}
          onClick={save}
          className="mt-5 rounded bg-mint px-5 py-3 text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {editingId ? 'Save changes' : 'Add member'}
        </button>
        {status && <p className="mt-4 break-words text-sm text-zinc-400" role="status">{status}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Current team</h2>
        {loading && <p className="text-zinc-400">Loading team…</p>}
        {!loading && members.length === 0 && <p className="rounded-xl border border-white/10 bg-zinc-900 p-5 text-zinc-400">No team members yet.</p>}
        {members.map((member) => (
          <article key={member.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
            <img src={member.photoUrl} alt="" className="h-16 w-16 rounded-lg bg-black object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg">{member.name}</h3>
              <p className="truncate text-sm text-zinc-400">{member.role} · Order {member.sortOrder}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={uploading} onClick={() => startEditing(member)} className="rounded border border-white/20 px-3 py-2 text-sm disabled:opacity-40">Edit</button>
              <button type="button" disabled={uploading} onClick={() => remove(member)} className="rounded bg-red-950 px-3 py-2 text-sm text-red-200 disabled:opacity-40">Delete</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
