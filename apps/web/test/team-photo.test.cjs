const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(api = {}, xhr = class {}) {
  const exports = {};
  const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/team-photo.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: () => api, URL, FormData, XMLHttpRequest: xhr,
  });
  return exports;
}

test('portraits transform only Cloudinary image uploads', () => {
  const { teamPhotoUrl } = load();
  assert.equal(teamPhotoUrl('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg'), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_1000,c_fill,g_face/v1/photo.jpg');
  for (const url of ['https://example.com/photo.jpg', 'https://res.cloudinary.com.evil.com/image/upload/a.jpg', 'invalid']) assert.equal(teamPhotoUrl(url), url);
});

test('photo validation rejects oversized and unsupported files before signing', async () => {
  let requests = 0;
  const { uploadTeamPhoto, validateTeamPhoto } = load({ adminFetch: () => { requests++; } });
  validateTeamPhoto({ type: 'image/webp', size: 8 * 1024 * 1024 });
  await assert.rejects(uploadTeamPhoto({ type: 'image/png', size: 8 * 1024 * 1024 + 1 }, '', () => {}, new AbortController().signal), /8 MB/);
  await assert.rejects(uploadTeamPhoto({ type: 'image/svg+xml', size: 100 }, '', () => {}, new AbortController().signal), /JPEG, PNG or WebP/);
  assert.equal(requests, 0);
});

test('site uploads allow 10 MB and use the site folder while Team keeps its 8 MB limit', async () => {
  let requests = 0;
  const { uploadTeamPhoto } = load({ adminFetch: async (path, token, init) => {
    requests++;
    assert.deepEqual(JSON.parse(init.body), { folder: 'confido/site' });
    return { ok: false, json: async () => ({ message: 'Signing checked' }) };
  } });
  const signal = new AbortController().signal;
  await assert.rejects(uploadTeamPhoto({ type: 'image/webp', size: 10 * 1024 * 1024 }, 'jwt', () => {}, signal, 'confido/site'), /Signing checked/);
  await assert.rejects(uploadTeamPhoto({ type: 'image/webp', size: 10 * 1024 * 1024 + 1 }, 'jwt', () => {}, signal, 'confido/site'), /10 MB/);
  await assert.rejects(uploadTeamPhoto({ type: 'image/webp', size: 9 * 1024 * 1024 }, 'jwt', () => {}, signal), /8 MB/);
  assert.equal(requests, 1);
});

test('upload sends signed fields without secrets and returns secure URL with progress', async () => {
  const progress = [];
  class Request {
    upload = {};
    open(method, url) { assert.equal(method, 'POST'); assert.equal(url, 'https://api.cloudinary.com/v1_1/demo/image/upload'); }
    send(body) {
      assert.equal(body.get('api_key'), 'public-key');
      assert.equal(body.get('folder'), 'confido/team');
      assert.equal(body.get('signature'), 'signed');
      assert.equal(body.get('timestamp'), '123');
      assert.ok(body.get('file'));
      assert.equal(body.has('api_secret'), false);
      this.upload.onprogress({ lengthComputable: true, loaded: 5, total: 10 });
      this.status = 200;
      this.responseText = JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/image/upload/test.png' });
      this.onload(); this.onloadend();
    }
  }
  const { uploadTeamPhoto } = load({ adminFetch: async (path, token, init) => {
    assert.equal(path, '/media/sign'); assert.equal(token, 'jwt');
    assert.deepEqual(JSON.parse(init.body), { folder: 'confido/team' });
    return { ok: true, json: async () => ({ cloudName: 'demo', apiKey: 'public-key', timestamp: 123, folder: 'confido/team', signature: 'signed' }) };
  } }, Request);
  const file = new File(['image'], 'test.png', { type: 'image/png' });
  assert.match(await uploadTeamPhoto(file, 'jwt', (value) => progress.push(value), new AbortController().signal), /^https:/);
  assert.deepEqual(progress, [50, 100]);
});

test('upload reports signing and Cloudinary failures without returning a URL', async () => {
  const file = new File(['image'], 'test.png', { type: 'image/png' });
  const signal = new AbortController().signal;
  const unavailable = load({ adminFetch: async () => ({ ok: false, json: async () => ({ message: 'Uploads unavailable' }) }) });
  await assert.rejects(unavailable.uploadTeamPhoto(file, 'jwt', () => {}, signal), /Uploads unavailable/);
  for (const [status, responseText, expected] of [
    [400, JSON.stringify({ error: { message: 'Invalid signature' } }), /Invalid signature/],
    [200, JSON.stringify({ secure_url: 'http://unsafe.example/photo.png' }), /secure photo URL/],
  ]) {
    class Request {
      upload = {};
      open() {}
      send() { this.status = status; this.responseText = responseText; this.onload(); this.onloadend(); }
    }
    const { uploadTeamPhoto } = load({ adminFetch: async () => ({ ok: true, json: async () => ({ cloudName: 'demo' }) }) }, Request);
    await assert.rejects(uploadTeamPhoto(file, 'jwt', () => {}, signal), expected);
  }
});
