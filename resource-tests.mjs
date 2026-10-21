import assert from 'node:assert/strict';
import fs from 'node:fs';
import {careGate,nutritionGuides,mealTranslations,trainingGuides} from './public/fitverse/care.mjs';
import {defaultResources,validateResources} from './public/fitverse/resource-settings.mjs';
import {normalizeWallet,validatePayments,defaultPayments} from './lib/payments.mjs';
const db=JSON.parse(fs.readFileSync('public/fitverse/data/exercise-library.json','utf8'));
assert.equal(db.entries.length,876);assert.equal(db.entries.reduce((n,e)=>n+e.images.length,0),1746);
assert.match(db.commit,/^[a-f0-9]{40}$/);assert.ok(db.imageBase.includes(db.commit));
assert.equal(new Set(db.entries.map(e=>e.id)).size,876);assert.equal(db.entries.filter(e=>e.images.length).length,873);assert.equal(db.entries.filter(e=>!e.instructions.length).length,5);
for(const e of db.entries){assert.ok(Array.isArray(e.instructions));assert.ok(Array.isArray(e.images));for(const p of e.images)assert.match(p,/^[A-Za-z0-9_.()-]+\/[01]\.jpg$/)}
for(const g of trainingGuides)for(const id of g.ids)assert.ok(db.entries.some(e=>e.id===id),id);
for(const g of nutritionGuides)for(const day of g.days)for(const meal of day)assert.ok(mealTranslations[meal],meal);
for(const emergency of ['yes','no','unsure',undefined])for(const urgent of ['yes','no','unsure',undefined])for(const specialist of ['yes','no','unsure',undefined])for(const cleared of [true,false])assert.equal(careGate({emergency,urgent,specialist,cleared})==='education',emergency==='no'&&urgent==='no'&&specialist==='no'&&cleared);
assert.deepEqual(validateResources(),defaultResources());
assert.throws(()=>validateResources({...defaultResources(),overrides:{'ex-test':{enabled:true,ar:'<script>',en:'Test',arBody:'',enBody:''}}}));
assert.throws(()=>validateResources({...defaultResources(),overrides:{'https://bad.example':{enabled:true}}}));
for(const v of ['+20 109 790 5455','00201097905455','٠١٠٩٧٩٠٥٤٥٥','۰۱۰۹۷۹۰۵۴۵۵'])assert.equal(normalizeWallet(v),'01097905455');
assert.throws(()=>validatePayments({...defaultPayments(),walletEnabled:true}),/recipient_required/);
console.log('PASS 876 entries / 1746 pinned image paths, guide references, bilingual meals, all 128 screening cases, content validation and Egyptian wallet forms');
