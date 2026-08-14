-- =========================================================
--  نظام الإنتاجية والمالية الموحّد — Unified Habit + Finance System
--  Supabase / PostgreSQL Schema
--  شغّل هذا الملف كاملاً في: Supabase Dashboard → SQL Editor
-- =========================================================

-- ---------------------------------------------------------
-- 0. الإضافات المطلوبة
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. الملف الشخصي (profiles) — يمتد من auth.users
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  currency text not null default 'DZD',      -- عملة العرض الافتراضية
  locale text not null default 'ar',         -- ar / en / fr
  timezone text not null default 'Africa/Algiers',
  week_starts_on smallint not null default 6, -- 0=Sunday ... 6=Saturday (الأحد بداية الأسبوع هنا)
  created_at timestamptz not null default now()
);

-- إنشاء بروفايل تلقائياً عند تسجيل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
--  القسم الأول: نظام العادات (Habits)
-- =========================================================

-- 2. العادات نفسها
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                    -- مثال: "صلاة الفجر", "قراءة 30 دقيقة"
  icon text default '✅',                 -- إيموجي أو اسم أيقونة
  color text default 'gold',             -- gold | teal | blue | red | purple
  category text default 'عام',           -- عبادة / صحة / تعلم / رياضة ...
  target_type text not null default 'boolean' check (target_type in ('boolean','count','duration')),
  target_value numeric default 1,        -- مثال: 8 أكواب ماء، 30 دقيقة
  target_unit text,                      -- كوب / دقيقة / صفحة ...
  frequency text not null default 'daily' check (frequency in ('daily','weekly','custom')),
  active_days smallint[] default '{0,1,2,3,4,5,6}', -- أيام الأسبوع المفعّلة (0=أحد)
  reminder_time time,                    -- وقت التذكير
  is_archived boolean not null default false,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- 3. سجلّ إنجاز العادة يومياً (Habit Logs) — أساس الـ Streak والإحصائيات
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  status text not null default 'done' check (status in ('done','partial','skipped','missed')),
  value numeric,                         -- القيمة الفعلية المنجزة (لعادات count/duration)
  note text,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)            -- سجل واحد لكل عادة لكل يوم
);

create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, log_date);
create index if not exists idx_habit_logs_habit on public.habit_logs(habit_id);

-- 4. المراجعة الأسبوعية (Weekly Review)
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  wins text,
  challenges text,
  lessons text,
  next_week_focus text,
  mood_rating smallint check (mood_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- =========================================================
--  القسم الثاني: النظام المالي (Finance) — مبني على منطق ERP-ALLA
-- =========================================================

-- 5. الحسابات المالية (بنك، نقدي، بطاقة ...)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                    -- "AGB Dinar", "CCP", "نقدي"
  type text not null default 'cash' check (type in ('cash','bank','card','savings','other')),
  currency text not null default 'DZD',
  opening_balance numeric(15,2) not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. فئات المعاملات (main_group / sub_category — نفس منطق ERP-ALLA الأصلي)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('Income','Expense')),
  main_group text not null,              -- مثال: "المنزل", "العائلة"
  sub_category text not null,            -- مثال: "أكل", "فواتير"
  icon text default '💰',
  sort_order int default 0,
  created_at timestamptz not null default now(),
  unique (user_id, type, main_group, sub_category)
);

-- 7. المعاملات المالية
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('Income','Expense','Transfer')),
  main_group text not null,              -- منسوخ من category وقت الإدخال (تسريع القراءة + سجل تاريخي ثابت)
  sub_category text not null,
  amount numeric(15,2) not null check (amount > 0),
  transaction_date date not null,
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date);
create index if not exists idx_transactions_type on public.transactions(user_id, type);

-- 8. الميزانيات الشهرية لكل فئة
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  main_group text not null,
  month date not null,                    -- أول يوم من الشهر المستهدف
  planned_amount numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, main_group, month)
);

-- 9. الأهداف المالية (ادخار، سداد دين ...)
create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) not null default 0,
  target_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
--  القسم الثالث: ربط العادات بالمشاريع/الأهداف (اختياري - من ملف الإنتاجية)
-- =========================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  priority smallint default 1,           -- 1..4 حسب نظام المستخدم
  weekly_target_hours numeric,
  color text default 'blue',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
--  Row Level Security — كل مستخدم يرى بياناته فقط
-- =========================================================
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.projects enable row level security;

-- سياسة عامة قابلة لإعادة الاستخدام: كل جدول فيه user_id → CRUD كامل لصاحبه فقط
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'habits','habit_logs','weekly_reviews','accounts',
    'categories','transactions','budgets','financial_goals','projects'
  ])
  loop
    execute format('drop policy if exists "own_rows_select" on public.%I', t);
    execute format('drop policy if exists "own_rows_modify" on public.%I', t);
    execute format(
      'create policy "own_rows_select" on public.%I for select using (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "own_rows_modify" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;

drop policy if exists "own_profile" on public.profiles;
create policy "own_profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- =========================================================
--  Views مساعدة للوحة التحكم الموحّدة
-- =========================================================

-- ملخص مالي يومي/شهري جاهز للاستعلام السريع
create or replace view public.v_monthly_finance as
select
  user_id,
  date_trunc('month', transaction_date)::date as month,
  sum(case when type = 'Income' then amount else 0 end) as total_income,
  sum(case when type = 'Expense' then amount else 0 end) as total_expense,
  sum(case when type = 'Income' then amount else -amount end) as net_balance
from public.transactions
group by user_id, date_trunc('month', transaction_date);

-- نسبة إنجاز العادات اليومية لكل مستخدم (لآخر 30 يوم)
create or replace view public.v_habit_completion_30d as
select
  h.user_id,
  h.id as habit_id,
  h.name,
  count(*) filter (where l.status = 'done') as done_count,
  count(*) as tracked_days
from public.habits h
left join public.habit_logs l
  on l.habit_id = h.id and l.log_date >= current_date - interval '30 days'
where h.is_archived = false
group by h.user_id, h.id, h.name;

-- =========================================================
--  بيانات أولية اختيارية (فئات افتراضية) — نفّذها بعد إنشاء أول مستخدم
--  استبدل 'USER_UUID_HERE' بمعرّف المستخدم من auth.users
-- =========================================================
-- insert into public.categories (user_id, type, main_group, sub_category) values
--   ('USER_UUID_HERE','Income','الراتب','راتب شهري'),
--   ('USER_UUID_HERE','Expense','المنزل','أكل'),
--   ('USER_UUID_HERE','Expense','المنزل','فواتير'),
--   ('USER_UUID_HERE','Expense','شخصي','مواصلات');
