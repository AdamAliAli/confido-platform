const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, extra = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText + (file.endsWith('block-form.tsx') ? '\nexports.ListField = ListField; exports.ImageField = ImageField;' : ''), {
    exports, window: { confirm: () => true }, ...extra,
    require: name => imports[name] || require(name),
  });
  return exports;
}
const schema = load('lib/admin-schema.ts');
const children = element => element == null || typeof element !== 'object' ? [] : Array.isArray(element) ? element.flatMap(children) : [element, ...children(element.props?.children)];
const button = (tree, name) => children(tree).find(node => node.type === 'button' && (Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children) === name);
const tick = () => new Promise(setImmediate);

test('schema exposes all nine sections and form shows missing fields as empty inputs', () => {
  assert.deepEqual(Object.keys(schema.ADMIN_SCHEMA), ['hero','services','projects','clarity','location','team','process','faq','contact']);
  const { BlockForm } = load('components/block-form.tsx', {
    react: { useId: () => 'field' }, '@/lib/admin-schema': schema, '@/lib/media-url': {}, '@/lib/team-photo': {},
  });
  for (const [type, config] of Object.entries(schema.ADMIN_SCHEMA)) {
    const tree = BlockForm({ data: {}, type, onChange() {} });
    for (const field of config.fields.filter(field => !['list','image'].includes(field.kind))) {
      const input = children(tree).find(node => node.props.id === `field-${field.key}`);
      assert.ok(input, `${type}.${field.key}`);
      assert.equal(input.props.value, '');
      if (field.kind === 'textarea') assert.equal(input.props.rows, 4);
    }
    assert.ok(config.section.startsWith('#'));
  }
  const unknown = BlockForm({ data: { custom: 'Keep editing' }, type: 'unknown', onChange() {} });
  assert.equal(children(unknown).find(node => node.type === 'input').props.value, 'Keep editing');
});

test('project, FAQ and service list cards support add, move, confirmed removal and limits', () => {
  const { ListField } = load('components/block-form.tsx', { react: {}, '@/lib/admin-schema': schema, '@/lib/media-url': {}, '@/lib/team-photo': {} });
  for (const type of ['projects', 'faq', 'services']) {
    const field = schema.ADMIN_SCHEMA[type].fields[0];
    let data = { [field.key]: [] };
    const render = () => ListField({ field, value: data[field.key], data, onChange: next => { data = next; } });
    button(render(), `Add ${field.itemLabel}`).props.onClick();
    assert.equal(data[field.key].length, 1);
    data[field.key] = [{ title: 'First', question: 'First' }, { title: 'Second', question: 'Second' }];
    button(render(), 'Move down').props.onClick();
    assert.equal(data[field.key][0].title, 'Second');
    children(render()).filter(node => node.type === 'button' && node.props.children === 'Move up')[1].props.onClick();
    assert.equal(data[field.key][0].title, 'First');
    button(render(), 'Remove').props.onClick();
    assert.equal(data[field.key].length, 1);
    if (field.max) {
      data[field.key] = Array.from({ length: field.max }, () => ({}));
      assert.equal(button(render(), `Add ${field.itemLabel}`).props.disabled, true);
    }
  }
});

test('image upload requests the site folder and fills the URL field', async () => {
  let value, folder, bytes;
  const { ImageField } = load('components/block-form.tsx', {
    react: { useRef: () => ({ current: null }), useState: initial => [initial, () => {}], useEffect() {} },
    '@/lib/admin-schema': schema, '@/lib/media-url': { imageUrl: () => '' },
    '@/lib/team-photo': { uploadTeamPhoto: async (file, token, progress, signal, target) => { folder = target; bytes = file.size; assert.equal(token, 'test-token'); progress(50); return 'https://res.cloudinary.com/test/image/upload/test.webp'; } },
  }, { AbortController });
  const tree = ImageField({ id: 'image', value: '', token: 'test-token', onChange: next => { value = next; } });
  children(tree).find(node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [{ type: 'image/webp', size: 10 * 1024 * 1024 }], value: 'file' } });
  await tick();
  assert.equal(folder, 'confido/site'); assert.equal(bytes, 10 * 1024 * 1024);
  assert.equal(value, 'https://res.cloudinary.com/test/image/upload/test.webp');
});

