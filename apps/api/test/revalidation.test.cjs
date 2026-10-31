const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RevalidationService } = require('../dist/common/revalidation.service');
const { ContentController } = require('../dist/content/content.controller');
const { TeamController } = require('../dist/team/team.controller');

test('webhook skips missing configuration, authenticates POST and never fails on HTTP/network/timeout errors', async () => {
  const original = { fetch: global.fetch, web: process.env.WEB_URL, secret: process.env.REVALIDATE_SECRET };
  const service = new RevalidationService(); const warnings = []; service.logger = { warn: value => warnings.push(value) };
  try {
    let calls = 0;
    global.fetch = async () => { calls++; return { ok: true }; };
    delete process.env.WEB_URL; delete process.env.REVALIDATE_SECRET;
    await service.contentChanged(); process.env.WEB_URL = 'http://web.example/'; await service.contentChanged();
    delete process.env.WEB_URL; process.env.REVALIDATE_SECRET = 'test-secret'; await service.contentChanged();
    assert.equal(calls, 0); assert.equal(warnings.length, 0);
    process.env.WEB_URL = 'http://web.example/';
    global.fetch = async (url, init) => { assert.equal(url, 'http://web.example/api/revalidate'); assert.equal(init.method, 'POST'); assert.equal(init.headers['x-revalidate-secret'], 'test-secret'); assert.equal(init.redirect, 'error'); assert.ok(init.signal); return { ok: true }; };
    await service.contentChanged(); assert.equal(warnings.length, 0);
    global.fetch = async () => ({ ok: false, status: 401 }); await service.contentChanged();
    global.fetch = async () => { throw new Error('Network failed'); }; await service.contentChanged();
    global.fetch = async (url, { signal }) => new Promise((resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('Timeout was not bounded')), 5000);
      signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(signal.reason); }, { once: true });
    });
    await service.contentChanged(); assert.equal(warnings.length, 3); assert.ok(warnings.every(value => !value.includes('test-secret')));
  } finally {
    global.fetch = original.fetch;
    for (const [key, value] of [['WEB_URL', original.web], ['REVALIDATE_SECRET', original.secret]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('successful block/order/team mutations await invalidation; failures and reads never call it', async () => {
  for (const [Controller, method, args] of [
    [ContentController, 'update', ['block', { data: { title: 'Saved' } }]],
    [ContentController, 'order', ['home', { ids: ['b', 'a'] }]],
    [TeamController, 'create', [{ name: 'Ada' }]],
    [TeamController, 'update', ['member', { sortOrder: 2 }]],
    [TeamController, 'remove', ['member']],
  ]) {
    const events = []; const result = { saved: true }; let release;
    const pending = new Promise(resolve => { release = resolve; });
    const controller = new Controller({ [method]: async () => { events.push('saved'); return result; } }, { contentChanged: async () => { events.push('invalidate'); await pending; } });
    let completed = false; const operation = controller[method](...args).then(value => { completed = true; return value; });
    await new Promise(setImmediate); assert.deepEqual(events, ['saved', 'invalidate']); assert.equal(completed, false);
    release(); assert.equal(await operation, result);
    const failure = new Controller({ [method]: async () => { throw new Error('Save failed'); } }, { contentChanged: async () => { throw new Error('Must not be called'); } });
    await assert.rejects(failure[method](...args), /Save failed/);
  }
  const notifier = { contentChanged: async () => { throw new Error('Read must not invalidate'); } };
  assert.equal(await new ContentController({ publicPage: async () => 'public', all: async () => 'admin' }, notifier).publicPage('home'), 'public');
  assert.equal(await new TeamController({ findAll: async () => 'team' }, notifier).findAll(), 'team');
});
