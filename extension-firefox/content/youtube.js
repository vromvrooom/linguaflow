(function() {
  let tooltip = null;

  console.log('[LF YouTube] Content script loaded');

  function removeTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null; }
  }

  function getWordAtPoint(x, y, target) {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range?.startContainer.nodeType === Node.TEXT_NODE) {
        const text = range.startContainer.textContent ?? '';
        const offset = range.startOffset;

        let start = offset;
        let end = offset;
        while (start > 0 && /\S/.test(text[start - 1])) start--;
        while (end < text.length && /\S/.test(text[end])) end++;

        const word = text
          .slice(start, end)
          .replace(/^[^a-zA-Zа-яА-ЯіІїЇєЄ]+|[^a-zA-Zа-яА-ЯіІїЇєЄ]+$/g, '');

        if (word.length >= 2) {
          console.log('[LF YouTube] caretRangeFromPoint →', word);
          return word;
        }
      }
    }

    const text = (target?.textContent ?? '').trim();
    if (!text) return null;
    const words = text.split(/\s+/).filter((w) => w.length >= 2);
    if (!words.length) return null;

    const rect = target.getBoundingClientRect?.();
    if (rect?.width > 0) {
      const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      return words[Math.min(Math.floor(ratio * words.length), words.length - 1)];
    }

    return words[0];
  }

  function el(tag, css, text) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function showTooltip(x, y, word, context) {
    removeTooltip();

    tooltip = el('div', `
      position: fixed; z-index: 2147483647;
      background: #1e293b; border: 1px solid #334155; border-radius: 10px;
      padding: 10px 14px; color: #f1f5f9; font-family: system-ui; font-size: 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.6);
      pointer-events: auto; max-width: 420px; min-width: 220px;
      display: flex; flex-direction: column; gap: 8px;
    `);

    // Position: above the click, clamped to viewport
    tooltip.style.left = `${Math.min(x, window.innerWidth - 440)}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.transform = 'translateY(calc(-100% - 8px))';

    // ── Row 1: word + save button ──────────────────────────────
    const row1 = el('div', 'display:flex; align-items:center; justify-content:space-between; gap:10px;');

    const wordSpan = el('span', 'font-weight:700; font-size:15px; color:#f8fafc; flex:1;', `"${word}"`);

    let pendingTranslation = null; // set by translate button before saving

    const saveBtn = el('button', `
      background:#3b82f6; border:none; border-radius:6px;
      color:white; padding:4px 10px; cursor:pointer; font-size:12px;
      white-space:nowrap; flex-shrink:0; transition:background .15s;
    `, '💾 Зберегти');

    saveBtn.addEventListener('mouseenter', () => { saveBtn.style.background = '#2563eb'; });
    saveBtn.addEventListener('mouseleave', () => { saveBtn.style.background = '#3b82f6'; });
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveBtn.disabled = true;
      chrome.runtime.sendMessage(
        { type: 'SAVE_WORD', word, translation: pendingTranslation, contextSentence: context, sourceUrl: location.href },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[LF YouTube] SAVE_WORD error:', chrome.runtime.lastError.message);
            saveBtn.textContent = '⚠️ Помилка';
            saveBtn.disabled = false;
            return;
          }
          console.log('[LF YouTube] Word saved:', response);
          saveBtn.textContent = '✓ Збережено!';
          saveBtn.style.background = '#22c55e';
          setTimeout(removeTooltip, 1800);
        }
      );
    });

    row1.appendChild(wordSpan);
    row1.appendChild(saveBtn);
    tooltip.appendChild(row1);

    // ── Row 2: context + translate (only when context differs from word) ──
    const hasContext = context && context !== word && context.trim().length > word.length;
    if (hasContext) {
      tooltip.appendChild(el('div', 'border-top:1px solid #334155;'));

      const ctxWrap = el('div', 'display:flex; flex-direction:column; gap:6px;');

      const maxLen = 90;
      const shortCtx = context.length > maxLen ? context.slice(0, maxLen) + '…' : context;
      ctxWrap.appendChild(el('em', 'color:#94a3b8; font-size:12px; line-height:1.5;', shortCtx));

      const actionsRow = el('div', 'display:flex; align-items:center; gap:8px; flex-wrap:wrap;');

      const translateBtn = el('button', `
        background:transparent; border:1px solid #475569; border-radius:5px;
        color:#94a3b8; padding:3px 8px; cursor:pointer; font-size:11px; transition:all .15s;
      `, '🔍 Перекласти речення');

      translateBtn.addEventListener('mouseenter', () => {
        translateBtn.style.borderColor = '#60a5fa';
        translateBtn.style.color = '#60a5fa';
      });
      translateBtn.addEventListener('mouseleave', () => {
        translateBtn.style.borderColor = '#475569';
        translateBtn.style.color = '#94a3b8';
      });

      const sentenceTransEl = el('span', 'color:#7dd3fc; font-size:12px; line-height:1.5; display:none;');
      const wordTransEl    = el('span', 'color:#86efac; font-size:12px; font-weight:500; display:none;');

      translateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        translateBtn.textContent = '⏳ Перекладаю…';
        translateBtn.disabled = true;

        chrome.runtime.sendMessage(
          { type: 'TRANSLATE_REQUEST', word, sentence: context },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
              translateBtn.textContent = '⚠️ Помилка перекладу';
              translateBtn.disabled = false;
              return;
            }
            translateBtn.style.display = 'none';

            if (response.wordTranslation) {
              pendingTranslation = response.wordTranslation;
              wordTransEl.textContent = `${word} = ${response.wordTranslation}`;
              wordTransEl.style.display = 'inline';
            }
            if (response.sentenceTranslation) {
              sentenceTransEl.textContent = response.sentenceTranslation;
              sentenceTransEl.style.display = 'block';
            }
          }
        );
      });

      actionsRow.appendChild(translateBtn);
      actionsRow.appendChild(wordTransEl);
      ctxWrap.appendChild(actionsRow);
      ctxWrap.appendChild(sentenceTransEl);
      tooltip.appendChild(ctxWrap);
    }

    document.body.appendChild(tooltip);
    setTimeout(removeTooltip, hasContext ? 20000 : 8000);
  }

  document.addEventListener('dblclick', (e) => {
    const { clientX, clientY, target } = e;

    const captionEl = target.closest?.('.ytp-caption-segment') ?? target;
    const context = (captionEl?.textContent ?? target?.textContent ?? '').trim();

    const word = getWordAtPoint(clientX, clientY, target);
    console.log('[LF YouTube] dblclick → word:', word, '| context:', context.slice(0, 60));

    if (!word) return;
    showTooltip(clientX, clientY, word, context || word);
  }, true);

  document.addEventListener('click', (e) => {
    if (tooltip && !tooltip.contains(e.target)) removeTooltip();
  }, true);
})();
