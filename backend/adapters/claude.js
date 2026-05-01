/**
 * Anthropic Claude adapter — claude-3-haiku / claude-3-sonnet
 * Requires: ANTHROPIC_API_KEY, ANTHROPIC_MODEL (default: claude-3-haiku-20240307)
 */

const SYSTEM_PROMPT = `You are ALA (Autonomous Life Assistant), a warm, patient, and calm AI care companion
for elderly users. Speak in short, clear sentences — never more than 3 sentences per reply.
Never use medical jargon. Always be reassuring and gentle. If the user indicates any emergency
(fall, pain, "help me"), respond that you are alerting their family right now and they should stay calm.`;

async function chat(userText, state = {}) {
  const fetch = (await import('node-fetch')).default;

  const profileSummary = buildProfileSummary(state);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      max_tokens: 150,
      system: SYSTEM_PROMPT + '\n\n' + profileSummary,
      messages: [{ role: 'user', content: userText }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || 'I\'m here. Could you say that again?';
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
