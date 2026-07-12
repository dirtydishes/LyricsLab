# Phase 04A production rhyme data inputs

This directory contains the pinned third-party notice inputs and source package
used to build `assets/rhyme/production.rhymebin`.

- `manifest.json` is the deterministic build contract for the production
  artifact.
- `cmudict-LICENSE.txt` and `cmudict-README.txt` preserve the authoritative
  CMUdict license and acknowledgement text from
  `cmusphinx/cmudict@74790861f652b15e4ac49015a90074ad62a27690`.
- `subtlex-word-frequencies-2.0.0.tgz` is the exact npm package tarball pinned
  by SHA-256, SHA-512/SRI, SHA-1 shasum, and internal file hashes.
- `NOTICE.md` records required acknowledgements and the SUBTLEX provenance
  caveat.

The production artifact is assembled through the Phase 03 binary compiler and
loader contract, but it remains dormant. Phase 05 owns provider/settings
activation.
