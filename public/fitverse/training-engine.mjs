import {exerciseIndex} from './exercise-index.mjs';
import {eligible} from './core.mjs';

const session=(ar,en,ids)=>({ar,en,ids});
const home=session('الجسم بالكامل','Full body',['squat','wall','bridge','bird','march']);
const machine=session('الجسم بالكامل بالأجهزة','Machine full body',['Leg_Press','Leverage_Chest_Press','Seated_Cable_Rows','Wide-Grip_Lat_Pulldown']);
const upper=session('الجزء العلوي','Upper body',['Dumbbell_Bench_Press','Seated_Cable_Rows','Standing_Dumbbell_Press','Wide-Grip_Lat_Pulldown','Dumbbell_Bicep_Curl']);
const lower=session('الجزء السفلي','Lower body',['Leg_Press','Dumbbell_Lunges','Lying_Leg_Curls','Standing_Calf_Raises','Plank']);
const push=session('الدفع','Push',['Dumbbell_Bench_Press','Standing_Dumbbell_Press','Standing_Dumbbell_Triceps_Extension']);
const pull=session('السحب','Pull',['Wide-Grip_Lat_Pulldown','Seated_Cable_Rows','Dumbbell_Bicep_Curl']);
const dumbbell=session('قوة بالدمبل','Dumbbell full body',['Dumbbell_Squat','Dumbbell_Bench_Press','Bent_Over_Two-Dumbbell_Row','Dumbbell_Lunges','Plank']);
const strength=session('قوة أساسية','Strength basics',['Barbell_Squat','Barbell_Bench_Press_-_Medium_Grip','Seated_Cable_Rows']);
const program=(id,ar,en,place,level,sessions,options={})=>({id,ar,en,place,level,sessions,sets:2,minReps:8,maxReps:12,rest:90,paid:false,...options});
export const trainingPrograms=[
 program('home-start','بداية المنزل','Home foundations','home','beginner',[home,home],{sets:1}),
 program('gym-start','بداية الأجهزة','Machine foundations','gym','beginner',[machine,machine],{sets:1}),
 program('full-body-three','الجسم بالكامل — 3 أيام','Full body — 3 days','gym','beginner',[machine,upper,lower]),
 program('dumbbell-three','الدمبل — 3 أيام','Dumbbells — 3 days','home','intermediate',[dumbbell,dumbbell,dumbbell],{paid:true}),
 program('upper-lower-four','علوي / سفلي — 4 أيام','Upper / lower — 4 days','gym','intermediate',[upper,lower,upper,lower],{paid:true}),
 program('ppl-three','دفع / سحب / أرجل','Push / pull / legs','gym','intermediate',[push,pull,lower],{sets:3,paid:true}),
 program('ppl-six','دفع / سحب / أرجل — 6 أيام','Push / pull / legs — 6 days','gym','expert',[push,pull,lower,push,pull,lower],{paid:true}),
 program('strength-three','أساس القوة — 3 × 5','Strength foundations — 3 × 5','gym','intermediate',[strength,strength,strength],{sets:3,minReps:5,maxReps:5,rest:150,paid:true}),
 program('five-by-five','القوة — 5 × 5','Strength — 5 × 5','gym','expert',[strength,strength,strength],{sets:5,minReps:5,maxReps:5,rest:180,paid:true}),
 program('home-circuit','دائرة منزلية منخفضة الصدمات','Low-impact home circuit','home','beginner',[home,home],{sets:1,minReps:6,maxReps:10,rest:60}),
 program('hypertrophy-four','بناء العضلات — 4 أيام','Muscle building — 4 days','gym','intermediate',[upper,lower,upper,lower],{sets:3,minReps:8,maxReps:12,rest:120,paid:true}),
 program('return-two','العودة الهادئة — يومان','Gentle return — 2 days','home','beginner',[home,home],{sets:1,minReps:5,maxReps:8})
];
export const trainingSource='https://acsm.org/resistance-training-guidelines-update-2026/';
const levels={beginner:0,intermediate:1,expert:2};
export const equipmentOptions=['body only','bands','dumbbell','barbell','machine','cable','kettlebells','exercise ball','pull-up bar','bench','other'];
const equipmentFor=e=>['Pullups','Chin-Up'].includes(e.id)?'pull-up bar':e.equipment;
export const requiredEquipment=id=>[equipmentFor(exerciseIndex[id]),...(/Bench|Lying_Leg_Curls/.test(id)&&exerciseIndex[id].equipment==='dumbbell'?['bench']:[])];
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const invalid=code=>{throw Error(code)};
// Curated movement families avoid treating any exercise for the same muscle as an equivalent.
const families=[
 ['squat','Bodyweight_Squat','Dumbbell_Squat','Barbell_Squat','Goblet_Squat','Leg_Press','legpress'],
 ['wall','Incline_Push-Up','Pushups','Leverage_Chest_Press','press','Dumbbell_Bench_Press','Barbell_Bench_Press_-_Medium_Grip'],
 ['bridge','Butt_Lift_Bridge','Barbell_Glute_Bridge'],
 ['bird','Plank','Side_Bridge'],
 ['march','Walking_Treadmill','Bicycling_Stationary','bike'],
 ['row','Seated_Cable_Rows','Bent_Over_Two-Dumbbell_Row','One_Arm_Dumbbell_Row'],
 ['pulldown','Wide-Grip_Lat_Pulldown','Underhand_Cable_Pulldowns','Close-Grip_Front_Lat_Pulldown'],
 ['Standing_Dumbbell_Press','Seated_Dumbbell_Press','Machine_Shoulder_Military_Press'],
 ['Dumbbell_Lunges','Barbell_Lunge','Dumbbell_Rear_Lunge'],
 ['Lying_Leg_Curls','Seated_Leg_Curl'],
 ['Standing_Calf_Raises','Seated_Calf_Raise'],
 ['Dumbbell_Bicep_Curl','Barbell_Curl','Hammer_Curls'],
 ['Standing_Dumbbell_Triceps_Extension','Seated_Triceps_Press','Triceps_Pushdown']
];
export function alternatives(id,equipment,level='beginner'){
 const current=Object.hasOwn(exerciseIndex,id)&&exerciseIndex[id];if(!current||!Array.isArray(equipment))return [];
 const family=families.find(f=>f.includes(id));if(!family)return [];
 return family.filter(other=>other!==id&&Object.hasOwn(exerciseIndex,other)).map(other=>exerciseIndex[other]).filter(e=>requiredEquipment(e.id).every(item=>equipment.includes(item))&&levels[e.level]<=levels[level]).sort((a,b)=>levels[a.level]-levels[b.level]||a.name.localeCompare(b.name));
}
export function initialTraining(){return {version:1,programId:null,experience:'beginner',weekDays:[],equipment:['body only'],substitutions:{}}}
export function validateTraining(v,profile,{full=false,overrides={}}={}){
 if(!object(v)||v.version!==1||!Object.hasOwn(levels,v.experience)||!Array.isArray(v.equipment)||v.equipment.length>equipmentOptions.length||!v.equipment.every(e=>equipmentOptions.includes(e))||!object(v.substitutions))invalid('invalid_training');
 const out={version:1,programId:v.programId,experience:v.experience,weekDays:[],equipment:[...new Set(v.equipment)],substitutions:{}};
 if(v.programId===null)return {...out,substitutions:{}};
 const p=trainingPrograms.find(p=>p.id===v.programId);if(!p||overrides['train-'+p.id]?.enabled===false)invalid('program_unavailable');
 if(!eligible(profile))invalid('training_needs_review');
 if(p.paid&&!full)invalid('upgrade_required');
 if(levels[v.experience]<levels[p.level])invalid('experience_required');
 if(!Array.isArray(v.weekDays)||v.weekDays.length!==p.sessions.length||new Set(v.weekDays).size!==v.weekDays.length||!v.weekDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6))invalid('invalid_schedule');
 out.weekDays=[...v.weekDays];
 // Full-body plans require a rest day between sessions, including across week boundaries.
 if(['home-start','gym-start','full-body-three','dumbbell-three','strength-three','five-by-five','home-circuit','return-two'].includes(p.id)){
  const sorted=[...out.weekDays].sort((a,b)=>a-b);if(sorted.some((d,i)=>(sorted[(i+1)%sorted.length]-d+7)%7<2))invalid('rest_day_required');
 }
 if(Object.keys(v.substitutions).length>40)invalid('invalid_substitution');
 for(const [key,id] of Object.entries(v.substitutions)){
  if(!/^\d:\d$/.test(key)||typeof id!=='string')invalid('invalid_substitution');
  const [si,ei]=key.split(':').map(Number),base=p.sessions[si]?.ids[ei];
  if(!base||!alternatives(base,out.equipment,p.level).some(e=>e.id===id))invalid('invalid_substitution');out.substitutions[key]=id;
 }
 for(const [si,session]of p.sessions.entries())for(const [ei,id]of session.ids.entries()){const chosen=out.substitutions[si+':'+ei]||id;if(overrides['ex-'+chosen]?.enabled===false)invalid('program_unavailable');if(!requiredEquipment(chosen).every(item=>out.equipment.includes(item)))invalid('equipment_required');}
 return out;
}
export function plannedSessions(settings){const p=trainingPrograms.find(p=>p.id===settings.programId);return p?p.sessions.map((s,i)=>({...s,index:i,weekDay:settings.weekDays[i],ids:s.ids.map((id,j)=>settings.substitutions[i+':'+j]||id),sets:p.sets,minReps:p.minReps,maxReps:p.maxReps,rest:p.rest})):[]}
export function validateSet(v){
 const date=typeof v?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)?new Date(v.date+'T12:00:00Z'):null;
 if(!object(v)||!uuid(v.id)||!uuid(v.sessionId)||!Number.isSafeInteger(v.time)||v.time<946684800000||v.time>Date.now()+864e5||!Object.hasOwn(exerciseIndex,v.exerciseId)||!date||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==v.date||v.date<'2000-01-01'||date.getTime()>Date.now()+864e5||!Number.isInteger(v.reps)||v.reps<0||v.reps>100||!Number.isFinite(v.load)||v.load<0||v.load>500||!Number.isInteger(v.seconds)||v.seconds<0||v.seconds>3600||(!v.reps&&!v.seconds)||!(v.rpe===null||Number.isInteger(v.rpe)&&v.rpe>=1&&v.rpe<=10)||typeof v.pain!=='boolean')invalid('invalid_set');
 return {id:v.id,sessionId:v.sessionId,date:v.date,time:v.time,exerciseId:v.exerciseId,reps:v.reps,load:v.load,seconds:v.seconds,rpe:v.rpe,pain:v.pain};
}
export function progression(records,id,profile,{maxReps=12,sets=2}={}){
 if(!eligible(profile))return {kind:'review'};
 const entries=records.filter(r=>r.exerciseId===id).sort((a,b)=>b.date.localeCompare(a.date)||b.time-a.time);
 if(entries.slice(0,sets).some(r=>r.pain))return {kind:'stop'};
 const groups=[...new Set(entries.map(r=>r.sessionId))].slice(0,2).map(key=>entries.filter(r=>r.sessionId===key));
 if(groups.length<2||groups.some(g=>g.length<sets))return {kind:'record'};
 if(groups.flat().some(r=>r.pain||r.rpe===null||r.rpe>8))return {kind:'hold'};
 const load=groups[0][0].load;if(!groups.every(g=>g.every(r=>r.reps>=maxReps&&r.load===load)))return {kind:'reps',maxReps};
 if(!load)return {kind:'form'};
 const increase=Math.min(2.5,load*.025),next=Math.floor((load+increase)*2)/2;
 return next>load?{kind:'increase',load:next}:{kind:'hold'};
}
export function mergeSets(existing,incoming){const m=new Map(existing.map(s=>[s.id,s]));for(const row of incoming){const v=validateSet(row),old=m.get(v.id);if(old&&JSON.stringify(old)!==JSON.stringify(v))invalid('record_conflict');m.set(v.id,v)}return [...m.values()]}
