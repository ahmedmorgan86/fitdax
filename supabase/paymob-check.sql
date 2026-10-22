begin;
insert into auth.users(id,email,email_confirmed_at) values('70000000-0000-4000-8000-000000000001','paymob-qa@example.invalid',now()),('70000000-0000-4000-8000-000000000002','paymob-qa-b@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$declare o jsonb;begin
 o:=public.fitdax_create_card_order('71000000-0000-4000-8000-000000000001','pro','monthly','live');
 if (o->>'amount_cents')::integer<>9900 then raise exception 'wrong_quote';end if;
 if public.fitdax_create_card_order('71000000-0000-4000-8000-000000000001','pro','monthly','live')->>'id'<>o->>'id' then raise exception 'retry_not_idempotent';end if;
 begin perform public.fitdax_bind_card_order('71000000-0000-4000-8000-000000000001',770001,'qa','{}');raise exception 'unsafe_bind';exception when insufficient_privilege then null;end;
 begin perform public.fitdax_fulfill_card_order(770001,880001,9900,'EGP','live');raise exception 'unsafe_fulfill';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims','{"sub":"70000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$begin if (select count(*) from public.fitdax_paymob_orders)<>0 then raise exception 'cross_user_read';end if;end$$;
reset role;
select public.fitdax_bind_card_order('71000000-0000-4000-8000-000000000001',770001,'qa','{"synthetic":true}');
do $$declare expiry timestamptz;begin
 begin perform public.fitdax_fulfill_card_order(770001,880001,1,'EGP','live');raise exception 'bad_amount';exception when raise_exception then if sqlerrm<>'payment_mismatch' then raise;end if;end;
 if public.fitdax_fulfill_card_order(770001,880001,9900,'EGP','live')<>'paid' then raise exception 'not_paid';end if;
 select expires_at into expiry from public.fitverse_memberships where user_id='70000000-0000-4000-8000-000000000001';
 if public.fitdax_fulfill_card_order(770001,880001,9900,'EGP','live')<>'duplicate' then raise exception 'not_duplicate';end if;
 if public.fitdax_fulfill_card_order(770001,880002,9900,'EGP','live')<>'already_processed' then raise exception 'double_order';end if;
 if (select expires_at from public.fitverse_memberships where user_id='70000000-0000-4000-8000-000000000001')<>expiry then raise exception 'double_extension';end if;
end$$;
insert into public.fitdax_paymob_orders(id,user_id,plan,period,amount_cents,mode,status,provider_order_id) values('71000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','premium','monthly',19900,'test','ready',770002);
do $$begin
 if public.fitdax_fulfill_card_order(770002,880003,19900,'EGP','test')<>'test_paid' then raise exception 'test_missing';end if;
 if exists(select 1 from public.fitverse_memberships where user_id='70000000-0000-4000-8000-000000000002') then raise exception 'test_granted_live_access';end if;
end$$;
insert into public.fitdax_paymob_orders(id,user_id,plan,period,amount_cents,mode,status,provider_order_id) values('71000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000002','premium','monthly',19900,'live','ready',770003);
select public.fitdax_flag_card_review(770003);
do $$begin
 if public.fitdax_fulfill_card_order(770003,880004,19900,'EGP','live')<>'already_processed' then raise exception 'refund_then_stale_success';end if;
 if exists(select 1 from public.fitverse_memberships where user_id='70000000-0000-4000-8000-000000000002') then raise exception 'refunded_order_activated';end if;
end$$;
rollback;
select 'PASS canonical quote, retries, ownership, service-only write grants, amount matching, duplicate callback/order deduplication and test/live isolation; synthetic records rolled back.' as result;
