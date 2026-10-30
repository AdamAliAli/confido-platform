const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, siteUrl, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, process: { env: { NEXT_PUBLIC_SITE_URL: siteUrl } }, require: name => imports[name] || require(name),
  });
  return exports;
}

test('SEO uses the configured origin or localhost and excludes admin from discovery', () => {
  for (const siteUrl of [undefined, '', 'https://confido.example/']) {
    const origin = siteUrl || 'http://localhost:3000';
    let font;
    const layout = load('app/layout.tsx', siteUrl, { './globals.css': {}, 'next/font/google': { Poppins(options) { font = options; return { variable: 'font', className: 'poppins' }; } } });
    assert.equal(layout.metadata.metadataBase.href, new URL(origin).href);
    assert.equal(layout.metadata.title.template, '%s — Confido');
    assert.equal(layout.metadata.title.default, 'Confido — Strategic Brand Advisory');
    assert.equal(layout.metadata.openGraph.type, 'website');
    assert.equal(layout.metadata.openGraph.siteName, 'Confido');
    assert.equal(layout.metadata.twitter.card, 'summary_large_image');
    assert.ok(font.weight.includes('300'));
    const robots = load('app/robots.ts', siteUrl).default();
    assert.equal(robots.rules.allow, '/'); assert.equal(robots.rules.disallow, '/admin');
    assert.equal(robots.sitemap, new URL('/sitemap.xml', origin).href);
    const sitemap = load('app/sitemap.ts', siteUrl).default();
    assert.deepEqual(Array.from(sitemap, item => item.url), ['/', '/services', '/about', '/contact', '/pricing', '/privacy-policy'].map(route => new URL(route, origin).href));
  }
});
