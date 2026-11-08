import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { transformWithOxc } from '../node_modules/vite/dist/node/index.js';

const require = createRequire(new URL('../package.json', import.meta.url));
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
// Use the real paired backend, not a second, hand-maintained allowlist.
// A standalone frontend checkout must explicitly supply its paired backend.
const backendRoot = process.env.CTH_BACKEND_CHECKOUT || path.resolve(frontendRoot, '../backend');
const backendPolicy = JSON.parse(execFileSync('python3', ['-I', '-B', '-c', `
import ast, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
def literal_assignment(relative, name):
    tree = ast.parse((root / relative).read_text())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            value = node.value
            if isinstance(value, ast.Call) and isinstance(value.func, ast.Name) and value.func.id == 'frozenset':
                value = value.args[0]
            result = ast.literal_eval(value)
            return sorted(result) if isinstance(result, set) else result
    raise AssertionError('Backend policy assignment missing: ' + name)
print(json.dumps({
    'allowed': literal_assignment('backend/services/openrouter_images_service.py', 'MODELS'),
    'fallbackOnly': literal_assignment('backend/services/image_fallback_service.py', 'NANO'),
    'generation': 'openai/' + literal_assignment('backend/constants/image_models.py', 'CORE_IMAGE_MODEL'),
    'referenceEdit': 'openai/' + literal_assignment('backend/constants/image_models.py', 'REFERENCE_IMAGE_MODEL'),
}))
`, backendRoot], { encoding: 'utf8', env: { PATH: process.env.PATH } }));

const source = fs.readFileSync(new URL('../src/pages/ContentQueue.jsx', import.meta.url), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const declarations = ast.program.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []);
function actualConstant(name) {
  const node = declarations.find(node => node.id.name === name);
  assert.ok(node, `Missing actual ContentQueue constant: ${name}`);
  return new Function(`return (${generate(node.init).code});`)();
}
const models = actualConstant('VISUAL_MODELS');
const defaultModel = actualConstant('DEFAULT_VISUAL_MODEL');
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (predicate(node)) return node;
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end'].includes(key)) continue;
    for (const child of Array.isArray(value) ? value : [value]) {
      const found = find(child, predicate);
      if (found) return found;
    }
  }
  return undefined;
}
const select = find(ast, node => node.type === 'JSXElement' && node.openingElement.name.name === 'select' &&
  node.openingElement.attributes.some(attr => attr.name?.name === 'title' && attr.value?.value === 'Image model'));
assert.ok(select, 'The actual image-model selector must be present');
const transformed = await transformWithOxc(`const menu = (${generate(select).code});`, 'ContentQueue.jsx', { jsx: { runtime: 'classic' } });
const makeMenu = new Function('React', 'VISUAL_MODELS', 'selectedModel', 'onSelectModel', 'item', 'higgsfieldConnected',
  transformed.code + '; return menu;');
const handler = find(ast, node => node.type === 'VariableDeclarator' && node.id.name === 'generateVisual');
assert.ok(handler, 'The actual generation handler must be present');

// These checks execute source declarations, selector JSX, and the actual handler.
// No app startup, provider requests, credentials, database, or build is involved.
test('every actual VISUAL_MODELS value belongs to the paired backend allowed set', () => {
  assert.ok(models.length > 0);
  assert.equal(new Set(models.map(model => model.value)).size, models.length);
  for (const model of models) {
    assert.ok(backendPolicy.allowed.includes(model.value), `Backend rejects model: ${model.value}`);
    assert.notEqual(model.value, backendPolicy.fallbackOnly, 'Nano Banana 2 must stay fallback-only');
  }
  assert.equal(defaultModel, backendPolicy.generation);
  assert.deepEqual(models.map(model => model.value), [backendPolicy.generation], 'Generation-only queue must offer Flare only');
  assert.ok(!models.some(model => model.value === backendPolicy.referenceEdit));
});

test('the actual selector renders only allowed options even with Higgsfield connected', () => {
  for (const connected of [false, true]) {
    const selections = [];
    const menu = makeMenu(React, models, defaultModel, (...args) => selections.push(args), { item_id: 'fixture' }, connected);
    const html = renderToStaticMarkup(menu);
    const optionValues = [...html.matchAll(/<option[^>]*value="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(optionValues, models.map(model => model.value));
    assert.doesNotMatch(html, /nano|gemini|higgsfield|sunburst/i);
    menu.props.onChange({ target: { value: defaultModel } });
    assert.deepEqual(selections, [['fixture', defaultModel]]);
  }
});

test('the actual generation handler sends each allowed choice and its default to the queue endpoint without edit references', async () => {
  const calls = [];
  const errors = [];
  const busy = [];
  const generateVisual = new Function('setBusyItem', 'setError', 'apiClient', 'unwrap', 'DEFAULT_VISUAL_MODEL', 'setItems',
    `return (${generate(handler.init).code});`)(value => busy.push(value), value => errors.push(value),
    { post: async (url, body) => { calls.push({ url, body }); return { data: {} }; } }, value => value?.data ?? value,
    defaultModel, () => {});
  for (const selected of [...models.map(model => model.value), undefined]) {
    await generateVisual({ item_id: 'fixture' }, selected);
    assert.deepEqual(calls.at(-1), {
      url: '/api/content-automation/queue/fixture/generate-visual',
      body: { model_id: selected || backendPolicy.generation },
    });
  }
  assert.ok(errors.every(value => value === ''));
  assert.equal(busy.at(-1), null);
});
