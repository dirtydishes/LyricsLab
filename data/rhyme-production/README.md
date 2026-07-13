# Production rhyme sources

This directory contains the exact externally sourced bytes used to build the
production rhyme artifact. `provenance.json` records independently verified
repository, registry, file, hash, license, acknowledgement, and citation pins.
`NOTICE.md` carries the redistribution notices and the SUBTLEX-US provenance
caveat.

The source-acquisition command accepts bytes only from the local cache paths
under `${HOME}/.cache/lyricslab-phase04a`, verifies those bytes against the
pins, and then materializes the committed copies. Normal production builds use
only the committed copies and never access the cache or network.

The `subtlex-word-frequencies` package release is the accepted distributable
commonness source. The Ghent SUBTLEX-US page is cited as upstream provenance;
it is not described as granting the package's ISC license.
