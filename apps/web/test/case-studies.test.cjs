const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const exports = {};
  const absolute = path.join(__dirname, '..', file);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, URL, process: { env: { NEXT_PUBLIC_SITE_URL: 'https://confido.example' } },
    require(name) {
      if (imports[name]) return imports[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(__dirname, '..', name.slice(2)) : path.resolve(path.dirname(absolute), name);
        const target = fs.existsSync(base + '.tsx') ? base + '.tsx' : base + '.ts';
        return load(path.relative(path.join(__dirname, '..'), target), imports);
      }
      return require(name);
    },
  });
  return exports;
}
const lib = load('lib/case-studies.ts');
const plain = value => JSON.parse(JSON.stringify(value));
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (typeof element.type === 'function') return nodes(element.type(element.props));
  return [element, ...nodes(element.props?.children)];
}

test('case-study slugs reject unsafe addresses and the first duplicate wins without changing saved order', () => {
  for (const slug of ['', '-bad', 'bad-', 'two--dashes', 'Uppercase', 'with space', 'trailing ', 'newline\n', 'newline\u2028', '../escape', 'x/y', 'x?y', '%2f', 'a'.repeat(81), null, 42]) {
    assert.equal(lib.caseStudySlug(slug), undefined, String(slug));
  }
  for (const slug of ['a', '2026', 'osmanli-oud-malaysia', 'a'.repeat(80)]) assert.equal(lib.caseStudySlug(slug), slug);
  const saved = [{ slug: 'first', title: 'Original' }, { slug: 'second', title: 'Next' }, { slug: 'first', title: 'Duplicate' }, { slug: 'Not-valid' }];
  assert.deepEqual(plain(lib.getCaseStudies(saved).map(p => [p.slug, p.title])), [['first', 'Original'], ['second', 'Next']]);
  assert.equal(saved[0].title, 'Original');
  for (const empty of [undefined, null, {}, 'text']) assert.deepEqual(plain(lib.getCaseStudies(empty)), []);
});

test('case studies keep plain text, approved images and complete results only, with bounded lists', () => {
  const [project] = lib.getCaseStudies([{
    slug: 'sample', title: '  Saved title  ', summary: '<b>Plain text</b>',
    image: 'javascript:bad', cover: '/images/cover.webp', client: ' A client ', width: 1600, height: 900,
    results: [{ value: ' +1,357% ', label: ' Reach ' }, { value: '', label: 'Bad' }, { value: '1', label: ' ' }, null, ...Array(7).fill({ value: '2x', label: 'Growth' })],
    gallery: [{ src: 'http://unsafe.test/a.jpg' }, { src: 'data:image/png;base64,abc' }, null, { src: '/images/local.webp', alt: ' Local photo ' }, ...Array(9).fill({ src: 'https://images.example/photo.jpg' })],
  }]);
  assert.equal(project.title, 'Saved title');
  assert.equal(project.summary, '<b>Plain text</b>');
  assert.equal(project.client, 'A client');
  assert.equal(project.image, '/images/cover.webp');
  assert.equal(project.width, 1600); assert.equal(project.height, 900);
  assert.equal(project.results.length, 6);
  assert.deepEqual(plain(project.results[0]), { value: '+1,357%', label: 'Reach' });
  assert.equal(project.gallery.length, 8);
  assert.deepEqual(plain(project.gallery[0]), { src: '/images/local.webp', alt: 'Local photo' });
  assert.equal(project.gallery[1].alt, project.title);
  assert.equal(lib.getCaseStudies([{ slug: 'no-image', image: 'javascript:bad' }])[0].image, '');
  assert.match(lib.caseImageSrcSet('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg'), /f_auto,q_auto,c_limit,w_1200/);
  assert.equal(lib.caseImageSrcSet('/images/photo.webp'), undefined);
});

test('paragraphs split blank lines, preserve single line breaks and handle Windows text', () => {
  assert.deepEqual(plain(lib.paragraphs('  First line\ncontinues.\n\n  Second paragraph.\n \n\n Third.  ')), ['First line\ncontinues.', 'Second paragraph.', 'Third.']);
  assert.deepEqual(plain(lib.paragraphs('First\r\n\r\n Second\r\n \r\nThird')), ['First', 'Second', 'Third']);
  for (const blank of [undefined, '', ' \n\n ', 3]) assert.deepEqual(plain(lib.paragraphs(blank)), []);
});

const studies = [
  { slug: 'first', title: 'First project', image: 'https://res.cloudinary.com/demo/image/upload/v1/cover.jpg', summary: 's'.repeat(200), client: 'Client A', market: 'Malaysia', challenge: 'First paragraph\n\nSecond paragraph', approach: 'Our plan', results: [{ value: '+1,357%', label: 'Reach' }], resultsNote: 'Measured over three months.', gallery: [{ src: '/images/location/reference-forest.png', alt: 'Forest' }] },
  { slug: 'second', title: 'Second project', image: '/images/location/reference-traveler.png' },
];
function pageImports(blocks) {
  return {
    '@/lib/api': { getHomeBlocks: async () => blocks },
    'next/navigation': { notFound() { throw new Error('NOT_FOUND'); } },
    '@/components/site-header': { SiteHeader: 'SiteHeader' }, '@/components/site-footer': { SiteFooter: 'SiteFooter' },
    '@/components/sections/contact-section': { ContactSection: 'ContactSection' },
    '@/components/sections/case-study-reveal': { CaseStudyReveal: 'Reveal' },
  };
}

