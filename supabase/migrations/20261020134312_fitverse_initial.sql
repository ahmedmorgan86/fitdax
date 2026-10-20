create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table private.fitverse_admin_emails(email text primary key);
insert into private.fitverse_admin_emails(email) values ('ahmed.morgan2009@gmail.com');
revoke all on private.fitverse_admin_emails from public, anon, authenticated;
create or replace function private.fitverse_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select (select auth.uid()) is not null and exists(
 select 1 from auth.users u join private.fitverse_admin_emails a on lower(u.email)=a.email
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null);
$$;
revoke all on function private.fitverse_admin() from public,anon;
grant execute on function private.fitverse_admin() to authenticated;

create table public.fitverse_accounts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload text not null check(octet_length(payload)<=350000),
 revision bigint not null check(revision>0),
 consent_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.fitverse_accounts enable row level security;
revoke all on public.fitverse_accounts from anon,authenticated;
grant select on public.fitverse_accounts to authenticated;
create policy account_owner_read on public.fitverse_accounts for select to authenticated using ((select auth.uid())=user_id);

create table private.fitverse_quotas(user_id uuid primary key references auth.users(id) on delete cascade,bucket bigint not null,requests integer not null);
revoke all on private.fitverse_quotas from public,anon,authenticated;

create table public.fitverse_memberships(
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null check(plan in ('pro','premium')),
 status text not null check(status in ('active','revoked')),
 expires_at timestamptz not null,
 source text not null default 'admin_grant' check(source in ('admin_grant','verified_payment'))
);
alter table public.fitverse_memberships enable row level security;
revoke all on public.fitverse_memberships from anon,authenticated;
grant select,insert,update,delete on public.fitverse_memberships to authenticated;
create policy membership_read on public.fitverse_memberships for select to authenticated using ((select auth.uid())=user_id or (select private.fitverse_admin()));
create policy membership_admin_insert on public.fitverse_memberships for insert to authenticated with check ((select private.fitverse_admin()) and source='admin_grant');
create policy membership_admin_update on public.fitverse_memberships for update to authenticated using ((select private.fitverse_admin())) with check ((select private.fitverse_admin()) and source='admin_grant');
create policy membership_admin_delete on public.fitverse_memberships for delete to authenticated using ((select private.fitverse_admin()));

create table public.fitverse_catalog(id integer primary key check(id=1),data jsonb not null check(octet_length(data::text)<=250000),revision bigint not null,updated_at timestamptz not null default now());
alter table public.fitverse_catalog enable row level security;
revoke all on public.fitverse_catalog from anon,authenticated;
grant select on public.fitverse_catalog to authenticated;
create policy catalog_read on public.fitverse_catalog for select to authenticated using (true);

create table public.fitverse_audit(id uuid primary key default gen_random_uuid(),actor uuid not null references auth.users(id),action text not null,revision bigint not null,created_at timestamptz not null default now());
alter table public.fitverse_audit enable row level security;
revoke all on public.fitverse_audit from anon,authenticated;
grant select on public.fitverse_audit to authenticated;
create policy audit_admin_read on public.fitverse_audit for select to authenticated using ((select private.fitverse_admin()));

create or replace function public.fitverse_access() returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('role',case when private.fitverse_admin() then 'admin' else 'member' end,
 'tier',case when private.fitverse_admin() then 'admin' else coalesce((select plan from public.fitverse_memberships where user_id=(select auth.uid()) and status='active' and expires_at>now()),'free') end,
 'full',private.fitverse_admin() or exists(select 1 from public.fitverse_memberships where user_id=(select auth.uid()) and status='active' and expires_at>now()));
$$;
revoke all on function public.fitverse_access() from public,anon;
grant execute on function public.fitverse_access() to authenticated;

create or replace function private.fitverse_save_account(p_revision bigint,p_payload text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare who uuid:=(select auth.uid()); changed bigint; req integer;
begin
 if who is null or not exists(select 1 from auth.users where id=who and email_confirmed_at is not null) then raise exception 'authentication_required';end if;
 if p_revision<0 or p_revision is null or octet_length(p_payload)>350000 or (p_payload::jsonb->>'v') is distinct from '1' then raise exception 'invalid_data';end if;
 insert into private.fitverse_quotas(user_id,bucket,requests) values(who,floor(extract(epoch from now())/60)::bigint,1)
 on conflict(user_id) do update set requests=case when fitverse_quotas.bucket=excluded.bucket then fitverse_quotas.requests+1 else 1 end,bucket=excluded.bucket returning requests into req;
 if req>60 then raise exception 'rate_limited';end if;
 if p_revision=0 then
 insert into public.fitverse_accounts(user_id,payload,revision) values(who,p_payload,1) on conflict do nothing;
 else update public.fitverse_accounts set payload=p_payload,revision=revision+1,updated_at=now() where user_id=who and revision=p_revision;
 end if;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'revision_conflict';end if;
 return p_revision+1;
end;$$;
revoke all on function private.fitverse_save_account(bigint,text) from public,anon;
grant execute on function private.fitverse_save_account(bigint,text) to authenticated;
create or replace function public.fitverse_save_account(p_revision bigint,p_payload text) returns bigint language sql security invoker set search_path = '' as $$select private.fitverse_save_account(p_revision,p_payload)$$;
revoke all on function public.fitverse_save_account(bigint,text) from public,anon;
grant execute on function public.fitverse_save_account(bigint,text) to authenticated;

create or replace function private.fitverse_delete_account(p_revision bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare who uuid:=(select auth.uid()); changed bigint;
begin
 if who is null then raise exception 'authentication_required';end if;
 delete from public.fitverse_accounts where user_id=who and revision=p_revision;
 get diagnostics changed=row_count;
 if changed=1 then delete from private.fitverse_quotas where user_id=who;end if;
 return changed=1;
end;$$;
revoke all on function private.fitverse_delete_account(bigint) from public,anon;
grant execute on function private.fitverse_delete_account(bigint) to authenticated;
create or replace function public.fitverse_delete_account(p_revision bigint) returns boolean language sql security invoker set search_path = '' as $$select private.fitverse_delete_account(p_revision)$$;
revoke all on function public.fitverse_delete_account(bigint) from public,anon;
grant execute on function public.fitverse_delete_account(bigint) to authenticated;

create or replace function private.fitverse_save_catalog(p_revision bigint,p_data jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare changed bigint;
begin
 if not private.fitverse_admin() then raise exception 'admin_required';end if;
 if p_revision<0 or p_revision is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>250000 then raise exception 'invalid_data';end if;
 if p_revision=0 then insert into public.fitverse_catalog(id,data,revision) values(1,p_data,1) on conflict do nothing;
 else update public.fitverse_catalog set data=p_data,revision=revision+1,updated_at=now() where id=1 and revision=p_revision;end if;
 get diagnostics changed=row_count;if changed<>1 then raise exception 'revision_conflict';end if;
 insert into public.fitverse_audit(actor,action,revision) values((select auth.uid()),'catalog_updated',p_revision+1);
 return p_revision+1;
end;$$;
revoke all on function private.fitverse_save_catalog(bigint,jsonb) from public,anon;
grant execute on function private.fitverse_save_catalog(bigint,jsonb) to authenticated;
create or replace function public.fitverse_save_catalog(p_revision bigint,p_data jsonb) returns bigint language sql security invoker set search_path = '' as $$select private.fitverse_save_catalog(p_revision,p_data)$$;
revoke all on function public.fitverse_save_catalog(bigint,jsonb) from public,anon;
grant execute on function public.fitverse_save_catalog(bigint,jsonb) to authenticated;
