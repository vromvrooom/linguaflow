'use client';

// LinguaFlow — design concept (static mock, not wired to any API).
// Sci-fi minimalism: Notion-like sidebar layout, dark textured background,
// restrained blue light accents. All styling is local to this file.

const NAV = [
  { icon: '◈', label: 'Dashboard', active: true },
  { icon: '📖', label: 'Словник', active: false },
  { icon: '🗂', label: 'Картки', active: false },
  { icon: '📊', label: 'Статистика', active: false },
  { icon: '🚀', label: 'Прогрес', active: false },
];

const STATS = [
  { icon: '🔥', name: 'STREAK', value: '12', unit: 'днів', trend: '+2 від вчора', up: true },
  { icon: '📚', name: 'СЛОВА', value: '348', unit: 'всього', trend: '+15 від вчора', up: true },
  { icon: '⏱', name: 'ХВИЛИНИ EN', value: '92', unit: 'сьогодні', trend: '+8 від вчора', up: true },
  { icon: '🔍', name: 'ПОШУКИ EN', value: '27', unit: 'сьогодні', trend: '+4 від вчора', up: true },
];

const STAGES = [
  { n: '01', title: 'Основи', sub: 'A1 – A2', progress: 100, state: 'done' as const },
  { n: '02', title: 'Розширення', sub: 'B1 – B2', progress: 64, state: 'active' as const },
  { n: '03', title: 'Вільне володіння', sub: 'C1 – C2', progress: 0, state: 'locked' as const },
];

const ACTIVITY = [
  { word: 'serendipity', tr: 'щаслива випадковість', time: '2 год тому' },
  { word: 'ubiquitous', tr: 'всюдисущий', time: '5 год тому' },
  { word: 'ephemeral', tr: 'ефемерний', time: 'вчора' },
  { word: 'resilience', tr: 'стійкість', time: 'вчора' },
  { word: 'paradigm', tr: 'парадигма', time: '2 дні тому' },
];

const ACTIONS = [
  { icon: '＋', label: 'Додати слово' },
  { icon: '↻', label: 'Повторити' },
  { icon: '📖', label: 'Словник' },
  { icon: '📊', label: 'Статистика' },
];

