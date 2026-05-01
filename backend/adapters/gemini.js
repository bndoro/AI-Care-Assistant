/**
 * Google Gemini adapter — gemini-1.5-flash / gemini-1.5-pro
 * Requires: GEMINI_API_KEY, GEMINI_MODEL (default: gemini-1.5-flash)
 */

const SYSTEM_INSTRUCTION = `You are ALA (Autonomous Life Assistant), a warm, patient, and calm AI care companion
for elderly users. Speak in short, clear sentences. Never use medical jargon.
Always be reassuring. If the user says anything suggesting an emergency, tell them you are
alerting their family and they should stay calm.`;

async function chat(userText, state = {}) {
  const fetch = (await import('node-fetch')).default;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const profileSummary = buildProfileSummary(state);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION + '\n\n' + profileSummary }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'I\'m here. Could you say that again?';
}

function buildProfileSummary(state) {
  if (!state || !state.patient) return '';
  const { patient, meds = [], schedule = [], bills = [] } = state;
  const pendingMeds = meds.filter(m => m.status === 'pending').map(m => `${m.name} ${m.dose} at ${m.time}`);
  const nextEvent = schedule[0];
  return [
    `Patient: ${patient.name}, age ${patient.age}.`,
    pendingMeds.length ? `Pending medications today: ${pendingMeds.join('; ')}.` : 'All medications taken today.',
    nextEvent ? `Next scheduled event: ${nextEvent.title} at ${nextEvent.time}.` : 'No upcoming events.',
  ].join(' ');
}

module.exports = { chat };
