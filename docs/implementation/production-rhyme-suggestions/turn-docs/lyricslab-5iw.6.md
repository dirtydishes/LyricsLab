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

### Fresh Independent Review Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.6",
  "risk": "high",
  "strategy": "direct",
  "implementation_owner": "completed Phase 06 implementation at f0a9a84f977dd3f99568e77afdcfb160c0304c32",
  "review_independence": "genuinely fresh zero-history reviewer task 019f5833-416d-78f2-9bca-34162b61c50b on the accepted clean detached checkout for lavender/production-rhyme-phase-06-sol-review",
  "delegation_plan": [],
  "model_and_effort_rationale": "Direct gpt-5.6-sol high-reasoning review preserves sole mutable-checkout ownership while applying full thermonuclear scrutiny to production exclusion, benchmark truthfulness, privacy, hostile evidence inputs, writer-history integrity, and manual release gates.",
  "required_evidence": [
    "complete PR 30 diff and transitive production, diagnostics, benchmark, writer, device-evidence, runtime, provider, UI, app-config, script, and test review",
    "test-first repairs for every safe in-scope finding with adversarial command, path, symlink, schema, hash, privacy, determinism, and fail-closed coverage",
    "root and editor installs, full tests and typecheck, production exclusion and enabled exports, repeated benchmarks, writer and iOS contract controls, artifact and evaluator gates, forced-GC runtime, legacy perf, Expo config and bundle evidence, and git diff checks",
    "PR 30 mergeability, hosted status contexts and workflow evidence without publishing local repairs",
    "explicitly incomplete physical-iPhone and human-writer gates"
  ],
  "ci_owner": "fresh independent reviewer for all local and hosted-state evidence",
  "user_constraints": [
    "Beads JSONL is read-only and only this existing Phase 06 turn doc may be updated",
    "reviewer is sole mutation owner and commits safe repairs locally with lowercase human messages",
    "do not push, update or merge PRs, mutate Beads, fabricate writer decisions, or fabricate device evidence",
    "send exactly one final schema-valid review callback to orchestrator 019f5428-f2ea-74c2-abfb-e37349c96391"
  ]
}
```

- The accepted detached-checkout exception is in use: preflight proved repository root `/home/delta/.codex/worktrees/30a0/lyricslab`, a clean detached checkout, and exact expected HEAD `79f4c8ab271ddca8697ac054dc890e4d2d68c3b2`. No branch repair or checkout mutation was performed.
- Direct sole-owner implementation is proportionate because the user assigned one mutation owner and the orchestrator has already reserved a separate fresh thermonuclear review task. This implementation task owns all local automated gates; hosted CI remains evidence-only if no workflow exists.
- TDD seams are fixed by the accepted plan: build-flag route discovery/exclusion, benchmark CLI JSON, writer packet/decision conversion, and physical-evidence validation. Each is exercised through its public command or exported route/config surface, not private helpers.
- Fresh-review preflight proved worktree and repository root `/home/delta/.codex/worktrees/05f0/lyricslab`, clean detached HEAD `f0a9a84f977dd3f99568e77afdcfb160c0304c32`, and the accepted remote review ref at that exact commit before any inspection or mutation. The reviewer remained sole mutation owner and used no delegates.

## Discoveries And Decisions

- Expo Router ignores a caller-supplied `EXPO_ROUTER_APP_ROOT` during bundling in this SDK. The supported `extra.router.root` config seam is now selected by `LYRICSLAB_DIAGNOSTICS_BUILD=1`; normal builds explicitly use `app`, while diagnostics builds use `diagnostics/app`, a distinct app name, and a distinct `.diagnostics` bundle identifier.
- The Node host cannot reproduce React Native commit timing exactly. The quick benchmark therefore labels its interval as a host approximation through a `setImmediate` boundary and explicitly disqualifies itself as physical evidence. The flagged diagnostics build times selection-context receipt through the first React commit observed by a diagnostics-only `useLayoutEffect` probe after the real production `SuggestionBar` renders.
- The checkout initially materialized sealed gold mode as `0600`; content hash remained unchanged. Mode was restored to the required `0444`, after which seal/tamper/evaluator gates passed.

## Implementation And Delegation Evidence

- Direct sole-owner TDD implementation; no delegates or additional mutation owners.
- Red/green slices covered missing diagnostics root, missing benchmark command, iOS host/device refusal, unsigned writer decisions, and the inherited whitespace-coupled Phase 05 accessibility assertion. Tests now exercise public build/config, CLI JSON, packet/conversion, and evidence-validation seams.
- The diagnostics app root consumes the production provider, production suggestion session, binary artifact, eligibility policy, and real `SuggestionBar`. It exposes only seeded synthetic cases, engine/artifact/version/load/error/retry state, a 60-sample device benchmark/share control, and sealed writer-case navigation.

## Changed Behavior And Files

- `app.config.js`, `diagnostics/app/*`, and `src/diagnostics/*` provide the explicit diagnostics-only build surface. Review removed all measurement props/imports from production `SuggestionBar`; diagnostics now owns the commit probe and a tested wrapper around the real production runtime for loading/failure/retry injection.
- `benchmarks/*` and `scripts/benchmark-rhyme.mjs` implement the versioned seeded 20-case/60-sample quick benchmark over the production binary-v2 runtime. One full 20-case warmup round is discarded, cold load is separate, each case has three samples with p50/p95/max, stable metadata covers artifact/corpus/manifest/source/sample-plan identity, and no prompt or returned word is emitted.
- `scripts/benchmark-rhyme-ios.mjs`, `scripts/rhyme-ios-evidence.mjs`, `scripts/lib/rhyme-ios-contract.mjs`, and `evaluation/rhyme-ios/*` implement exact-UDID physical-device/Xcode preflight and a strict 25-case evidence contract. Acceptance binds the signed diagnostics Release app, embedded artifact, diagnostics marker, build fingerprint, Git commit, recomputed report samples, writer log, actual evidence-file hashes, timestamps, and cross-record identities.
- `scripts/writer-review-rhyme.mjs` and `evaluation/rhyme-writer-review/*` provide the deterministic synthetic 60-case packet, independent file/content seal, append-only ordered decision contract, empty regression set, and signed rejection conversion. The packet contains prompts only—no judgment/signature placeholders—and conversion emits hashed, typed regression assertions without words, code, or paths, refuses traversal and overwrite, and is executed by `test:writer-regressions:rhyme`.
- Focused adversarial suites were added under `scripts/test-rhyme-*.mjs`; `package.json` exposes all required commands. The Phase 05 accessibility source assertion now tolerates formatter whitespace without weakening its behavioral requirement.

## Review

Fresh independent thermonuclear review outcome: **repaired, with phase completion still blocked only by the two accepted manual gates**.

- Removed diagnostics instrumentation from the production `SuggestionBar` and moved commit measurement behind the diagnostics-only root, eliminating production timing/import/contract effects.
- Repaired benchmark truthfulness: all corpus cases are warmed, host approximation is explicitly non-device evidence, per-case and aggregate nearest-rank percentiles are recomputed, source/artifact/corpus/build metadata is sealed deterministically, and malformed or privacy-violating reports fail.
- Replaced the label-only writer rotation with category-specific synthetic cases. Repetition uses production ranking without persisting the candidate word; themes use the real settings provider; loading/error/retry use a tested diagnostics wrapper over the production runtime.
- Replaced the self-sealed editable writer packet with an independent seal; removed empty decision placeholders; required exactly 60 ordered, uniquely attributed decisions plus later signoff; constrained correction schemas for ranking, classification, and safety; added executable hashed regressions; and blocked traversal, symlink input, and overwrite.
- Deepened physical evidence from permissive shape checks into exact nested schemas, unique cases, valid/ordered timestamps, cross-hash bindings, exact selected UDID, simulator rejection, diagnostics Release identity, embedded artifact and instrumentation verification, report-sample recomputation, actual evidence-file verification, stale-build rejection, validated writer history, and shell-safe process invocation.
- Made malformed diagnostics flags fail closed and proved production/diagnostics route separation with real non-bytecode iOS exports. Normal production config does not execute or expose the diagnostics build-commit helper.
- The first full reviewer Jest pass exposed the inherited whitespace-coupled accessibility source assertion after production instrumentation was removed; the existing formatter-tolerant behavioral regex was restored, and the rerun passed 26/26 suites and 212/212 tests.
- Thermonuclear structure review found no file near 1,000 lines, no production behavior widening, no duplicate engine/ranker/provider implementation, and no remaining safe in-scope finding after the diagnostics runtime wrapper, shared compiled-tool runner, independent iOS contract, and prompt-only packet simplifications.

## CI And Gates

Owner: fresh independent Phase 06 reviewer for final local gates and hosted-state evidence.

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

Fresh reviewer evidence after repairs:

- Root `npm ci` and editor `npm ci` passed with the same existing Expo worklets peer warning; no lockfile changed. Final root rerun passed 26/26 suites and 212/212 tests; `npm run typecheck` passed. Editor passed 3/3 files and 25/25 tests; editor build, generated HTML build, and freshness check passed.
- Production exclusion and enabled-export tests passed against real non-bytecode iOS exports. Final public/introspected config proved normal root `app`, `rhymeDiagnostics=false`, production bundle id, no diagnostics build commit, and embedded `production.rhymebin`; enabled config proved root `diagnostics/app`, `rhymeDiagnostics=true`, diagnostics bundle id, reviewed commit `9314ceb33d88b56b08af2c6a2853cc26bc8442a2`, and the same embedded production artifact.
- Final repaired host report at `9314ceb3`: cold `1274.339 ms` separate; 20 warmups discarded; 60 samples; p50 `8.631 ms`, p95 `21.206 ms`, max `25.222 ms`; pass. Source SHA `20ab4f37605097342a939819a7e55ab33310b33bdb5b4d9138477944752086ed`; stable report SHA `c7c02e9e9a6e50486205e6b7443e4a759c6e59ffd570a6ac0298428f76c226fd`; artifact/corpus/manifest hashes remained exact.
- Writer packet deterministic regeneration, independent seal, privacy, unsigned/partial/duplicate rejection, traversal/overwrite controls, signed conversion, and empty executable regression suite passed. Final packet content SHA `525cd7157c3a6a64a3f56e8a6be9a1c6b6ae235dbe0c69968e3b8aa4de8b98a7`; file SHA `437e4d5d22a55d180280fba56eceb94c88b1d22766dede15530d40d086e83c99`. The committed decision log remains header-only and intentionally unsigned; no judgment or signoff was fabricated.
- iOS CLI/help/template, exact-key schema, valid-fixture, malformed/duplicate/contradictory sample, threshold, selected-device mismatch, shell-injection, privacy, and Debian fail-closed tests passed. The actual selected-device command still truthfully fails before app/evidence inspection because this host is Debian without Xcode/xcrun.
- Fixture/compiler passed at 3,092 bytes / `04145680c60ff41981c4af545680c32067ee03e1b0ab4a51930d3ff8711688af`; production regeneration/check passed at 19,413,208 bytes / `9edd36f22608a86ac34f375bcf05b72a0c30e10a64a980df94d469e139862b58`; source acquisition/check/adversarial controls passed at CMU `74790861f652b15e4ac49015a90074ad62a27690`, 74,286 SUBTLEX entries, and 618/618 reviewed entries.
- Seal setup/check/tamper controls, evaluator self-test, and two normal evaluator runs passed 128/128 with gold SHA unchanged at `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7` and local mode `0444`.
- Forced-GC runtime passed with retained heap/RSS `41,339,744/31,358,976` bytes, startup `4301.551 ms`, warm p50/p95 `20.594/80.225 ms`, cold p50/p95/max `33.111/133.010/209.823 ms`, and query-cache heap/RSS growth `85,480/40,988,672` bytes. Legacy smoke remained fresh at `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`; compact mixed p50/p95 `0.371/1.869 ms` and slant p50/p95 `3.501/9.753 ms` passed.
- Hosted CI remains unavailable with evidence: PR #30 is open at remote head `f0a9a84f977dd3f99568e77afdcfb160c0304c32`, explicit base `lavender/expo-clean-rebuild`, `MERGEABLE` / `CLEAN`, with empty status contexts, `gh pr checks 30` reporting no checks, no branch workflow runs, no listed workflows, and no tracked `.github` directory. Local repairs are intentionally unpushed.
- `git diff --check` passed after the repair commit. Production artifact, source manifest, corpus, sealed gold, evaluator result, editor HTML, bridge, and production route files remained byte/freshness stable except for the reviewed artifact-hash constant and its freshness assertion.

## PR And Commits

- `25818429d3f1f474090b2ba84ee5321e832799f5` (`add final rhyme diagnostics and evidence tools`) contains the implementation and automated contracts.
- `9314ceb33d88b56b08af2c6a2853cc26bc8442a2` (`repair phase 06 review findings`) contains the local test-first thermonuclear repairs. PR #30 does not contain this commit because push/PR mutation is forbidden.
- This final review evidence record is committed separately. No push, PR mutation, merge, or Beads mutation was performed.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.5`.

## Plan Amendments

None.

## Context To Keep

Physical-iPhone evidence and explicit writer sign-off are mandatory completion gates; unavailability blocks completion rather than being reported as a pass.

## Closeout

Independent thermonuclear review is repaired and locally approved with no remaining automatable finding. Phase acceptance remains **blocked** on exactly two truthful manual gates: a completed/signed 60-case human writer review (including top-three acceptance and any resulting regression corrections), and a complete physical-iPhone diagnostics Release run with airplane mode, all 25 checklist cases, accessibility, interaction, measured device latency, artifact/build identity, evidence files, and human attestations. CI is terminally `ci-unavailable-with-evidence`; publishing repairs, manual evidence, PR update/merge, and Beads closeout remain orchestrator-owned.

## Post-device launch repair — 2026-07-13

- A physical-iPhone diagnostics Release build was reported to exit immediately. Loading the same diagnostics surface through the Expo dev client rendered successfully but left the production engine at `loading` with no error.
- The minimized repro showed that `createAfterFirstFrameScheduler` allowed the native idle scheduler to control startup without a backstop. A host exception escaped the runtime load error boundary, while an idle callback that never arrived left the artifact unopened and the snapshot permanently at `loading`.
- Startup now races the idle callback against a cancellable 250 ms timer after the existing two-frame defer. Unsupported idle scheduling is contained, starvation falls back to the timer, late callbacks cannot double-start the load, and cancellation clears both paths.
- Regression coverage exercises both the scheduler and the real Expo production-runtime `start()` call path. Focused tests passed 8/8; the full root suite passed 26/26 suites and 215/215 tests; typecheck, editor tests, diagnostics config/export separation, production runtime, and production artifact freshness all passed.
- Physical-device confirmation still requires rebuilding and relaunching the signed diagnostics app. This host is Debian and cannot claim that iPhone evidence.
