# Project-owned rhyme sources

This directory contains the human-reviewable Phase 04 editorial corpus. It is
project-authored source data, not a copy of CMU, SUBTLEX-US, a proprietary rap
lexicon, private data, or song lyrics. Regional scopes record where the review
team considers a form relevant in contemporary US hip-hop writing; they do not
claim that the form originated in, or is exclusive to, that region.

`lexicon.json` is the reviewed catalog. Alias records name the ordinary token
whose pronunciation Phase 04A must verify against its separately pinned CMU
source. Direct records use standard ARPAbet phones and are validated locally.
`evidence.json` records the project editorial basis for each category without
inventing third-party licensing or provenance. The two policy files enumerate
the complete maintained safety and proper-noun subsets.

The safety subset is intentionally narrow. High-risk identity slurs remain
available for analysis when typed as anchors, but their flag prevents
unsolicited suggestion output. Ordinary profanity is not safety-blocked.
Proper names, places, and acronyms require a non-empty normalized active prefix
before they are eligible as suggestions.

Run `npm run check:rhyme-sources` after any edit. The check authors a fresh
temporary corpus and byte-compares every committed source before it verifies
hashes, schema strictness, count floors, canonical uniqueness, category and
region enums, evidence and review completeness, direct ARPAbet, alias shape,
policy coverage, Phase 03 flag compatibility, and the sealed-evaluation
boundary.
The independent acceptance set is deliberately not stored, read, generated,
or described here.
