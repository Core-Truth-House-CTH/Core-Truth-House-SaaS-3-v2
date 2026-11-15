import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(new URL('../package.json', import.meta.url));
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const source = fs.readFileSync(path.join(root, 'src/ProtectedApp.jsx'), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const declaration = ast.program.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'ProtectedRoutes');
assert.ok(declaration, 'Test uses the actual outer route component');
const registry = fs.readFileSync(path.join(root, 'src/navigation/pageRegistry.jsx'), 'utf8');

test('retired screen implementation and active triggers are absent', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/pages/LockScreen.jsx')), false);
  assert.doesNotMatch(source, /LockScreen|lock-screen/);
  for (const relative of ['src/config/appRoutes.js', 'src/navigation/pageRegistry.jsx', 'src/components/BillingWall.jsx']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, relative), 'utf8'), /LockScreen|lock-screen/);
  }
  assert.match(registry, /["']\/command-center["']/);
});

test('retired paths have no redirect: no redirect table and no lock-screen, dashboard or audit route', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/config/redirectRoutes.js')), false);
  for (const relative of ['src/config/routeConfig.jsx', 'src/navigation/AppRouter.jsx']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, relative), 'utf8'), /redirectRoutes|REDIRECT_ROUTES/);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'), /"start_url":\s*"\/dashboard"/);
});
