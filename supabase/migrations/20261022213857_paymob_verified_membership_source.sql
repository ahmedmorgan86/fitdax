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
 insert into public.fitverse_memberships(user_id,plan,status,expires_at,source) values(o.user_id,o.plan,'active',now()+duration,'verified_payment')
 on conflict(user_id) do update set plan=excluded.plan,status='active',expires_at=greatest(public.fitverse_memberships.expires_at,now())+duration,source='verified_payment';
 update public.fitdax_paymob_orders set status='paid',paid_at=now() where id=o.id;
 return 'paid';
end$$;
revoke all on function public.fitdax_fulfill_card_order(bigint,bigint,integer,text,text) from public,anon,authenticated;
grant execute on function public.fitdax_fulfill_card_order(bigint,bigint,integer,text,text) to service_role;
