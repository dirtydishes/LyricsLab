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

### Independent Review Brief

- Risk: high. The review covers app-root production activation, asynchronous runtime ownership, latency-sensitive suggestion policy, safety/proper-noun enforcement, accessibility, and binary-v2 production non-regression.
- Strategy: direct fresh clean-room review with `thermo-nuclear-code-quality-review`; the reviewer is the sole mutation owner and will repair every safe in-scope finding test-first.
- Independence: the reviewer began from a clean detached checkout at the exact published PR head `820b02acc4dcd011dbb97e623e799dfc34586672` and did not participate in implementation.
- CI owner: the reviewer owns complete local reruns plus PR mergeability, hosted status, and workflow evidence; the terminal state must be one of the dirtyloops CI states.
- Required evidence: full PR diff and transitive seam inspection; focused provider/UI/accessibility/runtime tests; complete root/editor/data/source/evaluator/runtime/performance/Expo gates; `git diff --check`; and exact base/head/mergeability/status evidence for PR #29.
- Constraints: update only this existing turn doc outside safe in-scope code/tests, do not mutate Beads, do not push or change PR state, and send exactly one final callback to orchestrator `019f5428-f2ea-74c2-abfb-e37349c96391`.

### Independent Review Outcome

Outcome: **repaired and locally approved**. The reviewer challenged the implementation independently, repaired every safe in-scope finding test-first, and found no remaining Phase 05 blocker in the repaired local tree.

- Repaired anchor/prefix cost separation. Partial-word changes now reuse the completed-anchor query without rescanning `bodyText` or reranking, including when later document text follows the cursor. Completed edits with no active prefix still refresh a bounded 4,096-token / 256 KiB repetition snapshot. Call-count tests prove one engine invocation across successive partial prefixes.
- Repaired semantic-role loss for multisyllabic slants by carrying the engine's exact/slant role through the native-only `WordSuggestion` model. The discreet visible label remains `2-syllable`, while color and VoiceOver now truthfully identify a near rhyme. No bridge envelope changed.
- Repaired accessibility and motion details: removed the 1.6 Dynamic Type cap, removed the false `selected` state that conflated focus with selection, added accurate multisyllabic spoken labels and `Unavailable` state labels, retained 44-point targets/focus/pressed states, and stops the 180 ms prompt-to-result animation on cleanup.
- Repaired Settings truthfulness during a last-good refresh. It now reports `Refreshing` and explicitly says the current offline engine remains available. The app provider exposes only the subscribed immutable snapshot, retry, and suggestion session; Settings no longer receives the runtime/engine capability or reads external-store state during render.
- Hardened the transitive Phase 04 activation guard so it traverses the reviewed `suggestionEligibilityCore.cjs` implementation instead of stopping at its TypeScript wrapper. All other source/data/script/manifest activation remains forbidden.
- Rechecked singleton ownership, post-frame start, cleanup, bounded reads, stable proxy, atomic engine/policy publication, overlapping-retry generation cancellation, subscriber isolation, proper-name explicit-prefix policy, non-overridable safety blocking, deterministic capped ranking, prefix fallback, casing, selection hiding, exact insertion behavior, contrast, long-content horizontal layout, reduced motion, privacy, and absent out-of-scope features.
- Thermonuclear structure review found no file crossing 1,000 lines, no unsafe assertion/cast growth, no duplicate runtime/provider singleton, and no justified code-judo rewrite beyond the repaired ownership/cache/presentation seams. No new highlighting, phrase rhyme, scheme, G2P, personalization, AI, audio, sync, IAP, Android, TestFlight, lyric logging, diagnostics route, or persisted analysis behavior exists.

Local repair commit: `a73f0a58177a013e6dda6bcaf7a3aa0dbe443838` (`repair production rhyme integration review findings`). The evidence-only commit is the commit containing this final turn-doc record.

## CI And Gates

