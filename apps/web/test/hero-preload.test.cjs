const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup({ touch = false, desktop = true } = {}) {
  let downloads = 0;
  const source = fs.readFileSync(path.join(__dirname, '../components/sections/hero-section.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(`${outputText}\nexports.InteractiveCells = InteractiveCells;`, {
    exports,
    navigator: { maxTouchPoints: touch ? 1 : 0 },
    window: { matchMedia: () => ({ matches: desktop }), setTimeout: () => 0 },
    performance: { now: () => 0 },
    Image: class { set src(value) { downloads++; } },
    require(name) {
      if (name === 'react') return {
        useRef: (value) => ({ current: value }),
        useState: () => [[], () => {}],
        useCallback: (fn) => fn,
        useEffect: (fn) => fn(),
      };
      if (name === 'framer-motion') return { motion: {}, AnimatePresence: () => null };
      if (name === '@/lib/media-url') return {};
      if (name === './constants') return { PROJECT_IMAGES: [] };
      return require(name);
    },
  });
  const element = exports.InteractiveCells({ images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] });
  return {
    downloads: () => downloads,
    move(pointerType) {
      element.props.onPointerMove({
        pointerType, clientX: 20, clientY: 20,
        currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
      });
    },
  };
}

test('gallery preloads once, only after the first desktop mouse movement', () => {
  const gallery = setup();
  assert.equal(gallery.downloads(), 0);
  gallery.move('mouse');
  assert.equal(gallery.downloads(), 2);
  gallery.move('mouse');
  assert.equal(gallery.downloads(), 2);
});

test('gallery never preloads on touch input, touch-capable devices, or mobile viewports', () => {
  for (const [options, pointer] of [[{}, 'touch'], [{ touch: true }, 'mouse'], [{ desktop: false }, 'mouse']]) {
    const gallery = setup(options);
    gallery.move(pointer);
    assert.equal(gallery.downloads(), 0);
  }
});
