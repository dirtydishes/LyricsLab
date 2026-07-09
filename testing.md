# testing.md - LyricsLab Expo Rebuild

## Fast Local Gates

Run these before closing most code changes:

```bash
npm test
npm run typecheck
npm run editor:test
```

`npm test` should keep `src/rhyme/` coverage fast, deterministic, offline, and fixture-sized once the module exists.

Run this freshness gate whenever `packages/editor-web`, generated editor HTML, or WebView loading behavior changes:

```bash
npm run check:editor-html
```

If the freshness gate reports stale generated editor HTML, repair it with:

```bash
npm run build:editor-html
```

After repair, re-run `npm run check:editor-html` and any phase-specific editor gates.

Run these Phase 04 artifact gates when the CMU runtime artifact pipeline changes:

```bash
npm run build:rhyme-artifact
npm run check:rhyme-artifact
npm run smoke:rhyme-artifact
```

`npm run build:rhyme-artifact` should deterministically regenerate the bundled runtime artifact from `data/cmudict.txt`. `npm run check:rhyme-artifact` should fail when the checked-in artifact is stale. `npm run smoke:rhyme-artifact` is a non-default full-dictionary smoke that should load the generated artifact through the public rhyme artifact loader, probe representative exact-rhyme anchors, report artifact size and dictionary/index counts, and record representative lookup timings without putting the full dictionary on the default typing/test path.

Use this as a config sanity check when Expo dependencies or `app.json` change:

```bash
npx expo config --type public
```

## Coverage Priorities

- `src/songs/`
  - Repository create/update/delete/search behavior.
  - SQLite implementation tests where feasible without device-only APIs.
- `src/editor/bridge.ts`
  - Parse only known bridge messages.
  - Generate safe WebView command scripts.
- `src/editor/bodyPersistence.ts`
  - Preserve stale-save ordering and merge behavior.
- `src/editor/suggestions.ts`
  - Deterministic suggestion ids, filtering, and ordering.
- `src/rhyme/`
  - Pure TypeScript fixture tests for CMU-style parsing, alternate pronunciations, token normalization, last-stressed-vowel rhyme tails, exact candidate generation, and deterministic ordering.
  - OOV, slang, repeated-word, no-match, and phrase-boundary negative cases.
  - Privacy and API guard tests where the implementation surface allows: no external rhyme APIs, no network calls in rhyme lookup, and no lyric-content logging.
  - Hot-path guard tests or fakes showing suggestion refresh does not parse raw `data/cmudict.txt`, scan the full dictionary, or issue SQLite lookups on every typing event.
- `packages/editor-web/src/`
  - Suggestion context extraction.
  - Bridge message emission.
  - Future editor command behavior.

## Non-Default Rhyme Gates

Full CMU artifact smoke tests and lookup performance checks belong to the CMU artifact and performance phases, not the default `npm test` command. Future non-default gates should record the command, artifact size, representative lookup count, p50/p95 timings, and the device, simulator, or host used.

## Manual Device Checklist

The Expo rebuild is not validated as the daily app until this passes on a physical iPhone:

- App launches through the Expo dev-client flow.
- Create a song.
- Edit title and body.
- Keyboard appears without covering the editor unexpectedly.
- Suggestion bar stays reachable while typing.
- Fast typing keeps cursor behavior stable and the suggestion bar responsive; record visible lag or dropped updates.
- Insert suggestion at cursor.
- Navigate away and back; title/body persist.
- Search finds title and body text.
- Kill and relaunch; local songs remain.
- Airplane mode does not break the core writing flow.

Record device, iOS version, command used, and any screenshots or screen recordings in the relevant implementation note or Beads issue.

## What Not To Add Yet

- Broad UI snapshots before the visual system exists.
- Cloud/IAP/AI tests before those features are in scope.
- Slow full-dictionary, external API, neural, or performance benchmarks in the default test command.
