import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

const require = createRequire(import.meta.url);
const gate = fileURLToPath(new URL('../src/components/StagingApiGate.jsx', import.meta.url));
const origin = 'https://staging-api.invalid';
const valid = { MODE:'staging', CTH_STAGING_API_ORIGIN:origin, VITE_API_BASE_URL:origin, VITE_BACKEND_URL:origin, VITE_API_URL:origin };
async function render(environment) {
  const bundle = await rolldown({
    input:'fixture:entry', external:['react','react-dom/server'],
    plugins:[{name:'gate-fixture', resolveId(id){if(id==='fixture:entry')return id;},
      load(id){if(id==='fixture:entry')return {code:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Gate from ${JSON.stringify(gate)};let calls=0;function App(){calls++;return <p>Application ready</p>;}export const html=renderToStaticMarkup(<Gate><App/></Gate>);export {calls};`,moduleType:'jsx'};}}],
    transform:{define:{'import.meta.env':JSON.stringify(environment)},jsx:{runtime:'classic'}},logLevel:'silent',
  });
  try {
    const {output}=await bundle.generate({format:'cjs'});
    const module={exports:{}};
    new Function('require','module','exports',output.find(x=>x.type==='chunk').code)(require,module,module.exports);
    return module.exports;
  } finally {await bundle.close();}
}
test('missing staging configuration renders readable alert before application renders',async()=>{
  for(const key of ['CTH_STAGING_API_ORIGIN','VITE_API_BASE_URL','VITE_BACKEND_URL','VITE_API_URL']){
    const env={...valid};delete env[key];const result=await render(env);
    assert.match(result.html,/role="alert"/);
    assert.match(result.html,/This staging build is missing its API configuration/);
    assert.equal(result.calls,0);
  }
  const entry=readFileSync(new URL('../src/index.jsx',import.meta.url),'utf8');
  assert.match(entry,/<StagingApiGate>\s*<App \/>\s*<\/StagingApiGate>/);
});
test('configured staging and missing non-staging config preserve application rendering',async()=>{
  for(const env of [valid,{MODE:'production'},{MODE:'development'},{MODE:'test'}]){
    const result=await render(env);assert.equal(result.calls,1);assert.match(result.html,/Application ready/);assert.doesNotMatch(result.html,/role="alert"/);
  }
});
