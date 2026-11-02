const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, process: { env: { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo' } }, ...globals, require: name => imports[name] || require(name) });
  return exports;
}
function workLib() { return load('lib/work-items.ts', { './cloudinary': load('lib/cloudinary.ts'), './media-url': load('lib/media-url.ts', {}, { URL }) }, { URL }); }
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)];
}
const item = { id: 'a', section: 'work', mediaType: 'image', publicId: 'confido/gallery/a', title: 'A project', category: 'Posts', width: 800, height: 1000 };
test('gallery delivery transforms and namespace validation never permit arbitrary URLs', () => {
  const lib = load('lib/cloudinary.ts');
  assert.equal(lib.image(item.publicId, 1200), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/confido/gallery/a');
  assert.match(lib.video(item.publicId, 800), /video\/upload\/f_auto:video,q_auto,c_limit,w_800/);
  assert.match(lib.poster(item.publicId, 400), /so_0,f_auto,q_auto,c_limit,w_400\/confido\/gallery\/a.jpg$/);
  for (const invalid of ['https://evil.example/a', 'other/a', 'confido/gallery/../a', 'confido/gallery/a?x=1']) assert.equal(lib.image(invalid, 800), '');
  assert.equal(lib.image(item.publicId, 800, 'invalid/cloud'), '');
  assert.equal(lib.srcSet(item).split(', ').length, 4);
});
test('gallery fetch uses shared revalidation and safe API-down defaults', async () => {
  let init;
  const api = load('lib/api.ts', {}, { process: { env: {} }, fetch: async (url, options) => { init = options; return { ok: true, json: async () => [item, { ...item, publicId: 'https://evil.example/a' }] }; } });
  assert.equal((await api.getGallery()).length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(init)), { next: { revalidate: 300, tags: ['content'] } });
  const down = load('lib/api.ts', {}, { process: { env: {} }, fetch: async () => { throw new Error('offline'); } });
  assert.equal((await down.getGallery()).length, 0);
});
test('work page reuses header, hero, gallery, shared contact and footer', async () => {
  const blocks = { projects: { projects: [{ title: 'Homepage project', image: '/images/project.webp', category: 'Identity' }] }, contact: { title: 'Shared contact' } };
  const imports = new Proxy({ '@/lib/api': { getGallery: async () => [item], getHomeBlocks: async () => blocks }, '@/lib/work-items': workLib() }, { get(target, name) { return target[name] || (name.startsWith('@/components/') ? new Proxy({}, { get: (_, key) => key }) : undefined); } });
  const tree = await load('app/work/page.tsx', imports).default();
  assert.deepEqual(Array.from(tree.props.children, child => child.type), ['SiteHeader', 'PageHero', 'WorkGallery', 'ContactSection', 'SiteFooter']);
  assert.equal(tree.props.children[3].props.data, blocks.contact);
  assert.deepEqual(Array.from(tree.props.children[2].props.items, value => value.title), ['Homepage project', 'A project']);
});

