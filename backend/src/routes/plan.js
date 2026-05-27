const { Router } = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', auth, async (req, res) => {
  const progress = await prisma.planProgress.findMany({
    where: { userId: req.user.id },
  });
  res.json(progress);
});

router.post('/', auth, async (req, res) => {
  const { taskKey, stage, value, completed } = req.body;

  if (!taskKey) {
    return res.status(400).json({ error: 'taskKey is required' });
  }

  const data = {
    value: typeof value === 'number' ? value : undefined,
    completedAt: completed === true
      ? new Date()
      : completed === false
      ? null
      : undefined,
  };

  // remove undefined keys so Prisma doesn't complain
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const record = await prisma.planProgress.upsert({
    where: { userId_taskKey: { userId: req.user.id, taskKey } },
    update: data,
    create: {
      userId: req.user.id,
      taskKey,
      stage: stage ?? 1,
      value: typeof value === 'number' ? value : 0,
      completedAt: completed ? new Date() : null,
    },
  });

  res.json(record);
});

module.exports = router;
