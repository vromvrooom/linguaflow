const { Router } = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = Router();

const EMPTY_STAT = {
  englishMinutes: 0,
  ukrainianMinutes: 0,
  wordsAdded: 0,
  cardsReviewed: 0,
  englishSearches: 0,
  streakDay: 0,
};

router.get('/daily', auth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const stat = await prisma.dailyStat.findUnique({
    where: { userId_date: { userId: req.user.id, date: startOfDay } },
  });

  res.json(stat ?? EMPTY_STAT);
});

router.get('/weekly', auth, async (req, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const stats = await prisma.dailyStat.findMany({
    where: {
      userId: req.user.id,
      date: { gte: sevenDaysAgo, lte: today },
    },
    orderBy: { date: 'asc' },
  });

  // Fill in missing days with zeros so the chart always has 7 points
  const statsMap = new Map(stats.map((s) => [s.date.toISOString().slice(0, 10), s]));
  const result = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(
      statsMap.get(key) ?? { ...EMPTY_STAT, date: d.toISOString(), userId: req.user.id },
    );
  }

  res.json(result);
});

router.get('/monthly', auth, async (req, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const stats = await prisma.dailyStat.findMany({
    where: {
      userId: req.user.id,
      date: { gte: thirtyDaysAgo, lte: today },
    },
    orderBy: { date: 'asc' },
  });

  // Fill in missing days with zeros so the chart always has 30 points
  const statsMap = new Map(stats.map((s) => [s.date.toISOString().slice(0, 10), s]));
  const result = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(
      statsMap.get(key) ?? { ...EMPTY_STAT, date: d.toISOString(), userId: req.user.id },
    );
  }

  res.json(result);
});

if (process.env.NODE_ENV !== 'production') {
  router.get('/debug', auth, async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [sessions, dailyStat] = await Promise.all([
      prisma.trackingSession.findMany({
        where: {
          userId: req.user.id,
          startedAt: { gte: startOfDay },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.dailyStat.findUnique({
        where: { userId_date: { userId: req.user.id, date: startOfDay } },
      }),
    ]);

    res.json({
      serverUtcNow: new Date().toISOString(),
      startOfDayUtc: startOfDay.toISOString(),
      todaySessions: sessions,
      todayDailyStat: dailyStat,
    });
  });
}

module.exports = router;
