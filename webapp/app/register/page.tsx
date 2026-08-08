'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Languages, Loader2 } from 'lucide-react';
import { setToken } from '@/lib/auth';
import { syncWithExtension } from '@/lib/extension';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/register', { email, password });
      setToken(data.token, data.userId);
      localStorage.setItem('auth_email', email);
      syncWithExtension(data.token, data.userId, email);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Не вдалося створити акаунт');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Languages size={26} strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">LinguaFlow</h1>
          <p className="mt-1.5 text-sm text-dim">Створіть новий акаунт</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-ink placeholder-dim transition-all duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-ink placeholder-dim transition-all duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="мін. 6 символів"
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="press flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition-colors duration-200 hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" /> : 'Створити акаунт'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dim">
          Вже є акаунт?{' '}
          <a href="/login" className="font-semibold text-brand transition-colors duration-200 hover:text-brand-dark">
            Увійти
          </a>
        </p>
      </div>
    </div>
  );
}
