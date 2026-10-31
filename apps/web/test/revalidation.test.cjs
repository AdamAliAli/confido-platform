const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, globals, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, ...globals, require: name => imports[name] || require(name),
  });
  return exports;
}

test('both public requests share a five-minute content cache tag', async () => {
  const calls = [];
  const api = load('lib/api.ts', { process: { env: {} }, fetch: async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => [] }; } });
  await api.getPage(); await api.getTeam();
  assert.equal(calls.length, 2);
  for (const { init } of calls) {
    assert.equal(init.cache, undefined);
    assert.equal(JSON.stringify(init.next), JSON.stringify({ revalidate: 300, tags: ['content'] }));
  }
});

test('revalidation rejects missing/wrong secrets and invalidates content only on authenticated POST', async () => {
  for (const secret of [undefined, '', 'test-only-🔑-secret']) {
    const tags = [];
    const route = load('app/api/revalidate/route.ts', { process: { env: { REVALIDATE_SECRET: secret } }, Response }, { 'next/cache': { revalidateTag: tag => tags.push(tag) } });
    for (const supplied of [null, '', 'wrong', 'a'.repeat(500)]) {
      const response = await route.POST(new Request('http://localhost/api/revalidate', { method: 'POST', headers: supplied === null ? {} : { 'x-revalidate-secret': supplied } }));
      assert.equal(response.status, 401); assert.equal(tags.length, 0);
    }
    if (secret) {
      // Headers accept byte strings, so use a real HTTP-compatible shared secret.
      const valid = load('app/api/revalidate/route.ts', { process: { env: { REVALIDATE_SECRET: 'test-only-ascii-secret' } }, Response }, { 'next/cache': { revalidateTag: tag => tags.push(tag) } });
      const response = await valid.POST(new Request('http://localhost/api/revalidate', { method: 'POST', headers: { 'x-revalidate-secret': 'test-only-ascii-secret' } }));
      assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true }); assert.deepEqual(tags, ['content']);
    }
  }
});
