# Phase 05 Turn Doc: Native Integration and Suggestion UI

Beads issue: `lyricslab-5iw.5`

Phase doc: `docs/implementation/production-rhyme-suggestions/05-native-integration-suggestion-ui.md`

## Accepted Outcome

Integrate the production engine behind the existing native provider and ship compact, accessible semantic-role pills without destabilizing editing or widening the bridge.

## Orchestration Brief

- Risk: high. This phase activates the reviewed 19.4 MB binary-v2 production runtime in the normal app path and connects asynchronous engine state to latency-sensitive editing and accessibility behavior.
- Execution: one genuinely fresh zero-history `gpt-5.6-sol` implementation task at high reasoning in fast mode owns the prepared branch, followed by a separate fresh Sol/high `thermo-nuclear-code-quality-review` task. The orchestrator owns Git publication, PR merge, and Beads closeout.
- Checkout base: reviewed clean-room Phase 04A replacement merge `26d99983`; Phase 05 branch `lavender/production-rhyme-phase-05-sol`.
- Provider seam: activate `createProductionRhymeEngineRuntime` only at app-level construction. Preserve the existing editor-facing `RhymeEngine` interface and bridge envelopes; no new WebView messages or rhyme metadata payloads.
- Runtime: initialize after first frame, preserve compact indexed lazy queries, stable proxy/atomic last-good publication, generation cancellation, bounded I/O, listener isolation, and explicit retry/settings state. Do not regress the reviewed memory/query guards.
- Suggestion policy: cache expensive candidates by completed anchor, filter the partial prefix cheaply, feed non-persisted `bodyText` repetition penalties, preserve safety suppression and explicit-prefix proper-name eligibility, and return at most eight trustworthy results without padding.
- UI/accessibility: deterministic prompt/loading/error states, selection hiding, casing/insertion behavior, compact two-line semantic-role pills, Dynamic Type, VoiceOver, 44-point targets, focus/pressed states, reduced motion, theme contrast, and only the accepted 150-200 ms crossfade.
- Evidence: focused provider/runtime/UI tests plus full Jest, typecheck, editor tests/build/freshness, production/fixture/source/evaluator regressions, memory/performance non-regression, Expo config, transitive bridge/scope controls, and honest hosted CI evidence.
- Callback target: implementation and review each send exactly one final callback to orchestrator `019f5428-f2ea-74c2-abfb-e37349c96391` with their actual source task ID.

## Adaptations

- The accepted detached-checkout exception was used: preflight proved a clean detached worktree at exact expected HEAD `ddd99c15b0b69200d80234447a057994f82da94a`; no branch repair or checkout mutation was performed.
- The Phase 04 transitive source guard was narrowed to permit only the reviewed `src/rhymeSources/suggestionEligibility.ts` policy boundary in the Phase 05 app graph. Curated data, source scripts, manifests, and every other `rhymeSources` module remain forbidden and the adversarial gate passes.

## Discoveries And Decisions

- The reviewed binary-v2 engine evaluates proper-noun eligibility while lazily materializing indexed candidates. To preserve completed-anchor caching across partial-prefix edits, the production decoder admits a bounded proper-noun candidate superset while the runtime atomically publishes the matching decoded policy table; the provider then invokes the same reviewed explicit-prefix policy without rerunning phonological candidate generation. Safety blocking remains a hard decoder condition and cannot be overridden.
- Candidate queries are synchronous. The reviewed runtime remains the sole asynchronous boundary and already owns after-first-frame scheduling, generation cancellation, stale-load suppression, atomic last-good publication, bounded reads, retry, listener isolation, and cleanup.
- `bodyText` is consumed only as normalized, deduplicated in-memory repetition context. The active partial token is removed before cache/query construction, so prefix changes do not rerun the engine. No lyric text is logged, added to bridge envelopes, persisted as analysis, or exposed through diagnostics.

## Implementation And Delegation Evidence

- Direct sole-owner implementation; no delegates or additional mutation owners were used.
- TDD tracer bullets were written first at the accepted seams. The initial focused run failed because dependencies were absent, then failed on the missing `productionSuggestions` module. Subsequent red/green slices covered anchor/prefix call counts, repetition, result cap, policy, states, transitions, runtime policy publication, engine-version cache invalidation, and casing.
- Root and editor dependency installs completed from lockfiles. Root reported the existing Expo worklets peer warning and 10 moderate transitive audit findings; editor install reported zero vulnerabilities.

## Changed Behavior And Files

