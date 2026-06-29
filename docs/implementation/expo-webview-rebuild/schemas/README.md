# Callback Schemas

This stream uses the `orchestrator-callback` workflow. Worker/reviewer threads report back to the orchestrator with these payload shapes.

## Implementation Callback

```json
{
  "type": "implementation-callback",
  "phase_issue_id": "lyricslab-jd5.1",
  "status": "pr-ready|blocked",
  "branch": "feat/expo-webview-rebuild",
  "pr": "<url-or-id-or-null>",
  "commits": ["<sha>"],
  "turn_doc": "docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.1.md",
  "local_gates": ["<command + result>"],
  "changed_files": ["<path>"],
  "blockers": [],
  "context_to_keep": []
}
```

## Review Callback

```json
{
  "type": "review-callback",
  "phase_issue_id": "lyricslab-jd5.1",
  "status": "approved|repaired|blocked",
  "pr": "<url-or-id-or-null>",
  "ci_state": "ci-green|ci-repaired-and-green|ci-unavailable-with-evidence|ci-blocked-with-cause",
  "review_skill": "thermo-nuclear-code-quality-review",
  "repairs": ["<summary>"],
  "findings_remaining": [],
  "turn_doc": "docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.1.md",
  "context_to_keep": []
}
```

The orchestrator is the only actor that consumes these callbacks to update Beads, mirror `loop-state.md`, and advance the stream.
