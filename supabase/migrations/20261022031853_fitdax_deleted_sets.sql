create table private.fitdax_deleted_sets(user_id uuid not null references public.fitverse_accounts(user_id) on delete cascade,id uuid not null,deleted_at timestamptz not null default now(),primary key(user_id,id));
alter table private.fitdax_deleted_sets enable row level security;
revoke all on private.fitdax_deleted_sets from public,anon,authenticated;
revoke delete on public.fitdax_sets from authenticated;
create or replace function private.fitdax_append_sets(p_rows jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare who uuid:=(select auth.uid()); record_data jsonb; existing text; inserted integer:=0; changed integer; req integer;
begin
 if who is null or not exists(select 1 from auth.users where id=who and email_confirmed_at is not null) then raise exception 'authentication_required';end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>20 or octet_length(p_rows::text)>160000 then raise exception 'invalid_data';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(who::text,22));
 insert into private.fitverse_quotas(user_id,bucket,requests) values(who,floor(extract(epoch from now())/60)::bigint,1)
 on conflict(user_id) do update set requests=case when fitverse_quotas.bucket=excluded.bucket then fitverse_quotas.requests+1 else 1 end,bucket=excluded.bucket returning requests into req;
 if req>60 then raise exception 'rate_limited';end if;
 for record_data in select value from jsonb_array_elements(p_rows) loop
  if (record_data->>'payload') is null or octet_length(record_data->>'payload')>8000 or ((record_data->>'payload')::jsonb->>'v') is distinct from '1' or (record_data->>'content_mac') is null or (record_data->>'content_mac')!~'^[a-f0-9]{64}$' or (record_data->>'date')::date<'2000-01-01' or (record_data->>'date')::date>current_date+1 then raise exception 'invalid_data';end if;
  if exists(select 1 from private.fitdax_deleted_sets where user_id=who and id=(record_data->>'id')::uuid) then continue;end if;
  select content_mac into existing from public.fitdax_sets where user_id=who and id=(record_data->>'id')::uuid;
  if existing is not null and existing<>(record_data->>'content_mac') then raise exception 'record_conflict';end if;
  insert into public.fitdax_sets(user_id,id,entry_date,payload,content_mac) values(who,(record_data->>'id')::uuid,(record_data->>'date')::date,record_data->>'payload',record_data->>'content_mac') on conflict(user_id,id) do nothing;
  get diagnostics changed=row_count;inserted:=inserted+changed;
 end loop;
 return inserted;
end;$$;

create function private.fitdax_delete_sets(p_ids uuid[]) returns integer language plpgsql security definer set search_path='' as $$
declare who uuid:=(select auth.uid()); changed integer; req integer;
begin
 if who is null or not exists(select 1 from auth.users where id=who and email_confirmed_at is not null) then raise exception 'authentication_required';end if;
 if p_ids is null or cardinality(p_ids)<1 or cardinality(p_ids)>20 or array_position(p_ids,null) is not null then raise exception 'invalid_data';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(who::text,22));
 insert into private.fitverse_quotas(user_id,bucket,requests) values(who,floor(extract(epoch from now())/60)::bigint,1)
 on conflict(user_id) do update set requests=case when fitverse_quotas.bucket=excluded.bucket then fitverse_quotas.requests+1 else 1 end,bucket=excluded.bucket returning requests into req;
 if req>60 then raise exception 'rate_limited';end if;
 insert into private.fitdax_deleted_sets(user_id,id) select who,unnest(p_ids) on conflict do nothing;
 delete from public.fitdax_sets where user_id=who and id=any(p_ids);get diagnostics changed=row_count;return changed;
end;$$;
revoke all on function private.fitdax_delete_sets(uuid[]) from public,anon;
grant execute on function private.fitdax_delete_sets(uuid[]) to authenticated;
create function public.fitdax_delete_sets(p_ids uuid[]) returns integer language sql security invoker set search_path='' as $$select private.fitdax_delete_sets(p_ids)$$;
revoke all on function public.fitdax_delete_sets(uuid[]) from public,anon;
grant execute on function public.fitdax_delete_sets(uuid[]) to authenticated;
