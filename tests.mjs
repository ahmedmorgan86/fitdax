import assert from 'node:assert/strict';
import {exercises,food,eligible,calories,makePlan,mealPlan,validateProfile,fresh,dateKey} from './public/fitverse/core.mjs';
const p={name:'Test',age:30,sex:'male',height:180,weight:80,activity:'low',goal:'maintain',diet:'all',allergies:[],risk:false};
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name)}
test('Valid profile accepted; impossible inputs rejected',()=>{assert(validateProfile(p));for(const patch of [{weight:NaN},{height:0},{age:12},{sex:'bad'},{name:' '},{activity:'bad'},{diet:'bad'}])assert(!validateProfile({...p,...patch}));});
test('Mifflin calculation and conservative goal adjustments',()=>{assert.equal(calories(p).bmr,1780);assert.equal(calories(p).target,2136);assert.equal(calories({...p,goal:'lose'}).target,1922);assert.equal(calories({...p,goal:'gain'}).target,2243);assert.equal(calories({...p,sex:'female'}).bmr,1614)});
test('Safety gate blocks children, older adults, low BMI, flagged conditions',()=>{for(const patch of [{age:17},{age:65},{risk:true},{weight:45}]){assert(!eligible({...p,...patch}));assert.equal(calories({...p,...patch}),null);assert.equal(makePlan({...p,...patch}),null)}});
test('Home and gym plans include only appropriate library entries',()=>{for(const place of ['home','gym'])for(const days of [2,3]){const plan=makePlan(p,place,days);assert.equal(plan.sessions.length,days);for(const s of plan.sessions)for(const id of s.ids)assert.equal(exercises.find(e=>e.id===id).place,place);assert(plan.sessions[1].day-plan.sessions[0].day>=2)}});
test('Allergen filters hold over all weekly meal suggestions',()=>{for(let day=0;day<7;day++)for(const a of ['milk','egg','gluten','soy'])for(const m of mealPlan({...p,allergies:[a]},day))assert(!m.allergens.includes(a))});
test('Vegan meals exclude animal ingredients',()=>{for(let day=0;day<7;day++)for(const m of mealPlan({...p,diet:'vegan'},day))assert(m.vegan)});
test('Low energy outputs are withheld rather than prescribed',()=>{assert.equal(calories({...p,age:64,sex:'female',height:120,weight:30}),null);assert.equal(calories({...p,age:64,height:130,weight:33}),null)});
test('Unknown media is never represented as licensed content',()=>{for(const e of exercises){assert.equal(e.media.video,null);assert.equal(e.media.image,null);assert.equal(e.media.reviewed,false)}});
test('No fabricated logs or progress',()=>{const s=fresh();assert.equal(s.profile,null);for(const k of ['sessions','intake','measurements'])assert.deepEqual(s[k],[])});
test('Local date keys and food numeric records',()=>{assert.equal(dateKey(new Date(2026,9,19)),'2026-10-19');for(const m of food)for(const k of ['k','p','c','f'])assert(Number.isFinite(m[k])&&m[k]>=0)});
console.log(`${checks} domain checks passed.`);
