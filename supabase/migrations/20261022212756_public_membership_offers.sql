create or replace function public.fitdax_public_plans() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',p->>'id','name',p->>'name','monthly',p->'monthly','annual',p->'annual','available',p->'available','ar',p->>'ar','en',p->>'en')),'[]'::jsonb)
from public.fitverse_catalog c cross join lateral jsonb_array_elements(c.data->'plans') p where c.id=1 and p->>'id' in ('free','pro','premium');
$$;
revoke all on function public.fitdax_public_plans() from public;
grant execute on function public.fitdax_public_plans() to anon,authenticated;
