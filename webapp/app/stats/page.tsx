'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Header from '@/components/Header';

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

interface StatCardProps { label: string; value: string | number; icon: string; sub?: string; }

function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-1">
      <span className="text-xl">{icon}</span>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
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
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Статистика</h1>
          <p className="text-slate-400 text-sm mt-1">Твій прогрес занурення в англійську</p>
        </div>

        {/* Today's stats */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Сьогодні</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Streak" value={`${today?.streakDay ?? 0} дн.`} icon="🔥" sub="днів підряд" />
            <StatCard label="Хвилин англійською" value={today?.englishMinutes ?? 0} icon="⏱️" sub="сьогодні" />
            <StatCard label="Слів додано" value={today?.wordsAdded ?? 0} icon="➕" sub="сьогодні" />
            <StatCard label="Пошуків" value={today?.englishSearches ?? 0} icon="🔍" sub="англійських" />
            <StatCard label="Всього слів" value={wordTotal} icon="📚" sub="у словнику" />
          </div>
        </div>

        {/* Chart */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Активність за 7 днів (хв/день)
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            {chartData.every((d) => d.хвилин === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-slate-500">Даних поки немає</p>
                <p className="text-slate-600 text-sm">
                  Встанови розширення Chrome щоб відстежувати час
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    cursor={{ fill: '#ffffff0d' }}
                  />
                  <Bar dataKey="хвилин" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* History table */}
        {weeklyStats.some((s) => s.englishMinutes > 0) && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Активність тижня</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Дата', 'Англ. хв', 'Слів додано', 'Карток', 'Пошуків', 'Streak'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {[...weeklyStats].reverse().map((s) => (
                    <tr key={s.date} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(s.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{s.englishMinutes}</td>
                      <td className="px-4 py-3 text-slate-300">{s.wordsAdded}</td>
                      <td className="px-4 py-3 text-slate-300">{s.cardsReviewed}</td>
                      <td className="px-4 py-3 text-slate-300">{s.englishSearches}</td>
                      <td className="px-4 py-3">
                        <span className="text-orange-400">🔥 {s.streakDay}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
