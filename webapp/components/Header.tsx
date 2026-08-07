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
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/vocabulary', label: 'Словник',     icon: BookOpen },
  { href: '/cards',      label: 'Картки',      icon: Brain },
  { href: '/stats',      label: 'Статистика',  icon: BarChart2 },
  { href: '/progress',   label: 'Прогрес',     icon: TrendingUp },
];

const linkCls = (active: boolean) =>
  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
    active
      ? 'bg-active text-ink font-medium'
      : 'text-dim hover:text-ink hover:bg-hover'
  }`;

export default function Header() {
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
    <header className="border-b border-line bg-panel px-6 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 text-ink">
          <Languages size={18} strokeWidth={1.75} />
          <span className="font-semibold tracking-tight">LinguaFlow</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkCls(isActive(href))}>
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          {email && (
            <span className="text-dim text-sm hidden sm:block truncate max-w-[160px]">
              {email}
            </span>
          )}
          <button
            onClick={handleLogout}
            title="Вийти"
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-hover transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Вийти</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 mt-3 overflow-x-auto pb-0.5 scrollbar-thin">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${linkCls(isActive(href))} whitespace-nowrap`}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
