const client = require('prom-client');
const prisma = require('./prisma');

const register = new client.Registry();

// Collect default Node.js metrics (heap, CPU, event loop, etc.)
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['route', 'method', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['route', 'method', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const activeUsersTotal = new client.Gauge({
  name: 'active_users_total',
  help: 'Total number of users in the database',
  registers: [register],
  async collect() {
    try {
      this.set(await prisma.user.count());
    } catch (err) {
      // Leave the previous value if the database is unreachable
    }
  },
});

const wordsTotal = new client.Gauge({
  name: 'words_total',
  help: 'Total number of words in the database',
  registers: [register],
  async collect() {
    try {
      this.set(await prisma.word.count());
    } catch (err) {
      // Leave the previous value if the database is unreachable
    }
  },
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeUsersTotal,
  wordsTotal,
};
