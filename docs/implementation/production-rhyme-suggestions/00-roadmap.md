# Production Offline Rhyme Suggestions Roadmap

Canonical tracker: Beads epic `lyricslab-5iw`

## Plan Source

User-supplied accepted plan attachment `PLAN (14).md`.

## Outcome

A deterministic, offline, production-quality iOS rhyme suggestion experience with accessible theming/UI, reproducible data, contemporary hip-hop coverage, safe output, measured release performance, writer sign-off, and physical-device evidence.

## Phase Sequence

1. `lyricslab-5iw.1`: establish theme, Settings, insertion, and editor-contract foundations.
2. `lyricslab-5iw.2`: implement the pure phonological and ranking core.
3. `lyricslab-5iw.3`: build the reproducible versioned binary data pipeline and bounded loader.
4. `lyricslab-5iw.4`: curate and validate the rap lexicon, safety flags, and proper-noun policy.
5. `lyricslab-5iw.5`: integrate the engine through the native provider and accessible pill UI.
6. `lyricslab-5iw.6`: add diagnostics, benchmark release behavior, complete writer review, and record physical-iPhone closeout evidence.

## Dependencies

The graph is intentionally serial: `.2` depends on `.1`, `.3` on `.2`, `.4` on `.3`, `.5` on `.4`, and `.6` on `.5`. This preserves one active implementation PR and lets every phase consume reviewed contracts from the previous phase.

## Settled Decisions

The interface, suggestion behavior, scoring weights, `0.86` slant threshold, artifact contents/loading policy, 500-entry lexicon floor, 90% OOV threshold, safety/proper-noun behavior, accessibility requirements, latency limits, writer-review policy, and device checklist are accepted as written in the source plan.

## Open Questions

None at loop creation. The source plan's assumptions and deferred work are treated as explicit scope decisions, not unresolved product questions.

## Risks

- This creation checkout is not proven to contain the completed Expo/WebView and prior offline-rhyme implementation baseline.
- SUBTLEX-US and rap-source provenance must remain distributable and reproducible.
- A 500-entry reviewed lexicon and independent 250-case gold set require meaningful editorial effort.
- Binary loading and selection-to-frame latency can only be truthfully accepted in a release build on a physical iPhone.
- Accessibility, theming, and WebView synchronization cross several runtime boundaries.

## Replanning Triggers

- The verified implementation base lacks prerequisites assumed by the plan.
- Repository evidence invalidates the accepted `RhymeEngine` seam or narrow bridge constraint.
- Dataset licensing/provenance cannot support committed distribution.
- The 0.86 precision threshold, 90% OOV target, or release latency limits cannot be met without changing accepted product behavior.
- A physical iPhone or writer sign-off is unavailable at final closeout.

## Quality Gates

Use the exact required gates listed in `IMPLEMENT.md`, with phase-local subsets in each phase doc and the entire suite in Phase 06.

## Closeout

The final closeout artifact is `docs/implementation/production-rhyme-suggestions/storyboard-post-run-mm-dd-yyyy.html`.
