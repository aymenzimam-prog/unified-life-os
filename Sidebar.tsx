"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "🏠" },
  { href: "/habits", label: "العادات", icon: "✅" },
  { href: "/finance", label: "المالية", icon: "💰" },
  { href: "/finance/categories", label: "الفئات", icon: "🗂️" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-l border-border bg-surface min-h-screen p-5 hidden md:flex md:flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold2 flex items-center justify-center">
          🧭
        </div>
        <div>
          <h1 className="text-sm font-extrabold">نظام حياتي</h1>
          <p className="text-[11px] text-text3">العادات + المال</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm2 text-sm transition-colors ${
                active ? "bg-surface3 text-gold2 font-bold" : "text-text2 hover:text-text hover:bg-surface2"
              }`}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout} className="btn-ghost text-sm text-red mt-4">
        تسجيل الخروج
      </button>
    </aside>
  );
}
