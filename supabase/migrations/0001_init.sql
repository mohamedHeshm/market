-- =====================================================================
-- وصلة (Wasla) — Marketplace + Delivery Platform
-- Initial schema migration
-- Roles: USER, ADMIN, STORE, DELIVERY
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- ENUM-LIKE CHECK DOMAINS (kept as text + check constraints so the
-- values are easy to read directly in the database and in Supabase UI)
-- =====================================================================

-- =====================================================================
-- profiles
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null default 'USER',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('USER','ADMIN','STORE','DELIVERY'))
);

create index profiles_role_idx on public.profiles(role);
create index profiles_is_active_idx on public.profiles(is_active);

-- =====================================================================
-- categories
-- =====================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_unique unique (name)
);

create index categories_is_active_idx on public.categories(is_active);

-- =====================================================================
-- stores
-- =====================================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stores_owner_id_idx on public.stores(owner_id);
create index stores_is_active_idx on public.stores(is_active);

-- =====================================================================
-- products
-- =====================================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_positive check (price >= 0)
);

create index products_store_id_idx on public.products(store_id);
create index products_category_id_idx on public.products(category_id);
create index products_is_active_idx on public.products(is_active);
create index products_name_search_idx on public.products using gin (to_tsvector('simple', name));

-- =====================================================================
-- addresses
-- =====================================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  address text not null,
  phone text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses(user_id);

-- =====================================================================
-- orders
-- =====================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  store_id uuid not null references public.stores(id),
  delivery_id uuid references public.profiles(id),
  address_id uuid not null references public.addresses(id),
  phone text not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'PENDING',
  payment_method text,
  payment_status text default 'UNPAID',
  payment_transaction_reference text,
  payment_proof_url text,
  wallet_phone_used text,
  notes text,
  accepted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in (
    'PENDING','CONFIRMED','PREPARING','READY_FOR_DELIVERY',
    'ASSIGNED','ON_THE_WAY','DELIVERED','CANCELLED','REJECTED'
  )),
  constraint orders_payment_method_check check (payment_method is null or payment_method in ('CASH_WALLET')),
  constraint orders_payment_status_check check (payment_status is null or payment_status in (
    'UNPAID','WAITING_VERIFICATION','PAID','REJECTED'
  )),
  constraint orders_totals_non_negative check (subtotal >= 0 and delivery_fee >= 0 and total >= 0)
);

create index orders_user_id_idx on public.orders(user_id);
create index orders_store_id_idx on public.orders(store_id);
create index orders_delivery_id_idx on public.orders(delivery_id);
create index orders_status_idx on public.orders(status);
create index orders_ready_for_delivery_idx on public.orders(status) where status = 'READY_FOR_DELIVERY' and delivery_id is null;

-- =====================================================================
-- order_items
-- =====================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  price numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_price_non_negative check (price >= 0),
  constraint order_items_total_non_negative check (total >= 0)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

-- =====================================================================
-- notifications
-- =====================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_is_read_idx on public.notifications(user_id, is_read);

-- =====================================================================
-- reviews
-- =====================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_one_per_order unique (user_id, order_id)
);

create index reviews_store_id_idx on public.reviews(store_id);

-- =====================================================================
-- payment_settings  (single row settings table)
-- =====================================================================
create table public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  wallet_enabled boolean not null default false,
  wallet_phone text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- enforce a single settings row
create unique index payment_settings_single_row on public.payment_settings ((true));

insert into public.payment_settings (wallet_enabled, wallet_phone) values (false, null);

-- =====================================================================
-- updated_at triggers
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger stores_set_updated_at before update on public.stores
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- =====================================================================
-- helper functions (SECURITY DEFINER, used by RLS policies)
-- =====================================================================
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'ADMIN' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.stores
    where id = p_store_id and owner_id = auth.uid()
  );
$$;

