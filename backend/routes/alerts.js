/**
 * POST /api/alerts/escalate
 * Called by the escalation engine when a critical alert fires.
 * Optionally sends an SMS via Twilio if configured.
 */

const express = require('express');
const router = express.Router();

async function sendSMS(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return { skipped: true, reason: 'Twilio not configured' };

  const fetch = (await import('node-fetch')).default;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await res.json();
  return { sid: data.sid, status: data.status };
}

router.post('/escalate', async (req, res) => {
  const { level, message, patient, caregiver } = req.body;

  console.log(`[alert] ${level?.toUpperCase()} — ${message}`);

  const result = { logged: true, sms: null };

  if (level === 'critical' && process.env.ENABLE_ESCALATION_WEBHOOKS === 'true') {
    const to = process.env.CAREGIVER_PHONE;
    if (to) {
      const smsBody = `ALA ALERT for ${patient?.name || 'your patient'}: ${message}`;
      result.sms = await sendSMS(to, smsBody);
    }
  }

  res.json(result);
});

module.exports = router;
