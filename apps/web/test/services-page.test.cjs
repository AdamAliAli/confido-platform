const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, ...globals, require: name => imports[name] || require(name),
  });
  return exports;
}
const nodes = element => element == null || typeof element !== 'object' ? [] : Array.isArray(element) ? element.flatMap(nodes) : [element, ...nodes(element.props?.children)];

test('shared home blocks use enabled data, no-store fetch, and safe API-down defaults', async () => {
  let calls = 0;
  const api = load('lib/api.ts', {}, {
    process: { env: { NEXT_PUBLIC_API_URL: 'http://test-api/api' } },
    fetch: async (url, init) => {
      calls++; assert.equal(url, 'http://test-api/api/content/public/home'); assert.equal(init.cache, 'no-store');
      return { ok: true, json: async () => ({ blocks: [
        { type: 'clarity', enabled: true, data: { heading: 'Custom heading' } },
        { type: 'contact', enabled: false, data: { email: 'hidden@example.com' } },
        { type: 'faq', data: { faqs: [] } },
      ] }) };
    },
  });
  const result = await api.getHomeBlocks();
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { clarity: { heading: 'Custom heading' }, faq: { faqs: [] } });
  for (const fetch of [async () => { throw new Error('Offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('Malformed JSON'); } })]) {
    const unavailable = load('lib/api.ts', {}, { process: { env: {} }, fetch });
    assert.equal(JSON.stringify(await unavailable.getHomeBlocks()), '{}');
  }
});

test('services page has the requested order, hero and shared section content', async () => {
  for (const blocks of [{}, { clarity: { heading: 'Custom clarity' }, process: { steps: [] }, faq: { faqs: [] }, contact: { title: 'Custom contact' } }]) {
    const imports = new Proxy({
      '@/lib/api': { getHomeBlocks: async () => blocks },
      '@/lib/media-url': { text: (value, fallback) => typeof value === 'string' && value.trim() ? value : fallback },
    }, { get(target, name) { if (name in target) return target[name]; if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key }); } });
    const page = load('app/services/page.tsx', imports);
    assert.equal(page.metadata.title, 'Services — Confido');
    const result = await page.default();
    const children = result.props.children;
    assert.deepEqual(Array.from(children, child => child.type), ['SiteHeader', 'PageHero', 'ExpertiseList', 'div', 'PricingSection', 'ProcessSection', 'FAQSection', 'ContactSection', 'SiteFooter']);
    assert.equal(children[1].props.line1, 'Strategic');
    assert.equal(children[1].props.scrollTarget, '#what-we-do');
    assert.equal(children[1].props.fitSecondLine, true);
    assert.equal(children[3].props.children.props.text, blocks.clarity?.heading || 'Built on Clarity — Built to Scale');
    for (const [index, type] of [[5,'process'], [6,'faq'], [7,'contact']]) assert.equal(JSON.stringify(children[index].props.data), JSON.stringify(blocks[type] || {}));
  }
});

test('expertise list has three editable rows and disables reveal for reduced motion', () => {
  const content = load('components/sections/page-content.ts');
  for (const reduced of [false, true]) {
    const { ExpertiseList } = load('components/sections/expertise-list.tsx', {
      'framer-motion': { motion: { article: 'article' }, useReducedMotion: () => reduced },
      'lucide-react': { Spline: 'icon' }, './page-content': content,
    });
    const result = ExpertiseList({ label: 'OUR EXPERTISE', title: 'What We Do', accent: 'Why It Matters' });
    assert.equal(result.props.id, 'what-we-do');
    const rows = nodes(result).filter(node => node.type === 'article');
    assert.equal(rows.length, 3);
    for (const row of rows) {
      assert.equal(row.props.viewport.once, true);
      assert.equal(reduced ? row.props.initial : row.props.initial.opacity, reduced ? false : 0);
      if (reduced) assert.equal(row.props.transition.duration, 0);
    }
  }
});

test('homepage reuses the marquee with its existing classes and 22-second animation', () => {
  const { ClarityMarquee, ClaritySection } = load('components/sections/clarity-section.tsx', {
    react: { useRef: () => ({ current: null }) },
    'framer-motion': { motion: { h2: 'h2', div: 'div' }, useScroll: () => ({ scrollYProgress: 0 }), useSpring: value => value, useTransform: () => 0 },
    '@/lib/media-url': { text: (value, fallback) => value || fallback, imageUrl: (value, fallback) => value || fallback },
  });
  const marquee = ClarityMarquee({ text: 'Custom clarity' });
  assert.equal(marquee.props.className, 'clarity-heading-stage');
  const heading = marquee.props.children;
  assert.equal(heading.props.className, 'clarity-heading');
  assert.equal(heading.props.transition.duration, 22);
  assert.equal(heading.props.transition.repeat, Infinity);
  const home = ClaritySection({ data: {} });
  assert.equal(home.props.children[0].type, ClarityMarquee);
  assert.equal(home.props.children[0].props.text, 'Built on Clarity — Built to Scale');
});
