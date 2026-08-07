'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-ink tracking-tight">LinguaFlow</h1>
          <p className="text-dim mt-1 text-sm">Створіть новий акаунт</p>
        </div>
        <div className="bg-card border border-line rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-dim mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-line text-ink placeholder-dim/70 focus:outline-none focus:border-dim transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dim mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-line text-ink placeholder-dim/70 focus:outline-none focus:border-dim transition-colors"
              placeholder="мін. 6 символів"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-canvas font-medium hover:bg-ink disabled:opacity-50 transition-colors"
          >
            {loading ? 'Створюємо...' : 'Створити акаунт'}
          </button>
        </div>
        <p className="text-center text-sm text-dim">
          Вже є акаунт?{' '}
          <a href="/login" className="text-ink hover:text-dim underline underline-offset-4 transition-colors">Увійти</a>
        </p>
      </div>
    </div>
  );
}
