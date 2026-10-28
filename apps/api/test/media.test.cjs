const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { JwtStrategy } = require('../dist/auth/jwt.strategy');
const { RolesGuard } = require('../dist/auth/roles.guard');
const { MediaController } = require('../dist/media/media.controller');

test('signed uploads require JWT and editor/admin role, validate folders and keep secrets server-side', async () => {
  const keys = ['JWT_ACCESS_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const previous = keys.map((key) => process.env[key]);
  const secret = 'test-only-cloudinary-secret';
  Object.assign(process.env, { JWT_ACCESS_SECRET: 'test-only-jwt-secret-at-least-32-characters', CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: secret });
  class TestModule {}
  Module({ controllers: [MediaController], providers: [JwtStrategy, RolesGuard] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    const sign = (role, body = { folder: 'confido/team' }) => fetch(`${base}/media/sign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ sub: 'test-user', role })}` } : {}) }, body: JSON.stringify(body),
    });
    assert.equal((await sign(null)).status, 401);
    assert.equal((await sign('VIEWER')).status, 403);
    for (const role of ['ADMIN', 'EDITOR']) {
      for (const folder of ['confido/team', 'confido/gallery', 'confido/site']) {
        const response = await sign(role, { folder });
        assert.equal(response.status, 201);
        const result = await response.json();
        assert.deepEqual(Object.keys(result).sort(), ['apiKey', 'cloudName', 'folder', 'signature', 'timestamp']);
        assert.equal(result.signature, createHash('sha1').update(`folder=${folder}&timestamp=${result.timestamp}${secret}`).digest('hex'));
        assert.ok(Math.abs(Date.now() / 1000 - result.timestamp) < 5);
      }
    }
    for (const body of [{}, { folder: 'other' }, { folder: ['confido/team'] }, { folder: 'confido/team', extra: 'value' }]) {
      assert.equal((await sign('ADMIN', body)).status, 400);
    }
    for (const key of keys.slice(1)) {
      const value = process.env[key];
      delete process.env[key];
      const response = await sign('ADMIN');
      assert.equal(response.status, 503);
      assert.match((await response.json()).message, /Configure CLOUDINARY/);
      process.env[key] = value;
    }
  } finally {
    await app.close();
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
  }
});
