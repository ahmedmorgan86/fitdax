begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('20000000-0000-4000-8000-000000000001','fitdax-training-qa-a@example.invalid',now(),'{"role":"admin"}'),
 ('20000000-0000-4000-8000-000000000002','fitdax-training-qa-b@example.invalid',now(),'{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$declare records jsonb;begin
 if public.fitverse_save_account(0,'{"v":1,"iv":"test","data":"synthetic"}')<>1 then raise exception 'account_failed';end if;
 if public.fitdax_save_training(0,'{"v":1,"iv":"test","data":"synthetic"}')<>1 then raise exception 'settings_failed';end if;
 begin perform public.fitdax_save_training(0,'{"v":1}');raise exception 'stale_write_allowed';exception when raise_exception then if sqlerrm<>'revision_conflict' then raise;end if;end;
 records:=jsonb_build_array(jsonb_build_object('id','20000000-0000-4000-8000-000000000010','date',current_date::text,'payload','{"v":1,"iv":"test","data":"synthetic"}','content_mac',repeat('a',64)));
 if public.fitdax_append_sets(records)<>1 then raise exception 'log_failed';end if;
 if public.fitdax_append_sets(records)<>0 then raise exception 'retry_duplicate';end if;
 begin perform public.fitdax_append_sets(jsonb_set(records,'{0,content_mac}',to_jsonb(repeat('b',64))));raise exception 'id_conflict_ignored';exception when raise_exception then if sqlerrm<>'record_conflict' then raise;end if;end;
 if (select count(*) from public.fitdax_sets)<>1 or (select count(*) from public.fitdax_training)<>1 then raise exception 'own_read_failed';end if;
 begin insert into public.fitdax_training(user_id,payload,revision) values('20000000-0000-4000-8000-000000000002','{}',1);raise exception 'direct_write_allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.fitverse_save_account(0,'{"v":1,"iv":"test","data":"synthetic"}');
do $$begin
 if (select count(*) from public.fitdax_sets)<>0 or (select count(*) from public.fitdax_training)<>0 then raise exception 'cross_user_read';end if;
 begin delete from public.fitdax_sets where id='20000000-0000-4000-8000-000000000010';raise exception 'direct_delete_allowed';exception when insufficient_privilege then null;end;
 if public.fitdax_delete_sets(array['20000000-0000-4000-8000-000000000010']::uuid[])<>0 then raise exception 'cross_user_delete';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$declare records jsonb;begin
 if (select count(*) from public.fitdax_sets)<>1 then raise exception 'cross_user_delete_happened';end if;
 if public.fitdax_delete_sets(array['20000000-0000-4000-8000-000000000010']::uuid[])<>1 then raise exception 'own_delete_failed';end if;
 records:=jsonb_build_array(jsonb_build_object('id','20000000-0000-4000-8000-000000000010','date',current_date::text,'payload','{"v":1,"iv":"test","data":"synthetic"}','content_mac',repeat('a',64)));
 if public.fitdax_append_sets(records)<>0 or (select count(*) from public.fitdax_sets)<>0 then raise exception 'deleted_set_resurrected';end if;
 if not public.fitverse_delete_account(1) then raise exception 'delete_failed';end if;
 if (select count(*) from public.fitdax_sets)<>0 or (select count(*) from public.fitdax_training)<>0 then raise exception 'cascade_failed';end if;
end$$;
reset role;
set local role anon;
do $$begin
 begin perform count(*) from public.fitdax_sets;raise exception 'anon_read';exception when insufficient_privilege then null;end;
 begin perform public.fitdax_append_sets('[]');raise exception 'anon_rpc';exception when insufficient_privilege then null;end;
end$$;
rollback;
select 'PASS: private records, owner isolation, CAS, retry idempotency, ID conflicts, permanent deletion against delayed retries, anon denial and fitness-data deletion cascade; all fixtures rolled back.' as result;
