# ALA — Autonomous Life Assistant

> AI-powered care platform for elderly independence. Comprehensive safety net that promotes autonomy while ensuring 24/7 support for users and their families.

---

## Architecture

```
ala-care/
├── frontend/
│   ├── patient.html          # Patient-facing UI (large text, voice-first)
│   ├── caregiver.html        # Caregiver monitoring dashboard
│   ├── firebase-config.js    # Firebase project config (edit with your keys)
│   └── firebase-sync.js      # Real-time state sync layer (replaces localStorage)
│
├── backend/
│   ├── index.js              # Express API server
│   ├── routes/
│   │   ├── voice.js          # POST /api/voice — AI voice assistant
│   │   └── alerts.js         # POST /api/alerts/escalate — SMS notifications
│   └── adapters/
│       ├── index.js          # AI provider router (reads AI_PROVIDER from .env)
│       ├── mock.js           # Rule-based fallback — no API key needed
│       ├── openai.js         # GPT-4o adapter
│       ├── gemini.js         # Gemini 1.5 Flash adapter
│       └── claude.js         # Claude 3 Haiku/Sonnet adapter
│
├── .env.example              # Copy to .env and fill in your keys
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vanilla HTML/CSS/JS | Zero build step, runs from file:// or any static host |
| Real-time sync | Firebase Realtime DB | Free tier, instant push to all devices, no backend needed for sync |
| Backend API | Node.js + Express | Lightweight, fast to set up, great for serverless (Vercel) |
| AI (voice) | Pluggable adapter | Swap OpenAI / Gemini / Claude by changing one .env line |
| Notifications | Twilio SMS (optional) | Critical escalation alerts to caregiver phone |
| Deployment | Vercel (optional) | `vercel --prod` from root, zero config |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/bndoro/AI-Care-Assistant
cd AI-Care-Assistant
cp .env.example .env
cd backend && npm install
```

### 2. Set up Firebase (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project → add a Web App
3. Copy the config snippet into `frontend/firebase-config.js`
4. Go to **Realtime Database** → Create database → Start in **test mode**
5. Add your `databaseURL` to `firebase-config.js`

### 3. Configure AI provider (optional)

Edit `.env`:

```env
AI_PROVIDER=mock          # works with no API key
# AI_PROVIDER=openai      # set OPENAI_API_KEY
# AI_PROVIDER=gemini      # set GEMINI_API_KEY
# AI_PROVIDER=claude      # set ANTHROPIC_API_KEY
```

### 4. Start the backend

```bash
cd backend
npm run dev   # or: npm start
```

Server starts at `http://localhost:3001`

### 5. Open the frontend

Open `frontend/patient.html` and `frontend/caregiver.html` in a browser (or serve with Live Server VS Code extension).

Both pages will sync live via Firebase — open them in separate tabs or on different devices.

---

## API Reference

### `POST /api/voice`
Send patient voice transcript, get AI reply + intent action.

```json
// Request
{ "text": "I took my pill", "state": { ...ALAState } }

// Response
{ "reply": "Great job, Margaret! I've marked your Lisinopril as taken.", "action": "markMedTaken" }
```

**Action values:** `markMedTaken` | `callFamily` | `triggerEmergency` | `checkBills` | `null`

### `POST /api/alerts/escalate`
Log an alert and optionally send SMS via Twilio.

```json
{ "level": "critical", "message": "Margaret missed Lisinopril", "patient": { "name": "..." } }
```

### `GET /api/health`
Returns server status and active AI provider.

---

## Team Integration Notes

### Fall Detection AI (your teammate's module)
Wire it in via the alerts route:
```js
fetch('http://localhost:3001/api/alerts/escalate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    level: 'critical',
    message: 'Fall detected — high confidence. Location: living room.',
    patient: { name: 'Margaret Johnson' }
  })
})
```
This will push to Firebase (visible on caregiver dashboard instantly) + optional SMS.

### Smartwatch / Vitals Integration
Write directly to Firebase state at `/ala/state/vitals`:
```js
firebase.database().ref('/ala/state/vitals').set({
  heartRate: 72, bp: '118/76', ts: Date.now()
})
```

### Adding a New AI Provider
1. Create `backend/adapters/yourprovider.js` with an exported `async chat(text, state)` function
2. Add a case in `backend/adapters/index.js`
3. Set `AI_PROVIDER=yourprovider` in `.env`

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add a `vercel.json` at the repo root if you need to serve both frontend and backend from the same domain. Otherwise deploy frontend as static and backend as a separate Vercel serverless project.

---

## Hackathon Demo Flow

1. Open `patient.html` + `caregiver.html` side by side
2. Use demo bar buttons: **Skip 9 AM pill** → **+10 min** → **+30 min** to show escalation
3. Watch caregiver dashboard light up in real-time
4. Tap **Tap to speak** and say "What's my day?" or "Help me"
5. Hit **Fraud alert** to show financial monitoring
6. Hit **Trigger inactivity** to show safety monitoring

---

## Roadmap (post-hackathon)

- [ ] Firebase Auth (patient + caregiver login)
- [ ] Multi-patient support (`/patients/{id}/state`)
- [ ] Twilio voice calls (not just SMS)
- [ ] Wearable integration (Apple HealthKit / Google Fit webhooks)
- [ ] Telemedicine video via Daily.co or Twilio Video
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Offline-first PWA with service worker

---

*ALA · privacy-first by design · escalation only when you need it*
