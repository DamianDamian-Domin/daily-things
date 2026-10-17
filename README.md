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
# optional: public URL used in friend invite links (needed in the native app)
VITE_PUBLIC_URL=
```

## Scripts

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Vite dev server                                                 |
| `npm run dev:emu`   | Dev server connected to local Firebase emulators                |
| `npm run emulators` | Starts Auth + Firestore emulators                               |
| `npm run typecheck` | `vue-tsc` type check (keep it at 0 errors)                      |
| `npm run lint`      | ESLint (Vue + TypeScript correctness rules, keep it at 0)       |
| `npm run build`     | Production build                                                |
| `npm run android`   | Build, copy `native/android` (widget, icons) + `cap sync`       |
| `npm run icons`     | Regenerates pixel-art habit icons (`src/assets/pixelIcons.json`) |

### Deploy

`firebase deploy` builds the app (`npm run build` runs as a predeploy hook) and uploads `dist/` to Firebase Hosting together with the Firestore rules. Use `firebase deploy --only hosting` to ship only the app. The Android app is not updated by this; rebuild it with `npm run android`.

### Installable app and offline mode (PWA)

In the browser the app can be installed (Settings → App → Install, or the browser's own install button) and starts without internet. A service worker (`vite-plugin-pwa`, production builds only, never in the Android app) caches the app shell; habit data works offline through Firestore's persistent cache and syncs when the connection returns.

After a deploy, open apps pick up the new version on their own: right after start-up, when the app goes to the background, or via the "A new version is ready · Reload" toast. To test offline with the emulators, build with `VITE_EMULATOR_PERSISTENT_CACHE=true npx vite build --mode emulator` and serve it with `npx vite preview --mode emulator`.

## Project map

```
src/
  services/userData.ts     private Firestore data (users/**) — paths + reads/writes
  services/friends.ts      social Firestore data (profiles, friendCodes, friendships, cheers)
  stores/                  auth, habits, todos, userPreferences, toast, profile (my avatar/code)
                           + lazy: friends (listeners, requests), profileSync (publishing), social (loader)
  utils/date.ts            LOCAL date keys (YYYY-MM-DD) + formatting
  utils/habitCatalog.ts    catalog, categories, palettes, search
  utils/pixelIcons.ts      renders pixel sprites to cached SVG data URLs
  utils/avatar.ts          procedural pixel-art avatars (layered 32×32 masks → SVG data URL)
  components/ui/           PixelIcon, PixelAvatar, ToastHost
  components/home_view/    HabitsCard, HabitTile, AddHabitDialog, ToDosCard, StatsCard, FriendsCard, DatePicker
  components/friends/      AvatarEditor, AddFriendDialog, FriendDetailDialog
  components/settings/     AccountSheet, ProfilePanel, SettingsPanel
  style.css                design tokens (--dt-*) + shared component classes (.dt-btn, .dt-card…)
firestore.rules            security rules (deploy: npx firebase-tools deploy --only firestore:rules)
scripts/                   catalog fixes + pixel icon generator
```
