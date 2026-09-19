-- =====================================================================
-- orders_view — a column-masked read surface for orders.
--
-- Why this exists: Row Level Security on public.orders controls which
-- ROWS a role can see, but every logged-in user shares the same
-- Postgres "authenticated" role in Supabase, so plain column GRANTs
-- cannot distinguish "the customer" from "the delivery person" on the
-- same row. Delivery accounts are allowed to see their assigned order
-- (a row-level concern, already handled by orders_select_participants_or_admin),
-- but must NEVER see payment_proof_url, payment_transaction_reference,
-- wallet_phone_used, or payment_status (a column-level concern). This
-- view nulls those columns out for everyone except the order's own
-- customer and admins, regardless of which row-level policy let the
-- caller reach the row in the first place.
--
-- All frontend reads go through this view. Only the SECURITY DEFINER
-- RPCs (accept_order, advance_order_status, verify_payment, etc.)
-- touch the base table directly, and they never return proof/reference
-- data to a delivery caller either.
-- =====================================================================

create view public.orders_view
with (security_invoker = true) as
select
  o.id,
  o.user_id,
  o.store_id,
  o.delivery_id,
  o.address_id,
  o.phone,
  o.subtotal,
  o.delivery_fee,
  o.total,
  o.status,
  o.payment_method,
  case when o.user_id = auth.uid() or public.is_admin() then o.payment_status else null end as payment_status,
  case when o.user_id = auth.uid() or public.is_admin() then o.payment_transaction_reference else null end as payment_transaction_reference,
  case when o.user_id = auth.uid() or public.is_admin() then o.payment_proof_url else null end as payment_proof_url,
  case when o.user_id = auth.uid() or public.is_admin() then o.wallet_phone_used else null end as wallet_phone_used,
  o.notes,
  o.accepted_at,
  o.delivered_at,
  o.created_at,
  o.updated_at
from public.orders o;

grant select on public.orders_view to authenticated;

comment on view public.orders_view is
  'Column-masked read surface for orders. Payment proof/reference/wallet data is nulled out unless the caller is the order''s own customer or an admin, closing the gap RLS alone cannot close on a shared "authenticated" role.';