-- =====================================================================
-- new-user handling: create a profile row automatically on signup
-- role always starts as USER; ADMIN/STORE/DELIVERY are promoted later
-- by an admin action, never chosen by the signing-up user.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    'USER'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC: accept_order — the core concurrency-safe delivery claim
-- Only one DELIVERY user can ever win the race for the same order.
-- =====================================================================
create or replace function public.accept_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if v_role is distinct from 'DELIVERY' then
    raise exception 'Only delivery accounts can accept orders' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and is_active) then
    raise exception 'Delivery account is not active' using errcode = '42501';
  end if;

  -- Atomic conditional update: this single statement is the lock.
  -- Postgres row-level locking on UPDATE guarantees that concurrent
  -- callers serialize on this row, and the WHERE clause guarantees
  -- only the first caller whose predicate still holds wins.
  update public.orders
     set delivery_id = auth.uid(),
         status = 'ASSIGNED',
         accepted_at = now()
   where id = p_order_id
     and status = 'READY_FOR_DELIVERY'
     and delivery_id is null
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Order already assigned' using errcode = 'P0001';
  end if;

  insert into public.notifications (user_id, title, message, type)
  values (v_order.user_id, 'مندوب في الطريق', 'تم استلام طلبك من قبل مندوب التوصيل.', 'DELIVERY_ACCEPTED');

  return v_order;
end;
$$;

revoke all on function public.accept_order(uuid) from public;
grant execute on function public.accept_order(uuid) to authenticated;

