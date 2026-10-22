import {client} from '../../../lib/supabase.js';
import {originGuard,response,failure} from '../../../lib/http.mjs';
import {signOutLocal} from '../../../lib/session.mjs';
export async function POST(r){try{originGuard(r);const db=await client();await signOutLocal(db);return response({ok:true})}catch(e){return failure(e)}}
