begin;
insert into auth.users(id,email,email_confirmed_at) values
('20000000-0000-4000-8000-000000000001','payment-qa-a@example.invalid',now()),
('20000000-0000-4000-8000-000000000002','payment-qa-b@example.invalid',now()),
('20000000-0000-4000-8000-000000000003','payment-qa-admin@example.invalid',now());
insert into private.fitverse_admin_emails(email) values('payment-qa-admin@example.invalid');
insert into public.fitverse_catalog(id,data,revision) values(1,'{"plans":[{"id":"pro","available":true,"monthly":99,"annual":799},{"id":"premium","available":false,"monthly":199,"annual":1499}],"payments":{"walletEnabled":true,"walletNumber":"01000000000","recipientName":"Synthetic","instapayEnabled":true,"instapayAddress":"synthetic@instapay"}}',1)
on conflict(id) do update set data=excluded.data;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('test.order',public.fitverse_create_payment('pro','monthly','wallet')::text,true);
do $$declare o uuid:=current_setting('test.order')::uuid;begin
 if (select amount from public.fitverse_payment_orders where id=o)<>99 then raise exception 'price_snapshot_failed';end if;
 begin perform public.fitverse_create_payment('premium','monthly','wallet');raise exception 'disabled_plan_accepted';exception when raise_exception then if sqlerrm<>'plan_unavailable' then raise;end if;end;
 begin update public.fitverse_payment_orders set status='approved' where id=o;raise exception 'direct_status_write_allowed';exception when insufficient_privilege then null;end;
 perform public.fitverse_submit_payment(o,'SYNTHETIC_REFERENCE_1');
 if (public.fitverse_access()->>'full')::boolean then raise exception 'claim_granted_access';end if;
 begin perform public.fitverse_review_payment(o,true);raise exception 'self_approval_allowed';exception when raise_exception then if sqlerrm<>'admin_required' then raise;end if;end;
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.fitverse_payment_orders)<>0 then raise exception 'cross_user_payment_read';end if;
 begin perform public.fitverse_submit_payment(current_setting('test.order')::uuid,'SYNTHETIC_REFERENCE_2');raise exception 'cross_user_submit';exception when raise_exception then if sqlerrm<>'invalid_status' then raise;end if;end;
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$declare o uuid:=current_setting('test.order')::uuid;expiry timestamptz;begin
 perform public.fitverse_review_payment(o,true);
 select expires_at into expiry from public.fitverse_memberships where user_id='20000000-0000-4000-8000-000000000001';
 if expiry<now()+interval '27 days' then raise exception 'activation_failed';end if;
 begin perform public.fitverse_review_payment(o,true);raise exception 'double_approval_allowed';exception when raise_exception then if sqlerrm<>'invalid_status' then raise;end if;end;
 if (select expires_at from public.fitverse_memberships where user_id='20000000-0000-4000-8000-000000000001')<>expiry then raise exception 'double_duration';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$declare o uuid;begin
 if not (public.fitverse_access()->>'full')::boolean then raise exception 'membership_not_active';end if;
 o:=public.fitverse_create_payment('pro','annual','wallet');
 begin perform public.fitverse_submit_payment(o,'synthetic_reference_1');raise exception 'duplicate_reference_accepted';exception when raise_exception then if sqlerrm<>'duplicate_reference' then raise;end if;end;
 perform public.fitverse_submit_payment(o,'SYNTHETIC_REFERENCE_3');
 perform set_config('test.rejected',o::text,true);
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select public.fitverse_review_payment(current_setting('test.rejected')::uuid,false);
do $$begin if (select count(*) from public.fitverse_audit where action like 'manual_payment_%')<>2 then raise exception 'audit_failed';end if;end$$;
rollback;
select 'PASS: canonical prices, disabled plan, owner isolation, write denial, pending has no access, admin-only approval, duplicate references, repeat approval denial, rejection and audit; rollback complete' as result;