export default function DesignTestPage() {
  return (
    <div className="dt-root">
      <style>{CSS}</style>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="dt-sidebar">
        <div className="dt-logo">
          <span className="dt-logo-icon">🌐</span>
          <span className="dt-logo-text">LinguaFlow</span>
        </div>

        <nav className="dt-nav">
          {NAV.map((item) => (
            <a
              key={item.label}
              className={`dt-nav-item${item.active ? ' is-active' : ''}`}
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <span className="dt-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="dt-user">
          <div className="dt-avatar">VR</div>
          <div className="dt-user-meta">
            <span className="dt-user-email">romanecvadym@gmail.com</span>
            <span className="dt-user-plan">Pro · активний</span>
          </div>
          <button className="dt-logout" title="Вийти" onClick={(e) => e.preventDefault()}>
            ⏻
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="dt-main">
        {/* Overview header */}
        <header className="dt-section-head">
          <div>
            <h1 className="dt-h1">Overview</h1>
            <p className="dt-sub">Ваш прогрес у вивченні англійської</p>
          </div>
          <span className="dt-date">11 JUN 2026 · 16:40</span>
        </header>

        <div className="dt-rule" />

        {/* Stat cards */}
        <section className="dt-stats">
          {STATS.map((s) => (
            <div className="dt-card dt-stat" key={s.name}>
              <div className="dt-stat-top">
                <span className="dt-stat-icon">{s.icon}</span>
                <span className="dt-stat-name">{s.name}</span>
              </div>
              <div className="dt-stat-value">
                {s.value}
                <span className="dt-stat-unit">{s.unit}</span>
              </div>
              <div className={`dt-trend${s.up ? ' is-up' : ''}`}>
                <span className="dt-trend-arrow">{s.up ? '▲' : '▼'}</span>
                {s.trend}
              </div>
            </div>
          ))}
        </section>

        {/* Learning Path */}
        <section className="dt-block">
          <div className="dt-block-head">
            <h2 className="dt-h2">Learning Path</h2>
            <span className="dt-block-meta">2 / 3 стадії</span>
          </div>
          <div className="dt-stages">
            {STAGES.map((st) => (
              <div className={`dt-card dt-stage is-${st.state}`} key={st.n}>
                {st.state === 'active' && <span className="dt-badge">ACTIVE</span>}
                <span className="dt-stage-n">{st.n}</span>
                <div className="dt-stage-body">
                  <span className="dt-stage-label">STAGE {st.n}</span>
                  <h3 className="dt-stage-title">{st.title}</h3>
                  <span className="dt-stage-sub">{st.sub}</span>
                  <div className="dt-progress">
                    <div className="dt-progress-fill" style={{ width: `${st.progress}%` }} />
                  </div>
                  <span className="dt-stage-pct">{st.progress}%</span>
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
              <h2 className="dt-h2">Recent Activity</h2>
              <span className="dt-block-meta">останні слова</span>
            </div>
            <ul className="dt-activity">
              {ACTIVITY.map((a) => (
                <li className="dt-activity-row" key={a.word}>
                  <span className="dt-dot" />
                  <div className="dt-activity-main">
                    <span className="dt-activity-word">{a.word}</span>
                    <span className="dt-activity-tr">{a.tr}</span>
                  </div>
                  <span className="dt-activity-time">{a.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="dt-card dt-panel">
            <div className="dt-block-head">
              <h2 className="dt-h2">Quick Actions</h2>
              <span className="dt-block-meta">швидкий доступ</span>
            </div>
            <div className="dt-actions">
              {ACTIONS.map((a) => (
                <button
                  className="dt-action"
                  key={a.label}
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="dt-action-icon">{a.icon}</span>
                  <span>{a.label}</span>
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
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

.dt-root {
  --bg: #080c10;
  --sidebar: #0d1117;
  --card: #111820;
  --accent: #4f9cf9;
  --text: #e2e8f0;
  --text-2: #64748b;
  --border: rgba(79, 156, 249, 0.1);
  --glow: rgba(79, 156, 249, 0.05);
  --mono: 'JetBrains Mono', ui-monospace, monospace;

  min-height: 100vh;
  background-color: var(--bg);
  /* faint texture: subtle grid + corner glow */
  background-image:
    radial-gradient(900px 500px at 80% -10%, rgba(79, 156, 249, 0.06), transparent 70%),
    linear-gradient(rgba(79, 156, 249, 0.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 156, 249, 0.022) 1px, transparent 1px);
  background-size: 100% 100%, 32px 32px, 32px 32px;
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  animation: dt-fade 300ms ease both;
}

@keyframes dt-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
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
  padding: 22px 14px;
  z-index: 10;
}

.dt-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 8px 22px;
}
.dt-logo-icon { font-size: 18px; filter: drop-shadow(0 0 6px var(--accent)); }
.dt-logo-text {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
  color: var(--text);
}

.dt-nav { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
.dt-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  border-radius: 7px;
  color: var(--text-2);
  font-size: 13.5px;
  text-decoration: none;
  transition: background 200ms ease, color 200ms ease;
}
.dt-nav-item::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  width: 2px; height: 0;
  background: var(--accent);
  border-radius: 2px;
  transform: translateY(-50%);
  transition: height 200ms ease;
  box-shadow: 0 0 8px var(--accent);
}
.dt-nav-item:hover { background: var(--glow); color: var(--text); }
.dt-nav-item.is-active {
  background: rgba(79, 156, 249, 0.08);
  color: var(--text);
}
.dt-nav-item.is-active::before { height: 18px; }
.dt-nav-icon { font-size: 14px; width: 16px; text-align: center; }

.dt-user {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid var(--border);
}
.dt-avatar {
  width: 32px; height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid; place-items: center;
  font-family: var(--mono);
  font-size: 12px; font-weight: 700;
  color: var(--accent);
  background: rgba(79, 156, 249, 0.1);
  border: 1px solid var(--border);
}
.dt-user-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.dt-user-email {
  font-size: 11.5px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dt-user-plan { font-size: 10.5px; color: var(--text-2); }
.dt-logout {
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
}
.dt-logout:hover { color: var(--accent); border-color: var(--accent); background: var(--glow); }

/* ── Main ──────────────────────────────────── */
.dt-main {
  margin-left: 240px;
  padding: 38px 44px 64px;
  max-width: 1180px;
}

.dt-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.dt-h1 { font-size: 26px; font-weight: 600; margin: 0; letter-spacing: -0.3px; }
.dt-sub { margin: 5px 0 0; font-size: 13px; color: var(--text-2); }
.dt-date {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
  letter-spacing: 1px;
}

.dt-rule {
  height: 1px;
  background: rgba(79, 156, 249, 0.08);
  margin: 24px 0;
}

/* ── Cards (shared) ────────────────────────── */
.dt-card {
  position: relative;
  background: linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  overflow: hidden;
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}
/* sci-fi corner ticks */
.dt-card::before,
.dt-card::after {
  content: '';
  position: absolute;
  width: 10px; height: 10px;
  border-color: rgba(79, 156, 249, 0.25);
  border-style: solid;
  opacity: 0;
  transition: opacity 200ms ease;
}
.dt-card::before { top: 8px; left: 8px; border-width: 1px 0 0 1px; }
.dt-card::after  { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }
.dt-card:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 156, 249, 0.28);
  box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,156,249,0.06);
}
.dt-card:hover::before,
.dt-card:hover::after { opacity: 1; }

/* ── Stat cards ────────────────────────────── */
.dt-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.dt-stat { padding: 18px 18px 16px; isolation: isolate; }
.dt-stat-top {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.dt-stat-icon { font-size: 14px; opacity: 0.9; }
.dt-stat-name {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 1.5px;
  color: var(--text-2);
}
.dt-stat-value {
  font-family: var(--mono);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  color: var(--text);
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.dt-stat-unit {
  font-size: 11px; font-weight: 400;
  color: var(--text-2);
  letter-spacing: 0.5px;
}
.dt-trend {
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--text-2);
  display: flex; align-items: center; gap: 5px;
}
.dt-trend.is-up { color: #56d6a0; }
.dt-trend-arrow { font-size: 8px; }

/* shimmer highlight that sweeps the top edge on hover */
.dt-stat { --shimmer: linear-gradient(90deg, transparent, rgba(79,156,249,0.55), transparent); }
.dt-stat .dt-stat-top { position: relative; }
.dt-stat .dt-stat-top::after {
  content: '';
  position: absolute;
  top: -18px; left: -18px; right: -18px;
  height: 1px;
  background: var(--shimmer);
  background-size: 40% 100%;
  background-repeat: no-repeat;
  background-position: -60% 0;
  opacity: 0;
}
.dt-stat:hover .dt-stat-top::after {
  opacity: 1;
  animation: dt-shimmer 900ms ease forwards;
}
@keyframes dt-shimmer {
  from { background-position: -60% 0; }
  to   { background-position: 160% 0; }
}

/* ── Blocks ────────────────────────────────── */
.dt-block { margin-top: 30px; }
.dt-block-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 14px;
}
.dt-h2 { font-size: 14px; font-weight: 600; margin: 0; letter-spacing: 0.2px; }
.dt-block-meta {
  font-family: var(--mono);
  font-size: 10.5px; letter-spacing: 1px;
  color: var(--text-2);
}

/* ── Learning Path stages ──────────────────── */
.dt-stages {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.dt-stage { padding: 20px; display: flex; gap: 14px; }
.dt-stage-n {
  font-family: var(--mono);
  font-size: 44px;
  font-weight: 700;
  line-height: 0.9;
  color: rgba(226, 232, 240, 0.07);
  user-select: none;
}
.dt-stage-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.dt-stage-label {
  font-family: var(--mono);
  font-size: 9.5px; letter-spacing: 2px;
  color: var(--text-2);
}
.dt-stage-title { font-size: 15px; font-weight: 600; margin: 0; }
.dt-stage-sub { font-size: 11.5px; color: var(--text-2); }
.dt-progress {
  margin-top: 10px;
  height: 3px; border-radius: 3px;
  background: rgba(79, 156, 249, 0.1);
  overflow: hidden;
}
.dt-progress-fill {
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(79, 156, 249, 0.6);
  border-radius: 3px;
}
.dt-stage-pct {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 10.5px; color: var(--text-2);
}
.dt-stage.is-active {
  border-color: rgba(79, 156, 249, 0.45);
  box-shadow: 0 0 0 1px rgba(79,156,249,0.15), 0 10px 30px rgba(0,0,0,0.4);
}
.dt-stage.is-done .dt-progress-fill { background: #56d6a0; box-shadow: 0 0 8px rgba(86,214,160,0.5); }
.dt-stage.is-locked { opacity: 0.55; }
.dt-stage.is-locked .dt-stage-n { color: rgba(226, 232, 240, 0.04); }
.dt-badge {
  position: absolute;
  top: 14px; right: 14px;
  font-family: var(--mono);
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  color: var(--accent);
  padding: 3px 7px;
  border: 1px solid rgba(79, 156, 249, 0.35);
  border-radius: 5px;
  background: rgba(79, 156, 249, 0.08);
}

/* ── Two columns ───────────────────────────── */
.dt-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.dt-panel { padding: 20px; }

.dt-activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.dt-activity-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(79, 156, 249, 0.06);
}
.dt-activity-row:last-child { border-bottom: 0; }
.dt-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); flex-shrink: 0;
  box-shadow: 0 0 6px var(--accent);
}
.dt-activity-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.dt-activity-word { font-family: var(--mono); font-size: 13px; color: var(--text); }
.dt-activity-tr { font-size: 11.5px; color: var(--text-2); }
.dt-activity-time {
  font-family: var(--mono);
  font-size: 10.5px; color: var(--text-2); white-space: nowrap;
}

.dt-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dt-action {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 14px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: rgba(79, 156, 249, 0.03);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: transform 200ms ease, border-color 200ms ease, background 200ms ease;
}
.dt-action:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 156, 249, 0.4);
  background: rgba(79, 156, 249, 0.08);
}
.dt-action-icon {
  font-family: var(--mono);
  font-size: 15px; color: var(--accent);
  width: 18px; text-align: center;
}

@media (max-width: 900px) {
  .dt-stats { grid-template-columns: repeat(2, 1fr); }
  .dt-stages { grid-template-columns: 1fr; }
  .dt-cols { grid-template-columns: 1fr; }
}
`;
