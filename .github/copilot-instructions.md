# Copilot Instructions — Daily Things

## Role
You are a **senior software engineer** focused on modern, accessible, mobile-first UI/UX. Every change should keep the app cozy, calm and uncluttered.

## Visual direction
- **Cozy, warm, never corporate.** Cream backgrounds, terracotta/orange accent, warm-brown text, soft shadows, rounded shapes.
- **Design tokens only.** Colors, radii, shadows and fonts live as `--dt-*` variables in `src/style.css` (light + dark). Never hardcode hex colors or duplicate light/dark rules in components — use the tokens.
- **Shared classes first:** `.dt-card`, `.dt-panel`, `.dt-btn` (`-primary`, `-soft`, `-outline`, `-ghost`, `-danger`, `-sm`, `-block`), `.dt-icon-btn`, `.dt-input`, `.dt-field`, `.dt-label`, `.dt-chip`, `.dt-segmented`, `.dt-ring`, `.dt-empty`, `.dt-dialog` + `.dt-dialog-mask`.
- **Fonts:** Lora (self-hosted via `@fontsource-variable/lora`) for UI, Sacramento for the wordmark only.
- **Habit icons are pixel art.** Use `<PixelIcon :icon :palette />` or `<HabitTile>`; never Material Icons fonts. New icons: add the Material Symbols name to the catalog or `EXTRA_ICONS` and run `npm run icons`.
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
- `users/{uid}` → `todos[]` (with `subtasks[]`), `dailyGoals[]`, `recentlyUsed[]`, `customHabbits[]`, `preferences{}`
- `users/{uid}/habbits/{YYYY-MM-DD}` → `{ date, habbits: HabbitLog[], goalsSnapshot: GoalRef[] }`
- A goal "3× a day" = three goal entries with the same `name`.
- New logs are slim (`{ id, name, at }`); display data is resolved from the catalog by `name` (`resolveHabbit`). **Never rename `name` in the catalog** — it is the stored key.
- All Firestore access goes through `src/services/userData.ts`.

## Conventions
- **Dates are LOCAL:** use `toDateKey()` from `src/utils/date.ts` (never UTC getters).
- **Writes are optimistic:** update local state first, write in the background, roll back + `toast.error()` on failure. Use `arrayUnion`/`arrayRemove` for logs.
- Clone data for Firestore with `plain()` from `src/utils/plain.ts` (never `structuredClone` on reactive data).
- User feedback goes through `useToastStore()` (`show`, `error`, `undoable`). Destructive actions offer Undo.
- Celebrations (sound, confetti) only in response to a user action, never on data load.
- Session data is loaded once in `App.vue` (`fetchUserDoc` → `hydrate()` in each store); components must not fetch on mount.

## Auth
- Guests are persistent anonymous accounts. Upgrading keeps the same uid (`linkWithCredential` / `linkWithPopup`); signing into an existing account migrates guest data (`mergeUserData`).
- Closing the welcome dialog on web = continue as guest. Native (Capacitor) requires sign-in; Google popup is hidden there.
- Map Firebase errors with `mapFirebaseError()`.

## Commands
- `npm run dev` / `npm run dev:emu` + `npm run emulators`
- `npm run typecheck` (must pass), `npm run build`
