'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, X, Pencil, Trash2, MessageSquare, Languages, Loader2,
  ChevronLeft, ChevronRight, BookOpen,
} from 'lucide-react';
import AppShell, { Spinner } from '@/components/AppShell';
import { forceLogout } from '@/lib/auth';

const API = '/api';
const LIMIT = 20;

interface Word {
  id: string;
  word: string;
  translation: string | null;
  contextSentence: string | null;
  level: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  total: number;
  pages: number;
}

// Neutral ramp — contrast deepens with the level
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-[#fafafa] text-[#a1a1aa] border-[#e4e4e7]',
  A2: 'bg-[#f4f4f5] text-[#71717a] border-[#e4e4e7]',
  B1: 'bg-[#f4f4f5] text-[#52525b] border-[#d4d4d8]',
  B2: 'bg-[#e4e4e7] text-[#3f3f46] border-[#d4d4d8]',
  C1: 'bg-[#18181b] text-white border-[#18181b]',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const INPUT_CLS =
  'w-full px-2.5 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm transition-all duration-200';

const FIELD_CLS =
  'px-3.5 py-2.5 rounded-xl bg-paper border border-line text-ink placeholder-dim focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm transition-all duration-200';

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const EMPTY_FORM = { word: '', translation: '', contextSentence: '', level: '' };

export default function VocabularyPage() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deleting, setDeleting] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');

  // context translation
  const [expandedCtxId, setExpandedCtxId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, { wordTranslation: string | null; sentenceTranslation: string | null }>>({});
  const [translating, setTranslating] = useState<string | null>(null);

  const fetchWords = useCallback(async (page: number, level = levelFilter, sortBy = sort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), sort: sortBy });
      if (level) params.set('level', level);
      const res = await fetch(`${API}/words?${params}`, { headers: authHeaders() });
      if (res.status === 401) { forceLogout(); return; }
      const data = await res.json();
      setWords(data.data ?? []);
      setPagination(data.pagination ?? { page, total: 0, pages: 0 });
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, sort]);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { router.replace('/login'); return; }
    fetchWords(1, levelFilter, sort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, levelFilter, sort]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.word.trim()) return;
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch(`${API}/words`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          word: form.word.trim(),
          translation: form.translation.trim() || undefined,
          contextSentence: form.contextSentence.trim() || undefined,
          level: form.level || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Помилка');
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchWords(1);
    } catch {
      setFormError('Помилка мережі');
    } finally {
      setFormLoading(false);
    }
  }

  function startEdit(w: Word) {
    setEditingId(w.id);
    setSaveError('');
    setEditForm({
      word: w.word,
      translation: w.translation ?? '',
      contextSentence: w.contextSentence ?? '',
      level: w.level ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setSaveError('');
  }

  async function handleSave(id: string) {
    if (!editForm.word.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API}/words/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          word: editForm.word.trim(),
          translation: editForm.translation.trim() || null,
          contextSentence: editForm.contextSentence.trim() || null,
          level: editForm.level || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || `Помилка ${res.status}`);
        return;
      }
      const updated: Word = await res.json();
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
      setEditingId(null);
      setSaveError('');
    } catch {
      setSaveError('Помилка мережі');
    } finally {
      setSaving(false);
    }
  }

  async function handleTranslateSentence(w: Word) {
    if (!w.contextSentence) return;
    setTranslating(w.id);
    try {
      const res = await fetch(`${API}/translate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ word: w.word, sentence: w.contextSentence, sourceLang: 'en', targetLang: 'uk' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTranslations((prev) => ({ ...prev, [w.id]: data }));
    } catch { /* ignore */ } finally {
      setTranslating(null);
    }
  }

  async function handleDelete(id: string, wordText: string) {
    if (!window.confirm(`Видалити слово "${wordText}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API}/words/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.status === 401) { forceLogout(); return; }
      if (!res.ok) return;
      setWords((prev) => prev.filter((w) => w.id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = words.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.word.toLowerCase().includes(q) || w.translation?.toLowerCase().includes(q);
  });

  return (
    <AppShell max="max-w-6xl">
      {/* Title + add */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Словник</h1>
          <p className="mt-1 text-sm text-dim">
            {pagination.total > 0 ? `${pagination.total} збережених слів` : 'Твоя колекція слів'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(''); }}
          className="press flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors duration-200"
        >
          {showForm
            ? <><X size={18} strokeWidth={2.5} /> Закрити</>
            : <><Plus size={18} strokeWidth={2.5} /> Додати слово</>}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-bold text-ink">Нове слово</h2>
          <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-dim">Слово *</label>
              <input
                value={form.word}
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                required
                placeholder="e.g. resilience"
                className={FIELD_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-dim">Переклад</label>
              <input
                value={form.translation}
                onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                placeholder="e.g. стійкість"
                className={FIELD_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-dim">Контекст</label>
              <input
                value={form.contextSentence}
                onChange={(e) => setForm((f) => ({ ...f, contextSentence: e.target.value }))}
                placeholder="e.g. She showed great resilience..."
                className={FIELD_CLS}
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium text-dim">Рівень</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className={FIELD_CLS}
                >
                  <option value="">—</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="press flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors duration-200 whitespace-nowrap"
              >
                {formLoading ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" /> : 'Додати'}
              </button>
            </div>
            {formError && <p className="col-span-full text-sm text-red-600">{formError}</p>}
          </form>
        </div>
      )}

      {/* Search + filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={18} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук по слову або перекладу..."
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-11 pr-3 text-sm text-ink placeholder-dim shadow-card focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm font-medium text-dim hover:text-ink transition-colors duration-200">
            Очистити
          </button>
        )}

        <div className="flex items-center gap-1.5">
          {['', 'A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
            <button
              key={lvl || 'all'}
              onClick={() => setLevelFilter(lvl)}
              className={`press rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                levelFilter === lvl
                  ? 'bg-brand text-white'
                  : 'border border-line bg-surface text-dim hover:text-ink hover:border-brand'
              }`}
            >
              {lvl || 'Усі'}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-dim focus:outline-none focus:border-brand transition-colors duration-200"
        >
          <option value="newest">Нові спочатку</option>
          <option value="oldest">Старі спочатку</option>
          <option value="az">А – Я</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-24 text-center shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <BookOpen size={26} strokeWidth={2} />
          </span>
          <p className="text-lg font-semibold text-ink">
            {search ? `Нічого не знайдено за "${search}"` : 'Словник поки порожній'}
          </p>
          {!search && <p className="text-sm text-dim">Додай перше слово кнопкою вгорі</p>}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim">Слово</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim">Переклад</th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim md:table-cell">Контекст</th>
                  <th className="w-20 px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim">Рівень</th>
                  <th className="hidden w-28 px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-dim lg:table-cell">Додано</th>
                  <th className="w-20 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((w) =>
                  editingId === w.id ? (
                    <tr key={w.id} className="bg-brand-soft/60">
                      <td className="px-5 py-2.5">
                        <input
                          value={editForm.word}
                          onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                          className={INPUT_CLS}
                          autoFocus
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <input
                          value={editForm.translation}
                          onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))}
                          placeholder="—"
                          className={INPUT_CLS}
                        />
                      </td>
                      <td className="hidden px-5 py-2.5 md:table-cell">
                        <input
                          value={editForm.contextSentence}
                          onChange={(e) => setEditForm((f) => ({ ...f, contextSentence: e.target.value }))}
                          placeholder="—"
                          className={INPUT_CLS}
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <select
                          value={editForm.level}
                          onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value }))}
                          className={INPUT_CLS}
                        >
                          <option value="">—</option>
                          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td className="hidden px-5 py-2.5 lg:table-cell" />
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSave(w.id)}
                              disabled={saving}
                              className="press rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors duration-200 whitespace-nowrap"
                            >
                              {saving ? '...' : 'Зберегти'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="press rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-dim hover:text-ink transition-colors duration-200"
                            >
                              Скасувати
                            </button>
                          </div>
                          {saveError && <span className="text-xs text-red-600 whitespace-nowrap">{saveError}</span>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={w.id} className="group transition-colors duration-200 hover:bg-paper">
                      <td className="px-5 py-3.5 font-semibold text-ink">{w.word}</td>
                      <td className="px-5 py-3.5 text-ink/80">
                        {w.translation ?? <span className="text-dim">—</span>}
                      </td>
                      <td className="hidden max-w-xs px-5 py-3.5 md:table-cell">
                        {w.contextSentence ? (
                          <div>
                            <button
                              onClick={() => setExpandedCtxId((id) => id === w.id ? null : w.id)}
                              className="flex w-full items-center gap-1.5 text-left text-dim hover:text-brand transition-colors duration-200"
                            >
                              <MessageSquare size={16} strokeWidth={2} className="shrink-0" />
                              <span className="max-w-[180px] truncate text-xs">{w.contextSentence}</span>
                            </button>
                            {expandedCtxId === w.id && (
                              <div className="mt-2 space-y-2 rounded-lg bg-paper p-2.5">
                                <p className="text-xs italic leading-relaxed text-ink">{w.contextSentence}</p>
                                {translations[w.id]?.sentenceTranslation ? (
                                  <p className="text-xs leading-relaxed text-brand">
                                    {translations[w.id].sentenceTranslation}
                                  </p>
                                ) : (
                                  <button
                                    onClick={() => handleTranslateSentence(w)}
                                    disabled={translating === w.id}
                                    className="press inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-dim hover:text-brand hover:border-brand disabled:opacity-40 transition-colors duration-200"
                                  >
                                    {translating === w.id ? (
                                      <><Loader2 size={14} strokeWidth={2} className="animate-spin" /> Перекладаю…</>
                                    ) : (
                                      <><Languages size={14} strokeWidth={2} /> Перекласти речення</>
                                    )}
                                  </button>
                                )}
                                {translations[w.id]?.wordTranslation && !w.translation && (
                                  <p className="text-xs text-ink">
                                    {w.word} = {translations[w.id].wordTranslation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {w.level ? (
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            LEVEL_COLORS[w.level] ?? 'border-line bg-paper text-dim'
                          }`}>
                            {w.level}
                          </span>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3.5 text-xs tabular-nums text-dim lg:table-cell">
                        {new Date(w.createdAt).toLocaleDateString('uk-UA', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            onClick={() => startEdit(w)}
                            title="Редагувати"
                            className="press rounded-lg p-1.5 text-dim hover:bg-brand-soft hover:text-brand transition-colors duration-200"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(w.id, w.word)}
                            disabled={deleting === w.id}
                            title="Видалити"
                            className="press rounded-lg p-1.5 text-dim hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                          >
                            {deleting === w.id
                              ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                              : <Trash2 size={16} strokeWidth={2} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && !search && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchWords(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="press flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-dim hover:text-ink hover:border-brand disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200"
          >
            <ChevronLeft size={16} strokeWidth={2.5} /> Назад
          </button>

          <div className="flex gap-1">
            {buildPageList(pagination.page, pagination.pages).map((p, i) =>
              p === '...' ? (
                <span key={`gap-${i}`} className="select-none px-2 py-2 text-sm text-dim">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => fetchWords(p as number)}
                  className={`press h-9 w-9 rounded-lg text-sm font-medium tabular-nums transition-colors duration-200 ${
                    p === pagination.page
                      ? 'bg-brand text-white'
                      : 'border border-line bg-surface text-dim hover:text-ink hover:border-brand'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => fetchWords(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="press flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-dim hover:text-ink hover:border-brand disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200"
          >
            Далі <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </AppShell>
  );
}

function buildPageList(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) {
      if (pages.length > 0 && typeof pages[pages.length - 1] === 'number' && p - (pages[pages.length - 1] as number) > 1) {
        pages.push('...');
      }
      pages.push(p);
    }
  }
  return pages;
}
