import {createClient} from '@supabase/supabase-js';
import {paymobConfig} from './paymob.mjs';
export function paymobReady(env=process.env){try{paymobConfig(env);return !!env.PAYMOB_SUPABASE_SECRET_KEY&&!!env.FITVERSE_DATA_KEY}catch{return false}}
export function paymobService(){if(!paymobReady())throw Error('paymob_not_configured');return createClient(process.env.FITVERSE_SUPABASE_URL||process.env.SUPABASE_URL,process.env.PAYMOB_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}
