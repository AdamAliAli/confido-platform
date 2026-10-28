const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

async function renderHome(page, api = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === '@/lib/api') return { getPage: async () => page, getTeam: async () => [], ...api };
      if (name.startsWith('@/components/')) return new Proxy({}, { get: () => () => null });
      return require(name);
    },
  });
  return exports.default();
}

async function renderBlocks(page) {
  const result = await renderHome(page);
  return JSON.parse(JSON.stringify(result.props.children[1].props.blocks));
}

test('homepage preserves API order and does not inject missing sections', async () => {
  const blocks = ['clarity', 'hero', 'services'].map((type) => ({ id: type, type, enabled: true, data: {} }));
  assert.deepEqual((await renderBlocks({ blocks })).map((block) => block.type), ['clarity', 'hero', 'services']);
});

test('all section types including contact respect saved order and visibility', async () => {
  const blocks = ['contact', 'faq', 'process', 'team', 'location', 'clarity', 'projects', 'services', 'hero'].map(type => ({ id: type, type, enabled: type !== 'faq', data: {} }));
  assert.deepEqual((await renderBlocks({ blocks })).map(block => block.type), blocks.filter(block => block.enabled).map(block => block.type));
});

test('page and team requests start together and members are passed to TeamSection', async () => {
  let releasePage;
  let requestedTeam = false;
  const members = [{ id: 'member-1', name: 'Test member' }];
  const pendingPage = new Promise((resolve) => { releasePage = resolve; });
  const result = renderHome(null, {
    getPage: () => pendingPage,
    getTeam: async () => { requestedTeam = true; return members; },
  });
  assert.equal(requestedTeam, true);
  releasePage(null);
  assert.equal((await result).props.children[1].props.members, members);
});

test('homepage excludes disabled blocks and their gallery images', async () => {
  const blocks = [
    { id: 'hero', type: 'hero', enabled: true, data: {} },
    { id: 'projects', type: 'projects', enabled: false, data: { image: 'https://example.com/hidden.jpg' } },
  ];
  const rendered = await renderBlocks({ blocks });
  assert.deepEqual(rendered.map((block) => block.id), ['hero']);
  assert.deepEqual(rendered[0].data.galleryImages, []);
});

test('homepage uses fallbacks only for unavailable pages and renders no blocks for empty pages', async () => {
  assert.deepEqual((await renderBlocks(null)).map((block) => block.type), ['hero', 'services', 'projects', 'clarity', 'location', 'team', 'process', 'faq', 'contact']);
  assert.deepEqual(await renderBlocks({ blocks: [] }), []);
});
