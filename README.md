# وصلة (Wasla) — منصة طلبات وتوصيل

مشروع Web Application كامل من نوع Marketplace + Delivery Platform، مبني على React + TypeScript + Vite + Tailwind CSS + Supabase.

## المحتويات

- [التشغيل محليًا](#التشغيل-محليًا)
- [ربط Supabase](#ربط-supabase)
- [رفع المشروع على GitHub](#رفع-المشروع-على-github)
- [النشر على Vercel](#النشر-على-vercel)
- [بنية المشروع](#بنية-المشروع)
- [الأدوار والصلاحيات](#الأدوار-والصلاحيات)

## التشغيل محليًا

يتطلب Node.js 20 أو أحدث.

```bash
npm install
npm run dev      # تشغيل بيئة التطوير على http://localhost:5173
npm run build    # بناء نسخة الإنتاج في مجلد dist/
npm run preview  # معاينة نسخة الإنتاج محليًا
npm run lint     # فحص جودة الكود
```

## ربط Supabase

1. أنشئ مشروعًا جديدًا على [supabase.com](https://supabase.com).
2. من **SQL Editor**، نفّذ ملفات الترحيل (migrations) بالترتيب التالي:
   - `supabase/migrations/0001_init.sql` — الجداول، القيود، الفهارس، RLS، RPC Functions
   - `supabase/migrations/0002_storage.sql` — Storage Buckets وسياساتها
   - `supabase/migrations/0003_orders_view.sql` — واجهة قراءة مُقنَّعة للأعمدة الحساسة في الطلبات
3. (اختياري) نفّذ `supabase/seed/seed.sql` لإضافة بيانات تجريبية (أقسام، متاجر، منتجات).
4. من **Project Settings → API**، انسخ `Project URL` و `anon public key`.
5. انسخ `.env.example` إلى `.env` واملأ القيمتين:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxx
```

6. من **Authentication → Providers**، تأكد من تفعيل تسجيل الدخول بالبريد الإلكتروني.
7. أعد تشغيل `npm run dev`.

### إنشاء أول حساب Admin

كل حساب جديد يُنشأ بدور `USER` تلقائيًا (عبر Trigger على `auth.users`). لتفعيل أول حساب Admin:

```sql
update public.profiles set role = 'ADMIN' where id = '<user-id-من-auth.users>';
```

بعد ذلك، يمكن لهذا الحساب ترقية أي مستخدم آخر إلى `ADMIN` أو `STORE` أو `DELIVERY` من لوحة تحكم الإدارة مباشرة.

> **ملاحظة أمنية:** إنشاء حسابات المتاجر والمندوبين يتم بترقية حساب مستخدم عادي (تم تسجيله من صفحة `/register`) إلى الدور المطلوب من لوحة تحكم الإدارة — وليس بإنشاء المستخدم مباشرة من الواجهة الأمامية. هذا لأن إنشاء مستخدمي Supabase Auth يتطلب صلاحية `service_role`، والتي **يجب ألا تظهر في الواجهة الأمامية أبدًا**.

## رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "Initial commit: وصلة marketplace + delivery platform"
git branch -M main
git remote add origin <رابط-المستودع>
git push -u origin main
```

ملف `.gitignore` جاهز ويستثني `node_modules`, `.env`, `dist`, وكل ما لا يجب رفعه.

## النشر على Vercel

1. اربط مستودع GitHub بمشروع جديد على [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**.
3. أضف متغيرات البيئة في إعدادات المشروع على Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. ملف `vercel.json` مُجهّز مسبقًا بإعادة التوجيه (rewrite) اللازمة لعمل React Router كـ SPA.
5. Deploy.

## بنية المشروع

```text
src/
├── app/            # الموجّه (router) ومزودو الحالة العامة (providers)
├── components/     # عناصر واجهة عامة (ui) وتخطيطات (layout) ومكونات مشتركة (common)
├── features/       # منطق كل ميزة: auth, stores, products, cart, orders, delivery, payments...
├── pages/          # صفحات كل دور: public, user, store, admin, delivery
├── types/          # أنواع TypeScript المطابقة لقاعدة البيانات
├── lib/            # عميل Supabase وأدوات مساعدة
├── utils/
└── constants/      # تسميات الحالات، الأدوار، المسارات الافتراضية

supabase/
├── migrations/     # SQL كامل: جداول + RLS + RPC + Storage
└── seed/           # بيانات تجريبية اختيارية
```

## الأدوار والصلاحيات

| الدور | الوصول |
|---|---|
| **USER** | تصفح، طلب، متابعة طلباته، تقييم المتاجر |
| **STORE** | إدارة متجره ومنتجاته وطلباته فقط (RLS تمنع الوصول لمتجر آخر) |
| **DELIVERY** | استلام الطلبات الجاهزة (بآلية آمنة من تضارب التزامن) ومتابعة طلباته المُسندة فقط |
| **ADMIN** | صلاحية كاملة: مستخدمون، متاجر، مندوبون، أقسام، منتجات، طلبات، مدفوعات، إعدادات |

جميع القواعد مطبّقة على مستوى **قاعدة البيانات (RLS + RPC)**، وليس فقط في الواجهة الأمامية.
