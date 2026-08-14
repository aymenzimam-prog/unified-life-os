"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; type: "Income" | "Expense"; main_group: string; sub_category: string };

export default function CategoriesPanel({ initialCategories }: { initialCategories: Category[] }) {
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [mainGroup, setMainGroup] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    const key = `${c.type}-${c.main_group}`;
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!mainGroup.trim() || !subCategory.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, type, main_group: mainGroup.trim(), sub_category: subCategory.trim() })
      .select()
      .single();

    if (insertError) {
      setError("هذه الفئة موجودة مسبقاً أو حدث خطأ");
      return;
    }
    setCategories((prev) => [...prev, data as Category]);
    setSubCategory("");
  }

  async function handleDelete(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card h-fit">
        <h3 className="font-bold text-sm mb-4">➕ فئة جديدة</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("Income")}
              className={`flex-1 py-2 rounded-sm2 text-xs font-bold border ${
                type === "Income" ? "border-teal text-teal" : "border-border text-text3"
              }`}
            >
              دخل
            </button>
            <button
              type="button"
              onClick={() => setType("Expense")}
              className={`flex-1 py-2 rounded-sm2 text-xs font-bold border ${
                type === "Expense" ? "border-red text-red" : "border-border text-text3"
              }`}
            >
              مصروف
            </button>
          </div>
          <input
            className="input"
            placeholder="المجموعة الرئيسية (مثال: المنزل)"
            value={mainGroup}
            onChange={(e) => setMainGroup(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="الفئة الفرعية (مثال: فواتير)"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red">{error}</p>}
          <button className="btn-primary w-full" type="submit">
            إضافة الفئة
          </button>
        </form>
      </div>

      <div className="card md:col-span-2">
        <h3 className="font-bold text-sm mb-4">🗂️ الفئات الحالية</h3>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-text3 text-sm">لا توجد فئات بعد. أضف أول فئة من النموذج المجاور.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([key, cats]) => (
              <div key={key}>
                <p className="text-xs font-bold text-text2 mb-2">
                  {cats[0].type === "Income" ? "📈" : "📉"} {cats[0].main_group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <span
                      key={c.id}
                      className="text-xs bg-surface2 border border-border rounded-full px-3 py-1.5 flex items-center gap-2"
                    >
                      {c.sub_category}
                      <button onClick={() => handleDelete(c.id)} className="text-text3 hover:text-red">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
