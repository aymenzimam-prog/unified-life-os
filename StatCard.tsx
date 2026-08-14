const colorMap: Record<string, string> = {
  gold: "text-gold2",
  teal: "text-teal",
  blue: "text-blue",
  red: "text-red",
  purple: "text-purple",
};

export default function StatCard({
  label,
  value,
  icon,
  color = "gold",
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="card">
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-xl font-extrabold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-text3 mt-1">{label}</p>
    </div>
  );
}
