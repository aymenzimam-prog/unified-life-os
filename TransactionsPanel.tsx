"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; type: "Income" | "Expense"; main_group: string; sub_category: string };
type Tx = {
  id: string;
  type: "Income" | "Expense";
  main_group: string;
  sub_category: string;
  amount: number;
  transaction_date: string;
  notes: string;
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat("ar-DZ").format(Math.round(n)) + " دج";
}

export default function TransactionsPanel({
  initialTransactions,
  categories,
}: {
  initialTransactions: Tx[];
  categories: Category[];
}) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || !amount) {
      setError("اختر فئة وأدخل المبلغ");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        category_id: cat.id,
        type,
        main_group: cat.main_group,
        sub_category: cat.sub_category,
        amount: Number(amount),
        transaction_date: date,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTransactions((prev) => [data as Tx, ...prev]);
    setAmount("");
    setNotes("");
  }

  async function handleDelete(id: string) {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card md:col-span-1 h-fit">
        <h3 className="font-bold text-sm mb-4">➕ معاملة جديدة</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setType("Income");
                setCategoryId("");
              }}
              className={`flex-1 py-2 rounded-sm2 text-xs font-bold border ${
                type === "Income" ? "border-teal text-teal" : "border-border text-text3"
              }`}
            >
              دخل
            </button>
            <button
              type="button"
              onClick={() => {
                setType("Expense");
                setCategoryId("");
              }}
              className={`flex-1 py-2 rounded-sm2 text-xs font-bold border ${
                type === "Expense" ? "border-red text-red" : "border-border text-text3"
              }`}
            >
              مصروف
            </button>
          </div>

          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">اختر الفئة...</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.main_group} — {c.sub_category}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="المبلغ (دج)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input
            className="input"
            placeholder="ملاحظة (اختياري)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && <p className="text-xs text-red">{error}</p>}
          {filteredCategories.length === 0 && (
            <p className="text-xs text-gold2">أضف فئة {type === "Income" ? "دخل" : "مصروف"} أولاً من صفحة الفئات</p>
          )}

          <button className="btn-primary w-full" type="submit">
            حفظ المعاملة
          </button>
        </form>
      </div>

      <div className="card md:col-span-2">
        <h3 className="font-bold text-sm mb-4">📋 المعاملات</h3>
        {transactions.length === 0 ? (
          <p className="text-text3 text-sm">لا توجد معاملات بعد.</p>
        ) : (
          <ul className="space-y-1">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm py-2.5 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {t.sub_category} <span className="text-text3">({t.main_group})</span>
                  </p>
                  <p className="text-xs text-text3">{t.transaction_date}{t.notes ? ` · ${t.notes}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={t.type === "Income" ? "text-teal font-bold" : "text-red font-bold"}>
                    {t.type === "Income" ? "+" : "-"}
                    {fmtMoney(Number(t.amount))}
                  </span>
                  <button onClick={() => handleDelete(t.id)} className="text-text3 hover:text-red text-xs">
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
