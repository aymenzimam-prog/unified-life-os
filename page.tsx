"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold2 flex items-center justify-center text-xl">
            🧭
          </div>
          <div>
            <h1 className="text-lg font-extrabold">نظام حياتي</h1>
            <p className="text-xs text-text3">العادات + المال في مكان واحد</p>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-sm2 text-sm font-bold ${
                mode === "login" ? "bg-gold-dim text-gold2 border border-gold" : "text-text2 border border-border"
              }`}
              style={mode === "login" ? { background: "rgba(240,165,0,0.12)", borderColor: "#f0a500" } : {}}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-sm2 text-sm font-bold border border-border ${
                mode === "signup" ? "text-gold2" : "text-text2"
              }`}
              style={mode === "signup" ? { background: "rgba(240,165,0,0.12)", borderColor: "#f0a500" } : {}}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-text2 block mb-1">الاسم الكامل</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-text2 block mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-text2 block mb-1">كلمة المرور</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <p className="text-sm text-red">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "جارِ التحميل..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
