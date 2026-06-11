# AGENTS.md

## Project map (Ionic + Vue + Capacitor)

- App bootstrap is in `src/main.ts`: Vue 3 + Pinia + Ionic (`mode: 'md'`) + router.
- `src/App.vue` is the runtime orchestrator: loads all stores on mount, requests notification permission, schedules reminders, and subscribes to deep links.
- Views are route-level screens in `src/views/` (`HomePage.vue`, `SettingsPage.vue`); reusable UI lives in `src/components/` (`AddShiftModal.vue`).
- Business logic is split into Pinia stores (`src/stores/*.ts`) and composables (`src/composables/*.ts`).

## Core data flow and storage

- Persistent storage is Capacitor Preferences, not localStorage. Keys are:
    - `my_shifts` in `src/stores/shifts.ts`
    - `imported_people` in `src/stores/people.ts`
    - `app_settings` in `src/stores/settings.ts`
- Shifts are date-keyed (`YYYY-MM-DD`) and own shifts are upserted by date (`addShift` replaces same-date entry).
- Imported people are upserted by `name` (`importPerson` replaces same-name entry).
- Canonical shared types are in `src/types/index.ts`; use `SharePayload.version = 1` for schedule sharing.

## Sharing + deep link integration

- Share links use custom scheme `werkschema://import?data=...` (`src/composables/useShare.ts`).
- Payload encoding is `JSON -> encodeURIComponent -> btoa`; decoding does the reverse.
- Deep links are handled in two places:
    - App-level listener via `App.addListener('appUrlOpen', ...)` in `src/App.vue`
    - Manual paste/import path in `src/views/SettingsPage.vue`
- Android intent filter for `werkschema` is defined in `android/app/src/main/AndroidManifest.xml`.

## Notifications behavior (important coupling)

- Reminder logic is centralized in `src/composables/useNotifications.ts`.
- Scheduling always cancels notification ID `1001` before re-scheduling.
- A reminder is only created when all are true: notifications enabled, tomorrow has a shift, configured time is still in the future today.
- After any shift/settings change, current code re-runs `scheduleNextDayReminder()` (see `HomePage.vue` and `SettingsPage.vue`). Preserve this coupling when editing flows.

## UI conventions specific to this codebase

- Home timeline merges own + imported schedules, then filters to the last 14 days onward (`HomePage.vue`, `visibleEntries`).
- Display labels/UX are intentionally human-friendly (`Today/Tomorrow/Yesterday`, emoji shift labels).
- Settings inputs mostly persist on specific events (`blur`, toggle change, datetime change), not via full-form submit.

## Dev workflows discovered in repo

- Use npm scripts from `package.json`:
    - `npm run dev` (Vite dev server)
    - `npm run build` (type-check + production build)
    - `npm run lint`
    - `npm run test:unit` (Vitest)
    - `npm run test:e2e` (Cypress, base URL `http://localhost:5173` in `cypress.config.ts`)
- Path alias `@` points to `src` (`vite.config.ts`, `tsconfig.json`).

## Current quality baseline (do not assume tests protect behavior)

- Existing tests in `tests/unit/example.spec.ts` and `tests/e2e/specs/test.cy.ts` are scaffold defaults and currently mismatch real UI text/selectors.
- Treat behavior changes as needing manual verification in `HomePage.vue` / `SettingsPage.vue` flows until tests are updated.
