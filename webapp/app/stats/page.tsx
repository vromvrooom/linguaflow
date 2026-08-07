'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Flame, Clock, Plus, Search, BookMarked, type LucideIcon } from 'lucide-react';
import Header from '@/components/Header';

const API = '/api';

// Shared chart theme — matches the neutral palette
const CHART = {
  grid: '#262626',
  tick: '#737373',
  fill: '#e5e5e5',
  tooltip: { background: '#1a1a1a', border: '1px solid #262626', borderRadius: '8px', color: '#fafafa' },
};

interface DailyStat {
  date: string;
  englishMinutes: number;
  ukrainianMinutes: number;
  wordsAdded: number;
  cardsReviewed: number;
  englishSearches: number;
  streakDay: number;
}

interface StatCardProps { label: string; value: string | number; icon: LucideIcon; sub?: string; }

function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="bg-card border border-line rounded-xl p-5 space-y-1">
      <Icon size={18} strokeWidth={1.75} className="text-dim" />
      <p className="text-dim text-sm">{label}</p>
      <p className="text-3xl font-semibold text-ink tracking-tight">{value}</p>
      {sub && <p className="text-dim/70 text-xs">{sub}</p>}
    </div>
  );
}

const DAY_NAMES = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function toChartData(stats: DailyStat[]) {
  return stats.map((s) => ({
    day: DAY_NAMES[new Date(s.date).getUTCDay()],
    хвилин: s.englishMinutes,
  }));
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };
}

export default function StatsPage() {
  const router = useRouter();
  const [today, setToday] = useState<DailyStat | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStat[]>([]);
  const [wordTotal, setWordTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { router.replace('/login'); return; }

    Promise.allSettled([
      fetch(`${API}/stats/daily`, { headers: authHeaders() }).then((r) => {
        if (r.status === 401) router.replace('/login');
        return r.json();
      }),
      fetch(`${API}/stats/weekly`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/words?limit=1`, { headers: authHeaders() }).then((r) => r.json()),
    ]).then(([dailyRes, weeklyRes, wordsRes]) => {
      if (dailyRes.status === 'fulfilled' && dailyRes.value && typeof dailyRes.value === 'object' && !Array.isArray(dailyRes.value)) {
        setToday(dailyRes.value as DailyStat);
      }
      if (weeklyRes.status === 'fulfilled' && Array.isArray(weeklyRes.value)) {
        setWeeklyStats(weeklyRes.value as DailyStat[]);
      }
      if (wordsRes.status === 'fulfilled') {
        setWordTotal(wordsRes.value?.pagination?.total ?? 0);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  const chartData = toChartData(weeklyStats);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-line border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Статистика</h1>
          <p className="text-dim text-sm mt-1">Твій прогрес занурення в англійську</p>
        </div>

        {/* Today's stats */}
        <div>
          <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-4">Сьогодні</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Streak" value={`${today?.streakDay ?? 0} дн.`} icon={Flame} sub="днів підряд" />
            <StatCard label="Хвилин англійською" value={today?.englishMinutes ?? 0} icon={Clock} sub="сьогодні" />
            <StatCard label="Слів додано" value={today?.wordsAdded ?? 0} icon={Plus} sub="сьогодні" />
            <StatCard label="Пошуків" value={today?.englishSearches ?? 0} icon={Search} sub="англійських" />
            <StatCard label="Всього слів" value={wordTotal} icon={BookMarked} sub="у словнику" />
          </div>
        </div>

        {/* Chart */}
        <div>
          <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-4">
            Активність за 7 днів (хв/день)
          </h2>
          <div className="bg-card border border-line rounded-xl p-6">
            {chartData.every((d) => d.хвилин === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-dim">Даних поки немає</p>
                <p className="text-dim/70 text-sm">
                  Встанови розширення Chrome щоб відстежувати час
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="day" tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART.tooltip} cursor={{ fill: '#ffffff0d' }} />
                  <Bar dataKey="хвилин" fill={CHART.fill} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* History table */}
        {weeklyStats.some((s) => s.englishMinutes > 0) && (
          <div>
            <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-4">Активність тижня</h2>
            <div className="bg-card border border-line rounded-xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel">
                      {['Дата', 'Англ. хв', 'Слів додано', 'Карток', 'Пошуків', 'Streak'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-dim font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...weeklyStats].reverse().map((s) => (
                      <tr key={s.date} className="hover:bg-hover transition-colors">
                        <td className="px-4 py-3 text-dim tabular-nums whitespace-nowrap">
                          {new Date(s.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-ink font-medium tabular-nums">{s.englishMinutes}</td>
                        <td className="px-4 py-3 text-dim tabular-nums">{s.wordsAdded}</td>
                        <td className="px-4 py-3 text-dim tabular-nums">{s.cardsReviewed}</td>
                        <td className="px-4 py-3 text-dim tabular-nums">{s.englishSearches}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-ink tabular-nums">
                            <Flame size={16} strokeWidth={1.75} className="text-dim" /> {s.streakDay}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
