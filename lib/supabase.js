import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export async function client(){const jar=await cookies();if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)throw new Error('service_not_configured');return createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll(){return jar.getAll()},setAll(items){for(const {name,value,options} of items)jar.set(name,value,options)}}})}
export async function context(){const db=await client();const {data:{user},error}=await db.auth.getUser();return {db,user:error?null:user}}
