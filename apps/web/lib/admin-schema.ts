import { SECTION_DEFAULTS } from './section-defaults';

// Fields are shown even when absent from saved data. Keys match the public blocks.
export type Field = { key: string; label: string; kind: 'text' | 'textarea' | 'url' | 'email' | 'image' | 'list'; help?: string; max?: number; fields?: Field[]; itemLabel?: string };
export type BlockSchema = { name: string; section: string; fields: Field[] };

// Edit labels/help here; all input remains plain text, without HTML or rich text.
export const ADMIN_SCHEMA: Record<string, BlockSchema> = {
  hero: { name: 'Hero', section: '#hero', fields: [
    { key: 'eyebrow', label: 'Small label above the title', kind: 'text' },
    { key: 'title', label: 'Big title, line 1', kind: 'text' },
    { key: 'accent', label: 'Mint word, line 2', kind: 'text' },
    { key: 'subtitle', label: 'White word after it, line 2', kind: 'text' },
    { key: 'description', label: 'Description', kind: 'textarea' },
  ] },
  services: { name: 'Services', section: '#services', fields: [
    { key: 'services', label: 'Services', kind: 'list', max: 3, itemLabel: 'Service', fields: [
      { key: 'title', label: 'Title', kind: 'text' }, { key: 'description', label: 'Description', kind: 'textarea' },
    ] },
  ] },
  projects: { name: 'Projects', section: '#projects', fields: [
    { key: 'projects', label: 'Projects', kind: 'list', itemLabel: 'Project', fields: [
      { key: 'title', label: 'Title', kind: 'text' }, { key: 'category', label: 'Category', kind: 'text' },
      { key: 'year', label: 'Year', kind: 'text' }, { key: 'image', label: 'Image', kind: 'image' },
      { key: 'href', label: 'Link (optional)', kind: 'url', help: 'Use a full HTTPS link to the project.' },
    ] },
  ] },
  clarity: { name: 'Clarity', section: '#clarity', fields: [
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'metrics', label: 'Metrics', kind: 'list', max: 3, itemLabel: 'Metric', fields: [
      { key: 'label', label: 'Label', kind: 'text' }, { key: 'value', label: 'Value', kind: 'text', help: 'e.g. 98+ or 200M' },
      { key: 'image', label: 'Image', kind: 'image' },
    ] },
  ] },
  location: { name: 'About us / Location', section: '#about-us', fields: [
    { key: 'label', label: 'Section label', kind: 'text' }, { key: 'placeLabel', label: 'Place label', kind: 'text' },
    { key: 'country', label: 'Country label', kind: 'text' }, { key: 'city', label: 'City', kind: 'text' },
    { key: 'mapUrl', label: 'Map link', kind: 'url', help: 'Paste the HTTPS Google Maps link.' },
    { key: 'photos', label: 'Photos', kind: 'list', max: 3, itemLabel: 'Photo', fields: [
      { key: 'src', label: 'Photo', kind: 'image' }, { key: 'alt', label: 'Describe the photo', kind: 'text', help: 'A short description for screen readers.' },
    ] },
  ] },
  team: { name: 'Team', section: '#team', fields: [{ key: 'label', label: 'Section label', kind: 'text' }] },
  process: { name: 'Process', section: '#process', fields: [
    { key: 'steps', label: 'Steps', kind: 'list', max: 3, itemLabel: 'Step', fields: [
      { key: 'step', label: 'Step label', kind: 'text', help: 'e.g. Step 1' }, { key: 'title', label: 'Title', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'textarea' }, { key: 'image', label: 'Image', kind: 'image' },
    ] },
  ] },
  faq: { name: 'FAQ', section: '#faq', fields: [
    { key: 'faqs', label: 'Questions', kind: 'list', itemLabel: 'Question', fields: [
      { key: 'question', label: 'Question', kind: 'text' }, { key: 'answer', label: 'Answer', kind: 'textarea' },
    ] },
  ] },
  contact: { name: 'Contact', section: '#contact', fields: [
    { key: 'title', label: 'Title', kind: 'text' }, { key: 'accent', label: 'Mint line', kind: 'text' },
    { key: 'description', label: 'Description', kind: 'textarea' }, { key: 'email', label: 'Contact email', kind: 'email' },
  ] },
};

// Unknown types keep the old generic editing behavior for saved string fields.
export function genericFields(data: Record<string, unknown>): Field[] {
  return Object.entries(data).flatMap(([key, value]): Field[] => {
    if (Array.isArray(value)) return [{ key, label: key, kind: 'list', itemLabel: 'Item', fields: genericFields(Object.assign({}, ...value.filter(item => item && typeof item === 'object'))) }];
    if (typeof value === 'string') return [{ key, label: key, kind: 'text' }];
    return [];
  });
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]); return next;
}

const empty = (value: unknown) => value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// Resolve once when loading, for both the draft and its clean baseline. Never mutate saved data.
export function editorSectionData(type: string, saved: Record<string, unknown> = {}) {
  const schema = ADMIN_SCHEMA[type];
  if (!schema) return { data: copy(saved), showingDefaults: false };
  const source = copy(saved);
  if (type === 'services' && empty(source.services) && Array.isArray(source.items) && source.items.length) source.services = source.items;
  const defaults = (SECTION_DEFAULTS as Record<string, Record<string, unknown>>)[type] || {};
  let showingDefaults = false;
  function fill(fields: Field[], values: Record<string, unknown>, fallback: Record<string, unknown>): Record<string, unknown> {
    const result = { ...values };
    for (const field of fields) {
      let value = values[field.key];
      const defaultValue = fallback[field.key];
      if (empty(value) && defaultValue !== undefined) { value = copy(defaultValue); showingDefaults = true; }
      if (field.kind === 'list') {
        const defaultItems = Array.isArray(defaultValue) ? defaultValue : [];
        const items = Array.isArray(value) ? [...value] : [];
        // Location always renders three photos, including fallbacks for absent slots.
        if (type === 'location' && field.key === 'photos' && items.length < defaultItems.length) {
          while (items.length < defaultItems.length) { items.push(copy(defaultItems[items.length])); showingDefaults = true; }
        }
        result[field.key] = items.map((item, index) => fill(field.fields || [], item && typeof item === 'object' ? item : {}, defaultItems[index] || defaultItems[0] || {}));
      } else result[field.key] = value ?? '';
    }
    return result;
  }
  return { data: fill(schema.fields, source, defaults), showingDefaults };
}

// Keep unrelated saved settings (e.g. hero gallery images), but retire the old services key.
export function blockSaveData(type: string, data: Record<string, unknown>) {
  const result = { ...data };
  if (type === 'services') delete result.items;
  return result;
}
