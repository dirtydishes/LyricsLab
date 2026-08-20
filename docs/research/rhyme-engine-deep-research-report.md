# Building LyricsLab’s Offline Rhyme Engine

## What best-in-class should mean for LyricsLab

Rhymer’s Block is a solid baseline because it proves that two features matter enough for lyricists to use a dedicated mobile tool at all: offline operation and immediate visual rhyme feedback. Its public pitch is straightforward: color-coded rhymes, offline use, and rhyme suggestions ordered by commonly used words. That is useful, but it is still closer to a colorized rhyming notebook than a true phonological writing engine. citeturn7view0

To beat that baseline, LyricsLab should treat rhyme as a live, editable structure rather than a static word lookup. The engine should understand end rhymes, internal rhymes, slant rhymes, multisyllabic chains, and phrase rhymes that cross word boundaries. It should also predict what rhyme family the writer is probably “in” right now, because rap and songwriting often proceed by maintaining or bending a local rhyme pattern instead of simply finding a word that rhymes with the last token typed. Research on rap rhyme detection, rhyme-scheme discovery, and visualization all points in that direction: imperfect and internal rhyme matter in rap, rhyme structure is often local and pattern-based, and syllable-level clustering can reveal complexity that simple end-word matching misses. citeturn9view1turn23view0turn24view0turn24view3

The core product idea, then, is not “offline rhyming dictionary.” It is “offline rhyme intelligence.” In practice, that means a system with five properties: syllable-aware highlighting, phrase-aware matching, scheme-aware prediction, explainable ranking, and low-noise UX. CMUdict gives you a strong local seed because it is free for unrestricted use, contains stress-marked pronunciations in ARPAbet, and has broad but imperfect coverage; the right design is to use CMUdict as the base layer, then add slang overrides, phrase assembly, and a fallback grapheme-to-phoneme path for out-of-vocabulary words. citeturn7view4turn12view1turn12view0turn6search5turn6search2

## Competitive feature matrix

The matrix below focuses on what is publicly documented, not on undocumented internal capabilities. That matters, because the clearest way to position LyricsLab is to close the gap between “rhyming reference tool” and “writer-in-the-loop composition engine.” The products in the matrix publicly document useful parts of the stack, but none of them clearly combine all of the pieces that LyricsLab can own in one offline-first mobile editor. citeturn7view0turn7view2turn8search1turn21view0turn21view1turn21view2turn21view3

| Product | Documented strengths | Offline or local posture | Publicly visible gap that LyricsLab can exploit | Sources |
|---|---|---|---|---|
| **Rhymer’s Block** | Color-coded rhymes, offline use, suggestions sorted by commonly used words | Explicitly offline | Public materials emphasize word-level color coding and lookup, not scheme prediction, phrase-rhyme detection, or user-tunable slant logic | citeturn7view0 |
| **RapPad** | Built-in rhyming dictionary, syllable counter, thesaurus, line generator, instrumental attachment/control | Primarily web workflow | Strong tool suite, but public homepage does not foreground inline mobile-first rhyme highlighting and local-only operation | citeturn7view2 |
| **Lyric Notepad** | Rhyme matching, syllable counter, built-in recorder | Mobile app with local writing flow | Strong all-in-one notebook feel, but public pitch does not emphasize section-aware scheme prediction or editable slant families | citeturn8search1turn8search2 |
| **Lyrcs** | Real-time rhyme highlighting, cursor-aware suggestions, near-rhyme teaching, notes, annotations, plain-text ownership | Native local-file posture with iCloud sync | This is the closest visible product target; LyricsLab can surpass it with stronger offline phonological ranking, active-rhyme prediction, and a native suggestion bar tied to the current rhyme family | citeturn21view0 |
| **RhymeZone** | Exact rhymes, near rhymes, phrase rhymes, popularity/meter filtering, similar-sound search, offline iOS app database, “Poet Maker” | Search tool, not editor-first | Excellent lookup depth, but the interaction is still search-and-insert rather than live editor-native intelligence | citeturn21view2turn21view3 |
| **Rhymer.com** | Six rhyme types: end, last-syllable, double, triple, beginning, first-syllable | Web lookup | Great taxonomy, but not an inline writing environment and not rap-specific in its live feedback model | citeturn21view1 |

