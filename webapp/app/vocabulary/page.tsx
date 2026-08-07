'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, X, Pencil, Trash2, MessageSquare, Languages, Loader2,
  ChevronLeft, ChevronRight, BookOpen,
} from 'lucide-react';
import Header from '@/components/Header';

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

// Monochrome ramp — brightness rises with level
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-hover text-dim border-line',
  A2: 'bg-hover text-[#8f8f8f] border-[#2e2e2e]',
  B1: 'bg-active text-[#a3a3a3] border-[#333333]',
  B2: 'bg-active text-[#c4c4c4] border-[#3d3d3d]',
  C1: 'bg-[#2b2b2b] text-ink border-[#4a4a4a]',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const INPUT_CLS =
  'w-full px-2 py-1 rounded bg-canvas border border-line text-ink focus:outline-none focus:border-dim text-sm transition-colors';

const FIELD_CLS =
  'px-3 py-2 rounded-lg bg-canvas border border-line text-ink placeholder-dim/60 focus:outline-none focus:border-dim text-sm transition-colors';

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
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json();
      setWords(data.data ?? []);
      setPagination(data.pagination ?? { page, total: 0, pages: 0 });
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [router, levelFilter, sort]);

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
      console.log('[LF] DELETE', `${API}/words/${id}`);
      const res = await fetch(`${API}/words/${id}`, { method: 'DELETE', headers: authHeaders() });
      console.log('[LF] DELETE response status:', res.status);
      if (res.status === 401) { router.replace('/login'); return; }
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
    <div className="min-h-screen bg-canvas text-ink">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Page title + add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-ink text-xl tracking-tight">Словник</h1>
            {pagination.total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-active text-dim tabular-nums">
                {pagination.total}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-ink text-canvas text-sm font-medium transition-colors"
          >
            {showForm
              ? <><X size={16} strokeWidth={2} /> Закрити</>
              : <><Plus size={16} strokeWidth={2} /> Додати слово</>}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-card border border-line rounded-xl p-5">
            <h2 className="font-medium text-ink mb-4">Нове слово</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dim">Слово *</label>
                <input
                  value={form.word}
                  onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                  required
                  placeholder="e.g. resilience"
                  className={FIELD_CLS}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dim">Переклад</label>
                <input
                  value={form.translation}
                  onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                  placeholder="e.g. стійкість"
                  className={FIELD_CLS}
                />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-xs text-dim">Контекст</label>
                <input
                  value={form.contextSentence}
                  onChange={(e) => setForm((f) => ({ ...f, contextSentence: e.target.value }))}
                  placeholder="e.g. She showed great resilience..."
                  className={FIELD_CLS}
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-dim">Рівень</label>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-ink text-canvas text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {formLoading
                    ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                    : 'Додати'}
                </button>
              </div>
              {formError && (
                <p className="text-red-400 text-sm col-span-full">{formError}</p>
              )}
            </form>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук по слову або перекладу..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-line text-ink placeholder-dim focus:outline-none focus:border-dim text-sm transition-colors"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-dim hover:text-ink text-sm transition-colors">
              Очистити
            </button>
          )}

          {/* Level filter */}
          <div className="flex items-center gap-1">
            {['', 'A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
              <button
                key={lvl || 'all'}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === lvl
                    ? 'bg-accent text-canvas'
                    : 'bg-card border border-line text-dim hover:text-ink hover:bg-hover'
                }`}
              >
                {lvl || 'All'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card border border-line text-dim text-sm focus:outline-none focus:border-dim transition-colors"
          >
            <option value="newest">Нові спочатку</option>
            <option value="oldest">Старі спочатку</option>
            <option value="az">А – Я</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-line border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-24 gap-3">
            <BookOpen size={32} strokeWidth={1.25} className="text-dim" />
            <p className="text-dim text-lg font-medium">
              {search ? `Нічого не знайдено за "${search}"` : 'Словник порожній'}
            </p>
            {!search && (
              <p className="text-dim/70 text-sm">Додайте перше слово за допомогою кнопки вище</p>
            )}
          </div>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel">
                    <th className="text-left px-4 py-3 text-dim font-medium">Слово</th>
                    <th className="text-left px-4 py-3 text-dim font-medium">Переклад</th>
                    <th className="text-left px-4 py-3 text-dim font-medium hidden md:table-cell">Контекст</th>
                    <th className="text-left px-4 py-3 text-dim font-medium w-20">Рівень</th>
                    <th className="text-left px-4 py-3 text-dim font-medium hidden lg:table-cell w-28">Додано</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((w) =>
                    editingId === w.id ? (
                      <tr key={w.id} className="bg-hover">
                        <td className="px-4 py-2">
                          <input
                            value={editForm.word}
                            onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                            className={INPUT_CLS}
                            autoFocus
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.translation}
                            onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))}
                            placeholder="—"
                            className={INPUT_CLS}
                          />
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <input
                            value={editForm.contextSentence}
                            onChange={(e) => setEditForm((f) => ({ ...f, contextSentence: e.target.value }))}
                            placeholder="—"
                            className={INPUT_CLS}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.level}
                            onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value }))}
                            className={INPUT_CLS}
                          >
                            <option value="">—</option>
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell" />
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSave(w.id)}
                                disabled={saving}
                                className="px-2 py-1 rounded bg-accent hover:bg-ink text-canvas text-xs font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                {saving ? '...' : 'Зберегти'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-2 py-1 rounded border border-line text-dim hover:text-ink hover:bg-hover text-xs transition-colors"
                              >
                                Скасувати
                              </button>
                            </div>
                            {saveError && (
                              <span className="text-red-400 text-xs whitespace-nowrap">{saveError}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={w.id} className="hover:bg-hover transition-colors group">
                        <td className="px-4 py-3 font-medium text-ink">{w.word}</td>
                        <td className="px-4 py-3 text-dim">
                          {w.translation ?? <span className="text-dim/60">—</span>}
                        </td>
                        <td className="px-4 py-3 text-dim hidden md:table-cell max-w-xs">
                          {w.contextSentence ? (
                            <div>
                              <button
                                onClick={() => setExpandedCtxId((id) => id === w.id ? null : w.id)}
                                className="flex items-center gap-1.5 text-left text-dim hover:text-ink transition-colors w-full"
                              >
                                <MessageSquare size={16} strokeWidth={1.75} className="shrink-0" />
                                <span className="truncate text-xs max-w-[180px]">
                                  {w.contextSentence}
                                </span>
                              </button>
                              {expandedCtxId === w.id && (
                                <div className="mt-2 space-y-1.5 pl-1">
                                  <p className="text-ink text-xs italic leading-relaxed">{w.contextSentence}</p>
                                  {translations[w.id]?.sentenceTranslation ? (
                                    <p className="text-dim text-xs leading-relaxed">
                                      {translations[w.id].sentenceTranslation}
                                    </p>
                                  ) : (
                                    <button
                                      onClick={() => handleTranslateSentence(w)}
                                      disabled={translating === w.id}
                                      className="inline-flex items-center gap-1.5 text-xs text-dim hover:text-ink border border-line hover:border-dim px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                                    >
                                      {translating === w.id ? (
                                        <><Loader2 size={16} strokeWidth={1.75} className="animate-spin" /> Перекладаю…</>
                                      ) : (
                                        <><Languages size={16} strokeWidth={1.75} /> Перекласти речення</>
                                      )}
                                    </button>
                                  )}
                                  {translations[w.id]?.wordTranslation && !w.translation && (
                                    <p className="text-ink text-xs">
                                      {w.word} = {translations[w.id].wordTranslation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-dim/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {w.level ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                                LEVEL_COLORS[w.level] ?? 'bg-active text-dim border-line'
                              }`}
                            >
                              {w.level}
                            </span>
                          ) : (
                            <span className="text-dim/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-dim hidden lg:table-cell text-xs whitespace-nowrap tabular-nums">
                          {new Date(w.createdAt).toLocaleDateString('uk-UA', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                            <button
                              onClick={() => startEdit(w)}
                              title="Редагувати"
                              className="text-dim hover:text-ink p-1 rounded hover:bg-active transition-colors"
                            >
                              <Pencil size={16} strokeWidth={1.75} />
                            </button>
                            <button
                              onClick={() => handleDelete(w.id, w.word)}
                              disabled={deleting === w.id}
                              title="Видалити"
                              className="text-dim hover:text-red-400 p-1 rounded hover:bg-active transition-colors disabled:opacity-50"
                            >
                              {deleting === w.id ? (
                                <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} strokeWidth={1.75} />
                              )}
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
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => fetchWords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeft size={16} strokeWidth={1.75} /> Назад
            </button>

            <div className="flex gap-1">
              {buildPageList(pagination.page, pagination.pages).map((p, i) =>
                p === '...' ? (
                  <span key={`gap-${i}`} className="px-2 py-1.5 text-dim text-sm select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchWords(p as number)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors tabular-nums ${
                      p === pagination.page
                        ? 'bg-accent text-canvas font-medium'
                        : 'border border-line text-dim hover:text-ink hover:bg-hover'
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Далі <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </main>
    </div>
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
