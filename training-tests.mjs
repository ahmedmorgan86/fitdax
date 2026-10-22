import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {trainingPrograms,validateTraining,initialTraining,equipmentOptions,requiredEquipment,alternatives,validateSet,progression,mergeSets} from './public/fitverse/training-engine.mjs';
import {RestTimer} from './public/fitverse/rest-timer.mjs';
import {exerciseIndex} from './public/fitverse/exercise-index.mjs';
import {egyptianMeals} from './public/fitverse/egyptian-meals.mjs';
import fs from 'node:fs';
const profile={age:30,weight:80,height:180,risk:false},days={2:[6,2],3:[6,1,3],4:[6,0,2,3],6:[6,0,1,2,3,4]};
for(const p of trainingPrograms){for(const s of p.sessions)for(const id of s.ids)assert.ok(Object.hasOwn(exerciseIndex,id),id);assert.equal(validateTraining({...initialTraining(),programId:p.id,experience:p.level,weekDays:days[p.sessions.length],equipment:equipmentOptions},profile,{full:true}).programId,p.id);}
const home={...initialTraining(),programId:'home-start',weekDays:[6,2]};
assert.throws(()=>validateTraining({...home,weekDays:[6,0]},profile),/rest_day_required/);
assert.throws(()=>validateTraining({...home,weekDays:[2,2]},profile),/invalid_schedule/);
assert.throws(()=>validateTraining(home,{...profile,risk:true}),/training_needs_review/);
assert.throws(()=>validateTraining({...home,programId:'five-by-five',weekDays:[6,1,3],experience:'expert',equipment:equipmentOptions},profile),/upgrade_required/);
assert.throws(()=>validateTraining({...home,experience:'__proto__'},profile),/invalid_training/);
assert.throws(()=>validateTraining(home,profile,{overrides:{'ex-squat':{enabled:false}}}),/program_unavailable/);
for(const e of alternatives('Dumbbell_Bench_Press',['body only'],'beginner'))assert.ok(requiredEquipment(e.id).every(g=>g==='body only'));
const record=(extra={})=>({id:randomUUID(),sessionId:randomUUID(),date:new Date().toISOString().slice(0,10),time:Date.now(),exerciseId:'Dumbbell_Bench_Press',reps:12,load:20,seconds:0,rpe:7,pain:false,...extra});
assert.throws(()=>validateSet(record({exerciseId:'__proto__'})),/invalid_set/);
assert.throws(()=>validateSet(record({date:'2026-02-30'})),/invalid_set/);
assert.throws(()=>validateSet(record({reps:1.5})),/invalid_set/);
assert.throws(()=>validateSet(record({rpe:11})),/invalid_set/);
assert.throws(()=>validateSet(record({reps:0,seconds:0})),/invalid_set/);
const one=validateSet(record());assert.equal(mergeSets([one],[one]).length,1);assert.throws(()=>mergeSets([one],[{...one,load:25}]),/record_conflict/);
const records=[];for(let i=0;i<2;i++){const sessionId=randomUUID();for(let j=0;j<2;j++)records.push(record({sessionId,time:Date.now()-i*864e5-j*1000}));}
assert.deepEqual(progression(records,'Dumbbell_Bench_Press',profile),{kind:'increase',load:20.5});
assert.equal(progression(records.map(r=>({...r,rpe:null})),'Dumbbell_Bench_Press',profile).kind,'hold');
assert.equal(progression(records.map(r=>({...r,pain:true})),'Dumbbell_Bench_Press',profile).kind,'stop');
assert.equal(progression(records,'Dumbbell_Bench_Press',{...profile,risk:true}).kind,'review');
assert.equal(progression(records.filter(r=>r.sessionId===records[0].sessionId),'Dumbbell_Bench_Press',profile).kind,'record');
let now=1000;const timer=new RestTimer(()=>now);timer.start(90);now+=35000;assert.equal(timer.seconds(),55);timer.pause();now+=50000;assert.equal(timer.seconds(),55);timer.resume();now+=56000;assert.equal(timer.seconds(),0);assert.throws(()=>timer.start(0),/invalid_duration/);
const reference=JSON.parse(fs.readFileSync('public/fitverse/data/egyptian-food-reference.json','utf8'));for(const recipe of reference.recipes){const meal=egyptianMeals.find(m=>m.id===recipe.id);for(const key of ['k','p','c','f'])assert.equal(meal[key],Math.round(recipe.ingredients.reduce((sum,i)=>sum+reference.foods.find(f=>f.id===i.fdcId).per100g[key]*i.grams/100,0)*10)/10);}
console.log('Training: 12 templates, schedule/equipment/access gates, record validation, conservative progression, timer and 6 recipe calculations passed.');
