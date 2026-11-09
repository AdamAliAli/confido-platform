const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, siteUrl, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, process: { env: { NEXT_PUBLIC_SITE_URL: siteUrl } }, require: name => imports[name] || (name === '@/lib/api' ? { getHomeBlocks: async () => ({}) } : name === '@/lib/case-studies' ? load('lib/case-studies.ts', siteUrl, { './media-url': load('lib/media-url.ts', siteUrl) }) : name === '@/lib/seo' ? load('lib/seo.ts', siteUrl) : name === '@/components/json-ld' ? load('components/json-ld.tsx', siteUrl) : require(name)),
  });
  return exports;
}

test('SEO uses the configured origin or localhost and excludes admin from discovery', async () => {
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
    const sitemap = await load('app/sitemap.ts', siteUrl).default();
    assert.deepEqual(Array.from(sitemap, item => item.url), ['/', '/services', '/work', '/about', '/contact', '/pricing', '/privacy-policy'].map(route => new URL(route, origin).href));
  }
});


test('every public page exports concise metadata, canonical and matching sharing data', () => {
  const routes = ['', 'services', 'about', 'contact', 'pricing', 'work', 'privacy-policy'];
  const imports = new Proxy({}, { get: (_, name) => name === '@/lib/seo' ? undefined : name.startsWith('@/') ? {} : undefined });
  for (const route of routes) {
    const { metadata } = load(`app/${route ? route + '/' : ''}page.tsx`, 'https://confido.example', imports);
    const title = typeof metadata.title === 'string' ? metadata.title : metadata.title.absolute;
    const renderedTitle = typeof metadata.title === 'string' ? `${title} — Confido` : title;
    assert.ok(title.length > 5 && renderedTitle.length < 60, `${route} title: ${renderedTitle}`);
    assert.ok(metadata.description.length > 30 && metadata.description.length < 155, route);
    assert.equal(metadata.alternates.canonical, '/' + route);
    assert.equal(metadata.openGraph.url, '/' + route);
    assert.equal(metadata.openGraph.title, title);
    assert.equal(metadata.openGraph.description, metadata.description);
  }
});

test('structured data is valid JSON and safely escapes saved HTML delimiters', () => {
  const { JsonLd } = load('components/json-ld.tsx');
  const { ORGANIZATION, faqSchema, serviceSchema } = load('lib/seo.ts', 'https://confido.example');
  const malicious = '</script><script>alert("x")</script>';
  const schemas = [ORGANIZATION, faqSchema([{ question: malicious, answer: 'Plain answer' }]), serviceSchema(), serviceSchema(true)];
  for (const data of schemas) {
    const script = JsonLd({ data });
    assert.equal(script.type, 'script');
    assert.equal(script.props.type, 'application/ld+json');
    const serialized = script.props.dangerouslySetInnerHTML.__html;
    assert.ok(!serialized.includes('<'));
    assert.equal(JSON.stringify(JSON.parse(serialized)), JSON.stringify(data));
  }
  assert.equal(ORGANIZATION.logo, 'https://confido.example/icon.png');
  assert.equal(ORGANIZATION.address.addressLocality, 'Kuala Lumpur');
  assert.equal(JSON.stringify(ORGANIZATION.areaServed), '["MY","SA","SY","AE"]');
  const services = serviceSchema(true)['@graph'];
  assert.equal(services.map(s => s.name).join('|'), 'Social Media Management|Brand Strategy|Positioning|Brand Systems');
  assert.equal(services[0].offers.price, 1000);
  assert.equal(services[0].offers.priceCurrency, 'USD');
  assert.equal(services[0].offers.priceSpecification.unitText, 'MONTH');
});

test('sitemap gives every public route a modification date and the intended priority', async () => {
  const entries = await load('app/sitemap.ts', 'https://confido.example').default();
  const priorities = { '/': 1, '/services': 0.9, '/work': 0.9, '/about': 0.8, '/contact': 0.8, '/pricing': 0.8, '/privacy-policy': 0.3 };
  for (const entry of entries) {
    assert.equal(entry.priority, priorities[new URL(entry.url).pathname]);
    assert.ok(Number.isFinite(Date.parse(entry.lastModified)));
  }
});
