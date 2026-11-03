const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, options = {}) {
  const file = path.join(__dirname, '..', relative);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, process, require(name) {
      if (name === 'react') return { useCallback: fn => fn, useState: value => [options.open && value === null ? 0 : value, () => {}], useRef: () => ({ current: null }), useId: () => 'test-section' };
      if (name === 'framer-motion') return { useMotionValue: () => 0, useSpring: value => value, useScroll: () => ({ scrollYProgress: 0 }), useTransform: () => 0, motion: new Proxy({}, { get: (_, tag) => `motion.${tag}` }), AnimatePresence: ({ children }) => children, useReducedMotion: () => true };
      if (name === 'next/image') return { __esModule: true, default: 'Image' };
      if (name === 'lucide-react') return { ChevronLeft: 'icon', ChevronRight: 'icon' };
      if (name === '@/lib/api' || name === './api') return {};
      if (name.startsWith('@/')) return load(name.slice(2) + (name === '@/components/json-ld' ? '.tsx' : '.ts'), options);
      if (name.startsWith('.')) {
        const base = path.relative(path.join(__dirname, '..'), path.resolve(path.dirname(file), name));
        return load(base + (fs.existsSync(path.join(__dirname, '..', base + '.tsx')) ? '.tsx' : '.ts'), options);
      }
      return require(name);
    },
  });
  return exports;
}

function nodes(element) {
  if (element == null || typeof element === 'boolean') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (typeof element !== 'object') return [element];
  if (typeof element.type === 'function') return nodes(element.type(element.props));
  return [element, ...nodes(element.props?.children)];
}
const allText = tree => nodes(tree).filter(n => typeof n === 'string').join(' ');

test('empty editor blocks resolve to exactly the public fallback text and images for all nine sections', () => {
  const { editorSectionData, ADMIN_SCHEMA } = load('lib/admin-schema.ts');
  for (const type of Object.keys(ADMIN_SCHEMA)) {
    const exports = load(`components/sections/${type}-section.tsx`, { open: true });
    const Component = exports[type === 'faq' ? 'FAQSection' : `${type[0].toUpperCase()}${type.slice(1)}Section`];
    const members = [{ id: 'a', name: 'Ada', role: 'Designer', photoUrl: 'https://example.com/a.jpg' }];
    const live = Component({ data: {}, members });
    const filled = Component({ data: editorSectionData(type, {}).data, members });
    assert.equal(allText(filled), allText(live), type);
    const images = tree => nodes(tree).filter(node => node?.props?.src || node?.props?.style?.backgroundImage).map(node => ({ src: node.props.src, background: node.props.style?.backgroundImage }));
    assert.equal(JSON.stringify(images(filled)), JSON.stringify(images(live)), type);
  }
});

test('services prefer canonical data, then legacy items, then shared defaults', () => {
  const { ServicesSection } = load('components/sections/services-section.tsx');
  const legacy = [{ title: 'Legacy service', description: 'Keep this saved content' }];
  assert.match(allText(ServicesSection({ data: { services: [], items: legacy } })), /Legacy service/);
  const canonical = allText(ServicesSection({ data: { services: [{ title: 'Canonical', description: 'Canonical copy' }], items: legacy } }));
  assert.match(canonical, /Canonical/); assert.doesNotMatch(canonical, /Legacy service/);
  assert.match(allText(ServicesSection({ data: {} })), /Clarity before complexity/);
});

test('new section blocks render current fallbacks for empty or blank data', () => {
  const location = load('components/sections/location-section.tsx').LocationSection({ data: { label: '', photos: [], city: '' } });
  assert.match(allText(location), /MORE ABOUT US/);
  assert.match(allText(location), /Kuala Lumpur\s*,/);
  assert.equal(nodes(location).filter(n => n?.type === 'motion.img').length, 3);
  const process = load('components/sections/process-section.tsx', { open: true }).ProcessSection({ data: { steps: [] } });
  assert.match(allText(process), /Discover/);
  assert.match(allText(process), /Define/);
  assert.equal(nodes(process).find(n => n?.type === 'Image').props.src, '/images/Process-1.avif');
  const faq = load('components/sections/faq-section.tsx').FAQSection({ data: { faqs: [] } });
  assert.match(allText(faq), /What do you actually do\?/);
  assert.equal(nodes(faq).filter(n => n?.type === 'button').length, 6);
  const team = load('components/sections/team-section.tsx').TeamSection({ data: { label: '' }, members: [{ id: 'a', name: 'Ada', role: 'Designer', photoUrl: 'https://example.com/a.jpg' }] });
  assert.match(allText(team), /TEAM MEMBERS/);
  assert.ok(nodes(team).some(n => n?.props?.id === 'team'));
});

