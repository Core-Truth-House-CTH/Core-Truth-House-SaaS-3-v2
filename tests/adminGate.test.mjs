import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../src/admin/AdminProtectedRoute.jsx', import.meta.url), 'utf8');

test('admin gate relies only on the server-verified role', () => {
  assert.match(source, /\/api\/admin\/me/);
  for (const forbidden of ['publicMetadata', 'unsafeMetadata', 'privateMetadata', 'owner_id', 'updated_by_role', 'admin_notes', 'super administrator', 'usePlan', '/api/workspaces/mine']) {
    assert.ok(!source.includes(forbidden), forbidden + ' must not influence admin access');
  }
});

test('admin denial page shows no role or workspace debug details', () => {
  for (const forbidden of ['Plan role', 'Global role', 'Workspace role', 'Matched workspace', 'Workspace owner', 'updated_by_role']) {
    assert.ok(!source.includes(forbidden), forbidden);
  }
});
