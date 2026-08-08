'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, Brain, BarChart2, TrendingUp, Languages, LogOut,
  type LucideIcon,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard',  label: 'Дашборд',    icon: LayoutDashboard },
  { href: '/vocabulary', label: 'Словник',    icon: BookOpen },
  { href: '/cards',      label: 'Картки',     icon: Brain },
  { href: '/stats',      label: 'Статистика', icon: BarChart2 },
  { href: '/progress',   label: 'Прогрес',    icon: TrendingUp },
];

export function initials(email: string) {
  const local = email.split('@')[0] ?? '';
  return (local.slice(0, 2) || '??').toUpperCase();
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState('');

  useEffect(() => {
    setEmail(localStorage.getItem('auth_email') ?? '');
  }, []);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] flex-col bg-sidebar border-r border-line shadow-sidebar">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-6 h-[76px] shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <Languages size={20} strokeWidth={2} />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">LinguaFlow</span>
        </Link>

        {/* The active item carries a black left rail plus bold text — the sidebar
            and the active fill are the same colour, so weight does the work. */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 border-l-2 px-4 py-2.5 rounded-r-lg text-[15px] transition-colors duration-200 ${
                  active
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-dim hover:text-ink hover:bg-paper font-medium'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white text-xs font-semibold">
              {initials(email)}
            </span>
            <span className="flex-1 min-w-0 text-sm text-dim truncate" title={email}>
              {email || '—'}
            </span>
            <button
              onClick={handleLogout}
              title="Вийти"
              aria-label="Вийти"
              className="press shrink-0 p-2 rounded-lg text-dim hover:text-ink hover:bg-paper"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 bg-sidebar border-b border-line">
        <div className="flex items-center justify-between px-5 h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <Languages size={18} strokeWidth={2} />
            </span>
            <span className="font-bold tracking-tight text-ink">LinguaFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-[11px] font-semibold">
              {initials(email)}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Вийти"
              className="press p-2 rounded-lg text-dim hover:text-ink hover:bg-paper"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-thin">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-dim hover:text-ink font-medium'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.25 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
