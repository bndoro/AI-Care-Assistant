/**
 * firebase-sync.js
 *
 * Drop-in replacement for the localStorage-based state sync.
 * Exposes the same API both HTML files already use:
 *
 *   loadState()           → returns current state object (from local cache)
 *   saveState(state)      → writes state to Firebase (+ local cache)
 *   onStateChange(cb)     → subscribes to live Firebase updates
 *   logActivity(text, kind)
 *   addAlert(level, msg, source)
 *
 * USAGE: include this script AFTER firebase-config.js in each HTML file,
 * then remove the old localStorage functions.
 */

// ── Firebase SDK (loaded via CDN in HTML) ────────────────────────────────────
// The HTML files import Firebase via:
//   <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-database-compat.js"></script>

let _db = null;
let _stateRef = null;
let _localCache = null;
let _listeners = [];

function initFirebase() {
  if (_db) return; // already initialised
  if (typeof firebase === 'undefined') {
    console.warn('[ALA] Firebase SDK not loaded. Falling back to localStorage.');
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  _db = firebase.database();
  _stateRef = _db.ref(ALA_STATE_PATH);

  // Keep local cache in sync with Firebase
  _stateRef.on('value', (snap) => {
    const val = snap.val();
    if (val) {
      _localCache = val;
      _listeners.forEach(cb => cb(val));
    }
  });
}

/** Returns the cached state synchronously (null if not yet loaded) */
function loadState() {
  if (!_db) {
    // Fallback: localStorage
    try { return JSON.parse(localStorage.getItem('ALA_STATE_v1')); } catch { return null; }
  }
  return _localCache;
}

/** Saves state to Firebase (and localStorage as backup) */
function saveState(state) {
  state.updatedAt = Date.now();
  _localCache = state;
  // Always keep localStorage in sync as offline fallback
  try { localStorage.setItem('ALA_STATE_v1', JSON.stringify(state)); } catch {}
  if (_stateRef) {
    _stateRef.set(state).catch(err => console.error('[ALA] Firebase write failed:', err));
  }
}

/** Subscribe to real-time state changes from any device */
function onStateChange(callback) {
  _listeners.push(callback);
  // If we already have cached data, call immediately
  if (_localCache) callback(_localCache);
}

/** Log an activity entry */
function logActivity(text, kind = 'note') {
  const s = loadState();
  if (!s) return;
  s.activity = s.activity || [];
  s.activity.unshift({ ts: Date.now(), kind, text });
  s.activity = s.activity.slice(0, 30);
  saveState(s);
}

/** Add an alert and return its ID */
function addAlert(level, message, source = 'system') {
  const s = loadState();
  if (!s) return null;
  const id = 'a' + Date.now();
  s.alerts = s.alerts || [];
  s.alerts.unshift({ id, level, message, source, ts: Date.now(), acknowledged: false });
  s.alerts = s.alerts.slice(0, 20);
  saveState(s);

  // Optionally call backend escalation webhook for critical alerts
  if (level === 'critical' && typeof API_BASE_URL !== 'undefined') {
    fetch(`${API_BASE_URL}/api/alerts/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, patient: s.patient }),
    }).catch(err => console.warn('[ALA] Escalation webhook failed:', err));
  }

  return id;
}

/** Default state factory — same shape as original patient.html */
function defaultState() {
  const todayISO = new Date().toISOString().slice(0, 10);
  return {
    patient: { name: 'Margaret Johnson', age: 72, location: '123 Maple Ave' },
    demoOffsetMin: 0,
    meds: [
      { id: 'm1', name: 'Lisinopril',   dose: '10 mg',  time: '09:00', status: 'pending', remindersSent: 0 },
      { id: 'm2', name: 'Metformin',    dose: '500 mg', time: '13:00', status: 'pending', remindersSent: 0 },
      { id: 'm3', name: 'Atorvastatin', dose: '20 mg',  time: '20:00', status: 'pending', remindersSent: 0 },
    ],
    schedule: [
      { id: 's1', type: 'appt',   title: 'Dr. Patel — Cardiology', time: '11:30', meta: 'Riverside Clinic · ride suggested 10:50', status: 'pending' },
      { id: 's2', type: 'social', title: 'Phone call with Daniel',  time: '17:00', meta: 'your son', status: 'pending' },
    ],
    bills: [
      { id: 'b1', name: 'Electric — Duke Energy', amount: 87.42, due: todayISO, status: 'paid' },
      { id: 'b2', name: 'Water — City Utilities',  amount: 41.10, due: todayISO, status: 'scheduled' },
    ],
    alerts: [],
    activity: [{ ts: Date.now() - 1000 * 60 * 60 * 2, kind: 'wake', text: 'Day started. Ambient sensors normal.' }],
    wellness: null,
    adherence7d: [100, 100, 67, 100, 100, 100, 100],
    fraudFlags: [{ id: 'f1', merchant: 'GoldShield Warranty', amount: 312.00, status: 'held' }],
    updatedAt: Date.now(),
  };
}

/** Bootstrap: init Firebase and seed state if empty */
async function bootstrapALA() {
  initFirebase();
  if (_stateRef) {
    const snap = await _stateRef.once('value');
    if (!snap.val()) {
      saveState(defaultState());
    }
  } else {
    // localStorage fallback
    if (!localStorage.getItem('ALA_STATE_v1')) {
      saveState(defaultState());
    }
  }
}

// Auto-init on script load
bootstrapALA();
