'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const API = 'http://localhost:4000';
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

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-500/20 text-green-300 border-green-500/30',
  A2: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  B1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  B2: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  C1: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const INPUT_CLS =
  'w-full px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-blue-500 text-sm';

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
      await fetch(`${API}/words/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchWords(pagination.page);
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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Page title + add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-white text-xl">Словник</h1>
            {pagination.total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {pagination.total}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            {showForm ? '✕ Закрити' : '+ Додати слово'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Нове слово</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Слово *</label>
                <input
                  value={form.word}
                  onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                  required
                  placeholder="e.g. resilience"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Переклад</label>
                <input
                  value={form.translation}
                  onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                  placeholder="e.g. стійкість"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-xs text-slate-400">Контекст</label>
                <input
                  value={form.contextSentence}
                  onChange={(e) => setForm((f) => ({ ...f, contextSentence: e.target.value }))}
                  placeholder="e.g. She showed great resilience..."
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-slate-400">Рівень</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">—</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {formLoading ? '...' : 'Додати'}
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук по слову або перекладу..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white text-sm transition-colors">
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
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
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Нові спочатку</option>
            <option value="oldest">Старі спочатку</option>
            <option value="az">А – Я</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-2">
            <p className="text-4xl">📚</p>
            <p className="text-slate-400 text-lg font-medium">
              {search ? `Нічого не знайдено за "${search}"` : 'Словник порожній'}
            </p>
            <p className="text-slate-600 text-sm">
              {!search && 'Додайте перше слово за допомогою кнопки вище'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Слово</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Переклад</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Контекст</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium w-20">Рівень</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell w-28">Додано</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filtered.map((w) =>
                    editingId === w.id ? (
                      <tr key={w.id} className="bg-slate-700/40">
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
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                {saving ? '...' : 'Зберегти'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs transition-colors"
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
                      <tr key={w.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-4 py-3 font-semibold text-white">{w.word}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {w.translation ?? <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell max-w-xs">
                          {w.contextSentence ? (
                            <div>
                              <button
                                onClick={() => setExpandedCtxId((id) => id === w.id ? null : w.id)}
                                className="flex items-center gap-1.5 text-left hover:text-slate-200 transition-colors w-full"
                              >
                                <span className="text-slate-500 flex-shrink-0">💬</span>
                                <span className="truncate text-xs text-slate-400 max-w-[180px]">
                                  {w.contextSentence}
                                </span>
                              </button>
                              {expandedCtxId === w.id && (
                                <div className="mt-2 space-y-1.5 pl-1">
                                  <p className="text-slate-300 text-xs italic leading-relaxed">{w.contextSentence}</p>
                                  {translations[w.id]?.sentenceTranslation ? (
                                    <p className="text-blue-300 text-xs leading-relaxed">
                                      {translations[w.id].sentenceTranslation}
                                    </p>
                                  ) : (
                                    <button
                                      onClick={() => handleTranslateSentence(w)}
                                      disabled={translating === w.id}
                                      className="text-xs text-slate-500 hover:text-blue-400 border border-slate-600 hover:border-blue-500 px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                                    >
                                      {translating === w.id ? '⏳ Перекладаю…' : '🔍 Перекласти речення'}
                                    </button>
                                  )}
                                  {translations[w.id]?.wordTranslation && !w.translation && (
                                    <p className="text-emerald-400 text-xs">
                                      {w.word} = {translations[w.id].wordTranslation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {w.level ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                                LEVEL_COLORS[w.level] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                              }`}
                            >
                              {w.level}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleDateString('uk-UA', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => startEdit(w)}
                              title="Редагувати"
                              className="text-slate-500 hover:text-blue-400 p-1 rounded transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(w.id, w.word)}
                              disabled={deleting === w.id}
                              title="Видалити"
                              className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 p-1 rounded"
                            >
                              {deleting === w.id ? (
                                <span className="text-xs">...</span>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ← Назад
            </button>

            <div className="flex gap-1">
              {buildPageList(pagination.page, pagination.pages).map((p, i) =>
                p === '...' ? (
                  <span key={`gap-${i}`} className="px-2 py-1.5 text-slate-600 text-sm select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchWords(p as number)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      p === pagination.page
                        ? 'bg-blue-600 text-white font-medium'
                        : 'border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
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
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Далі →
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
