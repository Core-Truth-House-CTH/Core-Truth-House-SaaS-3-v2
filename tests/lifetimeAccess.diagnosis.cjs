/* Regression tests execute actual production access logic; no app startup/network. */
const fs = require('fs');
const assert = require('node:assert/strict');
const parser = require('/var/www/coretruthhouse-clean/node_modules/@babel/parser/lib/index.js');
const root = require('node:path').resolve(__dirname, '..');
const read = p => fs.readFileSync(`${root}/${p}`, 'utf8');
const parse = s => parser.parse(s, {sourceType:'module', plugins:['jsx']});
function nodes(ast) { const out=[]; (function walk(n) {if (!n || typeof n !== 'object') return; if(n.type) out.push(n); for(const [k,v] of Object.entries(n)) if(!['loc','start','end'].includes(k)) {if(Array.isArray(v)) v.forEach(walk); else walk(v);}})(ast); return out; }
const context = read('src/context/PlanContext.jsx');
const cn = nodes(parse(context));
const init = name => {const n=cn.find(n=>n.type==='VariableDeclarator' && n.id.name===name); return context.slice(n.init.start,n.init.end);};
const cb = cn.find(n=>n.type==='VariableDeclarator'&&n.id.name==='value').init.arguments[0].body;
const body = context.slice(cb.start+1,cb.end-1);
function access(snapshot) {
  const data=snapshot.plan_api, summary=snapshot.summary;
  const evalInit = (name, extra={}) => Function(...Object.keys({data,summary,...extra}),`return (${init(name)});`)(...Object.values({data,summary,...extra}));
  const rawPlanFromApi=evalInit('rawPlanFromApi');
  const lifetime=data.effective_access?.lifetime===true && data.effective_access?.active===true && data.effective_access?.plan==='estate';
  const plan=evalInit('resolvedPlan',{rawPlanFromApi,lifetime,activeWorkspacePlan:snapshot.workspace.plan_id});
  const rawStatus=evalInit('rawStatus');
  const env={plan,hasLifetimeAccess:lifetime,subscriptionStatus:rawStatus?String(rawStatus).toLowerCase():null,isSuperAdmin:false,isAdmin:false,userRole:'member',workspaceRole:'member',globalRole:'member',loading:false,planResolved:true,billingSummaryAvailable:true,planApiHasPlan:Boolean(rawPlanFromApi),ACTIVE_SUBSCRIPTION_STATUSES:new Set(['active','trialing']),canAccess:()=>true,getRequiredPlan:()=> 'estate',PLAN_INFO:{},fetchPlan:()=>{}};
  return Function(...Object.keys(env),body)(...Object.values(env));
}
const wallSource=read('src/components/BillingWall.jsx');
const wn=nodes(parse(wallSource));
const wall=wn.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='BillingWall');
let wallBody=wallSource.slice(wall.body.start+1,wall.body.end-1);
for(const jsx of wn.filter(n=>n.type==='JSXElement'&&n.start>wall.body.start&&n.end<wall.body.end).sort((a,b)=>b.start-a.start)) {
 const tag=jsx.openingElement.name.name; const start=jsx.start-wall.body.start-1, end=jsx.end-wall.body.start-1;
 wallBody=wallBody.slice(0,start)+JSON.stringify({component:tag})+wallBody.slice(end);
}
function wallResult(value, pathname='/command-center') {
 return Function('useUser','usePlan','useLocation','isWhitelisted','children',wallBody)(()=>({isLoaded:true,isSignedIn:true}),()=>value,()=>({pathname}),p=>['/billing'].some(a=>p===a||p.startsWith(a+'/')),'content');
}
const snapshots=JSON.parse(fs.readFileSync('/root/cth-cohort-fulfillment/tests/cohort_fulfillment/lifetime_frontend_snapshots.json'));
let checks=0;
for(const tier of ['founding','standard','ordinary']) {
 assert.equal(wallResult(access(snapshots[`${tier}:active`])),'content'); checks++;
 for(const status of ['past_due','cancelled','unpaid','trial_expired']) {
  const snapshot=snapshots[`${tier}:${status}`], result=access(snapshot);
  if(tier==='founding') {assert.equal(result.hasLifetimeAccess,true);assert.equal(result.plan,'estate');assert.equal(wallResult(result),'content');}
  else {assert.equal(result.hasLifetimeAccess,false);assert.deepEqual(wallResult(result),{component:'Navigate'});}
  assert.equal(Boolean(snapshot.workspace.cohort_lifetime_access),tier==='founding'); checks++;
 }
}
assert.equal(wallResult(access(snapshots['founding:nested_cancelled'])),'content'); checks++;
assert.equal(context.includes('activeWorkspaceName'),false); checks++;
const roleFn=cn.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='getSessionRoleState');
const roleResult=Function('normalizeRole','inferAdminFlags',`return (${context.slice(roleFn.start,roleFn.end)})({unsafeMetadata:{global_role:'SUPER_ADMIN',is_super_admin:true,is_admin:true}});`)((v,f)=>v||f,v=>({isSuperAdmin:Boolean(v.isSuperAdminFlag),isAdmin:Boolean(v.isAdminFlag)}));
assert.equal(roleResult.isSuperAdmin,false); assert.equal(roleResult.isAdmin,false);checks++;
for(const file of ['src/context/PlanContext.jsx','src/navigation/AppRouter.jsx','src/pages/CohortClaimPage.jsx','src/pages/CohortClaimEntry.jsx','src/App.jsx','src/pages/CommandCenterNext.jsx','src/pages/Billing.jsx','src/pages/CohortJoinPage.jsx','src/components/ApiClientBootstrap.jsx']) {parse(read(file));checks++;}
console.log(`${checks} lifetime access regression checks passed`);