The most important competitive takeaway is that LyricsLab does not need to win by having the biggest dictionary. RhymeZone already proves that online lookup can go very deep, with phrase rhymes and filtering by rhyme quality, popularity, and meter. What remains open is a writer-native experience that makes rhyme structure legible as the user composes, not after they stop to search. citeturn21view2turn21view3turn13view0

## Algorithm options with tradeoffs

The best MVP is a hybrid. Pure dictionary rules are too brittle for rap slang, but jumping directly to a neural on-device detector is overkill for a first release. The practical path is a deterministic phonological core with a continuous slant score, then a lighter-weight scheme model on top. That maps well to the literature: CMUdict-style pronunciation lookup is stable and explainable; Hirjee and Brown show that probabilistic phoneme scoring captures imperfect and internal rhymes better than simpler rules; Haider and Kuhn show that supervised neural similarity can become very accurate later if you want a reranker or classifier; and scheme research from Reddy and Knight plus Addanki and Wu shows that pattern models can infer rhyme structures beyond simple end-word matching. citeturn12view0turn9view1turn10view1turn9view3turn9view2turn23view0

| Algorithm family | What it does well | Weaknesses | Mobile fit | Recommendation |
|---|---|---|---|---|
| **Strict rhyme-tail key** from last stressed vowel to word end | Fast exact end-rhyme lookup; easy to explain; great for baseline suggestions | Misses many slant rhymes, internal patterns, and phrase rhymes | Excellent | **Use in MVP** as the first candidate generator citeturn12view0turn21view1 |
| **Weighted phoneme alignment** across syllables | Captures imperfect rhyme, internal rhyme, and multisyllabic similarity more realistically | More tuning work; needs good scoring tables and pronunciation handling | Good if precomputed and cached | **Use in MVP** as the main scorer after candidate generation citeturn9view1turn10view1turn14view0 |
| **Feature-vector phonetic similarity** using phonological features | Good slant-rhyme distance; more flexible than exact phone matching | Harder to explain than tail keys; not enough by itself for ranking usefulness | Good if vectors are prebuilt offline | **Use in MVP or early post-MVP** as a secondary slant score citeturn9view4turn10view3 |
| **Siamese or neural rhyme classifier** | Strong pair classification, especially for imperfect rhymes and noisy orthography | Model size, inference cost, explainability, training data burden | Fair to good if distilled, but still more complex | **Post-MVP reranker**, not core MVP citeturn9view3 |
| **Unsupervised scheme model** using EM or HMMs | Detects local rhyme patterns and predicts likely next-family targets | Less reliable on tiny context windows; needs stanza/line abstractions | Good if kept simple and local | **Use in MVP-lite form** for line-end prediction and section patterning citeturn9view2turn10view4turn23view0 |
| **Density clustering on syllable similarity** | Great for visualization of dense internal/multisyllabic patterns | More expensive; parameter-sensitive; can overcluster | Good for analysis mode, not every keystroke | **Post-MVP analysis mode** or background recompute after idle citeturn24view0turn24view1turn24view3 |

For **end rhymes**, the right primitive is the classic rhyming tail: from the last stressed vowel through the end of the pronunciation. Pronouncing’s `rhyming_part()` is a good conceptual model for this. For **slant rhymes**, do not make the system binary. Katz’s hip-hop work argues that imperfect rhymes reflect graded perceptual similarity, and Hirjee and Brown’s probabilistic scoring model outperforms simpler rules precisely because rhyme quality lives on a continuum rather than a yes/no boundary. citeturn12view0turn14view0turn10view1

For **multisyllabic rhymes**, score longer tails over multiple syllables instead of only comparing the final syllable. Rhymer.com’s distinction between end, double, and triple rhyme is useful product language, but the engine should treat this as a continuous “matched syllable span” problem. RapViz is also helpful here: their syllable-group approach shows why a word-level-only highlighter undersells complex rhyme chains. citeturn21view1turn24view3

