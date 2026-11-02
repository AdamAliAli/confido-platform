const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('class-validator');
const { GalleryCreateDto, GalleryEditDto, GalleryOrderDto } = require('../dist/gallery/dto');
const { GalleryService } = require('../dist/gallery/gallery.service');
const { GalleryController } = require('../dist/gallery/gallery.controller');
const valid = { section: 'work', mediaType: 'image', publicId: 'confido/gallery/project_1', title: 'Project', width: 800, height: 1000 };

test('gallery DTO validates namespace, section, category, title and dimensions', async () => {
  assert.equal((await validate(Object.assign(new GalleryCreateDto(), valid))).length, 0);
  for (const patch of [{ publicId: 'other/folder' }, { publicId: 'confido/gallery/../evil' }, { publicId: 'https://evil.com/a' }, { section: 'other' }, { category: 'Invalid' }, { title: 'a'.repeat(121) }, { title: '' }, { width: 0 }, { height: 1.2 }, { mediaType: 'raw' }]) {
    assert.ok((await validate(Object.assign(new GalleryCreateDto(), valid, patch))).length, JSON.stringify(patch));
  }
  assert.ok((await validate(Object.assign(new GalleryOrderDto(), { section: 'work', ids: ['a', 'a'] }))).length);
  assert.ok((await validate(Object.assign(new GalleryEditDto(), { publicId: 'confido/gallery/changed' }), { whitelist: true, forbidNonWhitelisted: true })).length);
});

function setup(failAt = -1) {
  let items = [{ id: 'a', section: 'work', position: 0 }, { id: 'b', section: 'work', position: 1 }, { id: 'logo', section: 'brand', position: 0 }];
  const writes = [];
  const service = new GalleryService({ async $transaction(run) {
    const draft = structuredClone(items);
    const result = await run({ galleryItem: {
      async findMany({ where }) { return draft.filter(item => item.section === where.section); },
      async update({ where, data }) {
        if (writes.length === failAt) throw new Error('Failed');
        const item = draft.find(item => item.id === where.id);
        assert.ok(!draft.some(other => other.id !== item.id && other.section === item.section && other.position === data.position));
        Object.assign(item, data); writes.push(data.position);
      },
    } });
    items = draft; return result;
  } });
  return { service, writes, items: () => items };
}
test('gallery order uses two passes and isolates sections', async () => {
  const { service, writes, items } = setup();
  await service.order({ section: 'work', ids: ['b', 'a'] });
  assert.deepEqual(writes, [1000, 1001, 0, 1]);
  assert.equal(items().find(item => item.id === 'logo').position, 0);
  assert.equal(items().find(item => item.id === 'b').position, 0);
});
test('gallery order rejects missing, duplicate and cross-section IDs without writes', async () => {
  for (const ids of [['a'], ['a', 'a'], ['a', 'logo']]) {
    const { service, writes } = setup();
    await assert.rejects(service.order({ section: 'work', ids }), error => error.getStatus() === 400);
    assert.equal(writes.length, 0);
  }
});
test('gallery order rolls back a failed final pass', async () => {
  const { service, items } = setup(3);
  await assert.rejects(service.order({ section: 'work', ids: ['b', 'a'] }));
  assert.deepEqual(items().map(item => item.position), [0, 1, 0]);
});
test('gallery mutations revalidate only after a successful write', async () => {
  const calls = [];
  const controller = new GalleryController({ create: async () => { calls.push('save'); return valid; }, order: async () => { throw new Error('Bad order'); } }, { contentChanged: async () => calls.push('revalidate') });
  await controller.create(valid);
  assert.deepEqual(calls, ['save', 'revalidate']);
  await assert.rejects(controller.order({ section: 'work', ids: [] }));
  assert.equal(calls.length, 2);
});

test('gallery HTTP endpoints enforce permissions, validate order and keep public data minimal', async () => {
  const { Module, ValidationPipe } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  const { JwtService } = require('@nestjs/jwt');
  const { JwtStrategy } = require('../dist/auth/jwt.strategy');
  const { RolesGuard } = require('../dist/auth/roles.guard');
  const { RevalidationService } = require('../dist/common/revalidation.service');
  const previous = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = 'gallery-test-only-secret-at-least-32-characters';
  let refreshes = 0;
  const orders = [];
  class TestModule {}
  Module({ controllers: [GalleryController], providers: [JwtStrategy, RolesGuard,
    { provide: GalleryService, useValue: { list: async admin => admin ? [{ ...valid, enabled: false }] : [valid], order: async dto => { orders.push(dto); return { ok: true }; }, remove: async () => ({ ok: true }) } },
    { provide: RevalidationService, useValue: { contentChanged: async () => { refreshes++; } } },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    const request = (path, method = 'GET', role, body) => fetch(`${base}/gallery${path}`, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ sub: 'test', role })}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    assert.equal((await request('')).status, 200);
    assert.equal((await request('/admin')).status, 401);
    assert.equal((await request('/admin', 'GET', 'EDITOR')).status, 200);
    assert.equal((await request('/admin', 'GET', 'VIEWER')).status, 403);
    assert.equal((await request('/order', 'PATCH', undefined, { section: 'work', ids: [] })).status, 401);
    assert.equal((await request('/order', 'PATCH', 'EDITOR', { section: 'work', ids: ['a', 'a'] })).status, 400);
    assert.equal((await request('/order', 'PATCH', 'EDITOR', { section: 'work', ids: ['a'] })).status, 200);
    assert.equal(orders.length, 1); assert.equal(refreshes, 1);
    assert.equal((await request('/a', 'DELETE', 'EDITOR')).status, 403);
    assert.equal((await request('/a', 'DELETE', 'ADMIN')).status, 200);
    assert.equal(refreshes, 2);
  } finally { await app.close(); if (previous === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = previous; }
});

test('Cloudinary deletion signs invalidation and preserves the row on remote failure', async () => {
  const originalFetch = global.fetch;
  const oldEnv = { ...process.env };
  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-only-secret' });
  let deleted = false;
  const service = new GalleryService({ galleryItem: { findUniqueOrThrow: async () => ({ ...valid, id: 'a' }), delete: async () => { deleted = true; } } });
  try {
    global.fetch = async (url, init) => {
      assert.equal(url, 'https://api.cloudinary.com/v1_1/demo/image/destroy');
      const body = init.body;
      const expected = require('node:crypto').createHash('sha1').update(`invalidate=true&public_id=${valid.publicId}&timestamp=${body.get('timestamp')}test-only-secret`).digest('hex');
      assert.equal(body.get('signature'), expected);
      return { ok: false, json: async () => ({ error: 'failed' }) };
    };
    await assert.rejects(service.remove('a'), error => error.getStatus() === 502);
    assert.equal(deleted, false);
    global.fetch = async () => ({ ok: true, json: async () => ({ result: 'not found' }) });
    await service.remove('a'); assert.equal(deleted, true);
  } finally { global.fetch = originalFetch; process.env = oldEnv; }
});
