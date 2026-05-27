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

const app = express();

app.use(cors());
app.use(express.json());

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
