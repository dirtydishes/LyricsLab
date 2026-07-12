# Notices for Phase 04A production rhyme data

## CMUdict

The production artifact uses `cmudict.dict` from the CMUSphinx CMUdict
repository pinned at commit `74790861f652b15e4ac49015a90074ad62a27690`
(`2025-10-24T13:40:26-04:00`). The repository's existing
`data/cmudict.txt` bytes match the pinned authoritative dictionary SHA-256:

`81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22`

The CMUdict license and acknowledgement text are preserved verbatim in:

- `data/rhyme-production/cmudict-LICENSE.txt`
- `data/rhyme-production/cmudict-README.txt`

## SUBTLEX word frequencies

The production artifact uses the npm package
`subtlex-word-frequencies@2.0.0`, tarball URL:

`https://registry.npmjs.org/subtlex-word-frequencies/-/subtlex-word-frequencies-2.0.0.tgz`

The package declares ISC license with copyright notice for Zeke Sikelianos, and
its README cites:

Brysbaert, M., & New, B. (2009). Moving beyond Kucera and Francis: A critical
evaluation of current word frequency norms and the introduction of a new and
improved word frequency measure for American English. Behavior Research
Methods, 41(4), 977-990.

Important provenance caveat: the packaged npm distribution declares ISC under
Zeke Sikelianos, while the Ghent SUBTLEXus download page itself does not state
ISC. Treat that as an upstream relicensing/provenance caveat, not as proof that
SUBTLEX rights are wholly unknown.

## LyricsLab reviewed Phase 04 source data

The 618 reviewed Phase 04 project source entries and policies remain
LyricsLab-owned source data. They are included only through
`data/rhyme-sources/manifest.json` and its declared source hashes.
