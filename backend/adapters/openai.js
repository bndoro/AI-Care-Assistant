/**
 * OpenAI adapter — GPT-4o / GPT-4o-mini
 * Requires: OPENAI_API_KEY, OPENAI_MODEL (default: gpt-4o)
 */

const SYSTEM_PROMPT = `You are ALA (Autonomous Life Assistant), a warm, patient, and calm AI care companion
for elderly users. You speak in short, clear sentences. You never use medical jargon.
You know the user's care profile (medications, schedule, family contacts) which will be
provided in the conversation context. Always be reassuring. If the user says anything
that sounds like an emergency (fall, pain, help), tell them you are alerting their family
immediately and to stay calm.`;

async function chat(userText, state = {}) {
  const fetch = (await import('node-fetch')).default;

  const profileSummary = buildProfileSummary(state);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + profileSummary },
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'I\'m here. Could you say that again?';
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
    `Bills: ${bills.filter(b => b.status === 'paid').length} of ${bills.length} paid.`,
  ].join(' ');
}

module.exports = { chat };
