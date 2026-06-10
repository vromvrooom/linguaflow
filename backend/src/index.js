require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const wordsRoutes = require('./routes/words');
const trackingRoutes = require('./routes/tracking');
const statsRoutes = require('./routes/stats');
const cardsRoutes = require('./routes/cards');
const planRoutes = require('./routes/plan');
const translateRoutes = require('./routes/translate');

const { register, httpRequestsTotal, httpRequestDuration } = require('./lib/metrics');

const app = express();

app.use(cors());
app.use(express.json());

// Measure request count and duration for every request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    const labels = { route, method: req.method, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/words', wordsRoutes);
app.use('/tracking', trackingRoutes);
app.use('/stats', statsRoutes);
app.use('/cards', cardsRoutes);
app.use('/plan', planRoutes);
app.use('/translate', translateRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
