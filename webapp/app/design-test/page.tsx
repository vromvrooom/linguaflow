'use client';

// LinguaFlow — design concept #3: Vercel / Linear minimal premium SaaS.
// Monochrome, 1px borders, no shadows/glows/gradients. Static mock, no API.

import type { ReactNode } from 'react';

/* Minimal monochrome stroke icons (inherit currentColor). */
const ICON: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="2.5" width="5" height="5" rx="1" />
      <rect x="2.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </>
  ),
  lexicon: (
    <>
      <path d="M3 3h8a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V3Z" />
      <path d="M3 12.5h10" />
    </>
  ),
  review: (
    <>
      <path d="M13.5 5.5A5.5 5.5 0 1 0 14 9" />
      <path d="M13.5 2.5v3h-3" />
    </>
  ),
  analytics: (
    <>
      <path d="M2.5 13.5V8" />
      <path d="M6.5 13.5V4" />
      <path d="M10.5 13.5V9" />
      <path d="M14 13.5h-12" />
    </>
  ),
  progress: (
    <>
      <path d="M2.5 11l4-4 3 3 5-6" />
    </>
  ),
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard', active: true },
  { id: 'lexicon', label: 'Lexicon', active: false },
  { id: 'review', label: 'Review', active: false },
  { id: 'analytics', label: 'Analytics', active: false },
  { id: 'progress', label: 'Progress', active: false },
];

const STATS = [
  { name: 'Streak', value: '12', trend: '+2 від вчора' },
  { name: 'Vocabulary', value: '348', trend: '+15 від вчора' },
  { name: 'English minutes', value: '92', trend: '+8 від вчора' },
  { name: 'English searches', value: '27', trend: '+4 від вчора' },
];

const STAGES = [
  { title: 'Stage 1', sub: 'Foundation', pct: 100, active: false },
  { title: 'Stage 2', sub: 'Expansion', pct: 64, active: true },
  { title: 'Stage 3', sub: 'Fluency', pct: 0, active: false },
];

const WORDS = [
  { word: 'serendipity', tr: 'щаслива випадковість', time: '2h ago' },
  { word: 'ubiquitous', tr: 'всюдисущий', time: '5h ago' },
  { word: 'ephemeral', tr: 'ефемерний', time: 'Yesterday' },
  { word: 'resilience', tr: 'стійкість', time: 'Yesterday' },
  { word: 'paradigm', tr: 'парадигма', time: '2d ago' },
];

const ACTIONS = ['Add word', 'Start review', 'Open lexicon', 'View analytics'];

