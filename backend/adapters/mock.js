/**
 * Mock AI adapter — no API key needed.
 * Returns rule-based responses. Great for local demo / hackathon fallback.
 */

const SYSTEM_PROMPT = `You are ALA (Autonomous Life Assistant), a warm and calm AI care companion
for elderly users. You speak simply, reassuringly, and never use jargon.
You know the user's name, medications, schedule, and family contacts from their care profile.`;

/**
 * @param {string} userText  – raw transcript from the patient
 * @param {object} state     – current ALA state object (meds, schedule, etc.)
 * @returns {Promise<string>} spoken reply
 */
async function chat(userText, state = {}) {
  const t = (userText || '').toLowerCase();
  const name = state?.patient?.name?.split(' ')[0] || 'there';

  if (/(what.*day|schedule|today|plan)/.test(t)) {
    const pending = (state.meds || []).filter(m => m.status !== 'taken').length;
    const next = (state.schedule || [])[0];
    return `Good ${getTimeOfDay()}, ${name}! You have ${pending} medication${pending !== 1 ? 's' : ''} left today.`
      + (next ? ` Your next event is ${next.title} at ${next.time}.` : ' Your schedule looks clear.');
  }

  if (/took.*(pill|med)|i took|just took/.test(t)) {
    const next = (state.meds || []).find(m => m.status === 'pending');
    if (next) return `Great job, ${name}! I've marked your ${next.name} as taken. Keep it up!`;
    return `You're all caught up on your medications today, ${name}. Well done!`;
  }

  if (/(bill|electric|water|payment)/.test(t)) {
    const unpaid = (state.bills || []).filter(b => b.status !== 'paid');
    if (unpaid.length === 0) return `All your bills are handled today, ${name}. Nothing to worry about.`;
    return `You have ${unpaid.length} bill${unpaid.length !== 1 ? 's' : ''} coming up: ${unpaid.map(b => b.name).join(' and ')}.`;
  }

  if (/(call|son|daughter|family|daniel|caregiver)/.test(t)) {
    return `I'll let your family know you'd like to chat. Reaching out to Daniel now.`;
  }

  if (/(help|emergency|hurt|fall|fallen|can't get up)/.test(t)) {
    return `I'm alerting your family right now, ${name}. Please stay still and stay calm. Help is on the way.`;
  }

  if (/(how.*feel|wellness|not well|pain|hurt)/.test(t)) {
    return `I'm sorry to hear that, ${name}. On a scale of great, okay, or not great — how would you say you're feeling right now?`;
  }

  if (/(weather|outside|walk|exercise)/.test(t)) {
    return `It looks like a nice day for a short walk, ${name}. Even 10 minutes outside can lift your spirits. Should I remind you in 30 minutes?`;
  }

  if (/(remind|reminder|forget)/.test(t)) {
    return `Of course, ${name}. I'll send you a reminder. Just tell me what you'd like me to remind you about and when.`;
  }

  return `I'm here with you, ${name}. You can ask me about your day, your pills, your bills, or just say "help" if you ever need me.`;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

module.exports = { chat };
