'use client';
import Sidebar from '@/components/Sidebar';

/**
 * Fixed 260px sidebar on the left, page content to its right.
 * `max` controls the content column width per page.
 */
export default function AppShell({
  children,
  max = 'max-w-5xl',
}: {
  children: React.ReactNode;
  max?: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <main className={`${max} mx-auto px-5 sm:px-8 py-8 lg:py-10`}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Centered spinner used while a page loads. */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-[3px] border-line border-t-brand rounded-full animate-spin" />
    </div>
  );
}
