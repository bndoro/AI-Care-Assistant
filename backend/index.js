/**
 * ALA Backend API Server
 * Stack: Node.js + Express
 *
 * Routes:
 *   GET  /api/health          — server health check
 *   POST /api/voice           — AI voice assistant (pluggable adapter)
 *   POST /api/alerts/escalate — escalation + optional SMS notification
 */

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    // Add your Vercel URL here once deployed
  ],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// ── Request logger (dev-friendly) ─────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'mock',
    ts: new Date().toISOString(),
  });
});

app.use('/api/voice', require('./routes/voice'));
app.use('/api/alerts', require('./routes/alerts'));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🟢 ALA API running on http://localhost:${PORT}`);
  console.log(`   AI provider : ${process.env.AI_PROVIDER || 'mock'}`);
  console.log(`   Firebase    : ${process.env.FIREBASE_PROJECT_ID || 'not configured'}\n`);
});
