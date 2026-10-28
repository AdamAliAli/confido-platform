const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function formHarness(fetch) {
  const state = [];
  let index = 0;
  const exports = {};
  const source = fs.readFileSync(require('node:path').join(__dirname, '../components/newsletter-form.tsx'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, fetch, require(name) {
      if (name === 'react') return { useState(initial) { const key = index++; if (!(key in state)) state[key] = initial; return [state[key], (value) => { state[key] = value; }]; } };
      if (name === '@/lib/api') return { API: 'http://test-api/api' };
      if (name === 'lucide-react') return { ArrowRight: 'icon' };
      return require(name);
    },
  });
  return () => { index = 0; return exports.NewsletterForm(); };
}

test('newsletter form posts email and displays mint confirmation without exposing subscriber state', async () => {
  let payload;
  const render = formHarness(async (url, init) => { assert.equal(url, 'http://test-api/api/newsletter'); assert.equal(init.method, 'POST'); payload = JSON.parse(init.body); return { ok: true }; });
  let form = render();
  const input = form.props.children[0].props.children[0];
  assert.equal(input.props.maxLength, 254);
  assert.equal(input.props.required, true);
  input.props.onChange({ target: { value: ' person@example.com ' } });
  form = render();
  form.props.onSubmit({ preventDefault() {} });
  assert.equal(render().props.children[0].props.children[1].props.disabled, true);
  await new Promise(setImmediate);
  form = render();
  assert.deepEqual(payload, { email: 'person@example.com' });
  assert.equal(form.props.children[1].props.children, "Thanks, you're subscribed.");
  assert.match(form.props.children[1].props.className, /text-mint/);
  assert.equal(form.props.children[0].props.children[0].props.value, '');
});

test('newsletter failures show a short error and restore submission controls', async () => {
  for (const fetch of [async () => ({ ok: false, status: 429 }), async () => { throw new Error('Network unavailable'); }]) {
    const render = formHarness(fetch);
    render().props.onSubmit({ preventDefault() {} });
    await new Promise(setImmediate);
    const form = render();
    assert.equal(form.props.children[1].props.role, 'alert');
    assert.equal(form.props.children[0].props.children[1].props.disabled, false);
  }
});
