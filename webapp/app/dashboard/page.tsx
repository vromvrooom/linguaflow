'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookMarked, RefreshCw, Flame, Target, Check, Plus, Minus,
  RotateCcw, Library, LineChart, ArrowRight, type LucideIcon,
} from 'lucide-react';
import AppShell, { Spinner } from '@/components/AppShell';

const API = '/api';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };
}

// ─── Plan definition ──────────────────────────────────────────────────────────

interface PlanTask {
  key: string;
  label: string;
  type: 'words' | 'checkbox' | 'counter';
  wordTarget?: number;    // for type=words: total words required at this stage
  counterTarget?: number; // for type=counter
  stage: 1 | 2 | 3;
}

const PLAN: PlanTask[] = [
  // Stage 1 — A1-A2
  { key: 's1_words',   label: 'Словниковий запас: 1 500 слів', type: 'words',    wordTarget: 1500, stage: 1 },
  { key: 's1_extra',   label: 'Переглянути серіал Extra',       type: 'checkbox',                  stage: 1 },
  { key: 's1_grammar', label: 'Present Simple і Future Simple', type: 'checkbox',                  stage: 1 },
  // Stage 2 — B1
  { key: 's2_words',   label: 'Ще 1 000 нових слів (≥ 2 500)', type: 'words',    wordTarget: 2500, stage: 2 },
  { key: 's2_movies',  label: '10 фільмів з субтитрами',        type: 'counter',  counterTarget: 10, stage: 2 },
  { key: 's2_speaking','label': 'Розмовна практика',             type: 'checkbox',                  stage: 2 },
  // Stage 3 — B2-C1
  { key: 's3_words',   label: 'Ще 1 500 нових слів (≥ 4 000)', type: 'words',    wordTarget: 4000, stage: 3 },
  { key: 's3_movies',  label: '15 фільмів',                     type: 'counter',  counterTarget: 15, stage: 3 },
  { key: 's3_speaking','label': 'Поглиблена розмовна практика', type: 'checkbox',                  stage: 3 },
];

