create or replace function public.fitdax_flag_card_review(p_provider_order bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.fitdax_paymob_orders set status='needs_review' where provider_order_id=p_provider_order;
 if not found then raise exception 'order_not_bound';end if;
end$$;
revoke all on function public.fitdax_flag_card_review(bigint) from public,anon,authenticated;
grant execute on function public.fitdax_flag_card_review(bigint) to service_role;
