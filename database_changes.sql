-- =====================================================================
-- وصلة (Wasla) — database_changes.sql
--
-- تغييرات قاعدة بيانات مستقلة لهذه المهمة فقط:
--   1) الدفع عند الاستلام (Cash on Delivery) كطريقة دفع إضافية
--   2) نظام خصومات المنتجات (السعر الأصلي / نوع ونسبة الخصم / السعر النهائي)
--
-- هذا الملف إضافي وآمن بالكامل:
--   - لا يحذف أي جدول أو عمود أو بيانات موجودة.
--   - لا يعيد إنشاء أي جدول من الصفر.
--   - كل تعديل يستخدم IF NOT EXISTS أو أسلوبًا آمنًا مكافئًا، بحيث يمكن
--     إعادة تشغيل هذا الملف أكثر من مرة دون خطأ (idempotent).
--   - لا يحتوي على أي مفاتيح أو كلمات مرور أو بيانات سرية.
--
-- طريقة التشغيل: افتح هذا الملف وحده في Supabase SQL Editor واضغط Run،
-- على قاعدة بيانات تم بالفعل تطبيق ملفات supabase/migrations عليها.
-- =====================================================================


-- #######################################################################
-- # 1) المنتجات: أعمدة الخصم + السعر النهائي المحسوب تلقائيًا
-- #######################################################################

-- نوع الخصم وقيمته. NULL في الاثنين = لا يوجد خصم على المنتج.
alter table public.products
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(5,2);

-- قيد يضمن: إما لا يوجد خصم إطلاقًا، أو خصم Percentage صحيح بين 0 و100.
-- (في البداية النوع المدعوم الوحيد هو PERCENTAGE، كما هو مطلوب).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_discount_check'
  ) then
    alter table public.products
      add constraint products_discount_check
      check (
        (discount_type is null and discount_value is null)
        or (
          discount_type = 'PERCENTAGE'
          and discount_value is not null
          and discount_value > 0
          and discount_value <= 100
        )
      );
  end if;
end $$;

-- السعر النهائي محسوب دائمًا من قاعدة البيانات نفسها (Generated Column)،
-- بحيث يكون هو المرجع الوحيد والموثوق للسعر بعد الخصم في كل مكان،
-- بدل حساب الخصم بطريقة مختلفة في كل جزء من الكود.
alter table public.products
  add column if not exists final_price numeric(10,2)
  generated always as (
    case
      when discount_type = 'PERCENTAGE' and discount_value is not null
        then round(price * (100 - discount_value) / 100, 2)
      else price
    end
  ) stored;

comment on column public.products.discount_type is 'نوع الخصم على المنتج. NULL يعني عدم وجود خصم. القيمة المدعومة حاليًا: PERCENTAGE.';
comment on column public.products.discount_value is 'قيمة الخصم. لنوع PERCENTAGE هي نسبة مئوية بين 0 و100 (غير شاملة الصفر).';
comment on column public.products.final_price is 'السعر النهائي بعد الخصم، محسوب تلقائيًا من price وdiscount_type وdiscount_value. لا يُكتب فيه مباشرة أبدًا.';


-- #######################################################################
-- # 2) عناصر الطلب: حفظ السعر الأصلي قبل الخصم وقت إنشاء الطلب
-- #######################################################################
-- عمود price الحالي في order_items يستمر يحمل السعر الفعلي الذي حُسب على
-- الطلب (بعد الخصم إن وجد). نضيف original_price بجانبه فقط لعرض "كان
-- عليه خصم وقتها" في تفاصيل الطلب، دون التأثير على أي منطق حالي.

alter table public.order_items
  add column if not exists original_price numeric(10,2);

-- تعبئة القيمة للصفوف القديمة (قبل هذا التعديل) بحيث تساوي السعر
-- المحفوظ بالفعل، أي "لا يوجد خصم معروف تاريخيًا" لهذه الصفوف تحديدًا.
update public.order_items
   set original_price = price
 where original_price is null;

