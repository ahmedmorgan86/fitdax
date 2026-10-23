import {eligible} from './core.mjs';
import {trainingPrograms,requiredEquipment,alternatives,progression} from './training-engine.mjs';
import {hasProgramAccess} from './memberships.mjs';
import {egyptianMeals} from './egyptian-meals.mjs';
const ranks={beginner:0,intermediate:1,expert:2};
const dayBefore=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10)};
export function quickWorkout({profile,settings,access,minutes,place='home',records=[],overrides={},today}){
 if(!eligible(profile))throw Error('training_needs_review');
 if(!['home','gym'].includes(place)||![10,20,30,45].includes(minutes)||!Object.hasOwn(ranks,settings?.experience)||!Array.isArray(settings.equipment))throw Error('invalid_training');
 const pain=new Set(records.filter(r=>r.pain&&r.date>=dayBefore(today,13)&&r.date<=today).map(r=>r.exerciseId));
 // A pain flag blocks automatic session generation; an alternative is not injury treatment.
 if(pain.size)throw Error('pain_review');
 const candidates=trainingPrograms.filter(p=>p.place===place&&hasProgramAccess(p.id,access)&&ranks[p.level]<=ranks[settings.experience]&&overrides['train-'+p.id]?.enabled!==false);
 const ids=[];
 for(const p of candidates)for(const original of p.sessions[0].ids){
  const pool=[original,...alternatives(original,settings.equipment,settings.experience).map(e=>e.id)];
  const chosen=pool.find(id=>overrides['ex-'+id]?.enabled!==false&&requiredEquipment(id).every(g=>settings.equipment.includes(g)));
  if(chosen&&!ids.includes(chosen))ids.push(chosen);
 }
 // Conservative planning estimate: 5 min warm-up, 2 min cool-down, 2 min per set including rest.
 const sets=minutes>=30?2:1,count=Math.min(5,Math.floor((minutes-7)/(sets*2))),selected=ids.slice(0,count);
 if(!selected.length)throw Error('equipment_required');
 return {index:0,weekDay:null,ar:'جلسة حسب وقتك',en:'Your time-based session',ids:selected,sets,minReps:6,maxReps:10,rest:90,estimatedMinutes:7+selected.length*sets*2,requestedMinutes:minutes};
}
export function weeklySummary(records,settings,profile,today,{partial=false}={}){
 const start=dayBefore(today,6),previousStart=dayBefore(today,13);
 const current=records.filter(r=>r.date>=start&&r.date<=today),previous=records.filter(r=>r.date>=previousStart&&r.date<start);
 const summarize=rows=>({sets:rows.length,sessions:new Set(rows.map(r=>r.sessionId)).size,days:new Set(rows.map(r=>r.date)).size,volume:Math.round(rows.reduce((n,r)=>n+r.reps*r.load,0)),pain:rows.some(r=>r.pain)});
 const now=summarize(current),before=summarize(previous),plannedDays=settings?.weekDays?.length||0;
 return {start,end:today,now,before,plannedDays,partial,advice:now.pain?'stop':!eligible(profile)?'review':!now.sets?'start':now.days<plannedDays?'consistency':'maintain',exercises:[...new Set(current.map(r=>r.exerciseId))].map(id=>({id,tip:progression(records,id,profile)}))};
}
export function availableRecipes(catalogFoods=egyptianMeals){
 return egyptianMeals.flatMap(base=>{const current=catalogFoods.find(m=>m.id===base.id);return current&&current.ingredientsAr===base.ingredientsAr&&current.ingredientsEn===base.ingredientsEn?[{...base,ar:current.ar,en:current.en,vegan:base.vegan&&current.vegan,allergens:[...new Set([...base.allergens,...current.allergens])]}]:[]});
}
export function shoppingList(selections,reference,profile,catalogFoods=egyptianMeals){
 if(!Array.isArray(selections)||selections.length>6)throw Error('invalid_meals');
 const totals=new Map(),seen=new Set();
 for(const {id,servings} of selections){
  if(seen.has(id)||!Number.isInteger(servings)||servings<0||servings>14)throw Error('invalid_meals');seen.add(id);
  const meal=availableRecipes(catalogFoods).find(m=>m.id===id),recipe=reference.recipes.find(m=>m.id===id);
  if(!meal||!recipe)throw Error('invalid_meals');
  if(servings&&((profile.diet==='vegan'&&!meal.vegan)||meal.allergens.some(a=>(profile.allergies||[]).includes(a))))throw Error('meal_restricted');
  for(const item of recipe.ingredients)totals.set(item.fdcId,(totals.get(item.fdcId)||0)+item.grams*servings);
 }
 return [...totals].filter(([,grams])=>grams>0).map(([id,grams])=>({id,grams:Math.round(grams*10)/10,en:reference.foods.find(f=>f.id===id)?.description||String(id)}));
}
