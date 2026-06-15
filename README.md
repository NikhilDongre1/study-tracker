# Study Tracker

A React + Firebase study session tracker with streaks, calendar, and customizable sessions.

---

## Setup (10 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase
1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name → Continue
3. On the project homepage, click **</>** (Web app) → register app → copy the config
4. Open `src/lib/firebase.js` and replace the placeholder values with your config
5. In Firebase console: **Build → Firestore Database → Create database → Start in test mode**
6. In Firebase console: **Authentication → Sign-in method → Enable Google**

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:5173

---

## Deploy (free, on Vercel)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Or drag the `dist/` folder to https://vercel.com/new after `npm run build`.

**Important:** After deploying, add your Vercel domain to Firebase:
- Firebase Console → Authentication → Settings → Authorized domains → Add domain

---

## Features

- **Google Sign-in** — data synced across all your devices via Firestore
- **5 study sessions** — fully customizable (name, time, color, type, description)
- **Progress ring** — fills as you complete sessions
- **Live clock** — auto-detects current session (● Now indicator)
- **Streak counter** — consecutive days with at least one session
- **Monthly calendar** — green = perfect day, amber = partial
- **Daily notes** — one note per day, read-only for past dates
- **Date navigation** — browse any past day

---

## Project structure

```
src/
  lib/
    firebase.js      ← Put your Firebase config here
    defaults.js      ← Default sessions + color/type options
  hooks/
    useFirestore.js  ← All Firestore read/write logic
    useClock.js      ← Live clock + date utilities
  components/
    SessionCard.jsx  ← Individual session row
    SessionEditor.jsx ← Edit sessions modal
    Calendar.jsx     ← Monthly calendar
    Stats.jsx        ← Ring, summary bar, streak cards
    Toast.jsx        ← Notification toasts
  App.jsx            ← Main app + auth
  main.jsx           ← Entry point
  index.css          ← Global styles + CSS variables
```

---

## Firestore data structure

```
users/
  {uid}/
    config/
      sessions → { list: [...] }   ← user's custom sessions
    days/
      2025-06-14 → { completed: { s1: true, s3: true }, note: "..." }
      2025-06-15 → { completed: { s1: true }, note: "" }
```