For **phrase rhymes**, explicitly allow the rhyme domain to cross word boundaries. The 2026 hybrid phonological-filtering paper describes “mosaic” rhymes, where the rhyme domain spans more than one word and is extracted from the stressed vowel to the end of the phonological phrase. That is exactly the right mental model for LyricsLab phrase rhymes like “and ready” matching “spaghetti”-type material. citeturn16view0turn24view3

For **active-rhyme prediction**, use a lightweight local sequence model. A practical MVP idea is to assign family labels to recent line endings and strong internal anchors, then estimate the probability of the next intended family from section-local transition counts. The research precedent is clear: unsupervised EM and HMM approaches can recover rhyme schemes, and hip-hop-specific HMM work shows that even noisy lyrics contain enough rhyming signal for pattern inference. citeturn9view2turn23view0

## Recommended MVP architecture

The architecture should respect your current split: native owns songs, persistence, and the suggestion bar; the WebView owns rich-text editing and future decorations. That is a good split for a local-first mobile app, because Expo’s docs explicitly recommend SQLite as a strong choice for local-first persistence, and `expo-sqlite` persists across restarts. citeturn7view6turn12view2

A strong MVP flow looks like this. The WebView editor tokenizes only the changed region and sends a compact patch plus cursor/selection metadata to native. Native maintains the authoritative rhyme-analysis state, because the native keyboard suggestion bar must react immediately even if the editor DOM is busy. Native then returns two payloads: a small ranked suggestion packet for the current anchor and a span packet for visual highlighting. The WebView turns the span packet into ProseMirror/Tiptap decorations. ProseMirror’s decoration model is made for this: inline, node, and widget decorations exist for exactly this kind of visual overlay, and the docs recommend keeping a `DecorationSet` in plugin state and mapping it forward through document changes instead of recreating everything every redraw. citeturn4view1turn4view2turn3search5turn3search9

On the bridge, keep the protocol boring and deterministic. React Native WebView officially supports three communication paths you care about: `injectedJavaScript`, imperative `injectJavaScript`, and `window.ReactNativeWebView.postMessage` plus `onMessage`. The guide also notes that `onMessage` must be set or the WebView postMessage bridge will not be injected. For ongoing editor traffic, use an explicit ready handshake and incremental messages instead of re-injecting whole-document state. citeturn7view7

For the lexicon, do not do hot-path SQL queries on every keystroke. Instead, ship a build-time compiled phonetic asset and keep SQLite for user data: songs, custom pronunciations, learned slant overrides, recents, and optional future sync metadata. CMUdict is large enough to be useful but small enough to preprocess into dense numeric structures; the NLTK reader reports 127,069 entries, 39 phonemes, and many alternate pronunciations, which is exactly the kind of data that benefits from integer encoding and precomputed indexes. citeturn12view1turn7view4

These are the data structures I would actually use in TypeScript and mobile hot paths:

```ts
type PhoneId = number;     // ARPAbet+stress encoded as small ints
type WordId = number;
type PronId = number;
type FamilyId = number;

interface Pronunciation {
  id: PronId;
  phones: Uint8Array;          // encoded phones
  stress: Uint8Array;          // one entry per syllable
  syllableEnds: Uint8Array;    // phone offsets for syllable boundaries
  tailHash: number;            // exact rhyme tail
  vowelHash: number;           // vowel skeleton for slant matching
  codaHash: number;            // consonant ending signature
  featureVec?: Int8Array;      // optional compact phonetic features
}

interface LexemeEntry {
  id: WordId;
  norm: string;
  display: string;
  freq: number;                // normalized local frequency score
  pronIds: Uint32Array;
  flags: number;               // slang/proper noun/user-added/etc
}

interface TokenInstance {
  from: number;                // editor doc offset
  to: number;
  line: number;
  wordId: WordId | -1;
  chosenPronId: PronId | -1;
}

interface HighlightSpan {
  from: number;
  to: number;
  familyId: FamilyId;
  strength: number;            // 0..100
  kindMask: number;            // end/internal/slant/multi/phrase
}

interface Suggestion {
  text: string;
  source: "word" | "phrase";
  score: number;
  familyId: FamilyId;
  matchedSyllables: number;
  reasons: string[];           // short explainability chips
}
```

