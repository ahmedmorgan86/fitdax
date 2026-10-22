begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','fitverse-qa-a@example.invalid',now(),'{"role":"admin"}'),
 ('10000000-0000-4000-8000-000000000002','fitverse-qa-b@example.invalid',now(),'{}'),
 ('10000000-0000-4000-8000-000000000003','fitverse-qa-admin@example.invalid',now(),'{}');
insert into private.fitverse_admin_emails(email) values('fitverse-qa-admin@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","email":"fitverse-qa-a@example.invalid"}',true);
do $$begin
 if (public.fitverse_access()->>'role')<>'member' then raise exception 'unsafe_metadata_role';end if;
 if (public.fitverse_access()->>'full')::boolean then raise exception 'free_full_access';end if;
 if public.fitverse_save_account(0,'{"v":1,"iv":"test","data":"synthetic"}')<>1 then raise exception 'save_failed';end if;
 if (select count(*) from public.fitverse_accounts)<>1 then raise exception 'own_read_failed';end if;
 begin perform public.fitverse_save_catalog(0,'{}');raise exception 'member_catalog_write_allowed';exception when raise_exception then if sqlerrm<>'admin_required' then raise;end if;end;
 begin perform public.fitverse_save_account(0,'{"v":1}');raise exception 'stale_write_allowed';exception when raise_exception then if sqlerrm<>'revision_conflict' then raise;end if;end;
 begin insert into public.fitverse_memberships(user_id,plan,status,expires_at) values('10000000-0000-4000-8000-000000000001','pro','active',now()+interval '1 day');raise exception 'self_upgrade_allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.fitverse_accounts)<>0 then raise exception 'cross_user_read';end if;
 if public.fitverse_delete_account(1) then raise exception 'cross_user_delete';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$declare catalog_version bigint; audit_count bigint;begin
 if (public.fitverse_access()->>'role')<>'admin' or not (public.fitverse_access()->>'full')::boolean then raise exception 'admin_missing';end if;
 if (select count(*) from public.fitverse_accounts)<>0 then raise exception 'admin_health_read_leak';end if;
 select coalesce(max(revision),0) into catalog_version from public.fitverse_catalog;
 select count(*) into audit_count from public.fitverse_audit;
 if public.fitverse_save_catalog(catalog_version,'{"brand":"Synthetic test"}')<>catalog_version+1 then raise exception 'admin_write_failed';end if;
 if (select count(*) from public.fitverse_audit)<>audit_count+1 then raise exception 'audit_missing';end if;
 insert into public.fitverse_memberships(user_id,plan,status,expires_at) values('10000000-0000-4000-8000-000000000001','pro','active',now()+interval '1 day');
end$$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$begin
 if not (public.fitverse_access()->>'full')::boolean then raise exception 'active_membership_missing';end if;
 if (select count(*) from public.fitverse_audit)<>0 then raise exception 'audit_visible_to_member';end if;
 if public.fitverse_delete_account(2) then raise exception 'stale_delete_allowed';end if;
 if not public.fitverse_delete_account(1) then raise exception 'own_delete_failed';end if;
end$$;
rollback;
select 'PASS: role forgery, admin authorization, account isolation, CAS, grants, audit visibility and deletion; all synthetic records rolled back.' as result;
