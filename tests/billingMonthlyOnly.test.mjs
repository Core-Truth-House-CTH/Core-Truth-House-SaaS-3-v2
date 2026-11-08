import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {transformWithOxc} from '../node_modules/vite/dist/node/index.js';
const require=createRequire(new URL('../package.json',import.meta.url));
const {parse}=require('@babel/parser');const generate=require('@babel/generator').default;
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const text=fs.readFileSync(new URL('../src/pages/Billing.jsx',import.meta.url),'utf8');const ast=parse(text,{sourceType:'module',plugins:['jsx']});
const selected=ast.program.body.filter(n=>n.type==='VariableDeclaration'||(n.type==='FunctionDeclaration'&&['PlanCard','CheckoutWall','StatusBanner'].includes(n.id.name)));
const transformed=await transformWithOxc(selected.map(n=>generate(n).code).join('\n'),'Billing.jsx',{jsx:{runtime:'classic'}});
const ui=new Function('React',transformed.code+';return {PlanCard,CheckoutWall};')(React);
const plan={id:'estate',name:'Estate',monthly_price_cents:69700,annual_price_cents:697000,monthly_credits:1200,annual_credits:14400};
for(const html of [renderToStaticMarkup(React.createElement(ui.PlanCard,{plan,onSelect:()=>{}})),renderToStaticMarkup(React.createElement(ui.CheckoutWall,{plans:[plan],checkoutBusy:null,onSelectPlan:()=>{},onSignOut:()=>{}}))]){assert.match(html,/697/);assert.doesNotMatch(html,/6970|14400|Annual|Monthly|\/yr|\/year/);}
assert.doesNotMatch(text,/setBillingCycle|annual_price_cents|annual_credits/);
const billing=ast.program.body.find(n=>n.type==='ExportDefaultDeclaration').declaration;
const start=billing.body.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[]).find(n=>n.id.name==='startSubscriptionCheckout').init;
const calls=[];const fn=new Function('setCheckoutBusy','setStatus','apiClient','API_PATHS','window','return ('+generate(start).code+');')(()=>{},()=>{},{post:async(path,body)=>{calls.push({path,body});return{checkout_url:'https://checkout.stripe.com/c/pay/cs_test_synthetic'};}},{billing:{checkoutSubscription:'/api/billing/checkout/subscription'}},{location:{origin:'https://synthetic.invalid',assign:()=>{}}});
await fn('estate');assert.equal(calls.length,1);assert.deepEqual(calls[0].body,{plan_id:'estate',billing_cycle:'monthly',origin_url:'https://synthetic.invalid'});
console.log('Billing monthly-only: rendered cards/wall and actual checkout handler PASS');
