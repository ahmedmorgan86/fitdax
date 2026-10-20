alter function public.fitverse_create_payment(text,text,text) set schema private;
alter function public.fitverse_submit_payment(uuid,text) set schema private;
alter function public.fitverse_review_payment(uuid,boolean) set schema private;
create function public.fitverse_create_payment(p_plan text,p_period text,p_method text) returns uuid language sql security invoker set search_path='' as $$select private.fitverse_create_payment(p_plan,p_period,p_method)$$;
create function public.fitverse_submit_payment(p_id uuid,p_reference text) returns boolean language sql security invoker set search_path='' as $$select private.fitverse_submit_payment(p_id,p_reference)$$;
create function public.fitverse_review_payment(p_id uuid,p_approve boolean) returns boolean language sql security invoker set search_path='' as $$select private.fitverse_review_payment(p_id,p_approve)$$;
revoke all on function public.fitverse_create_payment(text,text,text),public.fitverse_submit_payment(uuid,text),public.fitverse_review_payment(uuid,boolean) from public,anon;
grant execute on function public.fitverse_create_payment(text,text,text),public.fitverse_submit_payment(uuid,text),public.fitverse_review_payment(uuid,boolean) to authenticated;
