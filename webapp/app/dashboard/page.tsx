'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked, RefreshCw, Flame, Target, Gauge, Check, Plus, Minus,
  RotateCcw, Library, LineChart, type LucideIcon,
} from 'lucide-react';
import Header from '@/components/Header';

const API = '/api';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };
}

// ─── Plan definition ──────────────────────────────────────────────────────────

interface PlanTask {
  key: string;
  label: string;
  type: 'words' | 'checkbox' | 'counter';
  wordTarget?: number;   // for type=words: total words required at this stage
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
interface DashData { wordCount: number; cardsDue: number; streak: number; wordsPerDay: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function activeStage(wordCount: number): number {
  if (wordCount < 1500) return 1;
  if (wordCount < 2500) return 2;
  return 3;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-1.5 h-1 bg-line rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
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
      <div className={`flex flex-col gap-0.5 py-2 ${finished ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1.5 text-sm ${finished ? 'line-through text-dim' : 'text-ink'}`}>
            {finished && <Check size={16} strokeWidth={2} className="shrink-0" />}
            {task.label}
          </span>
          <span className="text-xs text-dim ml-4 shrink-0 tabular-nums">{clamped}/{target}</span>
        </div>
        {!finished && <ProgressBar value={clamped} max={target} />}
      </div>
    );
  }

  if (task.type === 'checkbox') {
    return (
      <button
        onClick={() => onToggle(task.key, task.stage, !done)}
        className="flex items-center gap-3 py-2 text-left w-full group"
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
          ${done ? 'bg-accent border-accent text-canvas' : 'border-line group-hover:border-dim'}`}
        >
          {done && <Check size={12} strokeWidth={3} />}
        </span>
        <span className={`text-sm ${done ? 'line-through text-dim' : 'text-ink'}`}>
          {task.label}
        </span>
      </button>
    );
  }

  // counter
  const target = task.counterTarget!;
  const finished = count >= target;
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`flex items-center gap-1.5 text-sm ${finished ? 'line-through text-dim' : 'text-ink'}`}>
        {finished && <Check size={16} strokeWidth={2} className="shrink-0" />}
        {task.label}
      </span>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={() => onCounterChange(task.key, task.stage, -1, count)}
          disabled={count <= 0}
          aria-label="Зменшити"
          className="w-6 h-6 rounded flex items-center justify-center border border-line text-dim hover:text-ink hover:bg-hover disabled:opacity-30 transition-colors"
        ><Minus size={14} strokeWidth={2} /></button>
        <span className="text-sm text-ink w-12 text-center tabular-nums">{count}/{target}</span>
        <button
          onClick={() => onCounterChange(task.key, task.stage, 1, count)}
          disabled={count >= target}
          aria-label="Збільшити"
          className="w-6 h-6 rounded flex items-center justify-center border border-line text-dim hover:text-ink hover:bg-hover disabled:opacity-30 transition-colors"
        ><Plus size={14} strokeWidth={2} /></button>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 transition-colors ${
      accent ? 'border-dim bg-active' : 'border-line bg-card'
    }`}>
      <Icon size={18} strokeWidth={1.75} className="text-dim" />
      <p className="text-dim text-sm">{label}</p>
      <p className="text-3xl font-semibold text-ink tracking-tight">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [plan, setPlan] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }

    const h = authHeaders();
    const [wordsRes, cardsRes, planRes, weeklyRes, dailyRes] = await Promise.allSettled([
      fetch(`${API}/words?limit=1`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/cards/due?limit=100`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/plan`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/stats/weekly`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/stats/daily`, { headers: h }).then((r) => r.json()),
    ]);

    const weekly = weeklyRes.status === 'fulfilled' && Array.isArray(weeklyRes.value) ? weeklyRes.value : [];
    const weekWords = weekly.reduce((sum: number, s: { wordsAdded?: number }) => sum + (s.wordsAdded ?? 0), 0);

