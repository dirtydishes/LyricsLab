# coding-standards.md - Expo/TypeScript Conventions

## TypeScript

- Keep strict, explicit domain types at module boundaries.
- Prefer pure functions for parsing, ranking, persistence policy, and bridge shaping.
- Avoid `any`; if data crosses the WebView bridge, parse it as unknown and narrow it.
- Keep route files thin. Put reusable logic under `src/`.

## React Native

- Keep typing paths cheap. Debounce expensive analysis and avoid broad state churn.
- Do not put generated HTML or large editor payloads into React state unless required.
- Keep keyboard-related dimensions stable so the writing surface does not jump.
- Prefer small, boring components until the core writing loop is proven on device.

## WebView Editor

- `packages/editor-web` is the source for the Tiptap editor.
- `src/editor/generated/editorHtml.ts` is generated. Do not edit it by hand.
- Bridge messages must stay versioned and tested.
- Native stores `bodyJson` and `bodyText`, never HTML.

## Persistence

- Keep repository interfaces narrow.
- Do not log lyric contents.
- Keep local/offline behavior working before adding sync or remote services.

## Scope

- MVP-first.
- AI, external rhyme APIs, IAP, iCloud, and audio are explicit follow-up scopes.
- If a change affects typing latency, cursor behavior, or suggestion insertion, treat it as product-critical.