- `app/_layout.tsx` now constructs one `ProductionRhymeProvider`, which alone activates `createProductionRhymeEngineRuntime` after the first frame and cleans it up on unmount.
- The shared provider exposes the stable engine-backed suggestion session, runtime snapshot subscription, and retry. `app/settings.tsx` shows the same truthful loading/ready/error/version state and retry action.
- `src/editor/productionSuggestions.ts` owns completed-anchor caching, bounded whole-song repetition context, cheap prefix filtering with unfiltered trustworthy fallback, explicit policy gating, deterministic prompt/loading/error/unavailable/result states, casing, engine-version invalidation, and the maximum-eight result contract.
- `LyricsEditorScreen` consumes current in-memory `song.bodyText` and the production provider without changing `SuggestionContext`, bridge messages, insertion commands, or persistence shapes. The obsolete shipped legacy provider adapter was removed.
- `SuggestionBar` now renders compact two-line semantic-role pills with Dynamic Type support, VoiceOver label/role/hint, 44-point targets, focus and pressed states, semantic theme tokens, live state announcements, retry, reduced-motion handling, and only a 180 ms prompt-to-results opacity transition.
- Tests and controls changed in `src/editor/__tests__/productionSuggestions.test.ts`, `src/editor/__tests__/SuggestionBar.test.ts`, `src/rhymeData/__tests__/rhymeEngineRuntime.test.ts`, `src/rhymeData/__tests__/runtimeBoundary.test.ts`, and `scripts/test-rhyme-sources.mjs`.

## Review

Pending the orchestrator-owned fresh independent thermonuclear review. Implementation self-verification found no remaining in-scope failure; no claim of independent approval is made here.

## CI And Gates

Owner: Phase 05 implementation task for local gates; orchestrator/reviewer owns independent review and publication evidence.

State: `ci-unavailable-with-evidence`

Evidence:

- Hosted state is honestly unavailable: the repository has no tracked `.github` directory/workflow; `gh pr list --head lavender/production-rhyme-phase-05-sol --state all` returned `[]`; `gh run list --branch lavender/production-rhyme-phase-05-sol` returned `[]`. No hosted-green claim is possible, and push/PR mutation is forbidden.
- `npm ci`: passed; `npm ci --prefix packages/editor-web`: passed.
- `npm test`: 25/25 suites, 207/207 tests passed. `npm run typecheck`: passed.
- Focused provider/runtime/UI/accessibility/settings/privacy/boundary tests: 6 suites, 30 tests passed before the final full run; later focused additions passed 14/14 and runtime-boundary 5/5.
- Editor: `npm run editor:test` passed 3/3 files and 25/25 tests; `npm run editor:build`, `npm run build:editor-html`, and `npm run check:editor-html` passed with generated HTML fresh.
- Fixture/compiler/production: fixture build/check passed at 3,092 bytes SHA-256 `04145680c60ff41981c4af545680c32067ee03e1b0ab4a51930d3ff8711688af`; compiler controls passed; production build/check/data controls passed at 19,413,208 bytes SHA-256 `9edd36f22608a86ac34f375bcf05b72a0c30e10a64a980df94d469e139862b58`.
- Source acquisition/check/adversarial controls passed at CMU revision `74790861f652b15e4ac49015a90074ad62a27690`, 74,286 SUBTLEX entries, and 618/618 reviewed Phase 04 entries.
- Seal/evaluator setup, check, tamper controls, self-test, and evaluation passed with immutable gold SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7` and 128/128 in both evaluator runs.
- Forced-GC production runtime passed: retained heap `40,996,200` bytes, retained RSS `31,100,928`, startup `4,246.441` ms, warm p50/p95 `27.866/66.452` ms, cold p50/p95/max `33.539/138.793/213.388` ms, and query-cache heap/RSS growth `78,632/39,927,808` bytes.
- Legacy artifact build/check/smoke passed at SHA-256 `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`; compact perf passed with mixed p50/p95 `0.361/1.913` ms and slant p50/p95 `3.543/9.343` ms.
- Expo public config passed at SDK 56; introspected config contains `production.rhymebin`; direct `expo-asset@56.0.17`, `expo-file-system@56.0.8`, and `expo-crypto@56.0.4` were verified.
- `git diff --check` passed. Final reruns are recorded before the implementation commit.

## PR And Commits

Local implementation commit is recorded after final gate reruns. No push, PR, merge, or hosted state was mutated.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4a`.

Per user constraint, no Beads mutation, export, status transition, closure, or follow-up creation was performed.

## Plan Amendments

None.

## Context To Keep

Keep policy in the canonical native provider seam; do not introduce bridge messages, highlighting spans, or persisted lyric analysis.

## Closeout

Implementation complete locally, subject to the orchestrator-owned independent thermonuclear review and publication/merge closeout. Phase 06 retains physical-device release proof; this phase makes no device-readiness claim.
