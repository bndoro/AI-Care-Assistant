/**
 * firebase-config.js
 *
 * Replace each value below with your project's config from:
 * Firebase Console → Project Settings → Your Apps → Web App → SDK setup
 *
 * This file is safe to commit — these are public identifiers, not secrets.
 * Firebase security is enforced by Realtime Database Rules, not by hiding these keys.
 */

const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_ME",
  authDomain:        "REPLACE_ME.firebaseapp.com",
  databaseURL:       "https://REPLACE_ME-default-rtdb.firebaseio.com",
  projectId:         "REPLACE_ME",
  storageBucket:     "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId:             "REPLACE_ME",
};

// ── ALA state path in Firebase ───────────────────────────────────────────────
// One path per patient instance. For multi-patient you'd use /patients/{patientId}/state
const ALA_STATE_PATH = '/ala/state';

// ── API server base URL ───────────────────────────────────────────────────────
// Local dev: http://localhost:3001
// Deployed:  https://your-project.vercel.app
const API_BASE_URL = 'http://localhost:3001';
