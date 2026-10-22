-- Fitness records remain private to their owner, including from app admins.
create table public.fitdax_training(
 user_id uuid primary key references public.fitverse_accounts(user_id) on delete cascade,
 payload text not null check(octet_length(payload)<=40000),
 revision bigint not null check(revision>0),
 updated_at timestamptz not null default now()
);
create table public.fitdax_sets(
 user_id uuid not null references public.fitverse_accounts(user_id) on delete cascade,
 id uuid not null,
 entry_date date not null,
 payload text not null check(octet_length(payload)<=8000),
 content_mac text not null check(content_mac ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 primary key(user_id,id)
);
create index fitdax_sets_owner_date on public.fitdax_sets(user_id,entry_date desc,id desc);
alter table public.fitdax_training enable row level security;
alter table public.fitdax_sets enable row level security;
revoke all on public.fitdax_training,public.fitdax_sets from public,anon,authenticated;
grant select on public.fitdax_training to authenticated;
grant select,delete on public.fitdax_sets to authenticated;
create policy training_own_read on public.fitdax_training for select to authenticated using((select auth.uid())=user_id);
create policy sets_own_read on public.fitdax_sets for select to authenticated using((select auth.uid())=user_id);
create policy sets_own_delete on public.fitdax_sets for delete to authenticated using((select auth.uid())=user_id);

-- Writes need atomic revision checks and quotas, so narrowly scoped functions
-- live in the private schema. The public wrappers remain SECURITY INVOKER.
create function private.fitdax_save_training(p_revision bigint,p_payload text) returns bigint
language plpgsql security definer set search_path='' as $$
declare who uuid:=(select auth.uid()); changed integer; req integer;
begin
 if who is null or not exists(select 1 from auth.users where id=who and email_confirmed_at is not null) then raise exception 'authentication_required';end if;
 if p_revision is null or p_revision<0 or p_payload is null or octet_length(p_payload)>40000 or (p_payload::jsonb->>'v') is distinct from '1' then raise exception 'invalid_data';end if;
 insert into private.fitverse_quotas(user_id,bucket,requests) values(who,floor(extract(epoch from now())/60)::bigint,1)
 on conflict(user_id) do update set requests=case when fitverse_quotas.bucket=excluded.bucket then fitverse_quotas.requests+1 else 1 end,bucket=excluded.bucket returning requests into req;
 if req>60 then raise exception 'rate_limited';end if;
 if p_revision=0 then insert into public.fitdax_training(user_id,payload,revision) values(who,p_payload,1) on conflict do nothing;
 else update public.fitdax_training set payload=p_payload,revision=revision+1,updated_at=now() where user_id=who and revision=p_revision;end if;
 get diagnostics changed=row_count;if changed<>1 then raise exception 'revision_conflict';end if;
 return p_revision+1;
end;$$;
revoke all on function private.fitdax_save_training(bigint,text) from public,anon;
grant execute on function private.fitdax_save_training(bigint,text) to authenticated;
create function public.fitdax_save_training(p_revision bigint,p_payload text) returns bigint
language sql security invoker set search_path='' as $$select private.fitdax_save_training(p_revision,p_payload)$$;
revoke all on function public.fitdax_save_training(bigint,text) from public,anon;
grant execute on function public.fitdax_save_training(bigint,text) to authenticated;

create function private.fitdax_append_sets(p_rows jsonb) returns integer
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
  select content_mac into existing from public.fitdax_sets where user_id=who and id=(record_data->>'id')::uuid;
  if existing is not null and existing<>(record_data->>'content_mac') then raise exception 'record_conflict';end if;
  insert into public.fitdax_sets(user_id,id,entry_date,payload,content_mac) values(who,(record_data->>'id')::uuid,(record_data->>'date')::date,record_data->>'payload',record_data->>'content_mac') on conflict(user_id,id) do nothing;
  get diagnostics changed=row_count;inserted:=inserted+changed;
 end loop;
 return inserted;
end;$$;
revoke all on function private.fitdax_append_sets(jsonb) from public,anon;
grant execute on function private.fitdax_append_sets(jsonb) to authenticated;
create function public.fitdax_append_sets(p_rows jsonb) returns integer language sql security invoker set search_path='' as $$select private.fitdax_append_sets(p_rows)$$;
revoke all on function public.fitdax_append_sets(jsonb) from public,anon;
grant execute on function public.fitdax_append_sets(jsonb) to authenticated;
