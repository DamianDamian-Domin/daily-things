# Daily Things

A cozy habit tracker and to-do list — Vue 3 + Firebase, packaged for Android with Capacitor.

## Quick start

```sh
npm install
npm run dev          # needs a .env with your Firebase config (see below)
```

### Local development without a Firebase project (emulators)

```sh
npm run emulators    # terminal 1 — Auth + Firestore emulators (needs Java 11+)
npm run dev:emu      # terminal 2 — app connected to the emulators (.env.emulator)
```

The emulators use the real security rules from `firestore.rules`, so what works locally
will also be allowed in production.

### `.env`

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Scripts

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Vite dev server                                                 |
| `npm run dev:emu`   | Dev server connected to local Firebase emulators                |
| `npm run emulators` | Starts Auth + Firestore emulators                               |
| `npm run typecheck` | `vue-tsc` type check (keep it at 0 errors)                      |
| `npm run build`     | Production build                                                |
| `npm run android`   | Build + `cap sync`                                              |
| `npm run icons`     | Regenerates pixel-art habit icons (`src/assets/pixelIcons.json`) |

## Project map

```
src/
  services/userData.ts     all Firestore paths + reads/writes in one place
  stores/                  auth, habbits, todos, userPreferences, toast (Pinia, composition style)
  utils/date.ts            LOCAL date keys (YYYY-MM-DD) + formatting
  utils/habitCatalog.ts    catalog, categories, palettes, search
  utils/pixelIcons.ts      renders pixel sprites to cached SVG data URLs
  components/ui/           PixelIcon, ToastHost
  components/home_view/    HabbitsCard, HabitTile, AddHabitDialog, ToDosCard, StatsCard, DatePicker
  components/settings/     AccountSheet, ProfilePanel, SettingsPanel
  style.css                design tokens (--dt-*) + shared component classes (.dt-btn, .dt-card…)
firestore.rules            security rules (deploy: npx firebase-tools deploy --only firestore:rules)
scripts/                   catalog fixes + pixel icon generator
```
