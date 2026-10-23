import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s.replace(/\r\n/g,'\n')).digest('hex');
const base='https://fitdax.vercel.app';
const get=async(path,options={})=>{const response=await fetch(base+path,{cache:'no-store',signal:AbortSignal.timeout(20000),...options});return response};
const checks=[];
for(const path of ['/','/en','/robots.txt','/sitemap.xml','/manifest.webmanifest','/.well-known/assetlinks.json','/fitverse/login.html','/fitverse/training.html?tab=tools','/fitverse/payments.html','/fitverse/privacy.html']){
 const r=await get(path);assert.equal(r.status,200,path);assert(r.headers.get('x-content-type-options')==='nosniff',path);if(path.startsWith('/fitverse/'))assert.match(r.headers.get('x-robots-tag'),/noindex/);checks.push({path,status:r.status});await r.body?.cancel();
}
for(const path of ['/api/account','/api/training','/api/payments']){const r=await get(path);assert.equal(r.status,401,path);assert.match(r.headers.get('cache-control'),/no-store/);checks.push({path,status:r.status});await r.body?.cancel()}
const plans=await (await get('/api/plans')).json();assert.deepEqual(plans.plans.map(p=>p.id).sort(),['free','premium','pro']);assert.equal(plans.plans.find(p=>p.id==='free').monthly,0);
const version=await (await get('/app-version.json')).json();
const release=await (await get('/downloads/release.json')).json(),localRelease=JSON.parse(fs.readFileSync('public/downloads/release.json','utf8'));
assert.equal(release.sha256,localRelease.sha256);assert.equal(release.apk,localRelease.apk);
const apk=await get(release.apk,{method:'HEAD'});assert.equal(apk.status,200);assert.equal(Number(apk.headers.get('content-length')),fs.statSync('public'+release.apk).size);
for(const path of ['/fitverse/training.js','/fitverse/daily-tools.mjs','/fitverse/daily-tools-ui.mjs','/fitverse/sw.js']){const r=await get(path);assert.equal(r.status,200);assert.equal(digest(await r.text()),digest(fs.readFileSync('public'+path,'utf8')),path+' source hash');checks.push({path,status:200,sourceMatched:true})}
const out={checkedAt:new Date().toISOString(),deployment:version.version,checks,plans:plans.plans.map(({id,monthly,annual,available,programs})=>({id,monthly,annual,available,programCount:programs.length})),android:{version:release.version,headStatus:apk.status,bytes:fs.statSync('public'+release.apk).size,localSha256:release.sha256,remoteFullHashVerified:false},physicalDeviceTest:'Pending',currentVisualAudit:'Not performed',realPaymentTest:'Not performed'};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
