const { Router } = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = Router();

router.get('/due', auth, async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const cards = await prisma.srsCard.findMany({
    where: { userId: req.user.id, nextReviewAt: { lte: new Date() } },
    include: { word: true },
    orderBy: { nextReviewAt: 'asc' },
    take: limit,
  });

  res.json(cards);
});

router.post('/:id/review', auth, async (req, res) => {
  const quality = Number(req.body.quality);

  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    return res.status(400).json({ error: 'quality must be integer 0-5' });
  }

  const card = await prisma.srsCard.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  let { intervalDays, easeFactor, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    );
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.srsCard.update({
    where: { id: card.id },
    data: { intervalDays, easeFactor, repetitions, lastQuality: quality, nextReviewAt },
    include: { word: true },
  });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.user.id, date: startOfDay } },
    update: { cardsReviewed: { increment: 1 } },
    create: { userId: req.user.id, date: startOfDay, cardsReviewed: 1 },
  });

  res.json(updated);
});

module.exports = router;