test('new sections use edited text and block unsafe image and link values', () => {
  const location = load('components/sections/location-section.tsx').LocationSection({ data: { label: '<b>Plain text</b>', mapUrl: 'javascript:alert(1)', photos: [{ src: 'data:bad', alt: 'Custom alt' }] } });
  assert.match(allText(location), /<b>Plain text<\/b>/);
  assert.equal(nodes(location).find(n => n?.type === 'motion.a').props.href, undefined);
  assert.ok(nodes(location).find(n => n?.type === 'motion.img').props.src.startsWith('https://'));
  const process = load('components/sections/process-section.tsx', { open: true }).ProcessSection({ data: { steps: [{ title: 'Custom step', image: 'javascript:bad' }] } });
  assert.match(allText(process), /Custom step/);
  assert.equal(nodes(process).find(n => n?.type === 'Image').props.src, '/images/Process-1.avif');
  const faq = load('components/sections/faq-section.tsx').FAQSection({ data: { faqs: [{ question: 'Custom question', answer: 'Custom answer' }] } });
  assert.match(allText(faq), /Custom answer/);
});

test('site media transformations and safe links only allow intended URLs', () => {
  const { siteImage, safeHref, imageUrl } = load('lib/media-url.ts');
  assert.equal(siteImage('https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 900), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_900/v1/a.jpg');
  assert.equal(siteImage('/images/a.webp', 1000), '/images/a.webp');
  for (const value of ['javascript:alert(1)', '//evil.test', '/\\evil.test', 'data:text/html,test', 'http://example.com']) assert.equal(safeHref(value), undefined);
  for (const value of ['https://example.com', '/pricing', 'mailto:hello@example.com']) assert.equal(safeHref(value), value);
  assert.equal(imageUrl('http://example.com/a.jpg', '/images/fallback.webp'), '/images/fallback.webp');
});


test('FAQ structured data exactly matches edited questions and built-in fallbacks', () => {
  const { FAQSection } = load('components/sections/faq-section.tsx');
  for (const data of [{}, { faqs: [] }, { faqs: [{ question: 'A saved question?', answer: 'A saved answer.' }, { question: '', answer: '' }] }]) {
    const tree = nodes(FAQSection({ data }));
    const script = tree.find(n => n?.type === 'script');
    const schema = JSON.parse(script.props.dangerouslySetInnerHTML.__html);
    const questions = tree.filter(n => n?.type === 'button').map(button => {
      const spans = button.props.children;
      return { question: spans[0].props.children, answer: schema.mainEntity.find(q => q.name === spans[0].props.children).acceptedAnswer.text };
    });
    assert.equal(schema['@type'], 'FAQPage');
    assert.equal(schema.mainEntity.length, questions.length);
    assert.deepEqual(schema.mainEntity.map(q => q.name), questions.map(q => q.question));
    const firstVisibleAnswer = tree.find(n => n?.type === 'span' && n.props.className?.includes('max-w-[420px]'));
    assert.equal(schema.mainEntity[0].acceptedAnswer.text, firstVisibleAnswer.props.children);
  }
});

test('hero headings remain single and expose descriptive hidden titles without changing visible words', () => {
  const home = load('components/sections/hero-section.tsx').HeroSection({ data: {} });
  const heading = nodes(home).filter(n => n?.type === 'h1');
  assert.equal(heading.length, 1);
  assert.equal(allText(heading[0]), 'Brands  With Direction — Confido, brand strategy and social media agency in Kuala Lumpur, Malaysia');
  assert.equal(heading[0].props.children[1].props.className, 'sr-only');
  const { PageHero } = load('components/sections/page-hero.tsx');
  for (const srTitle of [undefined, 'Branding and social media services in Malaysia']) {
    const tree = nodes(PageHero({ label: 'OUR EXPERTISE', line1: 'Strategic', accent: 'Brand', rest: 'Expertise', scrollTarget: '#what-we-do', srTitle }));
    const headings = tree.filter(n => n?.type === 'h1');
    assert.equal(headings.length, 1);
    const lines = headings[0].props.children;
    assert.equal(lines[0].props.children, 'Strategic');
    assert.equal(lines[0].props['aria-hidden'], srTitle ? true : undefined);
    assert.equal(lines[1].props['aria-hidden'], srTitle ? true : undefined);
    if (srTitle) assert.equal(lines[2].props.children, srTitle);
  }
});
