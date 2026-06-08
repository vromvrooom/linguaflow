'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
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

function StageBar({ label, value, target }: { label: string; value: number; target: number }) {
  const clamped = Math.min(value, target);
  const pct = Math.min(100, Math.round((value / target) * 100));
  const done = value >= target;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-200">{label}</span>
        <span className="text-xs text-slate-400">{clamped}/{target} слів</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: done ? '#22c55e' : '#3b82f6' }}
        />
      </div>
    </div>
  );
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };
}

function chartDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

export default function ProgressPage() {
  const router = useRouter();
  const [monthly, setMonthly] = useState<DailyStat[]>([]);
  const [wordTotal, setWordTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { router.replace('/login'); return; }

    Promise.allSettled([
      fetch(`${API}/stats/monthly`, { headers: authHeaders() }).then((r) => {
        if (r.status === 401) router.replace('/login');
        return r.json();
      }),
      fetch(`${API}/words?limit=1`, { headers: authHeaders() }).then((r) => r.json()),
    ]).then(([monthlyRes, wordsRes]) => {
      if (monthlyRes.status === 'fulfilled' && Array.isArray(monthlyRes.value)) {
        setMonthly(monthlyRes.value as DailyStat[]);
      }
      if (wordsRes.status === 'fulfilled') {
        setWordTotal(wordsRes.value?.pagination?.total ?? 0);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  // ─── Aggregates ──────────────────────────────────────────────────────────────
  const activeDays = monthly.filter((s) => s.englishMinutes > 0).length;
  const streaks = monthly.map((s) => s.streakDay);
  const longestStreak = streaks.length ? Math.max(...streaks) : 0;
  const positiveStreaks = streaks.filter((v) => v > 0);
  const avgStreak = positiveStreaks.length
    ? Math.round(positiveStreaks.reduce((a, b) => a + b, 0) / positiveStreaks.length)
    : 0;

  const wordsChart = monthly.map((s) => ({ date: chartDate(s.date), слова: s.wordsAdded }));
  const minutesChart = monthly.map((s) => ({ date: chartDate(s.date), хвилини: s.englishMinutes }));

  const hasWordData = monthly.some((s) => s.wordsAdded > 0);
  const hasMinuteData = monthly.some((s) => s.englishMinutes > 0);

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

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Прогрес вивчення</h1>
          <p className="text-slate-400 text-sm mt-1">Динаміка за останні 30 днів</p>
        </div>

        {/* Секція 1 — Загальна статистика */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Загальна статистика
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Всього слів вивчено" value={wordTotal} icon="📚" sub="у словнику" />
            <StatCard label="Днів активності" value={activeDays} icon="📅" sub="за 30 днів" />
            <StatCard label="Середній streak" value={`${avgStreak} дн.`} icon="📈" sub="в середньому" />
            <StatCard label="Найдовший streak" value={`${longestStreak} дн.`} icon="🔥" sub="рекорд" />
          </div>
        </section>

        {/* Секція 2 — Графік слів по тижнях */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Слова додані по днях
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            {!hasWordData ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-slate-500">Даних поки немає</p>
                <p className="text-slate-600 text-sm">Додавай слова щодня щоб побачити графік</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={wordsChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wordsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    cursor={{ stroke: '#334155' }}
                  />
                  <Area type="monotone" dataKey="слова" stroke="#3b82f6" strokeWidth={2} fill="url(#wordsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Секція 3 — Графік часу занурення */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Час занурення по днях (хв)
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            {!hasMinuteData ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-slate-500">Даних поки немає</p>
                <p className="text-slate-600 text-sm">Встанови розширення Chrome щоб відстежувати час</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={minutesChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    cursor={{ fill: '#ffffff0d' }}
                  />
                  <Bar dataKey="хвилини" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Секція 4 — Прогрес по стадіях */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Прогрес по стадіях
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
            <StageBar label="Стадія 1" value={wordTotal} target={1500} />
            <StageBar label="Стадія 2" value={wordTotal} target={2500} />
            <StageBar label="Стадія 3" value={wordTotal} target={4000} />
          </div>
        </section>
      </main>
    </div>
  );
}
