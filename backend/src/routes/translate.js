const { Router } = require('express');
const auth = require('../middleware/auth');
const redis = require('../lib/redis');

const router = Router();

const DEEPL_KEY = process.env.DEEPL_API_KEY || '';
// Free-plan keys end with ':fx'; Pro keys use the standard endpoint
const DEEPL_ENDPOINT = DEEPL_KEY.endsWith(':fx')
  ? 'https://api-free.deepl.com/v2/translate'
  : 'https://api.deepl.com/v2/translate';

async function translateWithDeepL(text, sourceLang, targetLang) {
  const res = await fetch(DEEPL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceLang.toUpperCase(),
      target_lang: targetLang.toUpperCase(),
    }),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const data = await res.json();
  return data.translations[0].text;
}

async function translateWithMyMemory(text, sourceLang, targetLang) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText ?? '';
  if (!translated || translated.toLowerCase() === text.toLowerCase()) throw new Error('No translation');
  return translated;
}

async function translate(text, sourceLang, targetLang) {
  if (DEEPL_KEY && DEEPL_KEY.length > 10) {
    try {
      return await translateWithDeepL(text, sourceLang, targetLang);
    } catch (err) {
      console.warn('[translate] DeepL failed, falling back to MyMemory:', err.message);
    }
  }
  return translateWithMyMemory(text, sourceLang, targetLang);
}

router.post('/', auth, async (req, res) => {
  const { word, sentence, sourceLang = 'en', targetLang = 'uk' } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });

  const cacheKey = `translate:${sourceLang}:${targetLang}:${word.toLowerCase()}`;

  // Return cache when there's no sentence (word-only requests are cacheable)
  if (!sentence) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* redis miss — continue */ }
  }

  let wordTranslation = null;
  let sentenceTranslation = null;

  try {
    wordTranslation = await translate(word, sourceLang, targetLang);
  } catch (err) {
    console.error('[translate] word translation failed:', err.message);
  }

  if (sentence) {
    try {
      sentenceTranslation = await translate(sentence, sourceLang, targetLang);
    } catch (err) {
      console.error('[translate] sentence translation failed:', err.message);
    }
  }

  const result = { wordTranslation, sentenceTranslation };

  if (wordTranslation && !sentence) {
    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: 86400 });
    } catch { /* redis write failed */ }
  }

  res.json(result);
});

module.exports = router;