const STAGE_META = [
  { num: 1, label: 'Стадія 1', sub: 'A1 – A2' },
  { num: 2, label: 'Стадія 2', sub: 'B1'       },
  { num: 3, label: 'Стадія 3', sub: 'B2 – C1'  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanRecord { taskKey: string; value: number; completedAt: string | null; }
interface DailyStat {
  date: string;
  englishMinutes: number;
  wordsAdded: number;
  cardsReviewed: number;
  streakDay: number;
}
interface RecentWord { id: string; word: string; translation: string | null; }
interface DashData {
  wordCount: number;
  cardsDue: number;
  streak: number;
  wordsPerDay: number;
  weekly: DailyStat[];
  recent: RecentWord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function activeStage(wordCount: number): number {
  if (wordCount < 1500) return 1;
  if (wordCount < 2500) return 2;
  return 3;
}

function displayName(email: string) {
  const local = email.split('@')[0] ?? '';
  if (!local) return '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/** Was there any activity on the weekday at `index` (0 = Monday)? */
function weekActivity(weekly: DailyStat[]): boolean[] {
  return WEEK_DAYS.map((_, i) => {
    const jsDay = (i + 1) % 7; // 0 = Sunday in JS
    const stat = weekly.find((s) => new Date(s.date).getUTCDay() === jsDay);
    if (!stat) return false;
    return stat.englishMinutes > 0 || stat.wordsAdded > 0 || stat.cardsReviewed > 0;
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ value, max, thick }: { value: number; max: number; thick?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`${thick ? 'h-2' : 'h-1.5'} bg-line rounded-full overflow-hidden`}>
      <div
        className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string | number; sub: string; icon: LucideIcon;
}) {
  return (
    <div className="lift bg-surface border border-line rounded-2xl p-5 shadow-card">
      <Icon size={20} strokeWidth={2} className="text-dim" />
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-dim">{sub}</p>
    </div>
  );
}

function TaskRow({
  task, wordCount, record, onToggle, onCounterChange,
}: {
  task: PlanTask;
  wordCount: number;
  record?: PlanRecord;
  onToggle: (key: string, stage: number, done: boolean) => void;
  onCounterChange: (key: string, stage: number, delta: number, current: number) => void;
}) {
  const done = !!record?.completedAt;
  const count = record?.value ?? 0;

  if (task.type === 'words') {
    const target = task.wordTarget!;
    const clamped = Math.min(wordCount, target);
    const finished = wordCount >= target;
    return (
      <div className="py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-sm ${finished ? 'text-dim line-through' : 'text-ink'}`}>
            {task.label}
          </span>
          <span className="text-xs text-dim shrink-0 tabular-nums">{clamped}/{target}</span>
        </div>
        <div className="mt-2"><ProgressBar value={clamped} max={target} /></div>
      </div>
    );
  }

  if (task.type === 'checkbox') {
    return (
      <button
        onClick={() => onToggle(task.key, task.stage, !done)}
        className="press flex items-center gap-3 py-2.5 text-left w-full group"
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 shrink-0 transition-colors duration-200
          ${done ? 'bg-success border-success text-white' : 'border-line group-hover:border-brand'}`}
        >
          {done && <Check size={13} strokeWidth={3.5} />}
        </span>
        <span className={`text-sm ${done ? 'text-dim line-through' : 'text-ink'}`}>
          {task.label}
        </span>
      </button>
    );
  }

  // counter
  const target = task.counterTarget!;
  const finished = count >= target;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className={`text-sm ${finished ? 'text-dim line-through' : 'text-ink'}`}>
        {task.label}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onCounterChange(task.key, task.stage, -1, count)}
          disabled={count <= 0}
          aria-label="Зменшити"
          className="press flex h-7 w-7 items-center justify-center rounded-lg border border-line text-dim hover:text-brand hover:border-brand disabled:opacity-30 disabled:pointer-events-none"
        ><Minus size={14} strokeWidth={2.5} /></button>
        <span className="text-sm text-ink w-11 text-center tabular-nums">{count}/{target}</span>
        <button
          onClick={() => onCounterChange(task.key, task.stage, 1, count)}
          disabled={count >= target}
          aria-label="Збільшити"
          className="press flex h-7 w-7 items-center justify-center rounded-lg border border-line text-dim hover:text-brand hover:border-brand disabled:opacity-30 disabled:pointer-events-none"
        ><Plus size={14} strokeWidth={2.5} /></button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [plan, setPlan] = useState<PlanRecord[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    setEmail(localStorage.getItem('auth_email') ?? '');

    const h = authHeaders();
    const [wordsRes, cardsRes, planRes, weeklyRes, dailyRes, recentRes] = await Promise.allSettled([
      fetch(`${API}/words?limit=1`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/cards/due?limit=100`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/plan`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/stats/weekly`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/stats/daily`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/words?limit=8&sort=newest`, { headers: h }).then((r) => r.json()),
    ]);

    const weekly: DailyStat[] =
      weeklyRes.status === 'fulfilled' && Array.isArray(weeklyRes.value) ? weeklyRes.value : [];
    const weekWords = weekly.reduce((sum, s) => sum + (s.wordsAdded ?? 0), 0);

    setData({
      wordCount: wordsRes.status === 'fulfilled' ? (wordsRes.value?.pagination?.total ?? 0) : 0,
      cardsDue:  cardsRes.status === 'fulfilled' ? (Array.isArray(cardsRes.value) ? cardsRes.value.length : 0) : 0,
      streak:    dailyRes.status === 'fulfilled' ? (dailyRes.value?.streakDay ?? 0) : 0,
      wordsPerDay: weekWords / 7,
      weekly,
      recent: recentRes.status === 'fulfilled' && Array.isArray(recentRes.value?.data)
        ? recentRes.value.data
        : [],
    });
    setPlan(planRes.status === 'fulfilled' && Array.isArray(planRes.value) ? planRes.value : []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function postPlan(taskKey: string, stage: number, body: object) {
    const res = await fetch(`${API}/plan`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskKey, stage, ...body }),
    });
    const updated: PlanRecord = await res.json();
    setPlan((prev) => {
      const idx = prev.findIndex((r) => r.taskKey === taskKey);
      return idx >= 0 ? prev.map((r, i) => (i === idx ? updated : r)) : [...prev, updated];
    });
  }

  function handleToggle(key: string, stage: number, done: boolean) {
    postPlan(key, stage, { completed: done });
  }

  function handleCounterChange(key: string, stage: number, delta: number, current: number) {
    const next = Math.max(0, current + delta);
    postPlan(key, stage, { value: next, completed: next >= (PLAN.find((t) => t.key === key)?.counterTarget ?? 0) });
  }

  if (loading) return <AppShell><Spinner /></AppShell>;

  const { wordCount, cardsDue, streak, wordsPerDay, weekly, recent } = data!;
  const stage = activeStage(wordCount);
  const planMap = Object.fromEntries(plan.map((r) => [r.taskKey, r]));
  const days = weekActivity(weekly);
  const name = displayName(email);

  const QUICK_ACTIONS: {
    icon: LucideIcon; label: string; sub: string; path: string; primary?: boolean;
  }[] = [
    { icon: Plus,      label: 'Додати слово',     sub: 'Поповнити словник',   path: '/vocabulary', primary: true },
    { icon: RotateCcw, label: 'Повторити картки', sub: cardsDue > 0 ? `${cardsDue} чекають` : 'Нічого на сьогодні', path: '/cards' },
    { icon: Library,   label: 'Словник',          sub: 'Всі збережені слова', path: '/vocabulary' },
    { icon: LineChart, label: 'Статистика',       sub: 'Твій прогрес',        path: '/stats' },
  ];

  return (
    <AppShell>
      {/* 1 — Greeting */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Привіт{name && `, ${name}`}
        </h1>
        <p className="mt-1.5 text-dim">Ось твій прогрес у вивченні англійської</p>
      </header>

      {/* 2 — Streak banner */}
      <section className="mt-8 rounded-2xl border border-line bg-warm p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[#e07a2f]">
              <Flame size={24} strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink tabular-nums">
                {streak} {streak === 1 ? 'день' : streak >= 2 && streak <= 4 ? 'дні' : 'днів'} підряд
              </p>
              <p className="text-sm text-dim">
                {streak > 0 ? 'Так тримати — не розривай ланцюжок' : 'Почни сьогодні, щоб запустити streak'}
              </p>
            </div>
          </div>

          {/* Week dots */}
          <div className="flex items-center gap-2.5">
            {WEEK_DAYS.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                    days[i]
                      ? 'bg-success text-white'
                      : 'bg-white/70 text-dim border border-line'
                  }`}
                >
                  {days[i] ? <Check size={16} strokeWidth={3} /> : ''}
                </span>
                <span className="text-[11px] font-medium text-dim">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Stat cards */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Збережено слів" sub="у словнику" value={wordCount} icon={BookMarked} />
        <StatCard
          label="На повторення"
          sub={cardsDue > 0 ? 'чекають на тебе' : 'все зроблено'}
          value={cardsDue}
          icon={RefreshCw}
        />
        <StatCard label="Streak" sub="днів підряд" value={streak} icon={Flame} />
        <StatCard
          label="Поточна стадія"
          sub={STAGE_META[stage - 1].sub}
          value={`Стадія ${stage}`}
          icon={Target}
        />
      </section>

      {/* 4 — Plan */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight text-ink">Твій план</h2>
          {wordsPerDay > 0 && (
            <p className="text-sm text-dim">
              {wordsPerDay.toFixed(1)} слів/день за тиждень
            </p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGE_META.map(({ num, label, sub }) => {
            const isActive = num === stage;
            const isDone = num < stage;
            const tasks = PLAN.filter((t) => t.stage === num);
            return (
              <div
                key={num}
                className={`lift rounded-2xl bg-surface p-5 shadow-card border-2 ${
                  isActive ? 'border-brand' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{label}</p>
                    <p className="text-xs font-medium text-dim">{sub}</p>
                  </div>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                      Активна
                    </span>
                  )}
                  {isDone && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                      <Check size={12} strokeWidth={3} /> Готово
                    </span>
                  )}
                </div>
                <div className="mt-3 divide-y divide-line">
                  {tasks.map((t) => (
                    <TaskRow
                      key={t.key}
                      task={t}
                      wordCount={wordCount}
                      record={planMap[t.key]}
                      onToggle={handleToggle}
                      onCounterChange={handleCounterChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5 — Two columns */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent words */}
        <div className="rounded-2xl bg-surface border border-line p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">Останні слова</h2>
            <Link
              href="/vocabulary"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors duration-200"
            >
              Усі <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-dim">
              Ще немає слів — додай перше, і воно з&apos;явиться тут.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {recent.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm"
                >
                  <span className="font-semibold text-ink">{w.word}</span>
                  {w.translation && <span className="text-dim">— {w.translation}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-surface border border-line p-6 shadow-card">
          <h2 className="text-lg font-bold tracking-tight text-ink">Швидкі дії</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, path, primary }) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                className={`press flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors duration-200 ${
                  primary
                    ? 'bg-brand text-white hover:bg-brand-dark'
                    : 'border border-line bg-surface text-ink hover:bg-paper hover:border-brand'
                }`}
              >
                <Icon size={20} strokeWidth={2} className={primary ? 'text-white' : 'text-brand'} />
                <span className="min-w-0">
                  <span className="block font-semibold text-sm">{label}</span>
                  <span className={`block text-xs truncate ${primary ? 'text-white/80' : 'text-dim'}`}>{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
