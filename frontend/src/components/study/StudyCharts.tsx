import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StudyStats } from "../../types";

interface StudyChartsProps {
  stats: StudyStats;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-2xl font-display text-ink">{value}</p>
      <p className="text-xs text-ink/50 font-mono mt-1">{label}</p>
    </div>
  );
}

export default function StudyCharts({ stats }: StudyChartsProps) {
  const chartData = stats.reviews_per_day.map((d) => ({ date: d.date.slice(5), count: d.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Due now" value={stats.due_count} />
        <StatCard label="Reviewed today" value={stats.reviewed_today} />
        <StatCard label="Streak (days)" value={stats.streak_days} />
        <StatCard label="Retention (7d)" value={`${stats.retention_rate_7d}%`} />
        <StatCard label="Retention (30d)" value={`${stats.retention_rate_30d}%`} />
        <StatCard label="Avg. difficulty" value={stats.avg_difficulty} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-4">
          Reviews per day (last 30 days)
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-ink/40 py-8 text-center">No reviews yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#22201a99" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#22201a99" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2F5D50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
