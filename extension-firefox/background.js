const isFirefox = typeof browser !== 'undefined';

const API_URL = 'https://linguaflow1.duckdns.org/api';
const APP_URL = 'https://linguaflow1.duckdns.org';
const MYMEMORY = 'https://api.mymemory.translated.net/get';

// Контекстне меню — створюємо при інсталяції, воно зберігається Chrome-ом між перезапусками SW
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'linguaflow-save',
    title: '💾 Додати в LinguaFlow',
    contexts: ['selection'],
  });
  console.log('[LF BG] Context menu created');
});

async function translateWord(word, sentence) {
  const { token } = await chrome.storage.local.get(['token']);
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ word, sentence: sentence || undefined, sourceLang: 'en', targetLang: 'uk' }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[LF BG] translateWord error:', err.message);
    return null;
  }
}

function showNotification(title, message) {
  console.log('[LF BG] showNotification:', title, '|', message, '| chrome.notifications:', !!chrome.notifications);
  if (!chrome.notifications) return;
  chrome.notifications.create(`lf-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'linguaflow-save') return;

  const selected = info.selectionText?.trim();
  if (!selected) return;

  // Clean the word (letters only); keep the full selection as sentence context
  const word = selected.replace(/[^a-zA-Z'-]/g, '').toLowerCase().trim() || selected;

  // Grab sentence context from the page so DeepL can translate in context
  let sentence = selected.length > word.length ? selected : null;
  try {
    const [{ result: pageContext }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return sel;
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const text = (container.nodeType === Node.TEXT_NODE ? container.textContent : container.innerText) ?? sel;
        // grab up to 200 chars around the selection
        const start = Math.max(0, range.startOffset - 100);
        const end = Math.min(text.length, range.endOffset + 100);
        return text.slice(start, end).trim();
      },
      args: [selected],
    });
    if (pageContext && pageContext.length > word.length) sentence = pageContext;
  } catch { /* scripting not available on this page */ }

  console.log('[LF BG] Context menu | word:', word, '| sentence:', sentence?.slice(0, 80));

  const result = await translateWord(word, sentence);
  const wordTranslation = result?.wordTranslation ?? null;
  console.log('[LF BG] Translation result:', result);

  try {
    await sendToBackend('/words', 'POST', {
      word,
      translation: wordTranslation,
      contextSentence: sentence ?? selected,
      sourceUrl: tab?.url ?? '',
    });
    console.log('[LF BG] Saved via context menu:', word, '→', wordTranslation);
    showNotification('LinguaFlow', `Збережено: "${word}"${wordTranslation ? ` → ${wordTranslation}` : ''}`);
  } catch (err) {
    console.error('[LF BG] Context menu save failed:', err.message);
    showNotification('LinguaFlow — Помилка', `Не вдалося зберегти "${word}": ${err.message}`);
  }
});

async function sendToBackend(endpoint, method, data) {
  const { token } = await chrome.storage.local.get(['token']);
  console.log(`[LF BG] ${method} ${endpoint} | token: ${token ? 'exists' : 'MISSING'}`);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (method !== 'GET') {
    options.body = JSON.stringify(data);
    console.log('[LF BG] Request body:', options.body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, options);
  } catch (err) {
    console.error('[LF BG] fetch failed (network error):', err.message);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[LF BG] HTTP ${res.status} from ${endpoint}:`, text);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  console.log(`[LF BG] Response from ${endpoint}:`, json);
  return json;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type } = message;
  console.log('[LF BG] Message received:', type, message);

  if (type === 'TRANSLATE_REQUEST') {
    translateWord(message.word, message.sentence)
      .then((result) => {
        if (!result) return sendResponse({ ok: false, error: 'Translation failed' });
        sendResponse({ ok: true, wordTranslation: result.wordTranslation, sentenceTranslation: result.sentenceTranslation });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'SAVE_WORD') {
    const cleanWord = (message.word ?? '').replace(/[^a-zA-Z'-]/g, '').toLowerCase().trim();
    const wordLabel = cleanWord || message.word;

    const doSave = (translation) => sendToBackend('/words', 'POST', {
      word: cleanWord || message.word,
      translation,
      contextSentence: message.contextSentence,
      sourceUrl: message.sourceUrl,
    });

    const onSaved = (data) => {
      showNotification('LinguaFlow', `✓ "${wordLabel}" збережено`);
      sendResponse({ ok: true, data });
    };
    const onFailed = (err) => {
      showNotification('LinguaFlow — Помилка', `Не вдалося зберегти "${wordLabel}": ${err.message}`);
      sendResponse({ ok: false, error: err.message });
    };

    if (message.translation) {
      // translation already fetched by the tooltip — save immediately
      doSave(message.translation).then(onSaved).catch(onFailed);
    } else {
      // auto-translate via backend then save
      translateWord(message.word, message.contextSentence)
        .then((result) => doSave(result?.wordTranslation ?? null))
        .then(onSaved)
        .catch(onFailed);
    }
    return true;
  }

  if (type === 'SEARCH_QUERY') {
    sendToBackend('/tracking/search', 'POST', { language: message.language })
      .then((res) => sendResponse({ ok: true, res }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'TRACKING_HEARTBEAT') {
    const data = {
      domain: message.domain,
      language: message.language,
      durationSeconds: message.durationSeconds,
    };
    console.log('[LF BG] Heartbeat payload:', data);
    sendToBackend('/tracking/heartbeat', 'POST', data)
      .then((res) => sendResponse({ ok: true, res }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'GET_TOKEN') {
    chrome.storage.local.get(['token', 'userId', 'email']).then((result) => {
      sendResponse({ token: result.token, userId: result.userId, email: result.email });
    });
    return true;
  }

  if (type === 'SET_TOKEN') {
    chrome.storage.local
      .set({ token: message.token, userId: message.userId, email: message.email })
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (type === 'GET_STATS') {
    Promise.all([
      sendToBackend('/stats/daily', 'GET'),
      sendToBackend('/words?limit=1', 'GET'),
    ])
      .then(([stats, words]) => sendResponse({ ok: true, stats, words }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