The indexes should also be numeric and cache-friendly: `Map<number, Uint32Array>` for exact tail lookup, vowel-skeleton lookup, and coda-signature lookup; a small LRU cache keyed by `(norm, selectedPronId, sensitivityMode)`; and a line-local rhyme graph stored as adjacency lists or family IDs rather than nested objects. For editor rendering, keep highlight spans as sorted flat arrays and convert them to inline decorations in one pass. ProseMirror’s `DecorationSet` being persistent is a nice match for this approach. citeturn4view1turn4view2

Ranking in the MVP should be a weighted sum, not a single score. I would rank offline suggestions by: exact tail match, weighted slant similarity, matched syllable count, stress compatibility, phrase-boundary fit, word frequency, local topical fit, and repetition penalty. Datamuse and RhymeZone are worth studying here, not because you should depend on them, but because they show two useful ranking ideas: popularity/frequency is valuable for tie-breaking, and phrase support matters for writers. Datamuse exposes pronunciation, syllable count, and word frequency metadata; RhymeZone’s advanced interface filters by rhyme quality, popularity, and meter. citeturn13view0turn13view1turn21view2

## UX patterns that help without creating visual noise

The biggest UX trap is trying to show all rhyme structure at once. RapViz is instructive here: linked text and timeline views can reveal rich structure, but even that system distinguishes between default settings for lay users and expert-adjusted settings for deeper analysis. For a mobile writing app, that strongly suggests progressive disclosure rather than maximal coloring. citeturn24view0turn24view3

The default mode should be **focused highlighting**. Only strongly detected families get color by default, and only in the current section. The active family around the cursor gets full saturation; other families fade. Internal rhymes should highlight more softly than end rhymes unless the user explicitly turns up “dense mode.” This preserves legibility while still giving the dopamine hit of seeing structure emerge. That approach also aligns with the direct-manipulation latency target: if color feedback lands in roughly the sub-100 ms range, it feels like the page is responding to the writer’s thought, not analyzing it afterward. citeturn18search0turn18search2

The suggestion bar should feel **native and intentional**, not like autocomplete spam. Show only a few high-confidence suggestions by default. Each suggestion should carry tiny explanation chips such as “perfect,” “near,” “3-syllable,” “phrase,” or “same family as line 2.” That kind of local explanation is good for trust, especially because research on intelligent systems consistently ties transparency, predictability, and perceived control to trust formation. citeturn20view1

Just as important, let the writer influence the engine with very small controls. The best pattern is not a settings screen; it is lightweight in-context control. A single tap could cycle **Strict → Balanced → Loose** slant sensitivity for the active search. A long press on a highlight could let the writer say “treat these as a family” or “never group these again.” That is not just nice UX. It directly addresses algorithm aversion: Dietvorst, Simmons, and Massey found that people are more willing to use imperfect algorithms when they can modify them even slightly, and that small control improves satisfaction and later willingness to reuse the algorithm. citeturn20view0

The interactions that would make LyricsLab feel magical are the ones that reveal structure exactly where the writer is already looking. The best candidates are: a cursor-bound rhyme halo that softly lights matching syllables elsewhere in the verse; ghost end-word suggestions showing the likely next rhyme family before the writer finishes the line; phrase-rhyme extraction from any selected span, including mid-word or multiword selection; section-scoped coloring so choruses and verses can be analyzed independently; and a temporary “rhyme x-ray” mode that appears while the writer holds a finger down, then disappears when they let go. Those patterns build on what Lyrcs and RapViz public materials suggest users value, but they keep the insight ephemeral unless the user asks for more. citeturn21view0turn24view3

## Test corpus and evaluation plan

The corpus should be intentionally mixed, because each genre and context breaks different assumptions. Addanki and Wu explicitly note that hip-hop lyrics are unusually noisy and unstructured, with slang, variable meter, and weak support from off-the-shelf phonological tools. That means a poetry-only gold set will give you a fake sense of success. citeturn23view0

