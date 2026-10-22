import {egyptianMeals} from './egyptian-meals.mjs';
export const exercises = [
 ['squat','سكوات إلى كرسي','Chair squat','home','legs','قف أمام كرسي ثابت، ادفع الوركين للخلف ثم قف ببطء. حافظ على ثبات الركبتين.','Use a stable chair. Sit back slowly, then stand. Keep knees steady.'],
 ['wall','ضغط الحائط','Wall push-up','home','upper','ضع اليدين على الحائط، اثن المرفقين ببطء ثم ادفع.','Place hands on a wall. Bend elbows slowly, then push away.'],
 ['bridge','رفع الحوض','Glute bridge','home','legs','استلق مع ثني الركبتين. ارفع الحوض دون تقويس الظهر.','Lie with knees bent. Lift hips without arching your back.'],
 ['bird','بيرد دوج','Bird dog','home','core','من وضع الأربع، مد ذراعًا والساق المقابلة مع ثبات الجذع.','From all fours, extend opposite arm and leg, keeping your trunk steady.'],
 ['march','مشي في المكان','March in place','home','cardio','امش بوتيرة يمكنك خلالها الكلام، بجانب سطح ثابت عند الحاجة.','March at a pace where you can talk, near a stable support if needed.'],
 ['row','سحب الجهاز','Seated cable row','gym','upper','اضبط الجهاز مع مدرب. اسحب إلى الجذع بظهر محايد ودون تأرجح.','Set up with a trainer. Pull toward your torso with a neutral back and no swinging.'],
 ['press','دفع الصدر بالجهاز','Machine chest press','gym','upper','اضبط المقعد والمقابض مع مدرب. ادفع ببطء دون قفل المرفقين.','Ask a trainer to set seat and handles. Press slowly without locking elbows.'],
 ['legpress','دفع الأرجل بالجهاز','Leg press','gym','legs','اضبط الجهاز مع مدرب، استخدم حملًا خفيفًا ومدى مريحًا دون قفل الركبتين.','Set up with a trainer. Use a light load and comfortable range without locking knees.'],
 ['bike','دراجة ثابتة','Stationary bike','gym','cardio','اضبط المقعد، ابدأ بمقاومة خفيفة ووتيرة تسمح بالكلام.','Adjust the seat. Start with light resistance at a conversational pace.'],
 ['pulldown','سحب علوي','Lat pulldown','gym','upper','اسحب أمام الجسم إلى أعلى الصدر ببطء. لا تسحب خلف الرقبة.','Pull slowly in front of your body to the upper chest, never behind your neck.']
].map(([id,ar,en,place,group,arCue,enCue])=>({id,ar,en,place,group,arCue,enCue,media:{image:null,video:null,creator:null,license:null,licenseUrl:null,sourceUrl:null,reviewed:false}}));
export const food = [
 ...egyptianMeals,
 {id:'oats',ar:'شوفان وموز وبذور',en:'Oats, banana & seeds',k:420,p:13,c:66,f:12,allergens:['gluten'],vegan:true,ingredientsAr:'60 جم شوفان، موزة، 15 جم بذور، ماء',ingredientsEn:'60 g oats, banana, 15 g seeds, water'},
 {id:'eggs',ar:'بيض وخبز وخضار',en:'Eggs, toast & vegetables',k:390,p:24,c:38,f:16,allergens:['egg','gluten'],vegan:false,ingredientsAr:'بيضتان، شريحتا خبز، خضار',ingredientsEn:'2 eggs, 2 slices bread, vegetables'},
 {id:'chicken',ar:'دجاج وأرز وسلطة',en:'Chicken, rice & salad',k:620,p:45,c:72,f:17,allergens:[],vegan:false,ingredientsAr:'150 جم دجاج مطهو، 200 جم أرز مطهو، سلطة، زيت زيتون',ingredientsEn:'150 g cooked chicken, 200 g cooked rice, salad, olive oil'},
 {id:'lentils',ar:'عدس وأرز وخضار',en:'Lentils, rice & vegetables',k:580,p:25,c:95,f:11,allergens:[],vegan:true,ingredientsAr:'200 جم عدس مطهو، 150 جم أرز مطهو، خضار، زيت زيتون',ingredientsEn:'200 g cooked lentils, 150 g cooked rice, vegetables, olive oil'},
 {id:'yogurt',ar:'زبادي وفاكهة',en:'Yogurt & fruit',k:240,p:16,c:32,f:6,allergens:['milk'],vegan:false,ingredientsAr:'200 جم زبادي، حصة فاكهة',ingredientsEn:'200 g yogurt, one serving of fruit'},
 {id:'fruit',ar:'فاكهة وحمص',en:'Fruit & chickpeas',k:280,p:10,c:48,f:6,allergens:[],vegan:true,ingredientsAr:'فاكهة، 100 جم حمص مطهو',ingredientsEn:'Fruit, 100 g cooked chickpeas'},
 {id:'tofu',ar:'توفو وبطاطس وخضار',en:'Tofu, potato & vegetables',k:550,p:30,c:65,f:19,allergens:['soy'],vegan:true,ingredientsAr:'180 جم توفو، 250 جم بطاطس، خضار',ingredientsEn:'180 g tofu, 250 g potato, vegetables'}
];
export function eligible(p){return p&&p.age>=18&&p.age<=64&&!p.risk&&p.weight/(p.height/100)**2>=18.5;}
export function calories(p){if(!eligible(p))return null; const b=10*p.weight+6.25*p.height-5*p.age+(p.sex==='male'?5:-161); const maintenance=Math.round(b*({low:1.2,medium:1.375,high:1.55}[p.activity]||1.2));const result={maintenance,target:Math.round(maintenance*(p.goal==='lose'?.9:p.goal==='gain'?1.05:1)),bmr:Math.round(b)};return result.target<(p.sex==='male'?1500:1200)?null:result;}
export function makePlan(p,place='home',days=3){if(!eligible(p))return null; const ids=place==='gym'?['legpress','row','press','bike']:['squat','wall','bridge','bird','march'];return {place,days:Number(days),created:new Date().toISOString(),sessions:Array.from({length:Number(days)},(_,i)=>({day:1+i*2,ids:[...ids]}))};}
export function mealPlan(p,day=0){const safe=food.filter(f=>(p.diet!=='vegan'||f.vegan)&&!f.allergens.some(a=>(p.allergies||[]).includes(a)));return Array.from({length:4},(_,i)=>safe.length?safe[(i+day)%safe.length]:null).filter(Boolean);}
export function validateProfile(p){return Boolean(p && typeof p === "object" && p.name?.trim()&&p.name.length<=60&&Number.isFinite(p.age)&&p.age>=13&&p.age<=100&&Number.isFinite(p.weight)&&p.weight>=30&&p.weight<=300&&Number.isFinite(p.height)&&p.height>=120&&p.height<=230&&['male','female'].includes(p.sex)&&['low','medium','high'].includes(p.activity)&&['maintain','lose','gain'].includes(p.goal)&&['all','vegan'].includes(p.diet));}
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function fresh(){return {version:1,profile:null,plan:null,measurements:[],sessions:[],intake:[],water:{},consent:false};}