function editorHarness(adminFetch, wide = false) {
  const hooks = [], listeners = new Map();
  let index = 0, effects = [];
  const react = {
    useState(initial) { const key = index++; if (!(key in hooks)) hooks[key] = typeof initial === 'function' ? initial() : initial; return [hooks[key], value => { hooks[key] = typeof value === 'function' ? value(hooks[key]) : value; }]; },
    useRef(initial) { const key = index++; if (!(key in hooks)) hooks[key] = { current: initial }; return hooks[key]; },
    useCallback(fn) { return fn; },
    useEffect(fn, deps) { const key = index++; const old = hooks[key]; if (!old || !deps || deps.some((dep, i) => dep !== old.deps?.[i])) effects.push(() => { old?.cleanup?.(); hooks[key] = { deps, cleanup: fn() }; }); },
  };
  function BlockForm() {}
  const { PageBlocksEditor } = load('components/page-blocks-editor.tsx', {
    react, 'framer-motion': { Reorder: { Group: 'reorder-group', Item: 'reorder-item' } }, 'lucide-react': {}, '@/lib/api': { adminFetch }, '@/lib/admin-schema': schema, './block-form': { BlockForm },
  }, { window: { matchMedia: () => ({ matches: wide, addEventListener() {}, removeEventListener() {} }), addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key, fn) => { if (listeners.get(key) === fn) listeners.delete(key); } } });
  const blocks = Object.keys(schema.ADMIN_SCHEMA).map((type, position) => ({ id: type, type, position, enabled: true, data: {} }));
  return { listeners, render() { index = 0; effects = []; const tree = PageBlocksEditor({ initialBlocks: blocks, pageId: 'home', token: 'test-token', active: true, onTeam() {} }); children(tree).find(node => node.type === 'form').props.ref.current = { reportValidity: () => true }; effects.forEach(fn => fn()); return tree; }, form: tree => children(tree).find(node => node.type === BlockForm) };
}

test('save race preserves newer drafts; discard restores last saved content; shortcut and warnings track dirtiness', async () => {
  let release, sent;
  const harness = editorHarness(async (url, token, init) => { sent = JSON.parse(init.body); await new Promise(resolve => { release = resolve; }); return { ok: true, json: async () => ({ id: 'hero', type: 'hero', enabled: sent.enabled, data: sent.data, position: 0 }) }; });
  let tree = harness.render();
  harness.form(tree).props.onChange({ title: 'First draft' }); tree = harness.render();
  assert.ok(harness.listeners.has('beforeunload'));
  harness.listeners.get('keydown')({ ctrlKey: true, key: 's', preventDefault() {} });
  tree = harness.render(); harness.form(tree).props.onChange({ title: 'Newer draft' });
  release(); await tick(); tree = harness.render();
  assert.equal(harness.form(tree).props.data.title, 'Newer draft');
  button(tree, 'Discard changes').props.onClick(); tree = harness.render();
  assert.equal(harness.form(tree).props.data.title, 'First draft');
  assert.equal(harness.listeners.has('beforeunload'), false);
});

test('all nine sections can select, edit, hide and save; keyboard order is persisted separately', async () => {
  const calls = [];
  const harness = editorHarness(async (url, token, init) => {
    const body = JSON.parse(init.body); calls.push({ url, body });
    return { ok: true, json: async () => ({ id: url.split('/').pop(), type: url.split('/').pop(), position: 0, ...body }) };
  });
  for (const type of Object.keys(schema.ADMIN_SCHEMA)) {
    let tree = harness.render();
    children(tree).find(node => node.props.block?.id === type).props.onSelect(); tree = harness.render();
    harness.form(tree).props.onChange({ custom: type }); tree = harness.render();
    children(tree).find(node => node.props.block?.id === type).props.onToggle(); tree = harness.render();
    children(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await tick(); harness.render();
    assert.equal(calls.at(-1).body.enabled, false); assert.equal(calls.at(-1).body.data.custom, type);
  }
  let tree = harness.render(); children(tree).find(node => node.props.block?.id === 'hero').props.onMove(1); tree = harness.render();
  button(tree, 'Save order').props.onClick(); await tick(); tree = harness.render();
  assert.equal(calls.at(-1).url, '/content/admin/pages/home/order');
  assert.deepEqual(calls.at(-1).body.ids.slice(0, 2), ['services', 'hero']);
  assert.equal(button(tree, 'Save order').props.disabled, true);
});

test('preview uses only own-site anchors and remounts after a save; failed saves retain drafts', async () => {
  let success = false;
  const harness = editorHarness(async (url, token, init) => success
    ? { ok: true, json: async () => ({ id: 'hero', type: 'hero', position: 0, ...JSON.parse(init.body) }) }
    : { ok: false, json: async () => ({ message: 'Please retry' }) }, true);
  let tree = harness.render(); tree = harness.render();
  let iframe = children(tree).find(node => node.type === 'iframe');
  assert.equal(iframe.props.src, '/#hero');
  const initialKey = iframe.key;
  harness.form(tree).props.onChange({ title: 'Pending' }); tree = harness.render();
  children(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick(); tree = harness.render();
  assert.equal(harness.form(tree).props.data.title, 'Pending');
  assert.ok(harness.listeners.has('beforeunload'));
  assert.equal(children(tree).find(node => node.type === 'iframe').key, initialKey);
  success = true;
  children(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await tick(); tree = harness.render();
  assert.notEqual(children(tree).find(node => node.type === 'iframe').key, initialKey);
  children(tree).find(node => node.props.block?.id === 'location').props.onSelect(); tree = harness.render();
  assert.equal(children(tree).find(node => node.type === 'iframe').props.src, '/#about-us');
});
