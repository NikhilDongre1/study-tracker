# Study Tracker

A React + Firebase study session tracker with a GitHub-style yearly heatmap, streaks, customizable sessions, daily notes, and motivational quotes — synced across devices via Google sign-in.

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

**Important — required for Google sign-in to work on your deployed domain:**
- Firebase Console → Authentication → Settings → Authorized domains → Add your Vercel domain (e.g. `your-app.vercel.app`)

**Note on ad blockers / privacy extensions:** Browser extensions like uBlock Origin, Privacy Badger, or Brave Shields can silently block Google's OAuth popup handshake, which Firebase then reports as a generic `auth/popup-blocked` error — even though no real browser popup blocker was triggered (no address-bar icon appears). If sign-in fails only for you and not for others, test in an Incognito window with extensions disabled before assuming it's a config issue.

---

## Features

**Authentication**
- Google Sign-in via Firebase Auth — data synced across all devices

**Tasks / Sessions**
- Fully customizable study sessions — name, description, time range, duration, color, and type — added, removed, and reordered via a single **Edit** button
- Editing applies to the current day's plan; an optional toggle inside the editor lets you also set the edited plan as the default for upcoming days
- Live "● Now" indicator on whichever session matches the current time
- One-tap completion toggle per session

**Stats panel**
- Compact progress ring showing today's completion %
- Hours logged today
- Current streak (consecutive days with at least one session completed)
- Perfect days this month (all sessions completed)

**Yearly heatmap**
- GitHub-style contribution heatmap for the full year, free-floating (no box), with month labels aligned to actual calendar weeks
- Cell intensity reflects that day's actual completion percentage (not a fixed scale), so days with different session counts are compared fairly
- Hovering a cell shows real session counts for that specific day (e.g. "3/5 sessions completed")
- Click any past day to view/edit that day's data
- Cell size auto-scales to fill the available panel width, within sane min/max bounds
- "Total active days" and "Max streak" summary below the grid

**Quote + Notes**
- Daily motivational quote (rotates by date, no box — sits free in the layout)
- One note per day, editable for today, read-only when viewing past dates

**Navigation**
- Step backward/forward through past days; "Today" shortcut button
- Live clock and full date display in the header

**Responsive layout**
- Tasks (left) + stats column (right) in roughly a 6:4 split on desktop, stacking to a single column on mobile

---

## Project structure

```
src/
  lib/
    firebase.js       ← Your Firebase config goes here
    defaults.js       ← Default sessions + color/type options
    quotes.js         ← Quote pool for the daily quote
    sessionUtils.js   ← Shared session math (e.g. calculateSessionHours)
  hooks/
    useFirestore.js   ← All Firestore read/write logic (sessions, day data, notes)
    useClock.js       ← Live clock + date utilities
  components/
    SessionCard.jsx   ← Individual session row (today's task list)
    SessionEditor.jsx ← Edit sessions modal (today's plan + set-as-default toggle)
    Calendar.jsx      ← Yearly heatmap, month labels, footer stats
    Stats.jsx         ← StatsPanel: ring, mini stats, streak cards
    Toast.jsx         ← Notification toasts
  App.jsx             ← Main app shell, auth, layout
  main.jsx            ← Entry point
  index.css           ← Global styles + CSS variables
vercel.json           ← COOP/COEP headers (required for Google sign-in popup on Vercel)
```

---

## Firestore data structure

```
users/
  {uid}/
    config/
      sessions → { list: [...] }   ← user's default session plan
    days/
      2026-06-14 → {
        completed: { s1: true, s3: true },
        note: "...",
        sessions: [...]            ← optional: only present if that day's
                                       plan was customized away from default
      }
      2026-06-15 → { completed: { s1: true }, note: "" }
```

If a day's document has no `sessions` array, the app falls back to the user's default plan from `config/sessions`.

---

## Known gotchas

- **`auth/unauthorized-domain`** — your deployed domain isn't in Firebase's Authorized domains list yet. Add it (see Deploy section above).
- **`auth/popup-blocked` with no visible browser icon** — almost always an ad blocker or privacy extension interfering with Google's OAuth handshake, not an actual Chrome popup block. Test in Incognito with extensions off to confirm.
- **COOP/COEP headers** — `vercel.json` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` and `Cross-Origin-Embedder-Policy: unsafe-none`, which Firebase's popup-based auth needs to reliably detect when the popup closes. Don't remove these if deploying to Vercel.