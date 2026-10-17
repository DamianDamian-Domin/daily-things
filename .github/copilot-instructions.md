# Copilot Instructions — Daily Things

## Role
You are a **senior software engineer** focused on modern, accessible, mobile-first UI/UX. Every change should keep the app cozy, calm and uncluttered.

## Visual direction
- **Cozy, warm, never corporate.** Cream backgrounds, terracotta/orange accent, warm-brown text, soft shadows, rounded shapes.
- **Design tokens only.** Colors, radii, shadows and fonts live as `--dt-*` variables in `src/style.css` (light + dark). Never hardcode hex colors or duplicate light/dark rules in components — use the tokens.
- **Shared classes first:** `.dt-card`, `.dt-panel`, `.dt-btn` (`-primary`, `-soft`, `-outline`, `-ghost`, `-danger`, `-sm`, `-block`), `.dt-icon-btn`, `.dt-input`, `.dt-field`, `.dt-label`, `.dt-chip`, `.dt-segmented`, `.dt-ring`, `.dt-empty`, `.dt-dialog` + `.dt-dialog-mask`.
- **Fonts:** Lora (self-hosted via `@fontsource-variable/lora`) for UI, Sacramento for the wordmark only.
- **Habit icons are pixel art.** Use `<PixelIcon :icon :palette />` or `<HabitTile>`; never Material Icons fonts. New icons: add the Material Symbols name to the catalog or `EXTRA_ICONS` and run `npm run icons`.
- **Avatars are pixel art too.** Use `<PixelAvatar :avatar :size />` (decorative unless you pass `alt`). Configs come from `src/utils/avatar.ts` (`AvatarConfig` v1, `defaultAvatar(uid)`, `randomAvatar()`); never trust remote configs without `normalizeAvatar()`. New parts: add the option key + label and its mask, then render a sheet and look at it.
- **Copy:** English UI, friendly and short, occasional emoji. Code comments in Polish.
- **Less is more:** one primary action per area, no stacked toggles, empty states that invite a single next step.

## Accessibility (must stay at 0 axe violations)
- Interactive elements are `<button>`/`<a>`/inputs — never clickable `<div>`s.
- Icon-only buttons need `aria-label`; decorative icons get `aria-hidden="true"`.
- Every input has a `<label>`; errors use `role="alert"`.
- Text contrast ≥ 4.5:1 — use `--dt-text`, `--dt-text-2`, `--dt-text-3` only.
- Touch targets ≥ 40px. Respect `.reduce-motion` / `prefers-reduced-motion`.
- Do not use `<header>`/`<footer>` inside dialogs or drawers (they become duplicate landmarks).

## Stack
- Vue 3 (`<script setup lang="ts">`), TypeScript, Vite 5, Pinia (composition stores only), PrimeVue 4 (Dialog, Drawer, Popover, ToggleSwitch, DatePicker, Tooltip), Tailwind 4, Firebase Auth + Firestore, Capacitor 8, vuedraggable, nanoid.
- Path alias `@` → `src`. All domain types in `src/libs/types.ts`.

## Data model (Firestore)
- `users/{uid}` → `dailyGoals[]`, `recentlyUsed[]`, `customHabbits[]`, `reminders[]`, `preferences{}`
- `users/{uid}/todos/{todoId}` → one `TodoItem` per document (with `subtasks[]` inside). Writes send only the changed todos. A legacy `users/{uid}.todos[]` array is moved here on first load (`migrateLegacyTodos`) and then removed.
- `users/{uid}/habbits/{YYYY-MM-DD}` → `{ date, habbits: HabitLog[], goalsSnapshot: GoalRef[] }` (read as `DayEntry.habits`)
- **Stored keys keep the old spelling** (`habbits` collection and field, `customHabbits`). Code says `habit` everywhere else; the service layer maps the keys (`DAY_LOGS_FIELD`, `toDayEntry`). Never rename stored keys without a data migration.
- A goal "3× a day" = three goal entries with the same `name`.
- New logs are slim (`{ id, name, at }`); display data is resolved from the catalog by `name` (`resolveHabit`). **Never rename `name` in the catalog** — it is the stored key.
- `users/{uid}.avatar` (own avatar; absent = default from uid), `users/{uid}.friendCode`, `preferences.shareProgress` / `shareHabits`.
- All Firestore access goes through `src/services/userData.ts` (private data) and `src/services/friends.ts` (social).

