'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Flame, Clock, Plus, Search, BookMarked, type LucideIcon } from 'lucide-react';
import AppShell, { Spinner } from '@/components/AppShell';
import { forceLogout } from '@/lib/auth';
import { CHART } from '@/lib/chart';

const API = '/api';

interface DailyStat {
  date: string;
  englishMinutes: number;
  ukrainianMinutes: number;
  wordsAdded: number;
  cardsReviewed: number;
  englishSearches: number;
  streakDay: number;
}

interface StatCardProps {
  label: string; value: string | number; icon: LucideIcon; sub?: string;
}

function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="lift rounded-2xl border border-line bg-surface p-5 shadow-card">
      <Icon size={20} strokeWidth={2} className="text-dim" />
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      {sub && <p className="text-xs text-dim">{sub}</p>}
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
        if (r.status === 401) forceLogout();
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

  if (loading) return <AppShell><Spinner /></AppShell>;

  return (
    <AppShell>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Статистика</h1>
        <p className="mt-1.5 text-dim">Твій прогрес занурення в англійську</p>
      </header>

      {/* Today */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Сьогодні</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Streak" sub="днів підряд" value={`${today?.streakDay ?? 0}`} icon={Flame} />
          <StatCard label="Хвилин англійською" sub="сьогодні" value={today?.englishMinutes ?? 0} icon={Clock} />
          <StatCard label="Слів додано" sub="сьогодні" value={today?.wordsAdded ?? 0} icon={Plus} />
          <StatCard label="Пошуків" sub="англійських" value={today?.englishSearches ?? 0} icon={Search} />
          <StatCard label="Всього слів" sub="у словнику" value={wordTotal} icon={BookMarked} />
        </div>
      </section>

      {/* Chart */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
          Активність за 7 днів (хв/день)
        </h2>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
          {/* /stats/weekly always returns 7 points, padding untracked days with
              zeroes — so an all-zero week is still a week worth plotting. The
              placeholder is only for a genuinely empty response. */}
          {chartData.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <p className="font-medium text-ink">Даних поки немає</p>
              <p className="text-sm text-dim">Дані з&apos;являться після активного використання</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: CHART.tick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.max(10, Math.ceil(max))]}
                />
                <Tooltip contentStyle={CHART.tooltip} cursor={{ fill: '#18181b0d' }} />
                <Bar dataKey="хвилин" fill={CHART.brand} radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* History table */}
      {weeklyStats.some((s) => s.englishMinutes > 0) && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Активність тижня</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper">
                    {['Дата', 'Англ. хв', 'Слів додано', 'Карток', 'Пошуків', 'Streak'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...weeklyStats].reverse().map((s) => (
                    <tr key={s.date} className="transition-colors duration-200 hover:bg-paper">
                      <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-dim">
                        {new Date(s.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold tabular-nums text-ink">{s.englishMinutes}</td>
                      <td className="px-5 py-3.5 tabular-nums text-ink/80">{s.wordsAdded}</td>
                      <td className="px-5 py-3.5 tabular-nums text-ink/80">{s.cardsReviewed}</td>
                      <td className="px-5 py-3.5 tabular-nums text-ink/80">{s.englishSearches}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warm px-2.5 py-1 text-xs font-semibold tabular-nums text-brand">
                          <Flame size={14} strokeWidth={2.5} /> {s.streakDay}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
