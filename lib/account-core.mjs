import {validateProfile,makePlan,eligible} from '../public/fitverse/core.mjs';
export class AccountError extends Error {constructor(status,code){super(code);this.status=status;this.code=code}}
const fail=(code='invalid_data')=>{throw new AccountError(400,code)};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const short=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u0008]/.test(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v&&v>='1900-01-01'&&v<=new Date(Date.now()+864e5).toISOString().slice(0,10);
function list(v,max,fn){if(!Array.isArray(v)||v.length>max)fail();return v.map(fn)}
export function cleanState(v){
 if(!object(v)||v.version!==1||v.consent!==true||v.consentVersion!=='2026-10-19'||!validateProfile(v.profile)||v.profile.age<18||!Number.isInteger(v.profile.age)||typeof v.profile.risk!=='boolean')fail();
 const p=v.profile;if(!Array.isArray(p.allergies)||p.allergies.length>4||!p.allergies.every(x=>['milk','egg','gluten','soy'].includes(x)))fail();
 const profile={name:p.name.trim(),age:p.age,sex:p.sex,height:p.height,weight:p.weight,activity:p.activity,goal:p.goal,diet:p.diet,risk:p.risk,allergies:[...new Set(p.allergies)]};
 let plan=null;if(v.plan!==null&&v.plan!==undefined){if(!['home','gym'].includes(v.plan.place)||![2,3].includes(v.plan.days))fail();plan=makePlan(profile,v.plan.place,v.plan.days);}
 const measurements=list(v.measurements,2000,m=>{if(!object(m)||!date(m.date)||!finite(m.weight,30,300)||!(m.waist===null||finite(m.waist,40,250)))fail();return {date:m.date,weight:m.weight,waist:m.waist}});
 if(new Set(measurements.map(m=>m.date)).size!==measurements.length)fail();
 const sessions=list(v.sessions,3000,s=>{if(!object(s)||!short(s.id,80)||!date(s.date)||!Number.isInteger(s.index)||s.index<0||s.index>2||!['home','gym'].includes(s.place)||!Array.isArray(s.exercises))fail();const allowed=makePlan({...profile,age:30,risk:false,weight:80,height:180},s.place,3).sessions[0].ids;if(s.exercises.length>10||!s.exercises.every(id=>allowed.includes(id)))fail();return {id:s.id,date:s.date,index:s.index,place:s.place,exercises:s.exercises}});
 const intake=list(v.intake,5000,m=>{if(!object(m)||!short(m.uid,80)||!date(m.date)||!short(m.name,80)||!finite(m.k,0,5000)||!finite(m.p,0,500)||!finite(m.c,0,1000)||!finite(m.f,0,500))fail();return {uid:m.uid,date:m.date,name:m.name,k:m.k,p:m.p,c:m.c,f:m.f}});
 if(!object(v.water)||Object.keys(v.water).length>2000)fail();const water={};for(const [d,amount]of Object.entries(v.water)){if(!date(d)||!finite(amount,0,20000)||amount%250!==0)fail();water[d]=amount;}
 return {version:1,consent:true,consentVersion:'2026-10-19',profile,plan:eligible(profile)?plan:null,measurements,sessions,intake,water};
}
export async function hashUser(id){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('fitverse:user:'+id)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function bytesToBase64(b){let s='';for(const x of new Uint8Array(b))s+=String.fromCharCode(x);return btoa(s)}
function base64ToBytes(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function key(secret){if(!secret||!/^[a-f0-9]{64}$/i.test(secret))throw new AccountError(503,'encryption_unavailable');return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function seal(data,secret,userKey){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(userKey)},await key(secret),new TextEncoder().encode(JSON.stringify(data)));return JSON.stringify({v:1,iv:bytesToBase64(iv),data:bytesToBase64(cipher)})}
export async function unseal(payload,secret,userKey){const v=JSON.parse(payload);if(v.v!==1)throw new AccountError(503,'data_unavailable');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(v.iv),additionalData:new TextEncoder().encode(userKey)},await key(secret),base64ToBytes(v.data));return JSON.parse(new TextDecoder().decode(plain))}
