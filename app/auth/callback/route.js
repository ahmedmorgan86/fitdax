import {client} from '../../../lib/supabase.js';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
export async function GET(r){const url=new URL(r.url),code=url.searchParams.get('code');if(code){const db=await client();const {error}=await db.auth.exchangeCodeForSession(code);if(!error){const jar=await cookies(),recover=jar.get('fitverse_recovery')?.value==='1';jar.delete('fitverse_recovery');const out=NextResponse.redirect(new URL(recover?'/fitverse/password.html':'/fitverse/index.html',url.origin));out.headers.set('Cache-Control','no-store, private');return out}}return NextResponse.redirect(new URL('/fitverse/login.html?error=expired',url.origin))}
