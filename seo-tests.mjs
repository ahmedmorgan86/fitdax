import assert from 'node:assert/strict';
import fs from 'node:fs';
import {siteMetadata,site} from './lib/site.mjs';
for(const lang of ['ar','en']){const m=siteMetadata(lang);assert.equal(m.alternates.canonical,site+(lang==='ar'?'/':'/en'));assert.equal(m.robots.index,true);assert.equal(m.alternates.languages.en,site+'/en');}
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest'));assert.equal(manifest.start_url,'/fitverse/index.html');for(const icon of manifest.icons)assert.ok(fs.existsSync('public'+icon.src));
const links=JSON.parse(fs.readFileSync('public/.well-known/assetlinks.json'));assert.equal(links[0].target.package_name,'com.ahmedmorgan.fitdax');assert.match(links[0].target.sha256_cert_fingerprints[0],/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/);
assert.ok(!fs.readFileSync('public/sw.js','utf8').includes('cache.put'));assert.ok(fs.readFileSync('public/sw.js','utf8').includes("startsWith('/api/')"));
console.log('PASS bilingual canonical/hreflang, install manifest/icons, actual Android association and public-only offline fallback.');
