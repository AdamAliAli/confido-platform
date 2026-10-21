const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Module, Controller, Get, BadRequestException } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { Prisma } = require('@prisma/client');
const { validate } = require('class-validator');
const { AuthController } = require('../dist/auth/auth.controller');
const { AuthService } = require('../dist/auth/auth.service');
const { AuthModule } = require('../dist/auth/auth.module');
const { ContentModule } = require('../dist/content/content.module');
const { TeamModule } = require('../dist/team/team.module');
const { AppModule } = require('../dist/app.module');
const { PrismaModule } = require('../dist/common/prisma.module');
const { PrismaService } = require('../dist/common/prisma.service');
const { PrismaExceptionFilter } = require('../dist/common/prisma-exception.filter');
const { ContentService } = require('../dist/content/content.service');
const { LoginDto } = require('../dist/auth/dto');

test('PrismaService is provided only by the global PrismaModule', () => {
  assert.deepEqual(Reflect.getMetadata('providers', PrismaModule), [PrismaService]);
  for (const module of [AppModule, AuthModule, ContentModule, TeamModule]) {
    assert.ok(!Reflect.getMetadata('providers', module).includes(PrismaService));
  }
  assert.equal(Reflect.getMetadata('imports', AppModule).filter((module) => module === PrismaModule).length, 1);
});

test('login DTO allows short passwords but enforces maximum lengths', async () => {
  const check = (fields) => validate(Object.assign(new LoginDto(), fields));
  assert.equal((await check({ email: 'a@example.com', password: 'short' })).length, 0);
  assert.ok((await check({ email: 'a@example.com', password: 'x'.repeat(129) })).length);
  assert.ok((await check({ email: 'x'.repeat(255), password: 'short' })).length);
});

test('project validation rejects unsafe or missing links before writing', async () => {
  let writes = 0;
  const service = new ContentService({ block: { update: async () => { writes++; } } });
  for (const project of [null, {}, { href: 'http://example.com', image: 'https://example.com/a.jpg' }, { href: 'https://example.com', image: 'javascript:alert(1)' }]) {
    assert.throws(() => service.update('a', { data: { projects: [project] } }), (error) => error.getStatus() === 400);
  }
  assert.equal(writes, 0);
  await service.update('a', { data: { projects: [{ href: 'https://example.com', image: 'https://example.com/a.jpg' }] } });
  await service.update('a', { enabled: false });
  assert.equal(writes, 2);
});

test('login is limited per forwarded IP; other routes and error handling remain independent', async () => {
  class ProbeController {
    health() { return { ok: true }; }
    missing() { throw new Prisma.PrismaClientKnownRequestError('Missing', { code: 'P2025', clientVersion: '6.15.0' }); }
    duplicate() { throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: '6.15.0' }); }
    bad() { throw new BadRequestException('Original error'); }
  }
  Controller()(ProbeController);
  for (const name of ['health', 'missing', 'duplicate', 'bad']) {
    Get(name)(ProbeController.prototype, name, Object.getOwnPropertyDescriptor(ProbeController.prototype, name));
  }
  class TestModule {}
  Module({
    imports: [Reflect.getMetadata('imports', AuthModule).at(-1)],
    controllers: [AuthController, ProbeController],
    providers: [{ provide: AuthService, useValue: { login: async () => ({ accessToken: 'test' }) } }],
  })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.set('trust proxy', 1);
  app.useGlobalFilters(new PrismaExceptionFilter(app.getHttpAdapter()));
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const login = (ip) => fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
      body: JSON.stringify({ email: 'a@example.com', password: 'short' }),
    });
    for (let i = 0; i < 5; i++) assert.equal((await login('203.0.113.10')).status, 201);
    assert.equal((await login('203.0.113.10')).status, 429);
    assert.equal((await login('203.0.113.11')).status, 201);
    for (let i = 0; i < 7; i++) assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/missing`)).status, 404);
    assert.equal((await fetch(`${base}/duplicate`)).status, 409);
    const bad = await fetch(`${base}/bad`);
    assert.equal(bad.status, 400);
    assert.equal((await bad.json()).message, 'Original error');
  } finally {
    await app.close();
  }
});

test('startup rejects missing and short JWT secrets before connecting to the database', () => {
  for (const secret of ['', 'too-short']) {
    const result = spawnSync(process.execPath, ['dist/main.js'], {
      cwd: require('node:path').join(__dirname, '..'),
      env: { ...process.env, JWT_ACCESS_SECRET: secret }, encoding: 'utf8', timeout: 20000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_ACCESS_SECRET must be set and contain at least 32 characters/);
  }
});
