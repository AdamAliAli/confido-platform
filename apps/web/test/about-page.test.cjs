const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => imports[name] || require(name) });
  return exports;
}
const nodes = element => element == null || typeof element !== 'object' ? [] : Array.isArray(element) ? element.flatMap(nodes) : [element, ...nodes(element.props?.children)];

test('About page renders the requested order and reuses homepage data or defaults', async () => {
  for (const blocks of [{}, { clarity: { heading: 'Custom heading' }, location: { city: 'Custom city' }, faq: { faqs: [] }, contact: { title: 'Custom contact' } }]) {
    const imports = new Proxy({ '@/lib/api': { getHomeBlocks: async () => blocks }, '@/lib/media-url': { text: (value, fallback) => value || fallback } }, { get(target, name) { if (name in target) return target[name]; if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key }); } });
    const page = load('app/about/page.tsx', imports);
    assert.equal(page.metadata.title, 'About Us — Confido');
    const result = await page.default();
    const children = result.props.children;
    assert.deepEqual(Array.from(children, child => child.type), ['SiteHeader', 'PageHero', 'AboutIntro', 'ExpertiseList', 'div', 'LocationSection', 'FAQSection', 'ContactSection', 'SiteFooter']);
    assert.equal(children[1].props.scrollTarget, '#how-we-think');
    assert.equal(children[1].props.line1, 'Built on');
    assert.equal(children[2].props.id, 'how-we-think');
    assert.equal(children[3].props.showHeader, false);
    assert.equal(children[4].props.children.props.text, blocks.clarity?.heading || 'Built on Clarity — Built to Scale');
    for (const [index, type] of [[5,'location'], [6,'faq'], [7,'contact']]) assert.equal(JSON.stringify(children[index].props.data), JSON.stringify(blocks[type] || {}));
  }
});

test('About introduction uses the editable data, shared header, safe CTA and reduced motion', () => {
  const content = load('components/sections/page-content.ts');
  const { SectionHeader } = load('components/sections/section-header.tsx');
  for (const reduced of [true, false]) {
    const { AboutIntro } = load('components/sections/about-intro.tsx', {
      'framer-motion': { motion: { div: 'motion.div' }, useReducedMotion: () => reduced },
      'lucide-react': { ArrowRight: 'icon' }, './page-content': content, './section-header': { SectionHeader }, '@/lib/media-url': { safeHref: value => value },
    });
    const result = AboutIntro({ id: 'how-we-think' });
    assert.equal(result.props.children[0].type, SectionHeader);
    assert.equal(result.props.children[0].props.padded, false);
    assert.equal(result.props.children[0].props.title, content.ABOUT.title);
    assert.equal(nodes(result).find(node => node.type === 'p').props.children, content.ABOUT.statement);
    assert.equal(nodes(result).find(node => node.type === 'a').props.href, '/contact');
    const reveal = nodes(result).find(node => node.type === 'motion.div');
    assert.equal(reveal.props.viewport.once, true);
    if (reduced) { assert.equal(reveal.props.initial, false); assert.equal(reveal.props.transition.duration, 0); }
  }
});

test('expertise header remains on by default and is omitted only when requested', () => {
  const content = load('components/sections/page-content.ts');
  const { SectionHeader } = load('components/sections/section-header.tsx');
  const { ExpertiseList } = load('components/sections/expertise-list.tsx', { 'framer-motion': { motion: { article: 'article' }, useReducedMotion: () => true }, 'lucide-react': { Spline: 'icon' }, './page-content': content, './section-header': { SectionHeader } });
  const services = ExpertiseList({ label: 'OUR EXPERTISE', title: 'What We Do', accent: 'Why It Matters' });
  assert.equal(services.props.children[0].type, SectionHeader);
  const about = ExpertiseList({ showHeader: false });
  assert.equal(about.props.children[0], false);
  assert.equal(nodes(about).filter(node => node.type === 'article').length, 3);
  assert.equal(about.props['aria-labelledby'], undefined);
});
