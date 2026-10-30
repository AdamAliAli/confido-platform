const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, ...globals, require: name => imports[name] || require(name) });
  return exports;
}
const nodes = element => element == null || typeof element !== 'object' ? [] : Array.isArray(element) ? element.flatMap(nodes) : [element, ...nodes(element.props?.children)];
const inquiryLib = load('lib/inquiries.ts', {}, { atob });

test('contact page uses shared blocks, requested section order and only valid query interests', async () => {
  const blocks = { faq: { faqs: [] }, contact: { title: 'Contact heading' } };
  const imports = new Proxy({ '@/lib/api': { getHomeBlocks: async () => blocks }, '@/lib/inquiries': inquiryLib }, { get(target, name) { if (name in target) return target[name]; if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key }); } });
  const page = load('app/contact/page.tsx', imports);
  assert.equal(page.metadata.title, 'Contact');
  for (const interest of ['Social Media Management', 'wrong', ['Brand Strategy']]) {
    const result = await page.default({ searchParams: Promise.resolve({ interest }) });
    const children = result.props.children;
    assert.deepEqual(Array.from(children, child => child.type), ['SiteHeader', 'PageHero', 'ContactForm', 'FAQSection', 'ContactSection', 'SiteFooter']);
    assert.equal(children[1].props.scrollTarget, '#contact-form');
    assert.equal(children[2].props.initialInterest, interest === 'Social Media Management' ? interest : '');
    assert.equal(children[3].props.data, blocks.faq); assert.equal(children[4].props.data, blocks.contact);
  }
});

test('messages display full content and unread count, allow marking, and restrict confirmed deletion to admin', async () => {
  for (const role of ['ADMIN', 'EDITOR']) {
    const token = `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
    assert.equal(inquiryLib.canDeleteInquiry(token), role === 'ADMIN');
    const item = { id: 'one', email: 'person@example.com', phone: '+60 123', interest: 'Brand Systems', message: 'Full project details\nSecond line', createdAt: '2026-10-29T01:00:00Z', read: false };
    const state = []; const effects = []; const dependencies = []; let index = 0, effectIndex = 0, count, confirm = false, deleted = false;
    const { MessagesAdmin } = load('components/messages-admin.tsx', {
      react: {
        useState(initial) { const key = index++; if (!(key in state)) state[key] = initial; return [state[key], value => { state[key] = typeof value === 'function' ? value(state[key]) : value; }]; },
        useEffect(callback, deps) { const key = effectIndex++; if (!dependencies[key] || deps.some((value, i) => dependencies[key][i] !== value)) { dependencies[key] = deps; effects.push(callback); } },
      },
      '@/lib/inquiries': inquiryLib,
      '@/lib/api': { adminFetch: async (url, activeToken, init = {}) => {
        assert.equal(activeToken, token);
        if (init.method === 'PATCH') { assert.equal(url, '/inquiries/one'); return { ok: true, json: async () => ({ ...item, read: JSON.parse(init.body).read }) }; }
        if (init.method === 'DELETE') { assert.equal(role, 'ADMIN'); deleted = true; return { ok: true }; }
        assert.equal(url, '/inquiries'); return { ok: true, json: async () => [item] };
      } },
    }, { AbortController, window: { confirm: () => confirm } });
    const onUnreadChange = value => { count = value; };
    const render = () => { index = 0; effectIndex = 0; const tree = MessagesAdmin({ token, onUnreadChange }); while (effects.length) effects.shift()(); return tree; };
    render(); await new Promise(setImmediate); let tree = render();
    assert.equal(count, 1);
    assert.equal(nodes(tree).find(node => node.type === 'a').props.href, 'mailto:person@example.com');
    assert.ok(nodes(tree).some(node => node.props?.children === item.message));
    assert.match(nodes(tree).find(node => node.type === 'article').props.className, /font-semibold/);
    let buttons = nodes(tree).filter(node => node.type === 'button');
    assert.equal(buttons.length, role === 'ADMIN' ? 2 : 1);
    await buttons[0].props.onClick(); tree = render(); assert.equal(count, 0);
    assert.match(nodes(tree).find(node => node.type === 'article').props.className, /font-normal/);
    if (role === 'ADMIN') {
      buttons = nodes(tree).filter(node => node.type === 'button');
      await buttons[1].props.onClick(); assert.equal(deleted, false);
      confirm = true; await buttons[1].props.onClick(); tree = render();
      assert.equal(deleted, true); assert.equal(nodes(tree).filter(node => node.type === 'article').length, 0);
    }
  }
  assert.equal(inquiryLib.canDeleteInquiry('invalid'), false);
});
