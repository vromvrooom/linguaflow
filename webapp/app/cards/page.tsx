'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import AppShell, { Spinner } from '@/components/AppShell';

const API = '/api';

interface SrsCard {
  id: string;
  intervalDays: number;
  repetitions: number;
  word: {
    id: string;
    word: string;
    translation: string | null;
    contextSentence: string | null;
  };
}

// Warm-to-green ramp: harder recall on the left, confident on the right
const RATINGS = [
  { quality: 0, label: 'Не знав',   color: 'bg-[#fdeceb] text-[#c0392b] hover:bg-[#fbdcda]', key: '1' },
  { quality: 2, label: 'Важко',     color: 'bg-[#fdf1e3] text-[#c96a24] hover:bg-[#fae5cd]', key: '2' },
  { quality: 3, label: 'Нормально', color: 'bg-[#fdf8e3] text-[#a08417] hover:bg-[#faf1cd]', key: '3' },
  { quality: 4, label: 'Добре',     color: 'bg-brand-soft text-brand hover:bg-[#e2f5ea]',    key: '4' },
  { quality: 5, label: 'Ідеально',  color: 'bg-brand text-white hover:bg-brand-dark',        key: '5' },
] as const;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  };
}

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  // inline translation
  const [addingTranslation, setAddingTranslation] = useState(false);
  const [translationInput, setTranslationInput] = useState('');
  const [savingTranslation, setSavingTranslation] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { router.replace('/login'); return; }
    fetch(`${API}/cards/due?limit=100`, { headers: authHeaders() })
      .then((r) => { if (r.status === 401) router.replace('/login'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setCards(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleRate = useCallback(async (quality: number) => {
    const card = cards[current];
    if (!card || submitting || !flipped) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/cards/${card.id}/review`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ quality }),
      });
      setReviewed((n) => n + 1);
      setCurrent((n) => n + 1);
      setFlipped(false);
      setAddingTranslation(false);
      setTranslationInput('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }, [cards, current, submitting, flipped]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped(true); }
      if (flipped && e.key >= '1' && e.key <= '5') {
        const r = RATINGS[parseInt(e.key) - 1];
        if (r) handleRate(r.quality);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, handleRate]);

  async function handleSaveTranslation() {
    const card = cards[current];
    if (!card || !translationInput.trim()) return;
    setSavingTranslation(true);
    try {
      const res = await fetch(`${API}/words/${card.word.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ word: card.word.word, translation: translationInput.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCards((prev) =>
          prev.map((c, i) => i === current ? { ...c, word: { ...c.word, translation: updated.translation } } : c)
        );
        setAddingTranslation(false);
        setTranslationInput('');
      }
    } finally { setSavingTranslation(false); }
  }

  const total = cards.length;
  const card = cards[current];
  const done = !loading && current >= total;
  const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  if (loading) return <AppShell max="max-w-xl"><Spinner /></AppShell>;

  if (done) {
    return (
      <AppShell max="max-w-xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-20 text-center shadow-card">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CheckCircle2 size={32} strokeWidth={2} />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Все повторено на сьогодні!</h2>
          <p className="text-dim">
            {reviewed > 0 ? `Переглянуто ${reviewed} карток` : 'Карток на повторення немає'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="press mt-2 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors duration-200"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> На дашборд
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell max="max-w-xl">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-ink">Переглянуто {reviewed} з {total}</span>
          <span className="text-dim tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div className="mt-6" style={{ perspective: '1200px' }}>
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            minHeight: '280px',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">Слово</p>
            <h2 className="text-4xl font-bold tracking-tight text-ink">{card.word.word}</h2>
            {card.word.contextSentence && (
              <p className="text-sm italic text-dim">&laquo;{card.word.contextSentence}&raquo;</p>
            )}
            <button
              onClick={() => setFlipped(true)}
              className="press mt-2 rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-brand hover:text-brand transition-colors duration-200"
            >
              Показати переклад <span className="ml-1 text-dim">пробіл</span>
            </button>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-brand bg-surface p-8 text-center shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">{card.word.word}</p>

            {card.word.translation ? (
              <p className="text-3xl font-bold tracking-tight text-brand">{card.word.translation}</p>
            ) : addingTranslation ? (
              <div className="flex w-full max-w-xs flex-col items-center gap-2">
                <input
                  autoFocus
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTranslation(); }}
                  placeholder="Введіть переклад..."
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-center text-sm text-ink placeholder-dim focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all duration-200"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTranslation}
                    disabled={savingTranslation}
                    className="press flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors duration-200"
                  >
                    {savingTranslation ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : 'Зберегти'}
                  </button>
                  <button
                    onClick={() => setAddingTranslation(false)}
                    className="press rounded-xl border border-line px-4 py-2 text-sm font-medium text-dim hover:text-ink transition-colors duration-200"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm italic text-dim">Переклад не додано</p>
                <button
                  onClick={() => setAddingTranslation(true)}
                  className="press flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors duration-200"
                >
                  <Plus size={16} strokeWidth={2.5} /> Додати переклад
                </button>
              </div>
            )}

            {card.word.contextSentence && (
              <p className="text-sm italic text-dim">&laquo;{card.word.contextSentence}&raquo;</p>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      {flipped && (
        <div className="mt-6 space-y-2.5">
          <p className="text-center text-sm text-dim">
            Як добре ти знав це слово? <span className="text-dim/70">(клавіші 1–5)</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {RATINGS.map(({ quality, label, color, key }) => (
              <button
                key={quality}
                onClick={() => handleRate(quality)}
                disabled={submitting}
                title={`${label} [${key}]`}
                className={`press rounded-xl py-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-dim">
        Картка {current + 1} з {total} · інтервал {card.intervalDays} дн. · повторень {card.repetitions}
      </p>
    </AppShell>
  );
}
