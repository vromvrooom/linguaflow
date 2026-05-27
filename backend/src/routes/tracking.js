const { Router } = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = Router();

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

async function recalculateStreak(userId, startOfDay) {
  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const recentStats = await prisma.dailyStat.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo, lte: startOfDay },
      englishMinutes: { gt: 0 },
    },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  let streak = 0;
  const cursor = new Date(startOfDay);

  for (const stat of recentStats) {
    const statDay = new Date(stat.date);
    statDay.setUTCHours(0, 0, 0, 0);
    if (statDay.getTime() === cursor.getTime()) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  await prisma.dailyStat.updateMany({
    where: { userId, date: startOfDay },
    data: { streakDay: streak },
  });
}

router.post('/heartbeat', auth, async (req, res) => {
  const { domain, language, durationSeconds } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'domain is required' });
  }

  const duration = typeof durationSeconds === 'number' && durationSeconds > 0
    ? Math.round(durationSeconds)
    : 30;

  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);

  const session = await prisma.trackingSession.findFirst({
    where: {
      userId: req.user.id,
      domain,
      endedAt: null,
      startedAt: { gte: cutoff },
    },
    orderBy: { startedAt: 'desc' },
  });

  let result;
  if (session) {
    result = await prisma.trackingSession.update({
      where: { id: session.id },
      data: { durationSeconds: { increment: duration } },
    });
  } else {
    result = await prisma.trackingSession.create({
      data: {
        userId: req.user.id,
        domain,
        language: language ?? 'unknown',
        durationSeconds: duration,
      },
    });
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const isEnglish = language === 'en';

  // Always upsert — increment seconds, then derive minutes from accumulated total
  const updatedStat = await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.user.id, date: startOfDay } },
    update: isEnglish
      ? { englishSeconds: { increment: duration } }
      : { ukrainianSeconds: { increment: duration } },
    create: {
      userId: req.user.id,
      date: startOfDay,
      englishSeconds: isEnglish ? duration : 0,
      ukrainianSeconds: isEnglish ? 0 : duration,
    },
  });

  // Recompute minutes from accumulated seconds
  const newEnglishMinutes = Math.floor(updatedStat.englishSeconds / 60);
  const newUkrainianMinutes = Math.floor(updatedStat.ukrainianSeconds / 60);

  if (
    newEnglishMinutes !== updatedStat.englishMinutes ||
    newUkrainianMinutes !== updatedStat.ukrainianMinutes
  ) {
    await prisma.dailyStat.update({
      where: { id: updatedStat.id },
      data: {
        englishMinutes: newEnglishMinutes,
        ukrainianMinutes: newUkrainianMinutes,
      },
    });

    if (isEnglish && newEnglishMinutes > 0) {
      await recalculateStreak(req.user.id, startOfDay);
    }
  }

  res.json(result);
});

router.post('/search', auth, async (req, res) => {
  const { language } = req.body;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const stat = await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.user.id, date: startOfDay } },
    update: language === 'en'
      ? { englishSearches: { increment: 1 } }
      : {},
    create: {
      userId: req.user.id,
      date: startOfDay,
      englishSearches: language === 'en' ? 1 : 0,
    },
  });

  res.json(stat);
});

module.exports = router;