export default function DesignTestPage() {
  return (
    <div className="v-root">
      <style>{CSS}</style>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="v-sidebar">
        <div className="v-logo">
          <span className="v-logo-dot" />
          <span className="v-logo-text">LinguaFlow</span>
        </div>

        <nav className="v-nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              className={`v-nav-item${item.active ? ' is-active' : ''}`}
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <svg
                className="v-nav-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICON[item.id]}
              </svg>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="v-user">
          <span className="v-avatar">VR</span>
          <span className="v-user-email">romanecvadym@gmail.com</span>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="v-main">
        <header className="v-head">
          <h1 className="v-h1">Good evening, Vadym</h1>
          <p className="v-sub">Here&apos;s your progress</p>
        </header>

        {/* Stat cards */}
        <section className="v-stats">
          {STATS.map((s) => (
            <div className="v-card v-stat" key={s.name}>
              <span className="v-stat-name">{s.name}</span>
              <span className="v-stat-value">{s.value}</span>
              <span className="v-stat-trend">{s.trend}</span>
            </div>
          ))}
        </section>

        {/* Learning path */}
        <section className="v-block">
          <h2 className="v-h2">Learning path</h2>
          <div className="v-stages">
            {STAGES.map((st) => (
              <div className={`v-card v-stage${st.active ? ' is-active' : ''}`} key={st.title}>
                <div className="v-stage-head">
                  <span className="v-stage-title">{st.title}</span>
                  <span className="v-stage-pct">{st.pct}%</span>
                </div>
                <span className="v-stage-sub">{st.sub}</span>
                <div className="v-bar">
                  <div className="v-bar-fill" style={{ width: `${st.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two columns */}
        <section className="v-cols">
          {/* Recent words */}
          <div className="v-block">
            <h2 className="v-h2">Recent words</h2>
            <div className="v-card v-list">
              {WORDS.map((w) => (
                <div className="v-list-row" key={w.word}>
                  <div className="v-list-main">
                    <span className="v-list-word">{w.word}</span>
                    <span className="v-list-tr">{w.tr}</span>
                  </div>
                  <span className="v-list-time">{w.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="v-block">
            <h2 className="v-h2">Actions</h2>
            <div className="v-actions">
              {ACTIONS.map((a) => (
                <button className="v-action" key={a} onClick={(e) => e.preventDefault()}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const CSS = `
.v-root {
  --bg: #000000;
  --sidebar: #0a0a0a;
  --card: #111111;
  --border: #1f1f1f;
  --border-hover: #333333;
  --text: #ffffff;
  --text-2: #666666;
  --hover-bg: #1a1a1a;
  --green: #3fb950;
  --blue: #0070f3;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 14px;
  animation: v-fade 200ms ease both;
}
@keyframes v-fade { from { opacity: 0; } to { opacity: 1; } }

/* ── Sidebar ───────────────────────────────── */
.v-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 220px;
  background: var(--sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
}
.v-logo { display: flex; align-items: center; gap: 9px; padding: 4px 8px 24px; }
.v-logo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text); }
.v-logo-text { font-size: 14px; font-weight: 600; letter-spacing: -0.2px; }

.v-nav { display: flex; flex-direction: column; gap: 1px; }
.v-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px;
  border-radius: 6px;
  color: var(--text-2);
  font-size: 13.5px;
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;
}
.v-nav-item:hover { background: var(--hover-bg); color: var(--text); }
.v-nav-item.is-active { color: var(--text); }
.v-nav-icon { width: 16px; height: 16px; flex-shrink: 0; }

.v-user {
  margin-top: auto;
  display: flex; align-items: center; gap: 9px;
  padding: 8px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
.v-avatar {
  width: 26px; height: 26px; flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  display: grid; place-items: center;
  font-size: 10.5px; font-weight: 600; color: var(--text-2);
}
.v-user-email {
  font-size: 12px; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── Main ──────────────────────────────────── */
.v-main { margin-left: 220px; padding: 56px 48px 80px; max-width: 1100px; }

.v-head { margin-bottom: 36px; }
.v-h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.6px; }
.v-sub { margin: 6px 0 0; font-size: 14px; color: var(--text-2); }

/* ── Cards (shared) ────────────────────────── */
.v-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 150ms ease, transform 150ms ease;
}
.v-card:hover { border-color: var(--border-hover); transform: translateY(-1px); }

/* ── Stat cards ────────────────────────────── */
.v-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.v-stat { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.v-stat-name { font-size: 13px; color: var(--text-2); }
.v-stat-value {
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  font-size: 30px; font-weight: 600; letter-spacing: -1px; line-height: 1;
  color: var(--text);
}
.v-stat-trend { font-size: 12px; color: var(--green); }

/* ── Blocks ────────────────────────────────── */
.v-block { margin-top: 36px; }
.v-h2 { margin: 0 0 14px; font-size: 13px; font-weight: 600; color: var(--text-2); }

/* ── Learning path ─────────────────────────── */
.v-stages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.v-stage { padding: 18px; display: flex; flex-direction: column; gap: 6px; }
.v-stage.is-active { border-color: var(--text); }
.v-stage-head { display: flex; align-items: baseline; justify-content: space-between; }
.v-stage-title { font-size: 14px; font-weight: 600; }
.v-stage-pct {
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  font-size: 12px; color: var(--text-2);
}
.v-stage-sub { font-size: 13px; color: var(--text-2); margin-bottom: 8px; }
.v-bar { height: 4px; border-radius: 4px; background: #1f1f1f; overflow: hidden; }
.v-bar-fill { height: 100%; background: var(--text); border-radius: 4px; }
.v-stage:not(.is-active) .v-bar-fill { background: var(--text-2); }

/* ── Two columns ───────────────────────────── */
.v-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

.v-list { padding: 4px 18px; }
.v-list-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
}
.v-list-row:last-child { border-bottom: 0; }
.v-list-main { display: flex; flex-direction: column; gap: 2px; }
.v-list-word { font-size: 14px; font-weight: 500; }
.v-list-tr { font-size: 13px; color: var(--text-2); }
.v-list-time { font-size: 12px; color: var(--text-2); }

.v-actions { display: flex; flex-direction: column; gap: 8px; }
.v-action {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--text);
  font-family: inherit; font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
}
.v-action:hover { border-color: var(--border-hover); background: var(--hover-bg); transform: translateY(-1px); }

@media (max-width: 900px) {
  .v-stats { grid-template-columns: repeat(2, 1fr); }
  .v-stages { grid-template-columns: 1fr; }
  .v-cols { grid-template-columns: 1fr; }
}
`;
