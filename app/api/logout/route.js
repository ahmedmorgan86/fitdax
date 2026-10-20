import {client} from '../../../lib/supabase.js';
import {originGuard,response,failure} from '../../../lib/http.mjs';
export async function POST(r){try{originGuard(r);const db=await client();await db.auth.signOut({scope:'local'});return response({ok:true})}catch(e){return failure(e)}}
