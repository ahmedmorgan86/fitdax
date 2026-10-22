create table public.fitdax_paymob_orders(
 id uuid primary key,user_id uuid not null references auth.users(id),plan text not null check(plan in ('pro','premium')),period text not null check(period in ('monthly','annual')),amount_cents integer not null check(amount_cents>0),currency text not null default 'EGP' check(currency='EGP'),mode text not null check(mode in ('test','live')),status text not null default 'created' check(status in ('created','ready','paid','test_paid','needs_review')),provider_order_id bigint unique,intention_id text,checkout_payload jsonb,created_at timestamptz not null default now(),paid_at timestamptz);
create index fitdax_paymob_orders_user_time on public.fitdax_paymob_orders(user_id,created_at desc);
alter table public.fitdax_paymob_orders enable row level security;
grant select on public.fitdax_paymob_orders to authenticated;
grant all on public.fitdax_paymob_orders to service_role;
create policy paymob_order_owner on public.fitdax_paymob_orders for select to authenticated using(user_id=(select auth.uid()));
create table public.fitdax_paymob_events(mode text not null,transaction_id bigint not null,order_id uuid not null references public.fitdax_paymob_orders(id),created_at timestamptz not null default now(),primary key(mode,transaction_id));
create index fitdax_paymob_events_order on public.fitdax_paymob_events(order_id);
alter table public.fitdax_paymob_events enable row level security;
grant all on public.fitdax_paymob_events to service_role;
create or replace function public.fitdax_create_card_order(p_id uuid,p_plan text,p_period text,p_mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid();o public.fitdax_paymob_orders;offer jsonb;amount integer;
begin
 if who is null then raise exception 'authentication_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text,7));
 select * into o from public.fitdax_paymob_orders where id=p_id;
 if found then if o.user_id<>who then raise exception 'invalid_order';end if;if o.plan<>p_plan or o.period<>p_period or o.mode<>p_mode then raise exception 'invalid_order';end if;return to_jsonb(o);end if;
 if p_plan not in ('pro','premium') or p_period not in ('monthly','annual') or p_mode not in ('test','live') then raise exception 'invalid_order';end if;
 if p_mode='test' and not private.fitverse_admin() then raise exception 'admin_required';end if;
 if (select count(*) from public.fitdax_paymob_orders where user_id=who and created_at>now()-interval '1 hour')>=10 then raise exception 'too_many_orders';end if;
 select p into offer from public.fitverse_catalog c cross join lateral jsonb_array_elements(c.data->'plans') p where c.id=1 and p->>'id'=p_plan;
 if offer is null or (offer->>'available')::boolean is not true then raise exception 'plan_unavailable';end if;
 amount:=((offer->>p_period)::numeric*100)::integer;if amount<1 then raise exception 'invalid_amount';end if;
 insert into public.fitdax_paymob_orders(id,user_id,plan,period,amount_cents,mode) values(p_id,who,p_plan,p_period,amount,p_mode) returning * into o;return to_jsonb(o);
end$$;
revoke all on function public.fitdax_create_card_order(uuid,text,text,text) from public;
grant execute on function public.fitdax_create_card_order(uuid,text,text,text) to authenticated;
create or replace function public.fitdax_bind_card_order(p_id uuid,p_provider_order bigint,p_intention text,p_payload jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.fitdax_paymob_orders set provider_order_id=p_provider_order,intention_id=p_intention,checkout_payload=p_payload,status='ready' where id=p_id and status='created';
 if not found then raise exception 'order_already_bound';end if;
end$$;
revoke all on function public.fitdax_bind_card_order(uuid,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.fitdax_bind_card_order(uuid,bigint,text,jsonb) to service_role;
create or replace function public.fitdax_fulfill_card_order(p_provider_order bigint,p_transaction bigint,p_amount integer,p_currency text,p_mode text) returns text language plpgsql security definer set search_path='' as $$
declare o public.fitdax_paymob_orders;current_plan text;duration interval;
begin
 select * into o from public.fitdax_paymob_orders where provider_order_id=p_provider_order for update;
 if not found then raise exception 'order_not_bound';end if;
 if o.amount_cents<>p_amount or o.currency<>p_currency or o.mode<>p_mode then raise exception 'payment_mismatch';end if;
 if exists(select 1 from public.fitdax_paymob_events where mode=p_mode and transaction_id=p_transaction) then return 'duplicate';end if;
 insert into public.fitdax_paymob_events(mode,transaction_id,order_id) values(p_mode,p_transaction,o.id);
 if o.status in ('paid','test_paid','needs_review') then return 'already_processed';end if;
 if o.status<>'ready' then raise exception 'invalid_status';end if;
 if p_mode='test' then update public.fitdax_paymob_orders set status='test_paid',paid_at=now() where id=o.id;return 'test_paid';end if;
 perform pg_advisory_xact_lock(hashtextextended(o.user_id::text,8));
 select plan into current_plan from public.fitverse_memberships where user_id=o.user_id and status='active' and expires_at>now();
 if current_plan='premium' and o.plan='pro' then update public.fitdax_paymob_orders set status='needs_review',paid_at=now() where id=o.id;return 'needs_review';end if;
 duration:=case when o.period='annual' then interval '1 year' else interval '1 month' end;
 insert into public.fitverse_memberships(user_id,plan,status,expires_at,source) values(o.user_id,o.plan,'active',now()+duration,'paymob_verified')
 on conflict(user_id) do update set plan=excluded.plan,status='active',expires_at=greatest(public.fitverse_memberships.expires_at,now())+duration,source='paymob_verified';
 update public.fitdax_paymob_orders set status='paid',paid_at=now() where id=o.id;
 return 'paid';
end$$;
revoke all on function public.fitdax_fulfill_card_order(bigint,bigint,integer,text,text) from public,anon,authenticated;
grant execute on function public.fitdax_fulfill_card_order(bigint,bigint,integer,text,text) to service_role;
