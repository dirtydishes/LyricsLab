# Resources

Bundled app resources live in this folder.

## CMU Pronouncing Dictionary

LyricsLab’s offline rhyme engine depends on a bundled CMU dictionary text file.

### Supported filenames

- `cmudict.txt` (preferred)
- `cmudict-0.7b.txt` (fallback)

The app checks the main bundle for those names in that order.

### Add or replace the dictionary

1. Copy the dictionary file into this folder.
2. In Xcode, confirm the file is included in the `LyricsLab` target.
3. Confirm it appears under **Build Phases → Copy Bundle Resources**.
4. Rebuild and run.

### Notes

- Keep the file as plain text.
- Replacing the dictionary changes rhyme analysis/suggestions after reinstall/relaunch.
