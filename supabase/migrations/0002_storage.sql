-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('stores', 'stores', true),
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- ---------------- avatars: public read, owner-folder write ----------------
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');
create policy avatars_owner_write on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_owner_update on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_owner_delete on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------- stores: public read, store owner or admin write ----------------
create policy stores_images_public_read on storage.objects
  for select using (bucket_id = 'stores');
create policy stores_images_owner_write on storage.objects
  for insert with check (
    bucket_id = 'stores'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );
create policy stores_images_owner_update on storage.objects
  for update using (
    bucket_id = 'stores'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );
create policy stores_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'stores'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );

-- ---------------- products: public read, owning store or admin write ----------------
create policy products_images_public_read on storage.objects
  for select using (bucket_id = 'products');
create policy products_images_owner_write on storage.objects
  for insert with check (
    bucket_id = 'products'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );
create policy products_images_owner_update on storage.objects
  for update using (
    bucket_id = 'products'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );
create policy products_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'products'
    and (public.is_admin() or public.owns_store(((storage.foldername(name))[1])::uuid))
  );

-- ---------------- categories: public read, admin-only write ----------------
create policy categories_images_public_read on storage.objects
  for select using (bucket_id = 'categories');
create policy categories_images_admin_write on storage.objects
  for insert with check (bucket_id = 'categories' and public.is_admin());
create policy categories_images_admin_update on storage.objects
  for update using (bucket_id = 'categories' and public.is_admin());
create policy categories_images_admin_delete on storage.objects
  for delete using (bucket_id = 'categories' and public.is_admin());

-- ---------------- payment-proofs: private. owner uploads to own folder,
-- readable by the uploading user, the order's store owner, and admins ----------------
create policy payment_proofs_owner_insert on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy payment_proofs_owner_select on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
create policy payment_proofs_owner_delete on storage.objects
  for delete using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
