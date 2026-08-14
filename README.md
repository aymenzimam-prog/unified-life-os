# 🧭 نظام حياتي — العادات + المالية (Unified Life OS)

تطبيق ويب حقيقي (Next.js 14 + Supabase) يجمع بين:
- ✅ **تتبع العادات اليومية** (سلاسل Streak، شبكة أسبوعية، إحصائيات)
- 💰 **إدارة مالية شخصية** (فئات دخل/مصروف، معاملات، لوحة تحكم موحّدة)

مبني على منطق نظام `ERP-ALLA` المالي الذي أرفقته (نفس بنية `main_group` / `sub_category`)، ومطوَّر ليشمل أيضاً نظام العادات من ملف `productivity-system-index.html`، بنفس الهوية البصرية (خلفية داكنة، ذهبي/تركواز).

---

## 1) المتطلبات

- Node.js 18.18 أو أحدث
- حساب مجاني على [supabase.com](https://supabase.com)

## 2) إنشاء مشروع Supabase

1. أنشئ مشروعاً جديداً على supabase.com (اختر منطقة قريبة، مثلاً Frankfurt).
2. من **SQL Editor** داخل لوحة Supabase، افتح ملف `supabase/schema.sql` من هذا المشروع وانسخ محتواه بالكامل، ثم نفّذه (Run). هذا سينشئ كل الجداول + سياسات الأمان (RLS) + الـ Views تلقائياً.
3. من **Project Settings → API**، انسخ:
   - `Project URL`
   - `anon public key`

## 3) تهيئة المشروع محلياً

```bash
# فك الضغط ثم:
cd app-workspace
npm install
cp .env.example .env.local
```

افتح `.env.local` وضع القيم التي نسختها من Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxx
```

## 4) التشغيل

```bash
npm run dev
```

افتح المتصفح على `http://localhost:3000` → سيتم توجيهك تلقائياً لصفحة تسجيل الدخول.

1. اضغط "حساب جديد" وسجّل بريدك وكلمة مرور (6 أحرف فأكثر).
2. بشكل افتراضي Supabase يتطلب تأكيد البريد الإلكتروني — يمكنك تعطيل هذا مؤقتاً للتجربة من:
   `Authentication → Providers → Email → Confirm email` (أطفئه أثناء التطوير فقط).
3. بعد الدخول، اذهب إلى **الفئات** وأضف فئات دخل/مصروف (مثال: دخل → الراتب → راتب شهري)، ثم إلى **المالية** لتسجيل أول معاملة، وإلى **العادات** لإضافة أول عادة.

## 5) البنية

```
app/
  login/                 صفحة الدخول + إنشاء حساب (Supabase Auth)
  auth/callback/         معالج تأكيد البريد/OAuth
  (app)/                 كل الشاشات المحمية (تتطلب تسجيل دخول)
    dashboard/           لوحة التحكم الموحّدة (عادات + مال)
    habits/              شبكة العادات الأسبوعية + السلاسل
    finance/             المعاملات المالية
    finance/categories/  إدارة الفئات
    settings/            إعدادات الملف الشخصي

components/              مكوّنات واجهة قابلة لإعادة الاستخدام
lib/supabase/            عملاء Supabase (متصفح + سيرفر)
middleware.ts            حماية المسارات + مزامنة الجلسة
supabase/schema.sql       المخطط الكامل لقاعدة البيانات + RLS
```

## 6) خطوات النشر (Deploy)

- **الويب**: انشر المشروع مباشرة على [Vercel](https://vercel.com) (استورد المستودع، أضف نفس متغيرَي البيئة، Deploy).
- **الموبايل**: بما أن الواجهة مبنية بـ Next.js فهي قابلة للتثبيت كـ **PWA** فوراً على الجوال (Add to Home Screen). لتطبيق موبايل أصلي لاحقاً (React Native / Flutter)، استخدم **نفس مشروع Supabase** (نفس الجداول وسياسات RLS) — لا حاجة لإعادة بناء الـ Backend، فقط عميل جديد يتصل بنفس القاعدة عبر `@supabase/supabase-js` (React Native) أو `supabase_flutter` (Flutter).

## 7) الخطوات التالية المقترحة (Roadmap)

- رسوم بيانية (Recharts مثبتة بالفعل) لصفحة المالية: مخطط شهري دخل/مصروف، توزيع المصروفات حسب الفئة.
- صفحة الميزانيات الشهرية (جدول `budgets` جاهز في المخطط).
- تذكيرات العادات عبر Web Push أو بريد يومي (جدول `habits.reminder_time` جاهز).
- المراجعة الأسبوعية (جدول `weekly_reviews` جاهز) — نموذج بسيط لتعبئة الإنجازات والدروس كل أسبوع.
- ربط جدول `projects` بمصفوفة أيزنهاور من نظام الإنتاجية الأصلي.
