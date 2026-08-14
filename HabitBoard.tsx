"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Habit = { id: string; name: string; icon: string; color: string };
type LogMap = Record<string, Record<string, "done" | undefined>>; // habitId -> dateStr -> status

const DAY_LABELS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function HabitBoard({
  initialHabits,
  initialLogs,
}: {
  initialHabits: Habit[];
  initialLogs: LogMap;
}) {
  const supabase = createClient();
  const [habits, setHabits] = useState(initialHabits);
  const [logs, setLogs] = useState<LogMap>(initialLogs);
  const [newHabitName, setNewHabitName] = useState("");
  const [isPending, startTransition] = useTransition();
  const weekDates = getWeekDates();

  async function toggleLog(habitId: string, dateStr: string) {
    const isDone = logs[habitId]?.[dateStr] === "done";

    // تحديث تفاؤلي فوري في الواجهة
    setLogs((prev) => ({
      ...prev,
      [habitId]: { ...prev[habitId], [dateStr]: isDone ? undefined : "done" },
    }));

    if (isDone) {
      await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("log_date", dateStr);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("habit_logs")
        .upsert(
          { habit_id: habitId, user_id: user.id, log_date: dateStr, status: "done" },
          { onConflict: "habit_id,log_date" }
        );
    }
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({ user_id: user.id, name: newHabitName.trim(), sort_order: habits.length })
      .select("id, name, icon, color")
      .single();

    if (!error && data) {
      startTransition(() => {
        setHabits((prev) => [...prev, data as Habit]);
        setNewHabitName("");
      });
    }
  }

  function currentStreak(habitId: string) {
    // احسب أيام متتالية منجزة بالرجوع من اليوم
    let streak = 0;
    const d = new Date();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (logs[habitId]?.[dateStr] === "done") {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  return (
    <div>
      <form onSubmit={addHabit} className="flex gap-2 mb-6">
        <input
          className="input"
          placeholder="أضف عادة جديدة... مثال: صلاة الفجر"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
        />
        <button className="btn-primary whitespace-nowrap" type="submit" disabled={isPending}>
          + إضافة
        </button>
      </form>

      {habits.length === 0 ? (
        <p className="text-text3 text-sm">لا توجد عادات بعد. أضف أول عادة أعلاه.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-right p-3 text-text3 text-xs bg-surface2 rounded-s-sm2">العادة</th>
                {DAY_LABELS.map((d) => (
                  <th key={d} className="p-3 text-text3 text-xs bg-surface2 text-center">
                    {d}
                  </th>
                ))}
                <th className="p-3 text-text3 text-xs bg-surface2 rounded-e-sm2 text-center">🔥 سلسلة</th>
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => (
                <tr key={h.id}>
                  <td className="p-3 border-b border-border font-bold whitespace-nowrap">
                    {h.icon} {h.name}
                  </td>
                  {weekDates.map((dateStr) => {
                    const done = logs[h.id]?.[dateStr] === "done";
                    const isFuture = new Date(dateStr) > new Date(new Date().toDateString());
                    return (
                      <td key={dateStr} className="p-3 border-b border-border text-center">
                        <button
                          disabled={isFuture}
                          onClick={() => toggleLog(h.id, dateStr)}
                          className={`w-7 h-7 rounded-md border transition-colors ${
                            done
                              ? "bg-teal text-bg border-teal"
                              : "border-border2 text-text3 hover:border-gold disabled:opacity-30 disabled:hover:border-border2"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-3 border-b border-border text-center text-gold2 font-bold">
                    {currentStreak(h.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
