import {createHmac} from 'node:crypto';
import {context} from '../../../lib/supabase.js';
import {seal,unseal} from '../../../lib/account-core.mjs';
import {body,response,originGuard,failure} from '../../../lib/http.mjs';
import {initialTraining,validateTraining,validateSet} from '../../../public/fitverse/training-engine.mjs';
import {defaultCatalog} from '../../../lib/catalog.mjs';
export const dynamic='force-dynamic';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const known=new Set(['invalid_training','program_unavailable','training_needs_review','upgrade_required','experience_required','invalid_schedule','rest_day_required','invalid_substitution','invalid_set','equipment_required']);
const trainingKey=id=>id+':training';
const setKey=(user,id)=>user+':set:'+id;
async function handler(request){try{
 originGuard(request);const {db,user}=await context();if(!user)return response({error:'authentication_required'},401);
 const [{data:account,error:accountError},{data:access,error:accessError}]=await Promise.all([
  db.from('fitverse_accounts').select('payload,consent_at').eq('user_id',user.id).maybeSingle(),db.rpc('fitverse_access')
 ]);if(accountError||accessError)throw Error();if(!account)return response({error:'profile_required'},409);
 const state=await unseal(account.payload,process.env.FITVERSE_DATA_KEY,user.id),accountKey=user.id+':'+account.consent_at;
 if(request.method==='GET'){
  const url=new URL(request.url),beforeDate=url.searchParams.get('beforeDate'),beforeId=url.searchParams.get('beforeId');
  if((beforeDate||beforeId)&&(!/^\d{4}-\d{2}-\d{2}$/.test(beforeDate||'')||!uuid.test(beforeId||'')))return response({error:'invalid_cursor'},400);
  let query=db.from('fitdax_sets').select('id,payload,entry_date').eq('user_id',user.id).order('entry_date',{ascending:false}).order('id',{ascending:false}).limit(201);
  if(beforeDate)query=query.or(`entry_date.lt.${beforeDate},and(entry_date.eq.${beforeDate},id.lt.${beforeId})`);
  const [{data:settingsRow,error:settingsError},{data:rows,error:logError}]=await Promise.all([db.from('fitdax_training').select('payload,revision').eq('user_id',user.id).maybeSingle(),query]);
  if(settingsError||logError)throw Error();const page=rows.slice(0,200),last=page.at(-1);
  return response({accountKey,profile:state.profile,access,settings:settingsRow?await unseal(settingsRow.payload,process.env.FITVERSE_DATA_KEY,trainingKey(user.id)):initialTraining(),revision:settingsRow?.revision||0,sets:await Promise.all(page.map(r=>unseal(r.payload,process.env.FITVERSE_DATA_KEY,setKey(user.id,r.id)))),nextCursor:rows.length>200?{beforeDate:last.entry_date,beforeId:last.id}:null});
 }
 if(request.method==='PATCH'){
  const input=await body(request,40000);if(input.accountKey!==accountKey)return response({error:'account_changed'},409);if(!Number.isSafeInteger(input.revision)||input.revision<0)return response({error:'invalid_revision'},400);
  const {data:row,error:catalogError}=await db.from('fitverse_catalog').select('data').eq('id',1).maybeSingle();if(catalogError)throw Error();
  const catalog={...defaultCatalog(),...(row?.data||{})};const settings=validateTraining(input.settings,state.profile,{full:access.full,overrides:catalog.resources?.overrides});
  const payload=await seal(settings,process.env.FITVERSE_DATA_KEY,trainingKey(user.id));const {data:revision,error}=await db.rpc('fitdax_save_training',{p_revision:input.revision,p_payload:payload});
  if(error)return rpcError(error);return response({settings,revision});
 }
 if(request.method==='POST'){
  const input=await body(request,24000);if(input.accountKey!==accountKey)return response({error:'account_changed'},409);if(!Array.isArray(input.sets)||input.sets.length<1||input.sets.length>20)return response({error:'invalid_sets'},400);
  const sets=input.sets.map(validateSet);if(new Set(sets.map(s=>s.id)).size!==sets.length)return response({error:'duplicate_set'},400);
  const rows=await Promise.all(sets.map(async s=>({id:s.id,date:s.date,payload:await seal(s,process.env.FITVERSE_DATA_KEY,setKey(user.id,s.id)),content_mac:createHmac('sha256',process.env.FITVERSE_DATA_KEY).update(user.id+':'+JSON.stringify(s)).digest('hex')})));
  const {error}=await db.rpc('fitdax_append_sets',{p_rows:rows});if(error)return rpcError(error);
  return response({accepted:sets.map(s=>s.id)});
 }
 if(request.method==='DELETE'){
  const input=await body(request,4000);if(input.accountKey!==accountKey)return response({error:'account_changed'},409);const ids=input.ids||[input.id];if(!Array.isArray(ids)||!ids.length||ids.length>20||!ids.every(id=>uuid.test(id)))return response({error:'invalid_set'},400);
  const {error}=await db.rpc('fitdax_delete_sets',{p_ids:ids});if(error)return rpcError(error);return response({deleted:true});
 }
 return response({error:'method_not_allowed'},405);
}catch(error){if(known.has(error.message))return response({error:error.message},error.message==='upgrade_required'?402:400);return failure(error)}}
function rpcError(error){for(const [code,status]of [['revision_conflict',409],['record_conflict',409],['rate_limited',429],['invalid_data',400]])if(error.message.includes(code))return response({error:code},status);return response({error:'service_unavailable'},503)}
export const GET=handler,PATCH=handler,POST=handler,DELETE=handler;
