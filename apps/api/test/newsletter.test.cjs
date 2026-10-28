const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { ThrottlerModule } = require('@nestjs/throttler');
const { Prisma } = require('@prisma/client');
const { JwtStrategy } = require('../dist/auth/jwt.strategy');
const { RolesGuard } = require('../dist/auth/roles.guard');
const { PrismaService } = require('../dist/common/prisma.service');
const { PrismaExceptionFilter } = require('../dist/common/prisma-exception.filter');
const { NewsletterController } = require('../dist/newsletter/newsletter.controller');
const { NewsletterService } = require('../dist/newsletter/newsletter.service');

test('newsletter HTTP flow validates, deduplicates, throttles per IP and protects list/export/delete', async () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = 'newsletter-test-only-jwt-secret-32-characters';
  const rows = [];
  const prisma = { subscriber: {
    async upsert({ where, create, update }) {
      assert.deepEqual(update, {});
      const existing = rows.find((row) => row.email === where.email);
      if (existing) return existing;
      const row = { id: String(rows.length + 1), ...create, createdAt: new Date(Date.UTC(2026, 9, 28, 0, rows.length)) };
      rows.push(row); return row;
    },
    async findMany(args) { assert.deepEqual(args, { orderBy: { createdAt: 'desc' } }); return [...rows].sort((a, b) => b.createdAt - a.createdAt); },
    async delete({ where }) {
      const index = rows.findIndex((row) => row.id === where.id);
      if (index < 0) throw new Prisma.PrismaClientKnownRequestError('Missing', { code: 'P2025', clientVersion: '6.15.0' });
      return rows.splice(index, 1)[0];
    },
  } };
  class TestModule {}
  Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])], controllers: [NewsletterController], providers: [NewsletterService, JwtStrategy, RolesGuard, { provide: PrismaService, useValue: prisma }] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PrismaExceptionFilter(app.getHttpAdapter()));
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    const request = (path = '', method = 'GET', role) => fetch(`${base}/newsletter${path}`, { method, headers: role ? { Authorization: `Bearer ${jwt.sign({ sub: 'test-user', role })}` } : {} });
    const subscribe = (email, ip = '203.0.113.10') => fetch(`${base}/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ email }) });
    const first = await subscribe('Mixed@Example.com');
    assert.equal(first.status, 200);
    const duplicate = await subscribe('mixed@example.com');
    assert.equal(duplicate.status, 200);
    assert.deepEqual(await first.json(), await duplicate.json());
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, 'mixed@example.com');
    assert.equal((await subscribe('invalid')).status, 400);
    assert.equal((await subscribe('a'.repeat(255) + '@example.com')).status, 400);
    assert.equal((await subscribe('another@example.com')).status, 200);
    assert.equal((await subscribe('blocked@example.com')).status, 429);
    assert.equal((await subscribe('+formula@example.com', '203.0.113.11')).status, 200);
    for (const [path, method] of [['', 'GET'], ['/export', 'GET'], ['/1', 'DELETE']]) {
      assert.equal((await request(path, method)).status, 401);
      assert.equal((await request(path, method, 'EDITOR')).status, 403);
    }
    const list = await request('', 'GET', 'ADMIN');
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).map((row) => row.email), ['+formula@example.com', 'another@example.com', 'mixed@example.com']);
    const csv = await request('/export', 'GET', 'ADMIN');
    assert.match(csv.headers.get('content-type'), /^text\/csv/);
    assert.match(csv.headers.get('content-disposition'), /subscribers\.csv/);
    assert.equal(await csv.text(), 'email,createdAt\r\n"\'+formula@example.com","2026-10-28T00:02:00.000Z"\r\n"another@example.com","2026-10-28T00:01:00.000Z"\r\n"mixed@example.com","2026-10-28T00:00:00.000Z"\r\n');
    assert.equal((await request('/1', 'DELETE', 'ADMIN')).status, 200);
    assert.equal(rows.length, 2);
    assert.equal((await request('/missing', 'DELETE', 'ADMIN')).status, 404);
  } finally {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = previousSecret;
  }
});

test('concurrent duplicate race succeeds without hiding other storage errors', async () => {
  const make = (code) => new NewsletterService({ subscriber: { upsert: async () => { throw new Prisma.PrismaClientKnownRequestError('Storage failure', { code, clientVersion: '6.15.0' }); } } });
  assert.deepEqual(await make('P2002').subscribe('a@example.com'), { message: "Thanks, you're subscribed." });
  await assert.rejects(make('P1001').subscribe('a@example.com'));
});
