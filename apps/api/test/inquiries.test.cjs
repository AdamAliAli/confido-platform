const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { ThrottlerModule } = require('@nestjs/throttler');
const { JwtStrategy } = require('../dist/auth/jwt.strategy');
const { RolesGuard } = require('../dist/auth/roles.guard');
const { PrismaService } = require('../dist/common/prisma.service');
const { InquiriesController } = require('../dist/inquiries/inquiries.controller');
const { InquiriesService } = require('../dist/inquiries/inquiries.service');

test('inquiries validate input, ignore honeypots, limit requests and enforce message permissions', async () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = 'inquiries-test-only-secret-with-32-characters';
  const rows = [];
  const prisma = { inquiry: {
    async create({ data }) { const row = { id: String(rows.length + 1), ...data, read: false, createdAt: new Date() }; rows.push(row); return row; },
    async findMany(args) { assert.deepEqual(args, { orderBy: { createdAt: 'desc' } }); return [...rows].reverse(); },
    async update({ where, data }) { const row = rows.find(item => item.id === where.id); Object.assign(row, data); return row; },
    async delete({ where }) { return rows.splice(rows.findIndex(item => item.id === where.id), 1)[0]; },
  } };
  class TestModule {}
  Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])], controllers: [InquiriesController], providers: [InquiriesService, JwtStrategy, RolesGuard, { provide: PrismaService, useValue: prisma }] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  try {
    await app.listen(0, '127.0.0.1');
    const base = `${await app.getUrl()}/inquiries`;
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    let ip = 1;
    const valid = { email: 'Person@Example.com', phone: '+60 (12) 345-6789', interest: 'Brand Strategy', message: 'Please help with our brand.' };
    const post = (data, address = `203.0.113.${ip++}`) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': address }, body: JSON.stringify(data) });
    const request = (method, path = '', role, data) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ sub: 'test', role })}` } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    for (const invalid of [{ email: 'bad' }, { interest: 'Invalid service' }, { message: 'x'.repeat(3001) }, { message: 'short' }, { phone: 'abc' }, { phone: '1'.repeat(31) }]) {
      assert.equal((await post({ ...valid, ...invalid })).status, 400);
    }
    const created = await post(valid);
    assert.equal(created.status, 201); assert.deepEqual(await created.json(), { ok: true });
    assert.equal(rows[0].email, 'person@example.com'); assert.equal(rows[0].read, false);
    for (const website of ['spam.example', ' ', false, 0, { spam: true }]) {
      const response = await post({ ...valid, website });
      assert.equal(response.status, 201); assert.deepEqual(await response.json(), { ok: true });
    }
    assert.equal(rows.length, 1, 'honeypots never create messages');
    for (let i = 0; i < 3; i++) assert.equal((await post(valid, '198.51.100.1')).status, 201);
    assert.equal((await post(valid, '198.51.100.1')).status, 429);
    assert.equal((await post(valid, '198.51.100.2')).status, 201);
    assert.equal((await request('GET')).status, 401);
    assert.equal((await request('GET', '', 'VIEWER')).status, 403);
    for (const role of ['ADMIN', 'EDITOR']) {
      const response = await request('GET', '', role); assert.equal(response.status, 200);
      assert.equal((await response.json()).length, rows.length);
      const updated = await request('PATCH', '/1', role, { read: true }); assert.equal(updated.status, 200); assert.equal((await updated.json()).read, true);
    }
    assert.equal((await request('PATCH', '/1', 'EDITOR', { read: 'false' })).status, 400);
    assert.equal((await request('PATCH', '/1', 'EDITOR', { read: false, email: 'change@example.com' })).status, 400);
    assert.equal((await request('DELETE', '/1', 'EDITOR')).status, 403);
    assert.equal((await request('DELETE', '/1', 'ADMIN')).status, 200);
    assert.equal(rows.some(item => item.id === '1'), false);
  } finally {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = previousSecret;
  }
});
