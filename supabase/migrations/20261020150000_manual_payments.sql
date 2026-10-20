create table public.fitverse_payment_orders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 plan text not null check(plan in ('pro','premium')),
 period text not null check(period in ('monthly','annual')),
 amount numeric(10,2) not null check(amount>0 and amount<=100000),
 method text not null check(method in ('wallet','instapay')),
 destination text not null,recipient_name text not null,
 status text not null default 'awaiting_transfer' check(status in ('awaiting_transfer','pending_review','approved','rejected')),
 transfer_reference text,
 created_at timestamptz not null default now(),reviewed_at timestamptz,
 reviewer uuid references auth.users(id),
 check(transfer_reference is null or transfer_reference ~ '^[a-zA-Z0-9_-]{6,80}$')
);
create index fitverse_payment_user on public.fitverse_payment_orders(user_id,created_at desc);
create unique index fitverse_payment_reference on public.fitverse_payment_orders(method,lower(transfer_reference)) where transfer_reference is not null and status in ('pending_review','approved');
alter table public.fitverse_payment_orders enable row level security;
revoke all on public.fitverse_payment_orders from anon,authenticated;
grant select on public.fitverse_payment_orders to authenticated;
create policy payment_owner_or_admin_read on public.fitverse_payment_orders for select to authenticated using ((select auth.uid())=user_id or (select private.fitverse_admin()));

create function public.fitverse_create_payment(p_plan text,p_period text,p_method text) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=(select auth.uid()); c jsonb; p jsonb; cfg jsonb; dest text; amount numeric; order_id uuid;
begin
 if who is null or not exists(select 1 from auth.users where id=who and email_confirmed_at is not null) then raise exception 'authentication_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text,0));
 if (select count(*) from public.fitverse_payment_orders where user_id=who and created_at>now()-interval '1 day')>=5 then raise exception 'too_many_orders';end if;
 if p_plan not in ('pro','premium') or p_period not in ('monthly','annual') or p_method not in ('wallet','instapay') or p_plan is null or p_period is null or p_method is null then raise exception 'invalid_order';end if;
 select data into c from public.fitverse_catalog where id=1;
 cfg:=c->'payments';
 select value into p from jsonb_array_elements(c->'plans') where value->>'id'=p_plan;
 if p is null or (p->>'available')::boolean is not true then raise exception 'plan_unavailable';end if;
 amount:=(p->>p_period)::numeric;
 if amount is null or amount<=0 or amount>100000 then raise exception 'plan_unavailable';end if;
 if (cfg->>(case when p_method='wallet' then 'walletEnabled' else 'instapayEnabled' end))::boolean is not true then raise exception 'payment_unavailable';end if;
 dest:=cfg->>(case when p_method='wallet' then 'walletNumber' else 'instapayAddress' end);
 if nullif(trim(cfg->>'recipientName'),'') is null or dest is null or (p_method='wallet' and dest !~ '^01[0125][0-9]{8}$') or (p_method='instapay' and dest !~ '^[a-zA-Z0-9._-]{1,80}@instapay$') then raise exception 'payment_unavailable';end if;
 insert into public.fitverse_payment_orders(user_id,plan,period,amount,method,destination,recipient_name) values(who,p_plan,p_period,amount,p_method,dest,cfg->>'recipientName') returning id into order_id;
 return order_id;
end;$$;
create function public.fitverse_submit_payment(p_id uuid,p_reference text) returns boolean language plpgsql security definer set search_path='' as $$
declare o public.fitverse_payment_orders;
begin
 select * into o from public.fitverse_payment_orders where id=p_id and user_id=(select auth.uid()) for update;
 if not found or o.status<>'awaiting_transfer' then raise exception 'invalid_status';end if;
 if o.created_at<now()-interval '24 hours' then raise exception 'order_expired';end if;
 if p_reference is null or p_reference !~ '^[a-zA-Z0-9_-]{6,80}$' then raise exception 'invalid_reference';end if;
 update public.fitverse_payment_orders set status='pending_review',transfer_reference=p_reference where id=p_id;
 return true;
exception when unique_violation then raise exception 'duplicate_reference';
end;$$;
create function public.fitverse_review_payment(p_id uuid,p_approve boolean) returns boolean language plpgsql security definer set search_path='' as $$
declare o public.fitverse_payment_orders; duration interval;
begin
 if not private.fitverse_admin() then raise exception 'admin_required';end if;
 if p_approve is null then raise exception 'invalid_status';end if;
 select * into o from public.fitverse_payment_orders where id=p_id for update;
 if not found or o.status<>'pending_review' then raise exception 'invalid_status';end if;
 if p_approve then
 duration:=case when o.period='annual' then interval '1 year' else interval '1 month' end;
 insert into public.fitverse_memberships(user_id,plan,status,expires_at,source) values(o.user_id,o.plan,'active',now()+duration,'verified_payment')
 on conflict(user_id) do update set plan=excluded.plan,status='active',expires_at=(case when fitverse_memberships.status='active' and fitverse_memberships.plan=excluded.plan then greatest(fitverse_memberships.expires_at,now()) else now() end)+duration,source='verified_payment';
 end if;
 update public.fitverse_payment_orders set status=case when p_approve then 'approved' else 'rejected' end,reviewer=(select auth.uid()),reviewed_at=now() where id=p_id;
 insert into public.fitverse_audit(actor,action,revision) values((select auth.uid()),case when p_approve then 'manual_payment_approved:' else 'manual_payment_rejected:' end||p_id::text,0);
 return true;
end;$$;
revoke all on function public.fitverse_create_payment(text,text,text),public.fitverse_submit_payment(uuid,text),public.fitverse_review_payment(uuid,boolean) from public,anon;
grant execute on function public.fitverse_create_payment(text,text,text),public.fitverse_submit_payment(uuid,text),public.fitverse_review_payment(uuid,boolean) to authenticated;