Owner: fresh independent Phase 05 reviewer for complete local gates and hosted publication evidence.

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

Fresh independent reviewer evidence after repairs:

- Dependency installs: root `npm ci` passed with the existing Expo worklets peer warning and 10 moderate transitive audit findings; editor lockfile `npm ci` passed with zero vulnerabilities.
- Focused provider/UI/accessibility/settings/runtime/decoder/policy/boundary verification passed 7 suites and 64 tests. Full root verification passed 25/25 suites and 211/211 tests; `npm run typecheck` passed.
- Editor verification passed 3/3 files and 25/25 tests; editor build, generated HTML build, and freshness check passed.
- Fixture build/check/compiler passed at 3,092 bytes / `04145680c60ff41981c4af545680c32067ee03e1b0ab4a51930d3ff8711688af`. Production build/check/data controls passed at 19,413,208 bytes / `9edd36f22608a86ac34f375bcf05b72a0c30e10a64a980df94d469e139862b58`.
- Production source acquisition/check/adversarial controls passed at CMU `74790861f652b15e4ac49015a90074ad62a27690`, 74,286 SUBTLEX entries, and 618/618 reviewed Phase 04 entries.
- Seal setup/check/tamper controls, evaluator self-test, and normal evaluation passed 128/128. Gold stayed byte-identical at `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7` and local mode `0444` after setup.
- Forced-GC production runtime passed: retained heap `41,329,240`, retained RSS `31,125,504`, startup `3,953.838` ms, warm p50/p95 `23.927/62.838` ms, cold p50/p95/max `36.815/153.381/209.780` ms, and query-cache heap/RSS growth `114,056/12,623,872` bytes.
- Legacy build/check/smoke passed at unchanged `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`. Compact perf completed with mixed p50/p95 `0.331/1.651` ms and slant p50/p95 `3.685/10.463` ms. A trailing evidence-only `sha256sum` initially named a nonexistent path; rerunning it against the canonical JSON confirmed the unchanged hash and no product gate failed.
- Expo public/introspected config passed at SDK 56 and contains `production.rhymebin`; direct packages remain `expo-asset@56.0.17`, `expo-file-system@56.0.8`, and `expo-crypto@56.0.4`. `git diff --check` passed.
- Hosted CI is unavailable with evidence: the repo has no `.github` directory, `gh pr checks 29` reports no checks, branch workflow runs are `[]`, and workflow listing is empty. PR #29 remains open and remotely unchanged at explicit base `lavender/expo-clean-rebuild` / `26d9998384fbbbd32651bcc1989e931323dd84d1` and head `lavender/production-rhyme-phase-05-sol` / `820b02acc4dcd011dbb97e623e799dfc34586672`; GitHub reports `MERGEABLE` / `CLEAN`. The local review repair is intentionally not pushed.

## PR And Commits

Implementation commit: `578f3f5831d70e0d721478beedab855379a5ee9f` (`activate production rhyme suggestions`). The accepted detached checkout remains atop the exact Phase 05 base; the orchestrator can publish/cherry-pick the reported commits onto `lavender/production-rhyme-phase-05-sol`. No push, PR, merge, or hosted state was mutated.

Independent review repair commit: `a73f0a58177a013e6dda6bcaf7a3aa0dbe443838`. PR #29 does not contain this local repair because push/PR mutation was explicitly forbidden.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4a`.

Per user constraint, no Beads mutation, export, status transition, closure, or follow-up creation was performed.

## Plan Amendments

None.

## Context To Keep

Keep policy in the canonical native provider seam; do not introduce bridge messages, highlighting spans, or persisted lyric analysis.

## Closeout

Independent thermonuclear review is repaired and locally approved with no remaining Phase 05 finding. CI is terminally `ci-unavailable-with-evidence`; publication, merge, and Beads closeout remain orchestrator-owned. Phase 06 retains physical-device release proof, so this phase makes no device-readiness claim.
