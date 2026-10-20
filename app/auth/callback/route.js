import {client} from '../../../lib/supabase.js';
import {NextResponse} from 'next/server';
export async function GET(r){const url=new URL(r.url),code=url.searchParams.get('code');if(code){const db=await client();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/fitverse/index.html',url.origin))}return NextResponse.redirect(new URL('/fitverse/login.html?error=expired',url.origin))}
