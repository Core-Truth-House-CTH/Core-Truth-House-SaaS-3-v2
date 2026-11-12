import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../src/pages/CommandCenterNext.jsx', import.meta.url), 'utf8');

test('consolidated-backend notice is limited to admins', () => {
  assert.match(source, /import \{ usePlan \} from "\.\.\/context\/PlanContext";/);
  assert.match(source, /const \{ isAdmin \} = usePlan\(\);/);
  assert.match(source, /dataSource === "legacy-fallback" && isAdmin/);
});

test('missing next move provides the Brand Foundation first step', () => {
  assert.match(source, /<h2>Start here: Brand Foundation<\/h2>/);
  assert.match(source, /onClick=\{\(\) => navigate\("\/brand-foundation"\)\}/);
});