### Friends (members only — guests are anonymous accounts and can't use them)
- `profiles/{uid}` → what friends see: `displayName`, `avatar`, `friendCode`, `sharing{progress, habits}`, `stats{streak, streakEnd, todayKey, todayDone, todayTotal, last7[]}`, `todayHabits[]` (positive habits only). Readable by the owner and accepted friends (rules `get()` the friendship). `stats`/`todayHabits` are optional: they're only published while the user has a friend or a pending outgoing request.
- `profiles/{uid}/cheers/{fromUid}` → inbox note `{ from, kind: cheer|request|accept, name, at }`; one doc per sender (written only by a friend, or by the requester for `request`), shown as a toast on the next load and deleted.
- `friendCodes/{CODE}` → `{ uid, name, avatar }`; 6 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. Members may `get` one, nobody can `list`.
- `friendships/{uidA_uidB}` (sorted uids) → `{ members, requestedBy, status: pending|accepted, from, to, createdAt, acceptedAt }`. Only the recipient can accept; either side deletes (decline/cancel/unfriend).
- Account/data deletion removes all of the above (`deleteSocialData`).

## Conventions
- **Dates are LOCAL:** use `toDateKey()` from `src/utils/date.ts` (never UTC getters).
- **Writes are optimistic:** update local state first, write in the background, roll back + `toast.error()` on failure. Use `arrayUnion`/`arrayRemove` for logs.
- Clone data for Firestore with `plain()` from `src/utils/plain.ts` (never `structuredClone` on reactive data).
- User feedback goes through `useToastStore()` (`show`, `error`, `undoable`). Destructive actions offer Undo.
- Celebrations (sound, confetti) only in response to a user action, never on data load.
- Session data is loaded once in `App.vue` (`fetchUserDoc` → `hydrate()` in each store); components must not fetch on mount.
- **Social code is lazy.** `stores/social.ts` loads `stores/friends.ts` (listeners, requests, inbox) and `stores/profileSync.ts` (publishing my profile) on demand; guests never download them. `stores/profile.ts` (my avatar/code) stays tiny because the navbar needs it.
- **Realtime listeners only while the Friends card is visible** (`friendsStore.start()` / `stopSoon()` driven from `App.vue`), one per friend profile (rules check friendship per document, so no `in` queries). Clean up with `clear()` on logout/account switch.
- **Be write-frugal.** The profile is published debounced (2.5 s), only when its JSON signature changed (signature kept in localStorage), and stats are skipped entirely for users without friends.

## Reminders (local notifications)
- `users/{uid}.reminders[]` = `{ name, time: "HH:MM" }`, one per goal name (local time). Stored as an array (setDoc merge would deep-merge a map and never drop keys).
- Only current daily goals ring. Scheduling lives in `stores/reminders.ts`, runs on native only and lazy-imports `@capacitor/local-notifications` (web never downloads it; the dialog says reminders ring in the Android app).
- We schedule one-off notifications for the next 7 days (not a repeating one), cancel + rebuild on any change, and skip today's once the goal is done. Every app open moves the window forward.
- Ask for notification permission only when the user sets their first time.
- `android/` is gitignored: custom Android resources (the `ic_stat_icon` status-bar icon) live in `native/android/res`, our Java code in `native/android/java`, and `npm run android` (`scripts/sync-android-native.mjs`) copies them in and adds the widget receiver to the manifest. `capacitor.config.ts` points LocalNotifications `smallIcon` at it.

## Home-screen widget (Android)
- "Today" widget: today's goals with pixel icons; a tap ticks a goal off (or undoes the last tick once it's done), same rule as `tapGoal`. Code: `native/android/java/app/dailythings/widget`, app side `src/utils/habitsWidget.ts`.
- The app pushes state (goals, today's logs, sprites, goals snapshot) plus `{ apiKey, projectId, uid, refreshToken }`. The widget writes straight to Firestore over REST (`documents:commit` with `appendMissingElements` / `removeAllFromArray` on `habbits`, i.e. arrayUnion / arrayRemove), so the same security rules apply.
- Taps that couldn't be sent (offline) stay queued; the app takes them on open/resume (`HabitsWidget.takeActions`) and writes them itself. Writes are by log id, so repeating one is harmless. With emulators the widget only queues.

## Auth
- Guests are persistent anonymous accounts. Upgrading keeps the same uid (`linkWithCredential` / `linkWithPopup`); signing into an existing account migrates guest data (`mergeUserData`).
- Closing the welcome dialog on web = continue as guest. Native (Capacitor) requires sign-in; Google popup is hidden there.
- Map Firebase errors with `mapFirebaseError()`.

## Commands
- `npm run dev` / `npm run dev:emu` + `npm run emulators`
- `npm run typecheck` and `npm run lint` (both must pass), `npm run build`
