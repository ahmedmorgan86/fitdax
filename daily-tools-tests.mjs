import assert from 'node:assert/strict';
import fs from 'node:fs';
import {quickWorkout,weeklySummary,shoppingList,availableRecipes} from './public/fitverse/daily-tools.mjs';
import {toolsView} from './public/fitverse/daily-tools-ui.mjs';
import {egyptianMeals} from './public/fitverse/egyptian-meals.mjs';
import {requiredEquipment,trainingPrograms} from './public/fitverse/training-engine.mjs';
const profile={age:30,height:175,weight:75,risk:false,diet:'all',allergies:[]},settings={experience:'beginner',equipment:['body only'],weekDays:[1,4]},access={tier:'free',role:'member'},today='2026-10-23';
const input={profile,settings,access,today,minutes:20};
for(const minutes of [10,20,30,45]){const s=quickWorkout({...input,minutes});assert(s.estimatedMinutes<=minutes);assert(s.ids.length>0);assert.equal(new Set(s.ids).size,s.ids.length);for(const id of s.ids)assert(requiredEquipment(id).every(g=>settings.equipment.includes(g)));}
assert.throws(()=>quickWorkout({...input,profile:{...profile,risk:true}}),/training_needs_review/);
assert.throws(()=>quickWorkout({...input,minutes:12}),/invalid_training/);
assert.throws(()=>quickWorkout({...input,settings:{...settings,equipment:[]}}),/equipment_required/);
assert.throws(()=>quickWorkout({...input,records:[{pain:true,date:'2026-10-10',exerciseId:'wall'}]}),/pain_review/);
assert.doesNotThrow(()=>quickWorkout({...input,records:[{pain:true,date:'2026-10-09',exerciseId:'wall'}]}));
assert.throws(()=>quickWorkout({...input,overrides:Object.fromEntries(trainingPrograms.map(p=>['train-'+p.id,{enabled:false}]))}),/equipment_required/);
assert.throws(()=>quickWorkout({...input,access:{tier:'unknown'}}),/equipment_required/);
assert(!quickWorkout({...input,overrides:{'ex-wall':{enabled:false}}}).ids.includes('wall'));
const rows=[{id:'a',date:'2026-10-23',sessionId:'one',exerciseId:'wall',reps:10,load:0,pain:false,time:1},{id:'b',date:'2026-10-22',sessionId:'two',exerciseId:'wall',reps:8,load:10,pain:false,time:2},{id:'c',date:'2026-10-16',sessionId:'older',exerciseId:'wall',reps:8,load:10,pain:true,time:3},{id:'d',date:'2026-10-24',sessionId:'future',exerciseId:'wall',reps:8,load:10,pain:true,time:4}];
const report=weeklySummary(rows,settings,profile,today);assert.equal(report.now.sets,2);assert.equal(report.now.volume,80);assert.equal(report.before.sets,1);assert.equal(report.now.pain,false);assert.equal(report.now.days,2);assert.equal(report.advice,'maintain');assert.equal(weeklySummary([],settings,profile,today).advice,'start');
const reference=JSON.parse(fs.readFileSync('public/fitverse/data/egyptian-food-reference.json'));
const list=shoppingList([{id:'egypt-foul',servings:2},{id:'egypt-eggs',servings:1}],reference,profile);assert.equal(list.find(r=>r.id===170457).grams,350);assert.equal(list.find(r=>r.id===174916).grams,180);
for(const servings of [-1,.5,15,NaN])assert.throws(()=>shoppingList([{id:'egypt-foul',servings}],reference,profile),/invalid_meals/);
assert.throws(()=>shoppingList([{id:'egypt-eggs',servings:1}],reference,{...profile,diet:'vegan'}),/meal_restricted/);
assert.throws(()=>shoppingList([{id:'egypt-foul',servings:1}],reference,{...profile,allergies:['gluten']}),/meal_restricted/);
assert.deepEqual(shoppingList([],reference,profile),[]);
assert.equal(availableRecipes([]).length,0);
const edited=structuredClone(egyptianMeals);edited[0].ingredientsAr='وصفة معدّلة';assert(!availableRecipes(edited).some(m=>m.id===edited[0].id));
for(const language of ['ar','en']){const t=(ar,en)=>language==='ar'?ar:en;const html=toolsView({live:{sets:[],profile:{...profile,diet:'vegan'},settings,nextCursor:null},t,today,gearAr:{},catalogFoods:egyptianMeals});assert(html.includes('quick-form'));assert(html.includes('shopping-form'));assert(!html.includes('name="egypt-eggs"'));assert(html.includes(language==='ar'?'تقرير آخر 7 أيام':'Last 7 days'));}
console.log('PASS time/equipment/plan/disabled-content/pain gates, weekly date boundaries and actual logs, exact combined ingredient weights and allergy/vegan restrictions.');
