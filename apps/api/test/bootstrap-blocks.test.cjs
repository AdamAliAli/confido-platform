const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BootstrapService } = require('../dist/common/bootstrap.service');
const canonical = ['hero', 'services', 'projects', 'clarity', 'location', 'team', 'process', 'faq', 'contact'];

async function defaults() {
  let blocks;
  await new BootstrapService({ user: { upsert: async () => {} }, page: { findUnique: async () => null, create: async ({ data }) => { blocks = data.blocks.create; } } }).onModuleInit();
  return blocks;
}

test('new pages have canonical defaults copied from all current sections', async () => {
  const blocks = await defaults();
  assert.deepEqual(blocks.map(b => b.type), canonical);
  assert.deepEqual(blocks.map(b => b.position), canonical.map((_, i) => i));
  assert.equal(blocks.find(b => b.type === 'clarity').data.metrics.length, 3);
  assert.equal(blocks.find(b => b.type === 'location').data.photos.length, 3);
  assert.equal(blocks.find(b => b.type === 'process').data.steps.length, 3);
  assert.equal(blocks.find(b => b.type === 'faq').data.faqs.length, 6);
});

test('missing sections are inserted before contact atomically, preserving data, enabled and unknown order', async () => {
  const initial = ['contact', 'legacy-a', 'hero', 'services', 'projects', 'clarity', 'legacy-b'].map((type, position) => ({ id: type, type, position, enabled: false, data: { custom: type } }));
  let committed = structuredClone(initial);
  let transactions = 0, writes = 0;
  const db = {
    user: { upsert: async () => {} },
    page: { findUnique: async () => ({ id: 'home', blocks: structuredClone(committed) }) },
    async $transaction(run) {
      transactions++;
      const working = structuredClone(committed);
      const tx = {
        page: { findUniqueOrThrow: async () => ({ blocks: structuredClone(working) }) },
        block: {
          aggregate: async () => ({ _max: { position: Math.max(...working.map(b => b.position)) } }),
          create: async ({ data }) => { const block = { id: data.type, ...data }; working.push(block); return block; },
          update: async ({ where, data }) => {
            writes++;
            assert.deepEqual(Object.keys(data), ['position']);
            assert.ok(!working.some(b => b.id !== where.id && b.position === data.position), 'positions never collide');
            Object.assign(working.find(b => b.id === where.id), data);
          },
        },
      };
      await run(tx);
      committed = working;
    },
  };
  const service = new BootstrapService(db);
  await service.onModuleInit();
  assert.deepEqual([...committed].sort((a,b) => a.position-b.position).map(b => b.type), [...canonical, 'legacy-a', 'legacy-b']);
  for (const original of initial) {
    const saved = committed.find(b => b.id === original.id);
    assert.deepEqual(saved.data, original.data);
    assert.equal(saved.enabled, false);
  }
  assert.ok(committed.filter(b => !initial.some(old => old.id === b.id)).every(b => b.enabled));
  const savedWrites = writes;
  await service.onModuleInit();
  assert.equal(transactions, 1, 'subsequent startups keep custom ordering');
  assert.equal(writes, savedWrites);
});

test('bootstrap failures roll back insertion and temporary ordering together', async () => {
  const original = [{ id: 'contact', type: 'contact', position: 2500, data: { title: 'Keep me' }, enabled: false }];
  let committed = structuredClone(original);
  const db = {
    user: { upsert: async () => {} },
    page: { findUnique: async () => ({ id: 'home', blocks: structuredClone(committed) }) },
    async $transaction(run) {
      const working = structuredClone(committed);
      await run({ page: { findUniqueOrThrow: async () => ({ blocks: structuredClone(working) }) }, block: {
        aggregate: async () => ({ _max: { position: Math.max(...working.map(b => b.position)) } }),
        create: async ({ data }) => { const block = { id: data.type, ...data }; working.push(block); return block; },
        update: async () => { throw new Error('Simulated ordering failure'); },
      } });
      committed = working;
    },
  };
  await assert.rejects(new BootstrapService(db).onModuleInit(), /Simulated ordering failure/);
  assert.deepEqual(committed, original);
});
