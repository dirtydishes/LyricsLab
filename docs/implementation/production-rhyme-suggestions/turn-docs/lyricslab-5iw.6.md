# Phase 06 Turn Doc: Diagnostics, Benchmarks, and Writer Review

Beads issue: `lyricslab-5iw.6`

Phase doc: `docs/implementation/production-rhyme-suggestions/06-diagnostics-benchmarks-writer-review.md`

## Accepted Outcome

Provide production-faithful diagnostics, deterministic benchmarks, release-device latency evidence, a signed 60-case writer review, the full physical-iPhone checklist, and final loop closeout.

## Orchestration Brief

- Risk: high. This phase introduces release-only diagnostics and benchmark instrumentation, produces quality-review evidence, and must distinguish automatable host proof from mandatory physical-iPhone and human-writer acceptance.
- Execution: one genuinely fresh zero-history `gpt-5.6-sol` implementation task at high reasoning and standard speed owns all automatable work, followed by a separate fresh Sol/high thermonuclear reviewer. The orchestrator owns Git/PR/Beads closeout.
- Base: reviewed Phase 05 merge `a8dc81f7`. Diagnostics must be build-flag-only and absent from normal production navigation.
- Instrumentation: measure the accepted native selection-context receipt through first committed suggestion-bar frame, discard warmups, report cold load separately, and emit deterministic shareable JSON with build/device/artifact/corpus/case/latency/pass metadata.
- Privacy: use only a versioned seeded synthetic corpus; never read, record, log, or emit user lyrics, real-song anchors, or returned user content.
- Benchmarks: provide deterministic Node quick benchmark and selected-device release command. Host evidence can validate harness integrity and warm p50/p95 guards; only a physical iPhone release build can satisfy final device acceptance.
- Writer review: generate and validate a sealed 60-case review packet/mode plus append-only rejection-to-fixture workflow. Do not fabricate human decisions or sign-off; record availability as a concrete manual gate.
- Device checklist: automate every machine-verifiable preflight and evidence schema, but do not claim airplane-mode/editor/relaunch/accessibility/device latency completion without an actual physical iPhone.
- Evidence: full existing gates, diagnostics production-exclusion tests, deterministic benchmark repetitions, privacy scans, writer packet integrity, regression capture, and honest hosted/manual blocker state.
- Callback target: implementation and review each send exactly one final callback to orchestrator `019f5428-f2ea-74c2-abfb-e37349c96391` with their actual task ID.

## Adaptations

- The accepted detached-checkout exception is in use: preflight proved repository root `/home/delta/.codex/worktrees/30a0/lyricslab`, a clean detached checkout, and exact expected HEAD `79f4c8ab271ddca8697ac054dc890e4d2d68c3b2`. No branch repair or checkout mutation was performed.
- Direct sole-owner implementation is proportionate because the user assigned one mutation owner and the orchestrator has already reserved a separate fresh thermonuclear review task. This implementation task owns all local automated gates; hosted CI remains evidence-only if no workflow exists.
- TDD seams are fixed by the accepted plan: build-flag route discovery/exclusion, benchmark CLI JSON, writer packet/decision conversion, and physical-evidence validation. Each is exercised through its public command or exported route/config surface, not private helpers.

## Discoveries And Decisions

- Expo Router ignores a caller-supplied `EXPO_ROUTER_APP_ROOT` during bundling in this SDK. The supported `extra.router.root` config seam is now selected by `LYRICSLAB_DIAGNOSTICS_BUILD=1`; normal builds explicitly use `app`, while diagnostics builds use `diagnostics/app`, a distinct app name, and a distinct `.diagnostics` bundle identifier.
- The Node host cannot reproduce React Native commit timing exactly. The quick benchmark therefore labels its interval as selection-context receipt through the first `setImmediate` host commit boundary. The flagged diagnostics build uses the real `SuggestionBar` and `requestAnimationFrame` commit callback for physical-device samples.
- The checkout initially materialized sealed gold mode as `0600`; content hash remained unchanged. Mode was restored to the required `0444`, after which seal/tamper/evaluator gates passed.

## Implementation And Delegation Evidence

- Direct sole-owner TDD implementation; no delegates or additional mutation owners.
- Red/green slices covered missing diagnostics root, missing benchmark command, iOS host/device refusal, unsigned writer decisions, and the inherited whitespace-coupled Phase 05 accessibility assertion. Tests now exercise public build/config, CLI JSON, packet/conversion, and evidence-validation seams.
- The diagnostics app root consumes the production provider, production suggestion session, binary artifact, eligibility policy, and real `SuggestionBar`. It exposes only seeded synthetic cases, engine/artifact/version/load/error/retry state, a 60-sample device benchmark/share control, and sealed writer-case navigation.

## Changed Behavior And Files