I would build the evaluation corpus in five slices. The first slice is **public-domain poetry** for clean end-rhyme and scheme tasks. The second is **hand-annotated rap and spoken-word excerpts** with dense internal and multisyllabic rhyme. The third is **songwriter-style lyric snippets** with near-rhyme and phrase-rhyme cases. The fourth is an **OOV and slang set** containing names, slang spellings, contractions, and stylized typography. The fifth is a **synthetic perturbation set** where you deliberately generate near misses: same spelling but different stress, same vowels but different codas, phrase-boundary crossings, repeated-identical words, and accent-sensitive variants. The point is to measure not only rhyme detection, but failure behavior. citeturn23view0turn16view0turn14view0

Evaluation should have four layers. **Accuracy** should include pair classification, span detection, family clustering, and scheme labeling. **Usefulness** should include suggestion acceptance rate, mean reciprocal rank for accepted suggestions, time-to-finished-line, and self-reported usefulness by task type. **Latency** should instrument p50, p95, and worst-case times for highlight update and suggestion refresh on representative devices. **Trust** should measure override rate, dismissal rate, disable rate, and “I understand why this showed up” scores after use. If a suggestion engine is ignored or constantly overridden, its raw phonetic accuracy does not matter. citeturn20view0turn20view1

For latency goals, I would set a hard product target of **under 50 ms median** and **under 100 ms p95** for highlight updates after local edits, because NNGroup’s classic thresholds still make sense here: around 0.1 seconds feels instantaneous, while around 1 second breaks the user’s flow of thought. Suggestions can tolerate slightly more if the highlight lands first, but not much more; anything that feels laggy in a writing tool will be blamed on the tool, not on the device. citeturn18search0turn18search2

One subtle but important test is **writer trust under disagreement**. Create tasks where the engine’s top suggestion is phonologically strong but semantically awkward, and see whether explanation plus small control improves adoption. This is where your “reasons” chips and sensitivity toggle earn their keep. A technically correct rhyme that feels wrong will otherwise train users to distrust the whole system. citeturn20view0turn20view1

## Post-MVP roadmap

After the MVP, the highest-leverage upgrade is a **user-teachable slant model**. Lyrcs already documents a valuable idea here: near rhymes should be editable by the writer. LyricsLab should go further and make those edits first-class training signals for that writer, that song, and optionally that genre profile. Over time, the engine should learn that one writer likes `time/mine` looseness while another only wants tighter codas. citeturn21view0turn14view0

The next upgrade is a stronger **scheme-and-structure model**. Start with line endings and obvious internal anchors, then add section-local templates such as couplets, alternate A/B patterns, chained internal ladders, and deliberate scheme pivots. The HMM and EM literature says these pattern models can work without heavy supervision; in product terms, that means LyricsLab can eventually suggest not just “what rhymes,” but “what kind of structural move usually comes next here.” citeturn9view2turn23view0

Then add **analysis views after idle**. RapViz shows the value of linked text and timeline perspectives, but that depth belongs in a second layer, not on every keystroke. After the writer pauses, LyricsLab could offer a temporary mini-map of rhyme density, internal-chain hotspots, repeated-tail warnings, and family transitions across the verse. That would make revision much smarter without crowding the drafting state. citeturn24view0turn24view3

Finally, the ambitious path is **hybrid phonology plus lightweight learning**. A distilled on-device similarity model can become a reranker for noisy spellings, accent variants, and slang that deterministic rules underserve. The key is to keep the symbolic phonological spine in place for trust and explainability, then let learning improve edge cases rather than replace the whole engine. That hybrid direction is increasingly supported by recent rhyme work, including symbolic verification layers that correct weaker generative predictions instead of surrendering control to them. citeturn9view3turn16view0

The bottom line is simple. Build LyricsLab’s first version around a **deterministic, syllable-aware offline engine** with **continuous slant scoring**, **phrase-capable matching**, **section-local scheme prediction**, and **writer-facing micro-controls**. That combination is realistic on mobile, aligned with your current native/WebView split, and strong enough to clear the line from “Rhymer’s Block but modern” to “the first mobile lyric editor that actually understands what the writer is trying to build.” citeturn7view0turn12view2turn4view2turn20view0