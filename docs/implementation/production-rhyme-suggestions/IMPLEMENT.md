# Production Offline Rhyme Suggestions Implementation Loop

Dirtyloop version: `2`

Execution policy: `orchestrator-callback`

Canonical tracker: Beads epic `lyricslab-5iw`

Accepted plan: user-supplied accepted plan attachment `PLAN (14).md`

Beads owns state. These docs preserve accepted intent and execution context.

## Goal

Ship a production-grade, iOS-only, offline rhyme-suggestion milestone with semantic theming, a deep phonological engine, deterministic licensed data, a reviewed contemporary US hip-hop lexicon, accessible native suggestion pills, and repeatable writer, benchmark, and physical-iPhone evidence.

## Scope And Non-Goals

In scope are perfect and precision-first balanced slant rhymes, multisyllabic ranking, deterministic offline loading, safety and proper-noun policy, current-song repetition penalties, System/Light/Dark theming, diagnostics, release benchmarks, and writer/device acceptance.

Focused in-editor highlighting is the next milestone. Phrase rhymes, scheme prediction, G2P, fuzzy spelling, personalization, AI, audio, sync, IAP, Android, TestFlight, external APIs, lyric logging, and hot-path SQL are out of scope.

## Settled Decisions

- `RhymeEngine` is the sole production editor-facing rhyme interface and hides artifact/index details.
- US English and CMU pronunciation are the language baseline.
- Balanced slants use full-tail alignment and require a phonetic score of at least `0.86`.
- Ranking weights are `0.65` phonetic, `0.15` exact, `0.12` multisyllabic, `0.08` SUBTLEX commonness, minus `0.12` current-song repetition.
- The runtime consumes a versioned bundled binary loaded asynchronously after the first interactive frame.
- Phase 03 proves the manifest-driven binary/compiler/loader framework with project-owned fixtures; Phase 04 authors reviewed project sources; Phase 04A resolves external-source rights and assembles the complete production artifact.
- The native provider seam and narrow bridge envelope remain stable.
- Physical validation occurs at final closeout and completion means a validated local iPhone release build, not TestFlight.

## Stream Acceptance Evidence

- All automated gates in the accepted plan pass.
- Artifact regeneration is byte/hash reproducible and licensing/provenance is recorded.
- The reviewed rap lexicon has at least 500 entries and the independent 250-case OOV set reaches at least 90% correct pronunciation coverage.
- Release interaction latency is p50 below 50 ms and p95 below 100 ms, with cold initialization reported separately.
- The 60-case writer review is signed off after wrong, mislabeled, unsafe, or rejected ranking cases become fixes or fixtures.
- The full physical-iPhone release checklist passes in airplane mode.
- Every phase has independent review and a terminal CI state recorded in its single turn doc.

## Sources Of Truth

- Beads epic: `lyricslab-5iw`
- Accepted plan: user-supplied accepted plan attachment `PLAN (14).md`
- Roadmap: `docs/implementation/production-rhyme-suggestions/00-roadmap.md`
- Phase docs linked from Beads
- Turn docs: `docs/implementation/production-rhyme-suggestions/turn-docs/`
- Resume mirror: `docs/implementation/production-rhyme-suggestions/loop-state.md`

## Control-Plane Invariants

- The run task remains orchestrator-only; implementation and independent review occur in delegated visible tasks.
- Bind the concrete run-time orchestrator task ID before every launch and require exactly one final callback containing the source task ID.
- Use standard task speed; do not use fast mode. Reasoning effort remains mission-adaptive, using `xhigh` at standard speed when warranted.
- Select one ready phase, read its phase doc, and record an orchestration brief before broad work.
- Keep one owner per mutable checkout and prove repo root, worktree, symbolic branch, and status before any delegated file action.
- Keep one active implementation PR and use explicit base/head. Do not assume this creation checkout is the implementation base.
- Reviewer agents use `thermo-nuclear-code-quality-review`; resolve CI before completion.
- Update Beads first, export `.beads/issues.jsonl`, then mirror state in this stream's docs.
- Continue phase-by-phase unless complete, blocked, interrupted, review/CI is unresolved, or explicitly run with `--once`.

## Phase Ledger

| Beads Issue | Phase | Outcome | Phase Doc | Depends On | Status |
|---|---|---|---|---|---|
| `lyricslab-5iw.1` | 01 | Foundation, theme, and editor contract | `01-foundation-theme-editor-contract.md` | none | closed |
| `lyricslab-5iw.2` | 02 | Pure phonological engine | `02-pure-phonological-engine.md` | `lyricslab-5iw.1` | closed |
| `lyricslab-5iw.3` | 03 | Deterministic pipeline framework | `03-deterministic-data-pipeline.md` | `lyricslab-5iw.2` | in progress |
| `lyricslab-5iw.4` | 04 | Rap lexicon and safety data | `04-rap-lexicon-safety-data.md` | `lyricslab-5iw.3` | open |
| `lyricslab-5iw.4a` | 04A | Production artifact assembly | `04a-production-artifact-assembly.md` | `lyricslab-5iw.4` | open |
| `lyricslab-5iw.5` | 05 | Native integration and suggestion UI | `05-native-integration-suggestion-ui.md` | `lyricslab-5iw.4a` | open |
| `lyricslab-5iw.6` | 06 | Diagnostics, benchmarks, and writer review | `06-diagnostics-benchmarks-writer-review.md` | `lyricslab-5iw.5` | open |

## Quality Gates

```text
npm test
npm run typecheck
npm run editor:test
npm run build:editor-html
npm run check:rhyme-data
npx expo config --type public
npm run benchmark:rhyme
npm run benchmark:rhyme:ios -- --device <device>
```

Run phase-relevant subsets during implementation and the full set at closeout. A physical iPhone is mandatory for the final iOS benchmark and checklist.

## Branch And PR Constraints

At run start, confirm the canonical implementation base containing the completed Expo/WebView and offline-rhyme streams. Create `lavender/` phase branches from that verified base, keep one active implementation PR, and open PRs with explicit base and head. A wrong repo, detached HEAD, or wrong symbolic branch is a launch failure, not something a delegate repairs ad hoc.

## Storyboard

On epic completion, generate `docs/implementation/production-rhyme-suggestions/storyboard-post-run-mm-dd-yyyy.html`. Use `impeccable` when available and `@pierre/diffs/ssr` for every diff.
