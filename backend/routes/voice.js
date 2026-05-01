/**
 * POST /api/voice
 * Body: { text: string, state: object }
 * Returns: { reply: string, action?: string }
 *
 * The "action" field lets the frontend know if it should trigger
 * a side-effect (e.g. markMedTaken, callFamily, triggerEmergency).
 */

const express = require('express');
const router = express.Router();
const { getAdapter } = require('../adapters');

// Detect intent for side-effects the frontend should act on
function detectAction(text) {
  const t = (text || '').toLowerCase();
  if (/(help|emergency|hurt|fall|fallen|can't get up)/.test(t)) return 'triggerEmergency';
  if (/took.*(pill|med)|i took|just took/.test(t)) return 'markMedTaken';
  if (/(call|son|daughter|family|daniel)/.test(t)) return 'callFamily';
  if (/(pay|bill)/.test(t)) return 'checkBills';
  return null;
}

router.post('/', async (req, res) => {
  const { text, state } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text field required' });
  }

  try {
    const adapter = getAdapter();
    const reply = await adapter.chat(text, state || {});
    const action = detectAction(text);
    res.json({ reply, action });
  } catch (err) {
    console.error('[voice] AI adapter error:', err.message);
    // Graceful fallback so the user never sees a crash
    res.json({
      reply: "I'm here with you. Could you say that again?",
      action: null,
      error: err.message,
    });
  }
});

module.exports = router;
