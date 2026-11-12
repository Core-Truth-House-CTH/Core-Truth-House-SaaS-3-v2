// Verify public offer artifacts; no app startup, environment files or network.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let checks=0;
const landing=read('src/pages/estate/EstateCohortPage.jsx');
const apply=read('src/pages/CohortApplyPage.jsx');
const metadata=read('scripts/inject-static-route-metadata.mjs');
for(const source of [landing,apply,metadata]){
 assert.match(source,/\$495 USD/);assert.match(source,/one-time/i);assert.match(source,/lifetime.*Estate|lifetime access to Estate/i);assert.match(source,/self-paced/i);assert.match(source,/written instructor feedback/i);assert.match(source,/90-day feedback window/i);assert.match(source,/Non-refundable/i);checks++;
}
for(const source of [landing,apply,metadata]){
 assert.doesNotMatch(source,/12-Week Live Cohort|four live sessions|Four live sessions|Direct access to brand strategists|Payment Plans Available|short call invitation|high-touch|entirely self-paced and AI-guided|human-led coaching/);checks++;
}
assert.match(apply,/STANDARD_UNAVAILABLE/);assert.match(metadata,/Standard enrollment is not currently available/);checks++;
// Approved automatic enrollment supersedes the earlier undecided policy wording.
assert.match(landing,/initially <em>12 seats<\/em>/);assert.match(apply,/accepted automatically/);assert.match(apply,/No referral is required/);assert.doesNotMatch(apply,/8 founders|In exchange|reviewed by hand/);checks++;
const welcome=read('src/pages/CohortWelcomePage.jsx');
assert.doesNotMatch(welcome,/apiClient|useSearchParams|URLSearchParams|Payment received|Your seat is confirmed/);
assert.match(welcome,/data-payment-state="unverifiable"/);checks++;
assert.doesNotMatch(read('src/pages/ScorecardPage.jsx'),/positioning in 14 days/);checks++;
console.log(`${checks} cohort offer/confirmation checks passed`);
