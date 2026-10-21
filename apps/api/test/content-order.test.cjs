const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ContentService } = require('../dist/content/content.service');
const { UpdateBlockDto, UpdateOrderDto } = require('../dist/content/dto');
const { validate } = require('class-validator');

function setup({ missing = false, failAt = -1 } = {}) {
  let blocks = ['a', 'b', 'c'].map((id, position) => ({ id, position }));
  const writes = [];
  const db = {
    async $transaction(run) {
      const draft = structuredClone(blocks);
      const result = await run({
        page: {
          async findUnique() {
            return missing ? null : { id: 'home', blocks: [...draft].sort((a, b) => a.position - b.position) };
          },
        },
        block: {
          async update({ where, data }) {
            if (writes.length === failAt) throw new Error('Database failure');
            assert.ok(!draft.some((block) => block.id !== where.id && block.position === data.position), 'unique position collision');
            Object.assign(draft.find((block) => block.id === where.id), data);
            writes.push([where.id, data.position]);
          },
        },
      });
      blocks = draft;
      return result;
    },
  };
  return { service: new ContentService(db), writes, blocks: () => blocks };
}

test('swapping all blocks preserves unique positions and returns the saved order', async () => {
  const { service, writes } = setup();
  const result = await service.order('home', ['c', 'b', 'a']);
  assert.deepEqual(result.blocks.map((block) => block.id), ['c', 'b', 'a']);
  assert.deepEqual(writes.map(([, position]) => position), [1000, 1001, 1002, 0, 1, 2]);
});

for (const ids of [['a', 'b'], ['a', 'a', 'c'], ['a', 'b', 'other-page']]) {
  test(`rejects invalid page membership: ${ids}`, async () => {
    const { service, writes } = setup();
    await assert.rejects(service.order('home', ids), (error) => error.getStatus() === 400);
    assert.equal(writes.length, 0);
  });
}

test('missing pages return 404 without writes', async () => {
  const { service, writes } = setup({ missing: true });
  await assert.rejects(service.order('missing', []), (error) => error.getStatus() === 404);
  assert.equal(writes.length, 0);
});

test('a failed final pass does not commit temporary positions', async () => {
  const { service, blocks } = setup({ failAt: 4 });
  await assert.rejects(service.order('home', ['c', 'b', 'a']), /Database failure/);
  assert.deepEqual(blocks().map((block) => block.position), [0, 1, 2]);
});

test('DTOs reject position edits, duplicate IDs and non-array IDs', async () => {
  const options = { whitelist: true, forbidNonWhitelisted: true };
  assert.ok((await validate(Object.assign(new UpdateBlockDto(), { position: 2 }), options)).length);
  assert.ok((await validate(Object.assign(new UpdateOrderDto(), { ids: ['a', 'a'] }), options)).length);
  assert.ok((await validate(Object.assign(new UpdateOrderDto(), { ids: 'a' }), options)).length);
  assert.equal((await validate(Object.assign(new UpdateBlockDto(), { enabled: false, data: {} }), options)).length, 0);
});
