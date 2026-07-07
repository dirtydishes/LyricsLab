# Product

## Register

product

## Users

LyricsLab is for songwriters, rappers, and lyric-driven musicians who are actively drafting lines, checking rhyme structure, and iterating while ideas are still fragile. The product should support fast, private, offline-first writing sessions on mobile devices, including moments where the keyboard is open and the user is focused on a single line or stanza.

## Product Purpose

LyricsLab exists to make lyric writing feel fluid: create and search compositions, edit lyrics with stable cursor behavior, see useful rhyme groupings, and insert relevant suggestions without leaving the writing surface. The MVP succeeds when typing stays responsive, rhyme highlighting is readable and stable, suggestions insert at the caret, search covers titles and lyrics, and local-first work remains private.

## Brand Personality

Focused, musical, and lightly futuristic. The default feel can carry retro-futuristic and liquid-glass polish, but the interface should earn trust as a writing tool before it performs as a visual object.

## Anti-references

Do not turn the editor into a generic chatbot or a cloud-first AI writing surface. Do not make decorative glass, motion, or theme effects compete with typing performance and legibility. Do not treat the Expo/WebView rebuild as the proven primary product lane until real-device runtime validation is recorded. Do not store HTML as canonical lyric state; canonical body storage is editor JSON plus plain text.

## Design Principles

- Keep the page centered on the lyric, not the chrome around it.
- Preserve writing flow: keyboard, caret, selection, scroll position, and suggestion insertion matter more than visual flourish.
- Make rhyme help legible and deterministic, with stable colors and low-noise grouping.
- Stay offline-first for MVP; external APIs and AI are explicit post-MVP, IAP-locked expansions.
- Expand by proving thin viability slices before declaring the rebuild done or widening scope.

## Accessibility & Inclusion

Themes and rhyme highlight palettes must remain readable with sufficient contrast. Motion should be brief, purposeful, and safe to reduce. Rhyme grouping should not depend on color alone; styling differences such as emphasis, underline, or other non-color cues should remain available as the editor matures.
