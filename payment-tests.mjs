import {defaultPayments,validatePayments} from './lib/payments.mjs';
import assert from 'node:assert/strict';
const p=defaultPayments();assert.equal(p.walletEnabled,false);assert.equal(p.instapayEnabled,false);
assert.equal(validatePayments({...p,walletNumber:'+201097905455'}).walletNumber,'01097905455');
assert.throws(()=>validatePayments({...p,walletEnabled:true}));
assert.throws(()=>validatePayments({...p,instapayEnabled:true,recipientName:'Synthetic'}));
assert.throws(()=>validatePayments({...p,instapayAddress:'https://phishing.invalid'}));
assert.throws(()=>validatePayments({...p,recipientName:'<script>'}));
assert.equal(validatePayments({...p,recipientName:'Synthetic',walletEnabled:true}).walletEnabled,true);
console.log('PASS payment defaults, normalization, recipient gate, destination validation and markup rejection');

const {authOrigin}=await import('./lib/auth-url.mjs');assert.equal(authOrigin('http://localhost:3000/api/auth','production'),'https://fitdax.vercel.app');assert.equal(authOrigin('https://untrusted.invalid/api/auth','production'),'https://fitdax.vercel.app');assert.equal(authOrigin('http://localhost:3000/api/auth','development'),'http://localhost:3000');console.log('PASS production auth never redirects to localhost or a request-selected host');
