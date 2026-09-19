import { Logo } from './Logo'

export function SetupNotice() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-lg font-bold text-ink">إعداد المشروع غير مكتمل</h1>
        <p className="mt-2 text-sm text-ink-soft">
          لم يتم ضبط متغيرات الاتصال بـ Supabase. انسخ ملف <code className="rounded bg-bg px-1.5 py-0.5 text-xs">.env.example</code> إلى{' '}
          <code className="rounded bg-bg px-1.5 py-0.5 text-xs">.env.example</code> وأضف رابط ومفتاح مشروعك على Supabase، ثم أعد تشغيل الخادم.
        </p>
        <pre dir="ltr" className="mt-4 overflow-x-auto rounded-lg bg-ink p-3 text-start text-xs text-white">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx`}
        </pre>
      </div>
    </div>
  )
}
