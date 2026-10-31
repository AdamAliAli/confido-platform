const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const interests = ['Social Media Management', 'Brand Strategy', 'Positioning', 'Brand Systems', 'Something else'];

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  const children = node.props?.children;
  return [node, ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(elements)];
}
function harness(fetch, initialInterest = '', search = '') {
  const state = []; let index = 0; const exports = {}; const effects = []; let effectUsed = false;
  const source = fs.readFileSync(path.join(__dirname, '../components/sections/contact-form.tsx'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, fetch, URLSearchParams, window: { location: { search } }, require(name) {
      if (name === 'react') return { useEffect(fn) { if (!effectUsed) { effectUsed = true; effects.push(fn); } }, useId: () => 'contact', useState(initial) { const key = index++; if (!(key in state)) state[key] = initial; return [state[key], value => { state[key] = typeof value === 'function' ? value(state[key]) : value; }]; } };
      if (name === '@/lib/api') return { API: 'http://test-api/api' };
      if (name === '@/lib/inquiries') return { INQUIRY_INTERESTS: interests };
      if (name === 'next/image') return { default: 'image' };
      return require(name);
    },
  });
  const render = () => { index = 0; const tree = exports.ContactForm({ initialInterest }); while (effects.length) effects.shift()(); return tree; };
  const field = name => elements(render()).find(node => node.props?.name === name);
  const change = (name, value) => field(name).props.onChange({ target: { value } });
  const submit = () => elements(render()).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  return { render, field, change, submit };
}

test('contact form validates fields, preselects interest, posts data and replaces itself on success', async () => {
  let payload;
  const form = harness(async (url, init) => { assert.equal(url, 'http://test-api/api/inquiries'); payload = JSON.parse(init.body); return { ok: true, json: async () => ({ ok: true }) }; }, interests[0]);
  assert.equal(form.field('interest').props.value, interests[0]);
  assert.equal(form.field('email').props.type, 'email'); assert.equal(form.field('email').props.required, true);
  assert.equal(form.field('email').props.maxLength, 254);
  assert.equal(form.field('phone').props.maxLength, 30);
  const phonePattern = new RegExp(`^(?:${form.field('phone').props.pattern})$`, 'v');
  assert.equal(phonePattern.test('+60 (12) 345-6789'), true); assert.equal(phonePattern.test('letters'), false);
  assert.equal(form.field('message').props.maxLength, 3000); assert.equal(form.field('message').props.rows, 5);
  assert.equal(form.field('website').props.tabIndex, -1); assert.equal(form.field('website').props.autoComplete, 'off');
  form.field('email').props.onInvalid(); assert.equal(form.field('email').props['aria-invalid'], true);
  form.change('email', ' Person@Example.com '); form.change('message', ' Please help with a project. ');
  form.submit();
  const button = elements(form.render()).find(node => node.type === 'button');
  assert.equal(button.props.disabled, true); assert.equal(button.props.children, 'Sending…');
  await new Promise(setImmediate);
  assert.deepEqual(payload, { email: 'Person@Example.com', interest: interests[0], message: 'Please help with a project.', website: '' });
  assert.equal(elements(form.render()).some(node => node.type === 'form'), false);
  const status = elements(form.render()).find(node => node.props?.role === 'status');
  assert.equal(status.props.children, "Thanks, we'll get back to you within 2 working days.");
});

test('failed submission preserves fields and invalid query interest is ignored', async () => {
  const form = harness(async () => ({ ok: false, status: 429 }), 'not an option');
  assert.equal(form.field('interest').props.value, '');
  form.change('email', 'person@example.com'); form.change('interest', interests[1]); form.change('message', 'Our project needs a brand strategy.');
  form.submit(); await new Promise(setImmediate);
  assert.equal(form.field('message').props.value, 'Our project needs a brand strategy.');
  assert.equal(form.field('email').props.value, 'person@example.com');
  assert.match(elements(form.render()).find(node => node.props?.role === 'alert').props.children, /minute/);
  assert.equal(elements(form.render()).find(node => node.type === 'button').props.disabled, false);
});

 test('cached contact form preselects only valid browser query interests after hydration', () => {
  for (const [search, expected] of [['?interest=Social%20Media%20Management', interests[0]], ['?interest=wrong', ''], ['', '']]) {
    const form = harness(async () => ({}), '', search); form.render();
    assert.equal(form.field('interest').props.value, expected);
  }
});
