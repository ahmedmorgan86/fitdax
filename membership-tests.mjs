import assert from 'node:assert/strict';
import {hasProgramAccess,requiredPlan} from './public/fitverse/memberships.mjs';
import {trainingPrograms,validateTraining,initialTraining,equipmentOptions} from './public/fitverse/training-engine.mjs';
import {membershipOffers} from './lib/membership-offers.mjs';
import {checkoutIntent,checkoutDestination} from './public/fitverse/checkout-intent.mjs';
const plans=['free','pro','premium'].map(id=>({id}));assert.deepEqual(membershipOffers(plans).map(x=>x.programs.length),[5,9,12]);
for(const p of trainingPrograms){for(const tier of ['free','pro','premium']){const options={...initialTraining(),programId:p.id,experience:p.level,weekDays:({2:[6,2],3:[6,1,3],4:[6,0,2,3],6:[6,0,1,2,3,4]})[p.sessions.length],equipment:equipmentOptions};const check=()=>validateTraining(options,{age:30,height:180,weight:80,risk:false},{tier,full:true});if(hasProgramAccess(p.id,{tier}))assert.equal(check().programId,p.id);else assert.throws(check,/upgrade_required/);}assert.ok(hasProgramAccess(p.id,{role:'admin',tier:'admin'}));}
assert.equal(hasProgramAccess('five-by-five',{tier:'pro',full:true}),false);assert.equal(hasProgramAccess('five-by-five',{tier:'__proto__'}),false);
const intent=checkoutIntent('?plan=premium&period=annual',1000);assert.equal(checkoutDestination(JSON.stringify(intent),2000),'payments.html?plan=premium&period=annual');assert.equal(checkoutDestination(JSON.stringify(intent),2000000),null);assert.equal(checkoutIntent('?plan=https://evil.example'),null);assert.equal(checkoutDestination('{'),null);
console.log('PASS 5/9/12 cumulative program entitlements, server validation for every tier, admin bypass and allowlisted expiring checkout intent.');
