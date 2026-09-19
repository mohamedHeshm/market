-- =====================================================================
-- Optional sample data for local development / demos.
-- Does NOT create any auth users, admin accounts, or delivery accounts.
-- Create those through Supabase Auth, then promote their role from the
-- Admin dashboard (or directly in the profiles table for the very first
-- admin, since only an existing admin can promote another user).
-- =====================================================================

insert into public.categories (name, description, is_active) values
  ('مطاعم', 'وجبات جاهزة من أفضل المطاعم المحلية', true),
  ('سوبر ماركت', 'بقالة ومنتجات يومية', true),
  ('صيدليات', 'أدوية ومستلزمات صحية', true),
  ('حلويات ومخبوزات', 'حلويات شرقية وغربية طازجة', true),
  ('مشروبات وعصائر', 'عصائر طبيعية ومشروبات ساخنة وباردة', true);

-- Sample stores are left without an owner_id (null) since owner_id must
-- reference a real auth user created through Supabase Auth. After you
-- create a STORE user, update owner_id via the Admin dashboard.

insert into public.stores (name, description, phone, address, is_active) values
  ('مطبخ أم محمد', 'أكلات بيتية طازجة يوميًا', '01000000001', 'شارع الجمهورية، المحلة الكبرى', true),
  ('سوبر ماركت النور', 'كل احتياجاتك اليومية في مكان واحد', '01000000002', 'شارع النهضة، المحلة الكبرى', true),
  ('حلواني الأمانة', 'حلويات شرقية بوصفات تقليدية', '01000000003', 'ميدان المحطة، المحلة الكبرى', true);

do $$
declare
  v_store_1 uuid;
  v_store_2 uuid;
  v_store_3 uuid;
  v_cat_food uuid;
  v_cat_market uuid;
  v_cat_sweets uuid;
begin
  select id into v_store_1 from public.stores where name = 'مطبخ أم محمد';
  select id into v_store_2 from public.stores where name = 'سوبر ماركت النور';
  select id into v_store_3 from public.stores where name = 'حلواني الأمانة';

  select id into v_cat_food from public.categories where name = 'مطاعم';
  select id into v_cat_market from public.categories where name = 'سوبر ماركت';
  select id into v_cat_sweets from public.categories where name = 'حلويات ومخبوزات';

  insert into public.products (store_id, category_id, name, description, price, is_active) values
    (v_store_1, v_cat_food, 'طاجن بامية باللحمة', 'بامية طازجة مطبوخة بطريقة منزلية', 95.00, true),
    (v_store_1, v_cat_food, 'محشي كرنب', 'محشي كرنب بالأرز والخضار', 80.00, true),
    (v_store_1, v_cat_food, 'كشري كبير', 'كشري مصري أصلي بالصلصة الحارة', 45.00, true),
    (v_store_2, v_cat_market, 'أرز أبو كاس 5 كيلو', 'أرز مصري فاخر', 210.00, true),
    (v_store_2, v_cat_market, 'زيت عباد الشمس 1.5 لتر', 'زيت طهي عالي الجودة', 120.00, true),
    (v_store_3, v_cat_sweets, 'كنافة بالمكسرات', 'كنافة طازجة محشوة بالمكسرات', 130.00, true),
    (v_store_3, v_cat_sweets, 'بسبوسة بالقشطة', 'بسبوسة طرية بالقشطة الطازجة', 70.00, true);
end $$;
