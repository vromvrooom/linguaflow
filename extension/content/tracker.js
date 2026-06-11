(function() {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isWebapp = (isLocalhost && window.location.port === '3000') || hostname === 'linguaflow1.duckdns.org';
  const isChromeExtension = window.location.protocol === 'chrome-extension:';

  // Автологін: якщо відкрита webapp — читаємо токен і надсилаємо в background
  if (isWebapp) {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('auth_userId') ?? '';
    const email = localStorage.getItem('auth_email') ?? '';
    if (token) {
      chrome.runtime.sendMessage(
        { type: 'SET_TOKEN', token, userId, email },
        () => {
          if (chrome.runtime.lastError) return;
          console.log('[LF Tracker] Auto-synced auth from webapp');
        }
      );
    }
    return;
  }

  if (isChromeExtension || isLocalhost) return;

  // --- Google Search трекінг ---

  const isGoogle = hostname.includes('google.');

  function detectQueryLanguage(query) {
    const letters = query.replace(/[^a-zA-ZЀ-ӿ]/g, '');
    if (!letters.length) return 'uk';
    const latinCount = (query.match(/[a-zA-Z]/g) || []).length;
    return latinCount / letters.length > 0.5 ? 'en' : 'uk';
  }

  if (isGoogle) {
    let lastSentQuery = null;

    function checkSearch() {
      const query = new URL(location.href).searchParams.get('q');
      if (!query || query === lastSentQuery) return;
      lastSentQuery = query;

      const language = detectQueryLanguage(query);
      console.log('[LF Tracker] Google search detected:', { query, language });

      chrome.runtime.sendMessage(
        { type: 'SEARCH_QUERY', language, domain: 'google.com' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[LF Tracker] SEARCH_QUERY failed:', chrome.runtime.lastError.message);
          } else {
            console.log('[LF Tracker] SEARCH_QUERY response:', response);
          }
        }
      );
    }

    // Початкова перевірка при завантаженні сторінки
    checkSearch();

    // SPA навігація: кнопки "назад/вперед"
    window.addEventListener('popstate', checkSearch);

    // SPA навігація: зміна заголовку сторінки (Google оновлює <title> при новому пошуку)
    const titleEl = document.querySelector('title');
    if (titleEl) {
      new MutationObserver(checkSearch).observe(titleEl, { childList: true });
    }
  }

  // --- Трекінг часу ---

  const domain = hostname;

  const EN_DOMAINS = [
    'youtube.com', 'www.youtube.com',
    'bbc.com', 'www.bbc.com',
    'cnn.com', 'www.cnn.com',
    'reddit.com', 'www.reddit.com',
    'github.com', 'www.github.com',
    'stackoverflow.com', 'www.stackoverflow.com',
    'medium.com', 'www.medium.com',
    'netflix.com', 'www.netflix.com',
  ];

  const language = EN_DOMAINS.includes(domain)
    ? 'en'
    : (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('en')
      ? 'en'
      : 'uk';

  let seconds = 0;
  let active = !document.hidden;
  const BUFFER_KEY = 'lf_heartbeat_buffer';

  console.log('[LF Tracker] Initialized:', { domain, language });

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
  });

  setInterval(() => {
    if (active && !document.hidden) seconds += 5;
  }, 5000);

  function sendViaRuntime(d, lang, dur) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'TRACKING_HEARTBEAT', domain: d, language: lang, durationSeconds: dur },
        (response) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(response);
        }
      );
    });
  }

  async function drainBuffer() {
    try {
      const result = await chrome.storage.local.get([BUFFER_KEY]);
      const buffer = result[BUFFER_KEY] ?? [];
      if (!buffer.length) return;
      const grouped = {};
      for (const item of buffer) {
        const key = `${item.domain}__${item.language}`;
        if (!grouped[key]) grouped[key] = { domain: item.domain, language: item.language, durationSeconds: 0 };
        grouped[key].durationSeconds += item.durationSeconds;
      }
      for (const item of Object.values(grouped)) {
        await sendViaRuntime(item.domain, item.language, item.durationSeconds);
      }
      await chrome.storage.local.remove([BUFFER_KEY]);
    } catch { /* SW ще недоступний */ }
  }

  async function bufferHeartbeat(d, lang, dur) {
    try {
      const result = await chrome.storage.local.get([BUFFER_KEY]);
      const buffer = result[BUFFER_KEY] ?? [];
      buffer.push({ domain: d, language: lang, durationSeconds: dur });
      await chrome.storage.local.set({ [BUFFER_KEY]: buffer });
      console.warn('[LF Tracker] Buffered heartbeat, items:', buffer.length);
    } catch (err) {
      console.error('[LF Tracker] Buffer failed:', err.message);
    }
  }

  setInterval(async () => {
    if (seconds <= 0) return;
    const toSend = seconds;
    seconds = 0;
    await drainBuffer();
    console.log('[LF Tracker] Sending heartbeat:', { domain, language, durationSeconds: toSend });
    try {
      const response = await sendViaRuntime(domain, language, toSend);
      console.log('[LF Tracker] Heartbeat OK:', response);
    } catch (err) {
      console.warn('[LF Tracker] sendMessage failed:', err.message);
      await bufferHeartbeat(domain, language, toSend);
    }
  }, 30000);
})();
