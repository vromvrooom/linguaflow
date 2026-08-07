'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BookMarked, Calendar, TrendingUp, Flame, type LucideIcon } from 'lucide-react';
import AppShell, { Spinner } from '@/components/AppShell';
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
  tone: { bg: string; fg: string };
}

function StatCard({ label, value, icon: Icon, sub, tone }: StatCardProps) {
  return (
    <div className="lift rounded-2xl border border-line bg-surface p-5 shadow-card">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone.bg} ${tone.fg}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      {sub && <p className="text-xs text-dim">{sub}</p>}
    </div>
  );
}

function StageBar({ label, value, target }: { label: string; value: number; target: number }) {
  const clamped = Math.min(value, target);
  const pct = Math.min(100, Math.round((value / target) * 100));
  const done = value >= target;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs tabular-nums text-dim">{clamped}/{target} слів</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${done ? 'bg-success' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
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

function EmptyChart({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2">
      <p className="font-medium text-ink">{title}</p>
      <p className="text-sm text-dim">{hint}</p>
    </div>
  );
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

  if (loading) return <AppShell><Spinner /></AppShell>;

  return (
    <AppShell>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Прогрес вивчення</h1>
        <p className="mt-1.5 text-dim">Динаміка за останні 30 днів</p>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Загальна статистика</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Всього слів вивчено" sub="у словнику" value={wordTotal}
            icon={BookMarked} tone={{ bg: 'bg-brand-soft', fg: 'text-brand' }} />
          <StatCard label="Днів активності" sub="за 30 днів" value={activeDays}
            icon={Calendar} tone={{ bg: 'bg-[#eef4ff]', fg: 'text-[#3b6fb8]' }} />
          <StatCard label="Середній streak" sub="в середньому" value={`${avgStreak} дн.`}
            icon={TrendingUp} tone={{ bg: 'bg-[#f6f0ff]', fg: 'text-[#7c5cc4]' }} />
          <StatCard label="Найдовший streak" sub="рекорд" value={`${longestStreak} дн.`}
            icon={Flame} tone={{ bg: 'bg-warm', fg: 'text-[#e07a2f]' }} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Слова додані по днях</h2>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
          {!hasWordData ? (
            <EmptyChart title="Даних поки немає" hint="Додавай слова щодня щоб побачити графік" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={wordsChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wordsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART.tooltip} cursor={{ stroke: CHART.grid }} />
                <Area type="monotone" dataKey="слова" stroke={CHART.brand} strokeWidth={2.5} fill="url(#wordsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Час занурення по днях (хв)</h2>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
          {!hasMinuteData ? (
            <EmptyChart title="Даних поки немає" hint="Встанови розширення Chrome щоб відстежувати час" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={minutesChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART.tooltip} cursor={{ fill: '#2d6a4f0d' }} />
                <Bar dataKey="хвилини" fill={CHART.success} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Прогрес по стадіях</h2>
        <div className="mt-4 space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <StageBar label="Стадія 1" value={wordTotal} target={1500} />
          <StageBar label="Стадія 2" value={wordTotal} target={2500} />
          <StageBar label="Стадія 3" value={wordTotal} target={4000} />
        </div>
      </section>
    </AppShell>
  );
}
