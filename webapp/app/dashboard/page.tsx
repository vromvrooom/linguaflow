'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';

const API = 'http://localhost:4000';

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
interface DashData { wordCount: number; cardsDue: number; email: string; }

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
    <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : '#3b82f6' }}
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
          <span className={`text-sm ${finished ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {finished && '✓ '}{task.label}
          </span>
          <span className="text-xs text-slate-400 ml-4 shrink-0">{Math.min(wordCount, target)}/{target}</span>
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
          ${done ? 'bg-green-500 border-green-500' : 'border-slate-500 group-hover:border-blue-400'}`}
        >
          {done && <span className="text-white text-xs">✓</span>}
        </span>
        <span className={`text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
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
      <span className={`text-sm ${finished ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {finished && '✓ '}{task.label}
      </span>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={() => onCounterChange(task.key, task.stage, -1, count)}
          disabled={count <= 0}
          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-30 transition-colors"
        >−</button>
        <span className="text-sm text-slate-200 w-12 text-center">{count}/{target}</span>
        <button
          onClick={() => onCounterChange(task.key, task.stage, 1, count)}
          disabled={count >= target}
          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-30 transition-colors"
        >+</button>
      </div>
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
    const [wordsRes, cardsRes, meRes, planRes] = await Promise.allSettled([
      fetch(`${API}/words?limit=1`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/cards/due?limit=100`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/auth/me`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/plan`, { headers: h }).then((r) => r.json()),
    ]);

    setData({
      wordCount: wordsRes.status === 'fulfilled' ? (wordsRes.value?.pagination?.total ?? 0) : 0,
      cardsDue:  cardsRes.status === 'fulfilled' ? (Array.isArray(cardsRes.value) ? cardsRes.value.length : 0) : 0,
      email:     meRes.status === 'fulfilled' ? (meRes.value?.email ?? '') : '',
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { wordCount, cardsDue, email } = data!;
  const stage = activeStage(wordCount);
  const planMap = Object.fromEntries(plan.map((r) => [r.taskKey, r]));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-xl">🌐</span>
            <span className="font-bold text-lg text-white">LinguaFlow</span>
          </div>
          <div className="flex items-center gap-4">
            {email && <span className="text-slate-400 text-sm hidden sm:block">{email}</span>}
            <button
              onClick={() => { removeToken(); router.push('/login'); }}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >Вийти</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Дашборд</h1>
          <p className="text-slate-400 text-sm mt-1">Твій прогрес у вивченні англійської</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Збережено слів', value: wordCount,              icon: '📚' },
            { label: 'На повторення',  value: cardsDue,               icon: '🔄', accent: cardsDue > 0 },
            { label: 'Поточна стадія', value: `Стадія ${stage}`,      icon: '🎯' },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} className={`rounded-xl border p-5 flex flex-col gap-2 ${accent ? 'border-blue-500/40 bg-blue-500/10' : 'border-slate-700 bg-slate-800'}`}>
              <span className="text-xl">{icon}</span>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Plan checklist */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Прогрес плану</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAGE_META.map(({ num, label, sub }) => {
              const isActive = num === stage;
              const isDone = num < stage;
              const tasks = PLAN.filter((t) => t.stage === num);
              return (
                <div
                  key={num}
                  className={`rounded-xl border p-5 ${
                    isActive ? 'border-blue-500 bg-blue-500/10'
                    : isDone ? 'border-slate-600 bg-slate-800/50'
                    : 'border-slate-700 bg-slate-800/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{label}</span>
                    {isDone && <span className="text-green-400 text-xs">✓ Завершено</span>}
                    {isActive && (
                      <span className="text-blue-400 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                        Активна
                      </span>
                    )}
                  </div>
                  <p className="text-blue-300 font-mono text-xs mb-3">{sub}</p>
                  <div className="divide-y divide-slate-700/50">
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
          <h2 className="text-lg font-semibold text-white mb-4">Швидкі дії</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: '➕', label: 'Додати слово',    sub: 'Відкрити словник',   path: '/vocabulary' },
              { icon: '🔄', label: 'Повторити картки', sub: cardsDue > 0 ? `${cardsDue} карток чекають` : 'Нічого на сьогодні', path: '/cards', accent: cardsDue > 0 },
              { icon: '📖', label: 'Словник',          sub: 'Всі збережені слова', path: '/vocabulary' },
              { icon: '📊', label: 'Статистика',       sub: 'Твій прогрес',       path: '/stats' },
            ].map(({ icon, label, sub, path, accent }) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border transition-colors text-left ${
                  accent
                    ? 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium text-white">{label}</p>
                  <p className="text-slate-400 text-xs">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
