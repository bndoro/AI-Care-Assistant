/**
 * AI Adapter Router
 * Reads AI_PROVIDER from env and returns the right adapter.
 * Swap providers by changing one line in .env — no other code changes needed.
 */

function getAdapter() {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'openai':   return require('./openai');
    case 'gemini':   return require('./gemini');
    case 'claude':   return require('./claude');
    case 'mock':
    default:         return require('./mock');
  }
}

module.exports = { getAdapter };
