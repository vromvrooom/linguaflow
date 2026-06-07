const { Router } = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = Router();

function cleanWord(raw) {
  return raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase().trim();
}

const SORT_MAP = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  az:     { word: 'asc' },
};

router.post('/', auth, async (req, res) => {
  const { word, contextSentence, sourceUrl, sourceTimestamp, level } = req.body;
  let { translation } = req.body;

  // Guard: older extension versions send translation as an object { wordTranslation, sentenceTranslation }
  if (translation && typeof translation === 'object') {
    translation = translation.wordTranslation ?? null;
  }

  if (!word) {
    return res.status(400).json({ error: 'word is required' });
  }

  const clean = cleanWord(word);
  if (!clean) {
    return res.status(400).json({ error: 'word contains no valid characters' });
  }

  try {
  const created = await prisma.word.create({
    data: {
      userId: req.user.id,
      word: clean,
      translation: typeof translation === 'string' ? translation : null,
      contextSentence,
      sourceUrl,
      sourceTimestamp,
      level,
      stageAdded: req.user.currentStage ?? 1,
    },
  });

  await prisma.srsCard.create({
    data: {
      wordId: created.id,
      userId: req.user.id,
      nextReviewAt: new Date(),
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
    },
  });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.user.id, date: startOfDay } },
    update: { wordsAdded: { increment: 1 } },
    create: { userId: req.user.id, date: startOfDay, wordsAdded: 1 },
  });

  res.status(201).json(created);
  } catch (err) {
    console.error('[words] POST failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;
  const level = req.query.level || null;
  const sort  = req.query.sort  || 'newest';

  const where = { userId: req.user.id };
  if (level) where.level = level;

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.newest;

  const [words, total] = await Promise.all([
    prisma.word.findMany({ where, orderBy, skip, take: limit }),
    prisma.word.count({ where }),
  ]);

  res.json({
    data: words,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.put('/:id', auth, async (req, res) => {
  const existing = await prisma.word.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Word not found' });
  }

  const { word, translation, contextSentence, level } = req.body;

  if (!word?.trim()) {
    return res.status(400).json({ error: 'word is required' });
  }

  const updated = await prisma.word.update({
    where: { id: req.params.id },
    data: {
      word: word.trim(),
      translation: translation ?? null,
      contextSentence: contextSentence ?? null,
      level: level ?? null,
    },
  });

  res.json(updated);
});

router.delete('/:id', auth, async (req, res) => {
  const existing = await prisma.word.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Word not found' });
  }

  await prisma.srsCard.deleteMany({ where: { wordId: req.params.id } });
  await prisma.word.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
