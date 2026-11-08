import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { getDiagnosticSignupState } from '../src/lib/diagnosticSignup.mjs';
import { transformWithOxc } from '../node_modules/vite/dist/node/index.js';

const require = createRequire(new URL('../package.json', import.meta.url));
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const source of ['diagnostic', 'diagnostic_return']) {
  test(source + ' preserves readable context, full handoff and billing redirect', () => {
    const params = new URLSearchParams({
      source, tier: 'Estate', score: '42', challenge: 'unclear_offer',
      first_name: 'Fixture', lead_id: 'synthetic-lead',
    });
    const state = getDiagnosticSignupState(params);
    assert.deepEqual(state.diagnosticContext, {
      source, tier: 'Estate', score: '42', challenge: 'unclear_offer', first_name: 'Fixture',
    });
    assert.deepEqual(state.persistedContext, Object.fromEntries(params));
    assert.equal(state.redirectUrl, '/billing?welcome=diagnostic&tier=Estate');
    assert.equal(getDiagnosticSignupState(new URLSearchParams({ source })).redirectUrl,
      '/billing?welcome=diagnostic');
    params.set('redirect_url', '/command-center?from=diagnostic');
    assert.equal(getDiagnosticSignupState(params).redirectUrl, '/command-center?from=diagnostic');
    params.delete('redirect_url');
    params.set('tier', 'Estate & followup');
    assert.equal(getDiagnosticSignupState(params).redirectUrl,
      '/billing?welcome=diagnostic&tier=Estate%20%26%20followup');
  });
}

test('ordinary and unknown signup sources do not acquire diagnostic context', () => {
  for (const source of ['', 'other', 'diagnostic-return', 'diagnostic_return_extra']) {
    const state = getDiagnosticSignupState(new URLSearchParams({ source, tier: 'Estate' }));
    assert.equal(state.diagnosticContext, null);
    assert.equal(state.persistedContext, null);
    assert.equal(state.redirectUrl, '/command-center');
  }
});

// Exercise the actual component function with offline Clerk/router/storage doubles.
const authSource = fs.readFileSync(new URL('../src/components/Auth.jsx', import.meta.url), 'utf8');
const authAst = parse(authSource, { sourceType: 'module', plugins: ['jsx'] });
const component = authAst.program.body.find(node =>
  node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === 'SignUpPage').declaration;
const transformed = await transformWithOxc(generate(component).code, 'SignUpPage.jsx', {
  jsx: { runtime: 'classic' },
});
const componentFactory = new Function(
  'React', 'useUser', 'useMemo', 'useEffect', 'window', 'sessionStorage',
  'HAS_CLERK', 'getDiagnosticSignupState', 'Navigate', 'AuthShell', 'SignUp', 'CLERK_APPEARANCE',
  transformed.code + '; return SignUpPage;',
);

for (const source of ['diagnostic', 'diagnostic_return']) {
  for (const signedIn of [false, true]) {
    test(source + ' actual Auth component applies context, persistence and redirect; signedIn=' + signedIn, () => {
      const writes = [];
      let shellContext;
      const Component = componentFactory(
        React,
        () => ({ isSignedIn: signedIn }),
        (fn) => fn(),
        (fn) => fn(),
        { location: { search: '?source=' + source + '&tier=House&score=35&lead_id=synthetic' } },
        { setItem: (key, value) => writes.push([key, JSON.parse(value)]) },
        true,
        getDiagnosticSignupState,
        ({ to }) => React.createElement('div', { 'data-redirect': to }),
        ({ diagnosticContext, children }) => {
          shellContext = diagnosticContext;
          return React.createElement('main', null, children);
        },
        ({ forceRedirectUrl }) => React.createElement('div', { 'data-redirect': forceRedirectUrl }),
        {},
      );
      const html = renderToStaticMarkup(React.createElement(Component));
      assert.match(html, /data-redirect="\/billing\?welcome=diagnostic&amp;tier=House"/);
      assert.deepEqual(writes, [['cth_diagnostic_context', {
        source, tier: 'House', score: '35', lead_id: 'synthetic',
      }]]);
      if (!signedIn) assert.equal(shellContext.source, source);
    });
  }
}
