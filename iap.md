# iap.md — Monetization & gating

## Premium features (locked)
- Extra themes (beyond default + light/dark + DirtyDishes)
- Extra icons
- External rhyme API fallback
- AI co-writer suggestions
- Music player integrations beyond local files

## Gating behavior
- When user attempts premium feature:
  - present paywall card (sheet/overlay)
  - include: what Plus unlocks, trial info, subscribe button, restore purchases

## Dev bypass
- Debug-only Settings toggle:
  - `Bypass IAP`
  - when ON, all premium gates return “unlocked”

## Store integration (post-MVP)
- Subscription product: `LyricsLab Plus`
- Restore purchases flow
- Expo/native purchase path TBD; keep minimal early.
