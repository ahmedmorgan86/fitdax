import {response} from '../../../lib/http.mjs';
// No fake checkout, client-side entitlement grant, or live charges before merchant setup.
export async function POST(){return response({error:'merchant_not_configured',message:'Payments are not active. No charge was made.'},503)}