- `app.config.js`, `diagnostics/app/*`, and `src/diagnostics/RhymeDiagnosticsScreen.tsx` provide the explicit diagnostics-only build surface. `SuggestionBar` gained inert optional commit-frame instrumentation used only by that surface.
- `benchmarks/*` and `scripts/benchmark-rhyme.mjs` implement the versioned seeded 20-case/60-sample quick benchmark over the production binary-v2 runtime with five discarded warmups, cold load separated, stable metadata hashes, and no emitted prompts or returned words.
- `scripts/benchmark-rhyme-ios.mjs`, `scripts/rhyme-ios-evidence.mjs`, `scripts/lib/rhyme-ios-contract.mjs`, and `evaluation/rhyme-ios/*` implement physical-device/Xcode preflight and the 22-case fail-closed evidence contract.
- `scripts/writer-review-rhyme.mjs` and `evaluation/rhyme-writer-review/*` provide the immutable 60-case packet, append-only unsigned decision log, empty regression set, validation, and signed rejection-to-fixture conversion. No judgment is prefilled.
- Focused adversarial suites were added under `scripts/test-rhyme-*.mjs`; `package.json` exposes all required commands. The Phase 05 accessibility source assertion now tolerates formatter whitespace without weakening its behavioral requirement.

## Review

Pending the orchestrator's separate fresh thermonuclear review. The implementation owner performed a final scope/privacy/diff inspection and found no user-content emission, normal-production diagnostics route, telemetry, or out-of-scope feature widening.

## CI And Gates

Owner: Phase 06 implementation owner for all local automated gates; orchestrator/reviewer owns hosted-state closeout.

State: `ci-unavailable-with-evidence`

Evidence:

- Hosted CI is unavailable: the repository contains no tracked `.github` workflows and no PR/push mutation was authorized. Local automated evidence is complete.
- Installs: root `npm ci` passed with the existing Expo worklets peer warning and 10 moderate transitive audit findings; editor `npm ci` passed with zero vulnerabilities.
- Root/editor: Jest 25/25 suites and 211/211 tests; typecheck passed; editor 3/3 files and 25/25 tests; editor build, generated HTML build, and freshness check passed.
- Diagnostics: static build-boundary tests passed. Real iOS exports proved production `1,189` modules / `3.3 MB` Hermes bundle and diagnostics `1,168` modules / `2.8 MB` distinct Hermes bundle. Production public/introspected config uses router root `app`, `rhymeDiagnostics=false`, the production bundle id, and includes `production.rhymebin`; flagged config uses root `diagnostics/app`, `rhymeDiagnostics=true`, and the distinct diagnostics id.
- Quick benchmark repeated-run/schema/hash/privacy/adversarial tests passed. Final host result at implementation commit `25818429`: cold `1277.839 ms` separate; warm p50 `8.991 ms`, p95 `20.255 ms`, max `33.264 ms`; pass. Artifact SHA `9edd36f22608a86ac34f375bcf05b72a0c30e10a64a980df94d469e139862b58`; corpus SHA `a562926907eaad9a29be467196ff926100ce3947f6a06037f7786e481d8498c4`; stable report SHA `add63f4f43f339438855aaa57ec1fa9166c0cd16be353950c0abc8a2462e148b`.
- Writer packet seal/validation/unsigned-rejection/conversion tests passed. Packet content seal `16983908bb8a8f9b0cb3ee3270837c7ac65d3aab427cf1330f261f52b9446ba8`; file SHA `0ce4d6d5f90219101609738e23ae6aabc235cbf370e220186db66357c9a32c57`. The committed decisions log contains only its append-only header and is intentionally unsigned.
- iOS CLI/help/schema/preflight/fail-closed tests passed. The required command truthfully failed on Debian: physical iPhone benchmark requires macOS with Xcode/xcrun. No device, screenshot, timing, airplane-mode proof, or attestation was fabricated.
- Production controls: fixture build/check `3,092` bytes SHA `04145680c60ff41981c4af545680c32067ee03e1b0ab4a51930d3ff8711688af`; production data controls `19,413,208` bytes SHA `9edd36f22608a86ac34f375bcf05b72a0c30e10a64a980df94d469e139862b58`; source acquisition/check/adversarial controls passed at CMU revision `74790861f652b15e4ac49015a90074ad62a27690`, 74,286 SUBTLEX entries, and 618/618 reviewed entries.
- Seal/evaluator passed with immutable gold SHA `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`, mode `0444`, and 128/128 twice.
- Forced-GC runtime passed: retained heap `41,351,928`, retained RSS `30,961,664`, startup `4006.296 ms`, warm p50/p95 `25.912/63.941 ms`, cold p50/p95/max `34.300/133.938/202.874 ms`, query-cache heap/RSS growth `85,512/40,157,184` bytes.
- Legacy artifact freshness/smoke passed at SHA `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`; compact perf passed with mixed p50/p95 `0.328/1.594 ms` and slant p50/p95 `3.592/9.645 ms`. `git diff --check` passed.

## PR And Commits

- `25818429d3f1f474090b2ba84ee5321e832799f5` (`add final rhyme diagnostics and evidence tools`) contains the implementation and automated contracts.
- This evidence record is committed separately. No push, PR mutation, merge, or Beads mutation was performed.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.5`.

## Plan Amendments

None.

## Context To Keep

Physical-iPhone evidence and explicit writer sign-off are mandatory completion gates; unavailability blocks completion rather than being reported as a pass.

## Closeout

Automatable implementation is PR-ready. Phase acceptance remains blocked on two truthful manual gates: a completed/signed 60-case human writer review (including top-three acceptance and any resulting regression corrections), and a complete physical-iPhone Release run with airplane-mode, accessibility, interaction, latency, artifact/build identity, and human attestations. Independent thermonuclear review is also pending orchestrator ownership.
