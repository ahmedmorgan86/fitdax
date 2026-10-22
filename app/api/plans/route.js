import {client} from '../../../lib/supabase.js';
import {response,failure} from '../../../lib/http.mjs';
import {membershipOffers} from '../../../lib/membership-offers.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{const db=await client();const {data,error}=await db.rpc('fitdax_public_plans');if(error||!Array.isArray(data)||data.length!==3)throw Error();return response({plans:membershipOffers(data)})}catch(e){return failure(e)}}
