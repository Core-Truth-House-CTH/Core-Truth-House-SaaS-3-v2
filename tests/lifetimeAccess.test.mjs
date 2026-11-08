import assert from 'node:assert/strict';
import { verifiedLifetimeAccess, claimCohortSeat } from '../src/lib/lifetimeAccess.mjs';
let checks = 0;
for (const payload of [null, {}, {lifetime:true}, {plan:'estate', lifetime:true, active:false}, {plan:'estate', lifetime:'true', active:true}, {plan:'standard', lifetime:true, active:true}]) {
  assert.equal(verifiedLifetimeAccess(payload), false); checks++;
}
assert.equal(verifiedLifetimeAccess({plan:'estate', lifetime:true, active:true}),true); checks++;
for (const failure of ['post','workspaces','plan',null]) {
  const calls=[];
  const run=()=>claimCohortSeat({token:'synthetic/token',workspaceId:'ws_synthetic',post:async(path,body)=>{calls.push('post');assert.equal(path,'/api/cohort/invite/redeem');assert.deepEqual(body,{token:'synthetic/token',workspace_id:'ws_synthetic'});if(failure==='post')throw Error('failure');return{success:true,workspace_id:'ws_synthetic'};},refreshWorkspaces:async()=>{calls.push('workspaces');if(failure==='workspaces')throw Error('failure');},refreshPlan:async()=>{calls.push('plan');return failure==='plan'?null:{plan:'estate'};}});
  if (failure) await assert.rejects(run); else await run();
  assert.deepEqual(calls, failure==='post'?['post']:failure==='workspaces'?['post','workspaces']:['post','workspaces','plan']); checks++;
}
console.log(`${checks} lifetime helper checks passed`);

for (const result of [{success:false}, {success:true,workspace_id:'another_workspace'}, {success:1,workspace_id:'ws_synthetic'}]) {
 let refreshed=false;await assert.rejects(()=>claimCohortSeat({token:'synthetic',workspaceId:'ws_synthetic',post:async()=>result,refreshWorkspaces:async()=>{refreshed=true},refreshPlan:async()=>({})}));assert.equal(refreshed,false);checks++;
}
console.log(`${checks} total lifetime helper checks passed`);
