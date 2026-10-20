import {client,context} from '../../../lib/supabase.js';
import {NextResponse} from 'next/server';
export async function GET(r){const url=new URL(r.url),code=url.searchParams.get('code');if(code){const db=await client();const {error}=await db.auth.exchangeCodeForSession(code);if(!error){const {user}=await context();if(user){const out=NextResponse.redirect(new URL('/fitverse/index.html',url.origin));out.headers.set('Cache-Control','no-store, private');return out}await db.auth.signOut({scope:'local'})}}return NextResponse.redirect(new URL('/fitverse/login.html?error=google',url.origin))}