test('case-study routes derive static paths and metadata from saved content, and unknown slugs return 404', async () => {
  const page = load('app/work/[slug]/page.tsx', pageImports({ projects: { projects: studies } }));
  assert.equal(page.revalidate, 300); assert.equal(page.dynamicParams, true);
  assert.deepEqual(plain(await page.generateStaticParams()), [{ slug: 'first' }, { slug: 'second' }]);
  const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: 'first' }) });
  assert.equal(metadata.title, 'First project — Case Study');
  assert.equal(metadata.description.length, 155);
  assert.equal(metadata.alternates.canonical, '/work/first');
  assert.equal(metadata.openGraph.url, '/work/first');
  assert.match(metadata.openGraph.images[0].url, /c_limit,w_1200/);
  for (const render of [page.default, page.generateMetadata]) await assert.rejects(render({ params: Promise.resolve({ slug: 'unknown' }) }), /NOT_FOUND/);
  const down = load('app/work/[slug]/page.tsx', pageImports({}));
  assert.deepEqual(plain(await down.generateStaticParams()), []);
  await assert.rejects(down.default({ params: Promise.resolve({ slug: 'first' }) }), /NOT_FOUND/);
});

test('case-study rendering includes plain text, valid schemas, shared contact, navigation and optional sections', async () => {
  const contact = { title: 'Shared contact' };
  const page = load('app/work/[slug]/page.tsx', pageImports({ projects: { projects: studies }, contact }));
  const tree = nodes(await page.default({ params: Promise.resolve({ slug: 'first' }) }));
  assert.equal(tree.filter(n => n.type === 'h1').length, 1);
  assert.equal(tree.find(n => n.type === 'h1').props.children, 'First project');
  assert.equal(tree.filter(n => n.type === 'dt').length, 2, 'empty facts stay hidden');
  assert.equal(tree.find(n => n.type === 'img').props.fetchPriority, 'high');
  assert.equal(tree.filter(n => n.type === 'img')[1].props.loading, 'lazy');
  assert.equal(tree.find(n => n.type === 'ContactSection').props.data, contact);
  assert.ok(tree.some(n => n.type === 'a' && n.props.href === '/work/second'));
  const schemas = tree.filter(n => n.type === 'script').map(n => JSON.parse(n.props.dangerouslySetInnerHTML.__html));
  assert.equal(schemas[0]['@type'], 'CreativeWork'); assert.equal(schemas[0].about, 'Client A');
  assert.equal(schemas[1]['@type'], 'BreadcrumbList');
  assert.deepEqual(schemas[1].itemListElement.map(i => i.name), ['Home', 'Work', 'First project']);
  const minimal = nodes(await page.default({ params: Promise.resolve({ slug: 'second' }) }));
  assert.equal(minimal.filter(n => n.type === 'section').length, 0, 'empty challenge, approach, results and gallery stay hidden');
  assert.ok(minimal.some(n => n.type === 'a' && n.props.href === '/work/first'), 'next wraps to the first study');
});

test('valid case-study links override href on work items and homepage projects; other projects retain existing links', () => {
  const projects = [{ slug: 'case-page', title: 'Case page', image: '/images/photo.webp', href: 'https://external.example' }, { slug: 'INVALID', title: 'External', image: '/images/other.webp', href: 'https://external.example' }];
  const items = load('lib/work-items.ts').combineWorkItems(projects, []);
  assert.equal(items[0].href, '/work/case-page'); assert.equal(items[0].caseStudy, true);
  assert.equal(items[1].href, 'https://external.example'); assert.equal(items[1].caseStudy, false);
  const { ProjectsSection } = load('components/sections/projects-section.tsx', { 'framer-motion': { motion: { article: 'article' } }, 'next/image': { __esModule: true, default: 'img' } });
  const links = nodes(ProjectsSection({ data: { projects } })).filter(n => n.type === 'a');
  assert.equal(links[0].props.href, '/work/case-page');
  assert.equal(links[1].props.href, 'https://external.example');
});

test('sitemap adds unique case-study paths and still lists fixed pages when the API is down', async () => {
  for (const blocks of [{}, { projects: { projects: [...studies, studies[0], { slug: 'INVALID' }] } }]) {
    const entries = await load('app/sitemap.ts', { '@/lib/api': { getHomeBlocks: async () => blocks } }).default();
    assert.equal(entries.filter(e => e.priority !== 0.7).length, 7);
    const cases = entries.filter(e => e.priority === 0.7);
    assert.equal(cases.length, blocks.projects ? 2 : 0);
    assert.deepEqual(plain(cases.map(e => e.url)), blocks.projects ? ['https://confido.example/work/first', 'https://confido.example/work/second'] : []);
  }
});

test('case-study sections reveal once and render immediately for reduced motion', () => {
  for (const reduced of [true, false]) {
    const { CaseStudyReveal } = load('components/sections/case-study-reveal.tsx', { 'framer-motion': { motion: { div: 'motion.div' }, useReducedMotion: () => reduced } });
    const element = CaseStudyReveal({ children: 'Content' });
    assert.equal(element.props.viewport.once, true);
    assert.equal(element.props.initial === false, reduced);
    assert.equal(element.props.transition.duration, reduced ? 0 : 0.7);
  }
});
