# Copilot Instructions — Daily Things

## Role
You are a **senior software engineer** whose top priority is creating **modern UI/UX applications** with excellent responsiveness and adherence to best practices. Prioritize clean, accessible interfaces, smooth interactions, and mobile-first responsive design in every change.

## Visual Direction
The app follows a **cozy, warm aesthetic** — friendly rather than corporate. Key guidelines:
- **Fonts**: Lora (serif) for headings and body, Sacramento (cursive) for decorative accents (logo, section embellishments)
- **Colors**: Warm orange tones (`orange-50` ground, `orange-100`–`orange-400` accents), pink gradients for avatars. Avoid cold grays/blues as primary accents
- **Shapes**: Soft, rounded corners (`rounded-2xl` for cards, `rounded-xl` for buttons). Squircle-style, not perfectly circular
- **Shadows**: Diffused, warm shadows (`box-shadow` with low opacity) — never harsh drop shadows
- **Tone**: Polish language throughout the UI. Friendly copy with emoji (✨🌿📝🎯☕👋). Greetings adapt to time of day
- **Interactions**: Gentle hover effects (scale, padding shift, color warmth) — no abrupt transitions

## Stack & Tooling
- **Vue 3** (Composition API, `<script setup lang="ts">`) + **TypeScript** + **Vite 5**
- **Pinia** for state management (composition-style stores only)
- **PrimeVue 4** (Aura theme with custom preset defined in `src/main.ts`) — use PrimeVue components (`Dialog`, `Button`, `InputText`, etc.) over raw HTML
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin + `tailwindcss-primeui` bridge
- **Firebase**: Auth (email/password) + Firestore for persistence
- **vuedraggable** for drag-and-drop reordering
- **nanoid** for generating unique IDs on entities
- Path alias: `@` → `./src` (configured in `vite.config.ts`)

## Architecture Overview
Single-page habit/todo tracker with two views: `LoginView` and `HomeView`. HomeView renders a **swipeable carousel** (`CarouselView`) containing three cards: `HabbitsCard`, `ToDosCard`, `StatsCard`. Each card receives an `isActive` prop to gate interactions when not in focus. **Note:** `StatsCard` is currently a placeholder — full implementation is planned for future development.

### Firebase Data Model
- **Habits per day**: subcollection `users/{uid}/habbits/{YYYY-MM-DD}` → `{ date, habbits[] }`
- **Todos & Goals**: fields on user doc `users/{uid}` → `{ todos: UserTodos[], dailyGoals: Goal[] }`
- **Recent habits**: `users/{uid}.recentlyUsed: string[]`

### Date Handling
All date keys use UTC via `toDateKey()` from `src/utils/timeUtils.ts` (format `YYYY-MM-DD`). The habits store lazy-loads 7-day ranges and expands the window as the user navigates dates.

## Key Conventions

### Store Patterns (`src/stores/`)
- All stores use **Pinia Composition API** (`defineStore("name", () => { ... })`).
- Wrap Firestore mutations in `handleAsyncAction(callback, successMsg, errorMsg)` from `src/stores/asyncActionHandler.ts` — this automatically manages loader state and shows success/error feedback toasts.
- For read-only loading, use `loader.run(async () => { ... })` directly from `useLoaderStore`.
- Access reactive store state in components via `storeToRefs(store)`, not direct destructuring.

### Component Patterns (`src/components/`)
- Components are organized by view: `home_view/`, `login_view/`, `navbar/`.
- Always use `<script setup lang="ts">` with TypeScript.
- **All domain/model types must go in `src/libs/types.ts`** (`Habbit`, `Goal`, `UserHabbits`, `CarouselCardConfig`, `TodoItem`, `UserTodos`, etc.). Do not co-locate types in store files.
- **Comments should be written in Polish.**

### Styling
- **Dark mode**: toggled via `.my-app-dark` class on `<html>` (not system preference). Use Tailwind's `dark:` variant which is mapped to this selector in `src/style.css` via `@custom-variant dark`.
- Use semantic utility classes from `src/style.css` over raw Tailwind when available:
  - Backgrounds: `surface-ground`, `surface-content`, `surface-primary`
  - Text: `text-a` (strong), `text-b` (medium), `text-c` (muted)
  - Cards: `card-a` (shadow + rounded + padding)
- Colors are bridged from PrimeVue CSS variables (`--p-green-500`, etc.) to Tailwind via the `@theme` block in `style.css`.

### Router & Auth
- Two routes: `/` (requires auth) and `/login` (guest only). Guards in `src/router/index.ts`.
- Auth initializes before app mount: `authStore.initAuth().then(() => app.mount(...))` in `main.ts`.
- `useAuthStore` maps Firebase error codes to user-friendly messages in `mapFirebaseError()`.

## Commands
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- No test runner is configured
