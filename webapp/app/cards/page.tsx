'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Header from '@/components/Header';

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

// Monochrome ramp — brightness rises with recall quality
const RATINGS = [
  { quality: 0, label: 'Не знав',   color: 'bg-hover text-dim hover:bg-active hover:text-ink border border-line', key: '1' },
  { quality: 2, label: 'Важко',     color: 'bg-active text-[#a3a3a3] hover:text-ink border border-line',          key: '2' },
  { quality: 3, label: 'Нормально', color: 'bg-[#333333] text-[#c4c4c4] hover:text-ink border border-[#3d3d3d]',  key: '3' },
  { quality: 4, label: 'Добре',     color: 'bg-[#a3a3a3] text-canvas hover:bg-[#c4c4c4]',                         key: '4' },
  { quality: 5, label: 'Ідеально',  color: 'bg-accent text-canvas hover:bg-ink',                                  key: '5' },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas"><Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-line border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-canvas"><Header />
        <div className="flex flex-col items-center justify-center h-[65vh] gap-4 text-center px-4">
          <CheckCircle2 size={48} strokeWidth={1.25} className="text-dim" />
          <h2 className="text-2xl font-semibold text-ink tracking-tight">Все повторено на сьогодні!</h2>
          <p className="text-dim">{reviewed > 0 ? `Переглянуто ${reviewed} карток` : 'Карток на повторення немає'}</p>
          <button onClick={() => router.push('/dashboard')}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-ink text-canvas font-medium transition-colors">
            <ArrowLeft size={16} strokeWidth={2} /> Дашборд
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-dim">
            <span>Переглянуто {reviewed} з {total}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Flip card */}
        <div style={{ perspective: '1200px' }}>
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              minHeight: '260px',
            }}
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 bg-card border border-line rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center"
            >
              <p className="text-xs text-dim uppercase tracking-wider">Слово</p>
              <h2 className="text-4xl font-semibold text-ink tracking-tight">{card.word.word}</h2>
              {card.word.contextSentence && (
                <p className="text-dim text-sm italic">&laquo;{card.word.contextSentence}&raquo;</p>
              )}
              <button
                onClick={() => setFlipped(true)}
                className="mt-2 px-5 py-2.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-hover hover:border-dim transition-colors text-sm"
              >
                Показати переклад <span className="text-dim/70 ml-1">пробіл</span>
              </button>
            </div>

            {/* Back */}
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 bg-card border border-dim rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center"
            >
              <p className="text-xs text-dim uppercase tracking-wider">{card.word.word}</p>

              {card.word.translation ? (
                <p className="text-3xl text-ink font-semibold tracking-tight">{card.word.translation}</p>
              ) : addingTranslation ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <input
                    autoFocus
                    value={translationInput}
                    onChange={(e) => setTranslationInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTranslation(); }}
                    placeholder="Введіть переклад..."
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-center placeholder-dim focus:outline-none focus:border-dim text-sm transition-colors"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveTranslation} disabled={savingTranslation}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent hover:bg-ink text-canvas text-sm font-medium disabled:opacity-50 transition-colors">
                      {savingTranslation
                        ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                        : 'Зберегти'}
                    </button>
                    <button onClick={() => setAddingTranslation(false)}
                      className="px-4 py-1.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-hover text-sm transition-colors">
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-dim italic text-sm">Переклад не додано</p>
                  <button
                    onClick={() => setAddingTranslation(true)}
                    className="flex items-center gap-1.5 text-ink hover:text-dim text-sm transition-colors"
                  >
                    <Plus size={16} strokeWidth={2} /> Додати переклад
                  </button>
                </div>
              )}

              {card.word.contextSentence && (
                <p className="text-dim text-sm italic">&laquo;{card.word.contextSentence}&raquo;</p>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        {flipped && (
          <div className="space-y-2">
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
                  className={`py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-dim">
          Картка {current + 1} з {total} · інтервал {card.intervalDays} дн. · повторень {card.repetitions}
        </p>
      </main>
    </div>
  );
}
