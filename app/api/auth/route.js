import {client} from '../../../lib/supabase.js';
import {authOrigin} from '../../../lib/auth-url.mjs';
import {authInput} from '../../../lib/auth-input.mjs';
import {authSettings} from '../../../lib/auth-settings.mjs';
import {response,originGuard,body,failure} from '../../../lib/http.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{return response(await authSettings())}catch(e){return failure(e)}}
export async function POST(r){try{originGuard(r);const origin=authOrigin(r.url);if(new URL(r.url).origin!==origin)return response({error:'canonical_login_required'},409);authInput(await body(r,1024));if(!(await authSettings()).googleEnabled)return response({error:'google_not_configured'},503);const db=await client();const {data,error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:origin+'/auth/callback',skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});if(error||!data.url)return response({error:'google_unavailable'},503);return response({url:data.url})}catch(e){return failure(e)}}
