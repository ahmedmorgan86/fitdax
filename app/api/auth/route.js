import {client} from '../../../lib/supabase.js';
import {authOrigin} from '../../../lib/auth-url.mjs';
import {authInput,authFailure} from '../../../lib/auth-input.mjs';
import {authSettings} from '../../../lib/auth-settings.mjs';
import {response,originGuard,body,failure} from '../../../lib/http.mjs';
import {cookies} from 'next/headers';
export const dynamic='force-dynamic';
export async function GET(){try{return response(await authSettings())}catch(e){return failure(e)}}
export async function POST(r){try{
 originGuard(r);const origin=authOrigin(r.url);if(new URL(r.url).origin!==origin)return response({error:'canonical_login_required'},409);
 const v=authInput(await body(r,4000)),db=await client();
 if(v.action==='google'){if(!(await authSettings()).googleEnabled)return response({error:'google_not_configured'},503);const {data,error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:origin+'/auth/callback',skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});if(error||!data.url)return response({error:'google_unavailable'},503);return response({url:data.url})}
 if(v.action==='login'){const {error}=await db.auth.signInWithPassword({email:v.email,password:v.password});if(error){const f=authFailure(error);return response({error:f.error},f.status)}return response({ok:true})}
 if(v.action==='signup'){const {data,error}=await db.auth.signUp({email:v.email,password:v.password,options:{emailRedirectTo:origin+'/auth/callback'}});if(error){const f=authFailure(error);return response({error:f.error==='invalid_credentials'?'signup_unavailable':f.error},f.status)}return response({ok:true,confirmationRequired:!data.session})}
 if(v.action==='reset'){const {error}=await db.auth.resetPasswordForEmail(v.email,{redirectTo:origin+'/auth/callback'});if(error){const f=authFailure(error);return response({error:f.error==='invalid_credentials'?'email_delivery_unavailable':f.error},f.status)}const jar=await cookies();jar.set('fitverse_recovery','1',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});return response({ok:true})}
 const {data:{user},error:ue}=await db.auth.getUser();if(ue||!user)return response({error:'authentication_required'},401);
 const {error}=await db.auth.updateUser({password:v.password});if(error){const f=authFailure(error);return response({error:f.error==='invalid_credentials'?'password_update_failed':f.error},f.status)}const {error:se}=await db.auth.signOut({scope:'others'});return response({ok:true,othersRevoked:!se});
}catch(e){return failure(e)}}