    setData({
      wordCount: wordsRes.status === 'fulfilled' ? (wordsRes.value?.pagination?.total ?? 0) : 0,
      cardsDue:  cardsRes.status === 'fulfilled' ? (Array.isArray(cardsRes.value) ? cardsRes.value.length : 0) : 0,
      streak:    dailyRes.status === 'fulfilled' ? (dailyRes.value?.streakDay ?? 0) : 0,
      wordsPerDay: weekWords / 7,
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

  const { wordCount, cardsDue, streak, wordsPerDay } = data!;
  const stage = activeStage(wordCount);

  // Прогноз: скільки днів до кожної стадії при поточному темпі
  const PACE_STAGES = [
    { label: 'Стадія 1', target: 1500 },
    { label: 'Стадія 2', target: 2500 },
    { label: 'Стадія 3', target: 4000 },
  ];
  function daysToTarget(target: number): number | null {
    if (wordCount >= target) return 0;
    if (wordsPerDay <= 0) return null;
    return Math.ceil((target - wordCount) / wordsPerDay);
  }
  const planMap = Object.fromEntries(plan.map((r) => [r.taskKey, r]));

  const QUICK_ACTIONS: {
    icon: LucideIcon; label: string; sub: string; path: string; accent?: boolean;
  }[] = [
    { icon: Plus,      label: 'Додати слово',     sub: 'Відкрити словник',   path: '/vocabulary' },
    { icon: RotateCcw, label: 'Повторити картки', sub: cardsDue > 0 ? `${cardsDue} карток чекають` : 'Нічого на сьогодні', path: '/cards', accent: cardsDue > 0 },
    { icon: Library,   label: 'Словник',          sub: 'Всі збережені слова', path: '/vocabulary' },
    { icon: LineChart, label: 'Статистика',       sub: 'Твій прогрес',        path: '/stats' },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Дашборд</h1>
          <p className="text-dim text-sm mt-1">Твій прогрес у вивченні англійської</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Збережено слів" value={wordCount}          icon={BookMarked} />
          <StatCard label="На повторення"  value={cardsDue}           icon={RefreshCw} accent={cardsDue > 0} />
          <StatCard label="Streak"         value={`${streak} дн.`}    icon={Flame} />
          <StatCard label="Поточна стадія" value={`Стадія ${stage}`}  icon={Target} />
        </div>

        {/* Темп вивчення */}
        <div className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={18} strokeWidth={1.75} className="text-dim" />
            <h2 className="font-medium text-ink">При такому темпі:</h2>
          </div>
          {wordsPerDay <= 0 ? (
            <p className="text-dim text-sm">Додавай слова щодня щоб побачити прогноз</p>
          ) : (
            <>
              <p className="text-dim text-xs mb-3">
                Середньо {wordsPerDay.toFixed(1)} слів/день за останні 7 днів
              </p>
              <div className="space-y-2">
                {PACE_STAGES.map(({ label, target }) => {
                  const days = daysToTarget(target);
                  return (
                    <div key={target} className="flex items-center justify-between text-sm">
                      <span className="text-dim">{label} ({target} слів):</span>
                      <span className="font-medium text-ink ml-4 shrink-0">
                        {days === 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Check size={16} strokeWidth={2} /> досягнуто
                          </span>
                        ) : (
                          `через ${days} днів`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Plan checklist */}
        <div>
          <h2 className="text-lg font-medium text-ink mb-4">Прогрес плану</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAGE_META.map(({ num, label, sub }) => {
              const isActive = num === stage;
              const isDone = num < stage;
              const tasks = PLAN.filter((t) => t.stage === num);
              return (
                <div
                  key={num}
                  className={`rounded-xl border p-5 ${
                    isActive ? 'border-dim bg-card'
                    : isDone ? 'border-line bg-card'
                    : 'border-line bg-card/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ink">{label}</span>
                    {isDone && (
                      <span className="flex items-center gap-1 text-dim text-xs">
                        <Check size={14} strokeWidth={2} /> Завершено
                      </span>
                    )}
                    {isActive && (
                      <span className="text-canvas text-xs px-2 py-0.5 rounded-full bg-accent font-medium">
                        Активна
                      </span>
                    )}
                  </div>
                  <p className="text-dim font-mono text-xs mb-3">{sub}</p>
                  <div className="divide-y divide-line">
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
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-medium text-ink mb-4">Швидкі дії</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, path, accent }) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border transition-colors text-left ${
                  accent
                    ? 'border-dim bg-active hover:bg-line'
                    : 'border-line bg-card hover:bg-hover hover:border-dim'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} className="text-dim shrink-0" />
                <div>
                  <p className="font-medium text-ink">{label}</p>
                  <p className="text-dim text-xs">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