test('homepage projects lead the grid, deduplicate shared assets and retain known Cloudinary dimensions', () => {
  const lib = workLib();
  const gallery = [{ ...item, cloudName: 'demo' }, { ...item, id: 'video', mediaType: 'video' }, { ...item, id: 'brand', section: 'brand' }];
  const result = lib.combineWorkItems([
    { title: 'Homepage', image: 'https://res.cloudinary.com/demo/image/upload/v123/confido/gallery/a.jpg', category: 'Brand Identity', href: '/projects/example' },
    { title: 'Duplicate', image: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_400/confido/gallery/a.webp' },
    { title: 'External', image: 'https://example.com/project.jpg', width: 400, height: 900, href: 'javascript:alert(1)' },
    { title: 'Known size', image: 'https://res.cloudinary.com/demo/image/upload/v2/confido/site/photo.jpg', width: 700, height: 1100 },
    { title: 'Unknown size', image: 'https://res.cloudinary.com/demo/image/upload/confido/site/other' },
    { title: 'Bad image', image: 'javascript:alert(1)' },
    null,
  ], gallery);
  assert.deepEqual(Array.from(result, value => value.title), ['Homepage', 'External', 'Known size', 'Unknown size', 'A project', 'A project']);
  assert.equal(result[0].width, 800); assert.equal(result[0].height, 1000);
  assert.equal(result[0].client, ''); assert.equal(result[0].href, '/projects/example');
  assert.equal(result[1].width / result[1].height, 1.5); assert.equal(result[1].href, undefined);
  assert.equal(result[2].width, 700); assert.equal(result[2].height, 1100);
  assert.equal(result[3].width / result[3].height, 1.5);
  assert.equal(result[4].mediaType, 'video'); assert.equal(result[5].section, 'brand');
  assert.match(lib.workImage(result[0], 1200), /f_auto,q_auto,c_limit,w_1200/);
  assert.equal(lib.workSrcSet(result[0]).split(', ').length, 4);
  assert.equal(lib.workImage(result[1], 800), 'https://example.com/project.jpg');
  assert.equal(lib.workSrcSet(result[1]), undefined);
  assert.equal(lib.combineWorkItems([], []).length, 0);
  assert.equal(lib.combineWorkItems(undefined, [item]).length, 1);
});
test('gallery filters only populated categories and opens the filtered viewer', () => {
  const states = []; let cursor = 0;
  const lib = load('lib/cloudinary.ts');
  const react = { useEffect() {}, useRef: value => ({ current: value }), useState(initial) { const key = cursor++; if (!(key in states)) states[key] = initial; return [states[key], value => { states[key] = typeof value === 'function' ? value(states[key]) : value; }]; } };
  const { WorkGallery } = load('components/sections/work-gallery.tsx', { react, '@/lib/cloudinary': lib, '@/lib/work-items': workLib(), '@/lib/media-url': load('lib/media-url.ts', {}, { URL }), './section-header': { SectionHeader: 'header' } });
  const render = items => { cursor = 0; return WorkGallery({ items }); };
  assert.ok(elements(render([])).some(node => node.props?.children === 'New work coming soon.'));
  const items = [item, { ...item, id: 'b', category: 'Reels', mediaType: 'video' }];
  let nodes = elements(render(items));
  const categories = nodes.filter(node => node.type === 'button' && node.props['aria-pressed'] !== undefined);
  assert.deepEqual(categories.map(node => node.props.children), ['All', 'Posts', 'Reels']);
  categories.find(node => node.props.children === 'Reels').props.onClick();
  nodes = elements(render(items));
  const buttons = nodes.filter(node => node.type === 'button' && node.props['aria-label'] === 'View A project');
  assert.equal(buttons.length, 1); buttons[0].props.onClick();
  const viewer = elements(render(items)).find(node => typeof node.type === 'function' && node.type.name === 'Viewer');
  assert.equal(viewer.props.items.length, 1); assert.equal(viewer.props.items[0].id, 'b');

  const project = workLib().combineWorkItems([{ title: 'Homepage only', image: '/images/project.webp', category: 'Custom Category' }], [])[0];
  categories.find(node => node.props.children === 'All').props.onClick();
  nodes = elements(render([project]));
  assert.equal(nodes.some(node => node.props?.children === 'New work coming soon.'), false);
  const custom = nodes.find(node => node.type === 'button' && node.props.children === 'Custom Category');
  assert.ok(custom); custom.props.onClick();
  nodes = elements(render([project]));
  const thumbnail = nodes.find(node => node.type === 'img');
  assert.equal(thumbnail.props.src, '/images/project.webp');
  assert.equal(thumbnail.props.width / thumbnail.props.height, 1.5);
});

test('viewer locks scrolling, navigates with keys and touch, traps focus and restores it', () => {
  const state = [], refs = [], effects = []; let cursor = 0, refCursor = 0, mounted = false, closed = 0, restored = 0;
  const listeners = {};
  const document = { body: { style: { overflow: 'auto' } }, activeElement: { focus() { restored++; } }, addEventListener(name, fn) { listeners[name] = fn; }, removeEventListener(name) { delete listeners[name]; } };
  const react = { useEffect(fn) { if (!mounted) effects.push(fn); }, useRef(value) { const i = refCursor++; return refs[i] || (refs[i] = { current: value }); }, useState(value) { const i = cursor++; if (!(i in state)) state[i] = value; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; } };
  const lib = load('lib/cloudinary.ts');
  const { WorkGallery } = load('components/sections/work-gallery.tsx', { react, 'react-dom': { createPortal: tree => tree }, '@/lib/cloudinary': lib, '@/lib/work-items': workLib(), '@/lib/media-url': load('lib/media-url.ts', {}, { URL }), './section-header': { SectionHeader: 'header' } }, { document });
  const project = workLib().combineWorkItems([{ title: 'Second project', image: '/images/project.webp', href: 'https://example.com/project' }], [])[0];
  const items = [item, project];
  const renderGallery = () => { cursor = refCursor = 0; return WorkGallery({ items }); };
  elements(renderGallery()).find(node => node.type === 'button' && node.props['aria-label'] === 'View A project').props.onClick();
  const Viewer = elements(renderGallery()).find(node => typeof node.type === 'function' && node.type.name === 'Viewer').type;
  state.length = refs.length = effects.length = 0;
  const renderViewer = () => { cursor = refCursor = 0; return Viewer({ items, start: 0, close: () => { closed++; } }); };
  let tree = renderViewer();
  const first = { focus() { document.activeElement = first; } }, last = { focus() { document.activeElement = last; } };
  tree.props.ref.current = { focus() { document.activeElement = this; }, contains(node) { return [this, first, last].includes(node); }, querySelectorAll(selector) { assert.ok(selector.includes('a[href]')); return [first, last]; } };
  const cleanup = effects[0](); mounted = true;
  assert.equal(document.body.style.overflow, 'hidden');
  const press = (key, shiftKey = false) => listeners.keydown({ key, shiftKey, preventDefault() {} });
  press('Tab'); assert.equal(document.activeElement, first);
  press('Tab', true); assert.equal(document.activeElement, last);
  press('ArrowRight'); tree = renderViewer();
  assert.equal(elements(tree).find(node => node.type === 'h3').props.children, 'Second project');
  assert.equal(elements(tree).find(node => node.type === 'a').props.href, 'https://example.com/project');
  tree.props.onTouchStart({ changedTouches: [{ clientX: 20 }] });
  tree.props.onTouchEnd({ changedTouches: [{ clientX: 100 }] });
  tree = renderViewer(); assert.equal(elements(tree).find(node => node.type === 'h3').props.children, 'A project');
  // A focused project link can disappear when navigating to a gallery item.
  document.activeElement = document.body;
  press('Tab'); assert.equal(document.activeElement, first);
  press('Escape'); assert.equal(closed, 1);
  cleanup(); assert.equal(document.body.style.overflow, 'auto'); assert.equal(restored, 1);
});
test('shared gallery upload rejects wrong types and oversize video before requesting signatures', async () => {
  let calls = 0;
  const { uploadMedia } = load('lib/team-photo.ts', { './api': { adminFetch: async () => { calls++; } } });
  const options = { folder: 'confido/gallery', acceptedTypes: ['video/mp4'], maxMb: 100 };
  await assert.rejects(uploadMedia({ type: 'video/mp4', size: 100 * 1024 * 1024 + 1 }, 'jwt', () => {}, new AbortController().signal, options), /100 MB/);
  await assert.rejects(uploadMedia({ type: 'text/html', size: 100 }, 'jwt', () => {}, new AbortController().signal, options), /JPEG/);
  assert.equal(calls, 0);
});

test('admin uploads at most two files at once and saves Cloudinary metadata', async () => {
  const state = [], refs = [], effects = []; let cursor = 0, refCursor = 0, mounted = false;
  const payloads = [], pending = []; let active = 0, maximum = 0;
  const react = {
    useState(initial) { const key = cursor++; if (!(key in state)) state[key] = initial; return [state[key], value => { state[key] = typeof value === 'function' ? value(state[key]) : value; }]; },
    useRef(initial) { const key = refCursor++; return refs[key] || (refs[key] = { current: initial }); },
    useEffect(fn) { if (!mounted) effects.push(fn); },
  };
  const { GalleryAdmin } = load('components/gallery-admin.tsx', {
    react, '@/lib/cloudinary': load('lib/cloudinary.ts'), '@/lib/inquiries': { canDeleteInquiry: () => false },
    '@/lib/api': { adminFetch: async (url, token, init = {}) => {
      if (init.method === 'POST') { const data = JSON.parse(init.body); payloads.push(data); return { ok: true, json: async () => ({ ...data, id: String(payloads.length), enabled: true }) }; }
      return { ok: true, json: async () => [] };
    } },
    '@/lib/team-photo': { uploadMedia: async (file, token, progress, signal, options) => {
      assert.equal(options.folder, 'confido/gallery'); assert.equal(options.resource, 'auto');
      active++; maximum = Math.max(maximum, active);
      await new Promise(resolve => pending.push(resolve)); active--; progress(100);
      return { public_id: `confido/gallery/${file.name}`, resource_type: 'image', width: 800, height: 1000 };
    } },
  }, { AbortController, window: { addEventListener() {}, removeEventListener() {} } });
  const render = () => { cursor = 0; refCursor = 0; const tree = GalleryAdmin({ token: 'jwt' }); if (!mounted) { mounted = true; effects.splice(0).forEach(fn => fn()); } return tree; };
  render(); await new Promise(setImmediate);
  const picker = elements(render()).find(node => node.type === 'input' && node.props.type === 'file');
  picker.props.onChange({ target: { files: [1, 2, 3, 4].map(n => ({ name: `photo${n}.jpg`, type: 'image/jpeg', size: 100 })), value: '' } });
  assert.equal(active, 2); assert.equal(pending.length, 2);
  pending.shift()(); await new Promise(setImmediate); assert.equal(active, 2);
  while (pending.length) { pending.shift()(); await new Promise(setImmediate); }
  assert.equal(maximum, 2); assert.equal(payloads.length, 4);
  for (const data of payloads) { assert.equal(data.section, 'work'); assert.equal(data.category, 'Reels'); assert.equal(data.mediaType, 'image'); assert.equal(data.width, 800); assert.ok(!data.title.endsWith('.jpg')); }
  assert.equal(elements(render()).filter(node => node.type === 'button' && node.props.children === 'Delete').length, 0);
});
