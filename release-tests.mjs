import assert from 'node:assert/strict';
import {body} from './lib/http.mjs';
import {signOutLocal} from './lib/session.mjs';
import {trainingData} from './public/fitverse/account-tools.mjs';
for(const input of ['null','[]','1','"text"'])await assert.rejects(body(new Request('https://app.test',{method:'POST',headers:{'content-type':'application/json'},body:input})),e=>e.status===400);
let called;await signOutLocal({auth:{signOut:async options=>{called=options;return {error:null}}}});assert.deepEqual(called,{scope:'local'});
await assert.rejects(signOutLocal({auth:{signOut:async()=>({error:Error('provider_failed')})}}),/provider_failed/);
const originalFetch=globalThis.fetch;let page=0;
try{globalThis.fetch=async()=>Response.json({accountKey:++page===1?'account-a':'account-b',sets:[],nextCursor:page===1?{beforeDate:'2026-10-01',beforeId:'10000000-0000-4000-8000-000000000001'}:null});await assert.rejects(trainingData(),/account_changed/);}finally{globalThis.fetch=originalFetch;}
console.log('PASS malformed JSON shapes rejected, logout errors propagate, and cross-account export pagination fails closed.');