-- =====================================================================
-- RPC: advance_order_status — enforces the allowed status flow only
-- =====================================================================
create or replace function public.advance_order_status(p_order_id uuid, p_new_status text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_role text;
  v_allowed boolean := false;
begin
  select role into v_role from public.profiles where id = auth.uid();
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- STORE can move PENDING -> CONFIRMED -> PREPARING -> READY_FOR_DELIVERY, or REJECTED from PENDING
  if v_role = 'STORE' and public.owns_store(v_order.store_id) then
    v_allowed :=
      (v_order.status = 'PENDING' and p_new_status in ('CONFIRMED','REJECTED')) or
      (v_order.status = 'CONFIRMED' and p_new_status = 'PREPARING') or
      (v_order.status = 'PREPARING' and p_new_status = 'READY_FOR_DELIVERY');
  end if;

  -- DELIVERY can move ASSIGNED -> ON_THE_WAY -> DELIVERED, only their own order
  if v_role = 'DELIVERY' and v_order.delivery_id = auth.uid() then
    v_allowed :=
      (v_order.status = 'ASSIGNED' and p_new_status = 'ON_THE_WAY') or
      (v_order.status = 'ON_THE_WAY' and p_new_status = 'DELIVERED');
  end if;

  -- ADMIN can cancel from any non-final state
  if v_role = 'ADMIN' and p_new_status = 'CANCELLED'
     and v_order.status not in ('DELIVERED','CANCELLED','REJECTED') then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Invalid status transition' using errcode = '22023';
  end if;

  update public.orders
     set status = p_new_status,
         delivered_at = case when p_new_status = 'DELIVERED' then now() else delivered_at end
   where id = p_order_id
  returning * into v_order;

  insert into public.notifications (user_id, title, message, type)
  values (
    v_order.user_id,
    'تحديث حالة الطلب',
    case p_new_status
      when 'CONFIRMED' then 'تم تأكيد طلبك من المتجر.'
      when 'PREPARING' then 'المتجر يقوم بتجهيز طلبك.'
      when 'READY_FOR_DELIVERY' then 'طلبك جاهز وبانتظار مندوب توصيل.'
      when 'ON_THE_WAY' then 'المندوب في الطريق إليك الآن.'
      when 'DELIVERED' then 'تم تسليم طلبك بنجاح.'
      when 'REJECTED' then 'تم رفض الطلب من المتجر.'
      when 'CANCELLED' then 'تم إلغاء الطلب.'
      else 'تم تحديث حالة طلبك.'
    end,
    'ORDER_STATUS'
  );

  return v_order;
end;
$$;

revoke all on function public.advance_order_status(uuid, text) from public;
grant execute on function public.advance_order_status(uuid, text) to authenticated;

-- =====================================================================
-- RPC: create_order — builds an order from the caller's cart payload,
-- re-pricing every line from the database (never trusts the client).
-- =====================================================================
create or replace function public.create_order(
  p_store_id uuid,
  p_address_id uuid,
  p_phone text,
  p_items jsonb, -- [{ "product_id": "...", "quantity": 2 }, ...]
  p_payment_method text,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products;
  v_subtotal numeric(10,2) := 0;
  v_delivery_fee numeric(10,2) := 15.00;
  v_order public.orders;
  v_wallet_phone text;
  v_wallet_enabled boolean;
begin
  if not exists (select 1 from public.stores where id = p_store_id and is_active) then
    raise exception 'Store is not available' using errcode = 'P0003';
  end if;

  if not exists (select 1 from public.addresses where id = p_address_id and user_id = auth.uid()) then
    raise exception 'Invalid address' using errcode = 'P0004';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty' using errcode = 'P0005';
  end if;

  insert into public.orders (
    user_id, store_id, address_id, phone, subtotal, delivery_fee, total,
    status, payment_method, payment_status, notes
  ) values (
    auth.uid(), p_store_id, p_address_id, p_phone, 0, v_delivery_fee, 0,
    'PENDING', p_payment_method, 'UNPAID', p_notes
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products
     where id = (v_item->>'product_id')::uuid
       and store_id = p_store_id
       and is_active
     for share;

    if v_product.id is null then
      raise exception 'Product unavailable' using errcode = 'P0006';
    end if;

    insert into public.order_items (order_id, product_id, quantity, price, total)
    values (
      v_order.id,
      v_product.id,
      (v_item->>'quantity')::integer,
      v_product.price,
      v_product.price * (v_item->>'quantity')::integer
    );

    v_subtotal := v_subtotal + v_product.price * (v_item->>'quantity')::integer;
  end loop;

  if p_payment_method = 'CASH_WALLET' then
    select wallet_enabled, wallet_phone into v_wallet_enabled, v_wallet_phone
    from public.payment_settings limit 1;

    if not coalesce(v_wallet_enabled, false) then
      raise exception 'Wallet payment is disabled' using errcode = 'P0007';
    end if;

    update public.orders set wallet_phone_used = v_wallet_phone, payment_status = 'WAITING_VERIFICATION'
     where id = v_order.id;
  end if;

  update public.orders
     set subtotal = v_subtotal,
         total = v_subtotal + v_delivery_fee
   where id = v_order.id
  returning * into v_order;

  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'تم إنشاء الطلب', 'تم استلام طلبك وهو بانتظار تأكيد المتجر.', 'ORDER_CREATED');

  return v_order;
end;
$$;

revoke all on function public.create_order(uuid, uuid, text, jsonb, text, text) from public;
grant execute on function public.create_order(uuid, uuid, text, jsonb, text, text) to authenticated;

-- =====================================================================
-- RPC: submit_payment_proof
-- =====================================================================
create or replace function public.submit_payment_proof(
  p_order_id uuid,
  p_transaction_reference text,
  p_proof_url text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  update public.orders
     set payment_transaction_reference = p_transaction_reference,
         payment_proof_url = p_proof_url,
         payment_status = 'WAITING_VERIFICATION'
   where id = p_order_id and user_id = auth.uid()
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  return v_order;
end;
$$;

revoke all on function public.submit_payment_proof(uuid, text, text) from public;
grant execute on function public.submit_payment_proof(uuid, text, text) to authenticated;

-- =====================================================================
-- RPC: verify_payment — admin only, confirm or reject a wallet payment
-- =====================================================================
create or replace function public.verify_payment(p_order_id uuid, p_approve boolean)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  update public.orders
     set payment_status = case when p_approve then 'PAID' else 'REJECTED' end
   where id = p_order_id
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  insert into public.notifications (user_id, title, message, type)
  values (
    v_order.user_id,
    case when p_approve then 'تم تأكيد الدفع' else 'تم رفض الدفع' end,
    case when p_approve then 'تم التحقق من عملية الدفع بنجاح.' else 'لم يتم التحقق من عملية الدفع، يرجى مراجعة المتجر.' end,
    'PAYMENT_STATUS'
  );

  return v_order;
end;
$$;

revoke all on function public.verify_payment(uuid, boolean) from public;
grant execute on function public.verify_payment(uuid, boolean) to authenticated;

-- =====================================================================
-- RPC: update_payment_settings — admin only
-- =====================================================================
create or replace function public.update_payment_settings(p_wallet_enabled boolean, p_wallet_phone text)
returns public.payment_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.payment_settings;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  update public.payment_settings
     set wallet_enabled = p_wallet_enabled,
         wallet_phone = p_wallet_phone,
         updated_at = now(),
         updated_by = auth.uid()
  returning * into v_settings;

  return v_settings;
end;
$$;

revoke all on function public.update_payment_settings(boolean, text) from public;
grant execute on function public.update_payment_settings(boolean, text) to authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.payment_settings enable row level security;

-- ---------------- profiles ----------------
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
  -- role column can never be changed by the user themselves via this policy

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- categories ----------------
create policy categories_select_active_or_admin on public.categories
  for select using (is_active or public.is_admin());

create policy categories_admin_write on public.categories
  for insert with check (public.is_admin());
create policy categories_admin_update on public.categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy categories_admin_delete on public.categories
  for delete using (public.is_admin());

-- ---------------- stores ----------------
create policy stores_select_active_or_owner_or_admin on public.stores
  for select using (is_active or owner_id = auth.uid() or public.is_admin());

create policy stores_admin_insert on public.stores
  for insert with check (public.is_admin());
create policy stores_owner_or_admin_update on public.stores
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (owner_id = auth.uid() and owner_id = (select owner_id from public.stores s where s.id = id))
  );
create policy stores_admin_delete on public.stores
  for delete using (public.is_admin());

-- ---------------- products ----------------
create policy products_select_active_or_owner_or_admin on public.products
  for select using (
    is_active
    or public.owns_store(store_id)
    or public.is_admin()
  );

create policy products_owner_or_admin_insert on public.products
  for insert with check (public.owns_store(store_id) or public.is_admin());
create policy products_owner_or_admin_update on public.products
  for update using (public.owns_store(store_id) or public.is_admin())
  with check (public.owns_store(store_id) or public.is_admin());
create policy products_owner_or_admin_delete on public.products
  for delete using (public.owns_store(store_id) or public.is_admin());

-- ---------------- addresses ----------------
create policy addresses_owner_or_admin_select on public.addresses
  for select using (user_id = auth.uid() or public.is_admin());
create policy addresses_owner_insert on public.addresses
  for insert with check (user_id = auth.uid());
create policy addresses_owner_update on public.addresses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_owner_delete on public.addresses
  for delete using (user_id = auth.uid());

-- ---------------- orders ----------------
-- direct INSERT is blocked; orders are only created through create_order()
-- which runs as SECURITY DEFINER and re-prices everything server-side.
create policy orders_select_participants_or_admin on public.orders
  for select using (
    user_id = auth.uid()
    or delivery_id = auth.uid()
    or public.owns_store(store_id)
    or public.is_admin()
    or (status = 'READY_FOR_DELIVERY' and delivery_id is null and public.current_role() = 'DELIVERY')
  );

-- status/assignment changes only via accept_order()/advance_order_status()
-- (both SECURITY DEFINER); no direct UPDATE policy is granted to non-admins.
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy orders_admin_delete on public.orders
  for delete using (public.is_admin());

-- ---------------- order_items ----------------
create policy order_items_select_participants_or_admin on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or o.delivery_id = auth.uid() or public.owns_store(o.store_id) or public.is_admin())
    )
  );
-- order_items are only written by create_order(); no direct write policy.

-- ---------------- notifications ----------------
create policy notifications_owner_select on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy notifications_owner_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_system_insert on public.notifications
  for insert with check (public.is_admin());
  -- regular notification rows are inserted by SECURITY DEFINER RPCs above

-- ---------------- reviews ----------------
create policy reviews_select_all on public.reviews
  for select using (true);
create policy reviews_owner_insert on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'DELIVERED'
    )
  );
create policy reviews_owner_update on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_owner_or_admin_delete on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------- payment_settings ----------------
create policy payment_settings_select_all on public.payment_settings
  for select using (true);
-- writes only via update_payment_settings() RPC (admin-checked inside)

-- =====================================================================
-- REALTIME
-- =====================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
