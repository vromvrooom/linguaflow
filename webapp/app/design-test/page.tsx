'use client';

// LinguaFlow — design concept #2: "Detroit: Become Human" android system UI.
// Cold cyan accents, scanlines, terminal typography. Static mock, no API.

import { useEffect, useState } from 'react';

const NAV = [
  { code: '01', label: 'DASHBOARD', active: true },
  { code: '02', label: 'LEXICON', active: false },
  { code: '03', label: 'REVIEW', active: false },
  { code: '04', label: 'ANALYTICS', active: false },
  { code: '05', label: 'PROGRESS', active: false },
];

const STATS = [
  { code: 'STR-001', name: 'STREAK', value: 12, unit: 'DAYS', pct: 40 },
  { code: 'LEX-002', name: 'VOCABULARY', value: 348, unit: 'WORDS', pct: 70 },
  { code: 'TMP-003', name: 'EN MINUTES', value: 92, unit: 'TODAY', pct: 77 },
  { code: 'SRC-004', name: 'EN SEARCHES', value: 27, unit: 'TODAY', pct: 68 },
];

const PROTOCOLS = [
  { n: '01', title: 'FOUNDATION', sub: 'A1 — A2', pct: 100, state: 'done' as const },
  { n: '02', title: 'EXPANSION', sub: 'B1 — B2', pct: 64, state: 'active' as const },
  { n: '03', title: 'FLUENCY', sub: 'C1 — C2', pct: 0, state: 'standby' as const },
];

const ACTIVITY = [
  { ts: '14:23:07', word: 'serendipity', tr: 'щаслива випадковість' },
  { ts: '11:58:42', word: 'ubiquitous', tr: 'всюдисущий' },
  { ts: '09:31:15', word: 'ephemeral', tr: 'ефемерний' },
  { ts: '08:47:03', word: 'resilience', tr: 'стійкість' },
  { ts: '07:12:59', word: 'paradigm', tr: 'парадигма' },
];

const ACTIONS = ['ADD_WORD', 'REVIEW', 'LEXICON', 'ANALYTICS'];

