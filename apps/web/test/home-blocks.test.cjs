const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

async function renderBlocks(page) {
  const source = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === '@/lib/api') return { getPage: async () => page };
      if (name.startsWith('@/components/')) return new Proxy({}, { get: () => () => null });
      return require(name);
    },
  });
  const result = await exports.default();
  return JSON.parse(JSON.stringify(result.props.children[0].props.blocks));
}

test('homepage preserves API order and does not inject missing sections', async () => {
  const blocks = ['clarity', 'hero', 'services'].map((type) => ({ id: type, type, enabled: true, data: {} }));
  assert.deepEqual((await renderBlocks({ blocks })).map((block) => block.type), ['clarity', 'hero', 'services']);
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

test('homepage retains the existing fallbacks for unavailable or empty pages', async () => {
  for (const page of [null, { blocks: [] }]) {
    assert.deepEqual((await renderBlocks(page)).map((block) => block.type), ['hero', 'services', 'projects', 'clarity']);
  }
});