alter table public.order_items
  alter column original_price set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_items_original_price_non_negative'
  ) then
    alter table public.order_items
      add constraint order_items_original_price_non_negative
      check (original_price >= 0);
  end if;
end $$;

comment on column public.order_items.original_price is 'سعر الوحدة الأصلي قبل الخصم وقت إنشاء الطلب، لعرضه مشطوبًا في تفاصيل الطلب. price يبقى هو السعر الفعلي المحتسب في الطلب.';


-- #######################################################################
-- # 3) طرق الدفع: إضافة "الدفع عند الاستلام" مع الإبقاء على الحالية
-- #######################################################################

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('CASH_WALLET', 'CASH_ON_DELIVERY'));

comment on column public.orders.payment_method is 'طريقة الدفع المختارة للطلب: CASH_WALLET (الدفع بالمحفظة الحالي) أو CASH_ON_DELIVERY (الدفع عند الاستلام، جديد).';


-- #######################################################################
-- # 4) دالة create_order: تسعير كل عنصر من السعر النهائي بعد الخصم،
-- #    وحفظ original_price لكل عنصر — كل هذا على السيرفر، دون أي ثقة
-- #    بسعر قادم من الـFrontend. باقي منطق الدالة كما هو دون تغيير.
-- #######################################################################

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

    -- final_price هو عمود Generated من قاعدة البيانات نفسها (بعد الخصم
    -- إن وجد)، فهو المصدر الوحيد الموثوق للسعر — لا نثق بأي سعر يصل من
    -- الـFrontend إطلاقًا. original_price يُحفظ فقط لعرض الخصم لاحقًا.
    insert into public.order_items (order_id, product_id, quantity, price, original_price, total)
    values (
      v_order.id,
      v_product.id,
      (v_item->>'quantity')::integer,
      v_product.final_price,
      v_product.price,
      v_product.final_price * (v_item->>'quantity')::integer
    );

    v_subtotal := v_subtotal + v_product.final_price * (v_item->>'quantity')::integer;
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

  -- الدفع عند الاستلام (CASH_ON_DELIVERY) لا يحتاج أي معالجة إضافية هنا:
  -- يبقى payment_status = 'UNPAID' كما تم إدخاله، دون أي بوابة دفع، ويتم
  -- التحقق منه (إن رغب الأدمن) بنفس دالة verify_payment الموجودة أصلًا.

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


-- #######################################################################
-- # 5) رسوم التوصيل الخاصة بكل متجر (بدلًا من رسوم ثابتة للمنصة كلها)
-- #######################################################################

alter table public.stores
  add column if not exists delivery_fee numeric(10,2) not null default 15.00;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stores_delivery_fee_non_negative'
  ) then
    alter table public.stores
      add constraint stores_delivery_fee_non_negative
      check (delivery_fee >= 0);
  end if;
end $$;

comment on column public.stores.delivery_fee is 'رسوم التوصيل الخاصة بهذا المتجر، يحددها صاحب المتجر من إعداداته. القيمة الافتراضية 15 تحافظ على السلوك السابق لكل المتاجر الحالية.';

-- create_order يقرأ الآن رسوم التوصيل من المتجر نفسه بدل قيمة ثابتة
-- للمنصة كلها. باقي منطق الدالة (إعادة التسعير من final_price، حفظ
-- original_price، الدفع بالمحفظة/عند الاستلام) كما هو دون أي تغيير.
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
  v_delivery_fee numeric(10,2);
  v_order public.orders;
  v_wallet_phone text;
  v_wallet_enabled boolean;
begin
  select delivery_fee into v_delivery_fee
  from public.stores
  where id = p_store_id and is_active;

  if v_delivery_fee is null then
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

    insert into public.order_items (order_id, product_id, quantity, price, original_price, total)
    values (
      v_order.id,
      v_product.id,
      (v_item->>'quantity')::integer,
      v_product.final_price,
      v_product.price,
      v_product.final_price * (v_item->>'quantity')::integer
    );

    v_subtotal := v_subtotal + v_product.final_price * (v_item->>'quantity')::integer;
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