/** Counts up from 0 to `target` with an ease-out curve on mount. */
function Counter({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{val}</>;
}

/** Reveals `text` one character at a time. */
function useTyping(text: string, speed = 85) {
  const [out, setOut] = useState('');
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

export default function DesignTestPage() {
  const typed = useTyping('SYSTEM OVERVIEW');

  return (
    <div className="dt-root">
      <style>{CSS}</style>

      {/* effects layers */}
      <div className="dt-scanlines" aria-hidden />
      <div className="dt-loadbar" aria-hidden />

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="dt-sidebar">
        <div className="dt-logo">
          <span className="dt-logo-glyph">[◈]</span>
          <span className="dt-logo-text">LINGUAFLOW</span>
        </div>
        <div className="dt-online">
          <span className="dt-pulse" />
          ONLINE
        </div>

        <nav className="dt-nav">
          {NAV.map((item) => (
            <a
              key={item.code}
              className={`dt-nav-item${item.active ? ' is-active' : ''}`}
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <span className="dt-nav-code">{item.code}</span>
              <span className="dt-nav-slash">/</span>
              <span className="dt-nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="dt-id">
          <div className="dt-id-row">
            <span className="dt-id-label">ANDROID</span>
            <span className="dt-id-val">#VA-56</span>
          </div>
          <div className="dt-id-row">
            <span className="dt-id-label">BUILD</span>
            <span className="dt-id-val">v2.1.0</span>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="dt-main">
        <header className="dt-head">
          <h1 className="dt-h1">
            {typed}
            <span className="dt-caret" />
          </h1>
          <span className="dt-clock">[ 11.06.2026 // 16:40:07 ]</span>
        </header>

        <div className="dt-rule" />

        {/* Stat cards */}
        <section className="dt-stats">
          {STATS.map((s) => (
            <div className="dt-card dt-stat" key={s.code}>
              <div className="dt-stat-head">
                <span className="dt-stat-code">{s.code}</span>
                <span className="dt-stat-name">{s.name}</span>
              </div>
              <div className="dt-stat-value">
                <Counter target={s.value} />
                <span className="dt-stat-unit">{s.unit}</span>
              </div>
              <div className="dt-bar">
                <div className="dt-bar-fill" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </section>

        {/* Learning Path / Protocols */}
        <section className="dt-block">
          <div className="dt-block-head">
            <h2 className="dt-h2">LEARNING PATH</h2>
            <span className="dt-block-meta">2 / 3 PROTOCOLS</span>
          </div>
          <div className="dt-protocols">
            {PROTOCOLS.map((p) => (
              <div className={`dt-card dt-protocol is-${p.state}`} key={p.n}>
                {p.state === 'active' && (
                  <span className="dt-badge dt-badge-active">
                    <span className="dt-pulse" /> ACTIVE PROTOCOL
                  </span>
                )}
                {p.state === 'done' && <span className="dt-badge dt-badge-done">✓ COMPLETED</span>}
                {p.state === 'standby' && <span className="dt-badge dt-badge-standby">STANDBY</span>}

                <span className="dt-protocol-n">{p.n}</span>
                <div className="dt-protocol-body">
                  <span className="dt-protocol-label">PROTOCOL {p.n}</span>
                  <h3 className="dt-protocol-title">{p.title}</h3>
                  <span className="dt-protocol-sub">{p.sub}</span>
                  <div className="dt-bar">
                    <div className="dt-bar-fill" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="dt-protocol-pct">{p.pct}% COMPLETE</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="dt-rule" />

        {/* Two columns */}
        <section className="dt-cols">
          {/* Recent Activity */}
          <div className="dt-card dt-panel">
            <div className="dt-block-head">
              <h2 className="dt-h2">RECENT ACTIVITY</h2>
              <span className="dt-block-meta">LOG</span>
            </div>
            <ul className="dt-log">
              {ACTIVITY.map((a) => (
                <li className="dt-log-row" key={a.word}>
                  <span className="dt-log-ts">[{a.ts}]</span>
                  <span className="dt-dot" />
                  <span className="dt-log-word">{a.word}</span>
                  <span className="dt-log-tr">{a.tr}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="dt-card dt-panel">
            <div className="dt-block-head">
              <h2 className="dt-h2">QUICK ACTIONS</h2>
              <span className="dt-block-meta">CMD</span>
            </div>
            <div className="dt-actions">
              {ACTIONS.map((a) => (
                <button className="dt-action" key={a} onClick={(e) => e.preventDefault()}>
                  <span className="dt-action-prompt">&gt;</span>
                  <span className="dt-action-cmd">{a}</span>
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
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap');

.dt-root {
  --bg: #04080f;
  --sidebar: #060d18;
  --accent: #00b4d8;
  --accent-2: #0077b6;
  --text: #caf0f8;
  --text-2: #4a7c8e;
  --border: rgba(0, 180, 216, 0.15);
  --glow: rgba(0, 180, 216, 0.06);
  --green: #2dd4bf;
  --mono: 'JetBrains Mono', ui-monospace, monospace;

  position: relative;
  min-height: 100vh;
  background-color: var(--bg);
  background-image: radial-gradient(1000px 600px at 78% -12%, rgba(0,180,216,0.07), transparent 70%);
  color: var(--text);
  font-family: var(--mono);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* (1) scanlines overlay */
.dt-scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  background: repeating-linear-gradient(
    to bottom,
    rgba(202, 240, 248, 1) 0px,
    rgba(202, 240, 248, 1) 1px,
    transparent 1px,
    transparent 3px
  );
  opacity: 0.03;
}

/* (8) top loading bar */
.dt-loadbar {
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  width: 0;
  z-index: 60;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  box-shadow: 0 0 12px var(--accent);
  animation: dt-load 1300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes dt-load {
  0%   { width: 0; opacity: 1; }
  75%  { width: 100%; opacity: 1; }
  100% { width: 100%; opacity: 0; }
}

/* ── Sidebar ───────────────────────────────── */
.dt-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 240px;
  background: var(--sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 20;
}
.dt-logo { display: flex; align-items: center; gap: 9px; }
.dt-logo-glyph { color: var(--accent); font-size: 14px; text-shadow: 0 0 10px var(--accent); }
.dt-logo-text { font-weight: 800; font-size: 14px; letter-spacing: 2px; color: var(--text); }

/* (6) pulsing online dot */
.dt-online {
  display: flex; align-items: center; gap: 7px;
  margin: 9px 0 26px 2px;
  font-size: 9.5px; letter-spacing: 2px; color: var(--green);
}
.dt-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: dt-pulse 1.6s ease-in-out infinite;
}
@keyframes dt-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 6px var(--green); }
  50%      { opacity: 0.35; transform: scale(0.75); box-shadow: 0 0 2px var(--green); }
}

.dt-nav { display: flex; flex-direction: column; gap: 1px; }
.dt-nav-item {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px 10px 14px;
  color: var(--text-2);
  font-size: 12px; letter-spacing: 1px;
  text-decoration: none;
  transition: color 200ms ease, background 200ms ease;
}
/* (5) cyan line on the left that grows width 0 -> 100% on hover */
.dt-nav-item::after {
  content: '';
  position: absolute;
  left: 0; bottom: 6px;
  height: 1px; width: 0;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  transition: width 220ms ease;
}
.dt-nav-item:hover { color: var(--text); background: var(--glow); }
.dt-nav-item:hover::after { width: 100%; }
.dt-nav-item.is-active { color: var(--accent); background: rgba(0,180,216,0.08); }
.dt-nav-item.is-active::after { width: 100%; }
.dt-nav-code { color: var(--accent); font-weight: 700; }
.dt-nav-slash { color: var(--text-2); opacity: 0.5; }
.dt-nav-label { font-weight: 500; }

.dt-id {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 5px;
}
.dt-id-row { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 1.5px; }
.dt-id-label { color: var(--text-2); }
.dt-id-val { color: var(--accent); font-weight: 700; }

/* ── Main ──────────────────────────────────── */
.dt-main { margin-left: 240px; padding: 40px 46px 70px; max-width: 1200px; }

.dt-head { display: flex; align-items: baseline; justify-content: space-between; }
.dt-h1 {
  display: flex; align-items: center;
  margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: var(--text);
  min-height: 30px;
}
/* (4) blinking caret for typing effect */
.dt-caret {
  display: inline-block;
  width: 9px; height: 20px;
  margin-left: 6px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: dt-blink 1s steps(1) infinite;
}
@keyframes dt-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
.dt-clock { font-size: 11px; letter-spacing: 1px; color: var(--text-2); }

.dt-rule {
  height: 1px;
  background: linear-gradient(90deg, var(--border), transparent);
  margin: 22px 0;
}

/* ── Cards (shared) ────────────────────────── */
.dt-card {
  position: relative;
  background: var(--sidebar);
  border: 1px solid var(--border);
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}
/* (2) decorative L-shaped corner brackets */
.dt-card::before,
.dt-card::after {
  content: '';
  position: absolute;
  width: 12px; height: 12px;
  border-color: var(--accent);
  border-style: solid;
  opacity: 0.35;
  transition: opacity 200ms ease, width 200ms ease, height 200ms ease;
}
.dt-card::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.dt-card::after  { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
/* (7) thin cyan glow + lift on hover */
.dt-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 180, 216, 0.4);
  box-shadow: 0 0 0 1px rgba(0,180,216,0.1), 0 12px 30px rgba(0,0,0,0.5), 0 0 22px rgba(0,180,216,0.12);
}
.dt-card:hover::before,
.dt-card:hover::after { opacity: 1; width: 16px; height: 16px; }

/* shared progress bar */
.dt-bar { height: 2px; background: rgba(0,180,216,0.12); overflow: hidden; }
.dt-bar-fill { height: 100%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }

/* ── Stat cards ────────────────────────────── */
.dt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.dt-stat { padding: 16px 16px 14px; }
.dt-stat-head { display: flex; flex-direction: column; gap: 3px; margin-bottom: 14px; }
.dt-stat-code { font-size: 9.5px; letter-spacing: 2px; color: var(--accent); }
.dt-stat-name { font-size: 10.5px; letter-spacing: 1.5px; color: var(--text-2); }
.dt-stat-value {
  display: flex; align-items: baseline; gap: 7px;
  font-size: 34px; font-weight: 800; line-height: 1; color: var(--text);
  margin-bottom: 14px;
  text-shadow: 0 0 18px rgba(0,180,216,0.25);
}
.dt-stat-unit { font-size: 10px; font-weight: 500; letter-spacing: 1px; color: var(--text-2); }

/* ── Protocols ─────────────────────────────── */
.dt-block { margin-top: 30px; }
.dt-block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.dt-h2 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; color: var(--text); }
.dt-block-meta { font-size: 10px; letter-spacing: 1.5px; color: var(--text-2); }

.dt-protocols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.dt-protocol { padding: 20px; display: flex; gap: 14px; }
.dt-protocol-n {
  font-size: 46px; font-weight: 800; line-height: 0.85;
  color: rgba(0, 180, 216, 0.1);
  user-select: none;
}
.dt-protocol-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.dt-protocol-label { font-size: 9px; letter-spacing: 2px; color: var(--text-2); }
.dt-protocol-title { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 1px; }
.dt-protocol-sub { font-size: 10.5px; letter-spacing: 1px; color: var(--text-2); margin-bottom: 8px; }
.dt-protocol-pct { margin-top: 6px; font-size: 9.5px; letter-spacing: 1px; color: var(--text-2); }

.dt-protocol.is-active { border-color: rgba(0,180,216,0.5); box-shadow: 0 0 0 1px rgba(0,180,216,0.15), 0 0 22px rgba(0,180,216,0.1); }
.dt-protocol.is-active .dt-protocol-n { color: rgba(0,180,216,0.22); }
.dt-protocol.is-done .dt-bar-fill { background: var(--green); box-shadow: 0 0 8px var(--green); }
.dt-protocol.is-standby { opacity: 0.5; }

.dt-badge {
  position: absolute; top: 14px; right: 14px;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  padding: 4px 8px; border-radius: 2px;
}
.dt-badge-active { color: var(--accent); border: 1px solid rgba(0,180,216,0.4); background: rgba(0,180,216,0.08); }
.dt-badge-done { color: var(--green); border: 1px solid rgba(45,212,191,0.35); background: rgba(45,212,191,0.07); }
.dt-badge-standby { color: var(--text-2); border: 1px solid var(--border); }

/* ── Two columns ───────────────────────────── */
.dt-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.dt-panel { padding: 20px; }

.dt-log { list-style: none; margin: 0; padding: 0; }
.dt-log-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(0,180,216,0.07);
  font-size: 12px;
}
.dt-log-row:last-child { border-bottom: 0; }
.dt-log-ts { color: var(--text-2); font-size: 10.5px; letter-spacing: 0.5px; }
.dt-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent); box-shadow: 0 0 6px var(--accent);
}
.dt-log-word { color: var(--text); font-weight: 500; }
.dt-log-tr { color: var(--text-2); font-size: 11px; margin-left: auto; }

.dt-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dt-action {
  position: relative;
  display: flex; align-items: center; gap: 9px;
  padding: 13px 14px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-family: var(--mono); font-size: 12px; letter-spacing: 1px;
  cursor: pointer; overflow: hidden;
  text-align: left;
}
/* left-to-right cyan fill on hover */
.dt-action::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,180,216,0.18), rgba(0,180,216,0.04));
  transform: scaleX(0); transform-origin: left;
  transition: transform 240ms ease;
  z-index: 0;
}
.dt-action:hover::before { transform: scaleX(1); }
.dt-action:hover { border-color: rgba(0,180,216,0.45); }
.dt-action-prompt, .dt-action-cmd { position: relative; z-index: 1; }
.dt-action-prompt { color: var(--accent); font-weight: 700; }

@media (max-width: 900px) {
  .dt-stats { grid-template-columns: repeat(2, 1fr); }
  .dt-protocols { grid-template-columns: 1fr; }
  .dt-cols { grid-template-columns: 1fr; }
}
`;
