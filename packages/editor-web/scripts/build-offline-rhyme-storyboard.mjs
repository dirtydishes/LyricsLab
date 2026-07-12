#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { preloadPatchDiff } from '@pierre/diffs/ssr';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
const docsRoot = path.join(
  repoRoot,
  'docs/implementation/offline-rhyme-suggestions',
);

const DEFAULT_DATE_STAMP = '07-11-2026';
const EXPECTED_DIFF_COUNT = 6;

const options = parseArgs(process.argv.slice(2));
const outputPath = path.join(
  docsRoot,
  `storyboard-post-run-${options.dateStamp}.html`,
);

const phaseLedger = [
  {
    phase: '00',
    title: 'Tracker and loop bootstrap',
    issue: 'lyricslab-8um.3',
    pr: 'none',
    status: 'closed',
    summary:
      'Beads, phase docs, prompts, schemas, callback placeholders, and turn docs became durable before app code moved.',
    repair:
      'Three generated Codex worktree launches detached HEAD; the loop switched to a verified local attached phase branch.',
    gates:
      'Beads ready/show/export checks, schema parsing, expected-file scans, callback/path scans, and git diff checks passed.',
  },
  {
    phase: '01',
    title: 'Product scope lock',
    issue: 'lyricslab-8um.5',
    pr: '#16',
    status: 'merged',
    summary:
      'The MVP narrowed to deterministic offline CMU-backed native suggestions, with highlighting, sync, AI, audio, IAP, and richer rhyme surfaces deferred.',
    repair:
      'Dependency bootstrap repaired initial test/typecheck failures; review repaired missing turn-doc evidence.',
    gates: 'npm test, npm run typecheck, and git diff --check passed.',
  },
  {
    phase: '02',
    title: 'Editor baseline and suggestion contract',
    issue: 'lyricslab-xoc',
    pr: '#17',
    status: 'merged',
    summary:
      'Suggestion context, insertion behavior, bridge parsing, and generated editor HTML freshness were locked before rhyme replacement.',
    repair:
      'Overreach was removed: no CMU parsing, bridge widening, highlight spans, decoration protocol, or SuggestionBar redesign.',
    gates:
      'npm test, typecheck, editor:test, check:editor-html, git diff --check, and merge-tree passed; hosted checks were absent.',
  },
  {
    phase: '03',
    title: 'Pure rhyme core with fixtures',
    issue: 'lyricslab-8um.1',
    pr: '#18',
    status: 'merged',
    summary:
      'src/rhyme became a pure synchronous TypeScript module for CMU parsing, normalization, exact tails, alternates, candidates, and deterministic exact ranking.',
    repair:
      'Review removed dead standalone types/ranking layers and collapsed duplicate adapter logic back into the candidate path.',
    gates:
      'npm test passed 10 suites and 74 tests; typecheck, diff check, and dependency/logging scans passed.',
  },
  {
    phase: '04',
    title: 'CMU artifact pipeline',
    issue: 'lyricslab-8um.4',
    pr: '#19',
    status: 'merged',
    summary:
      'data/cmudict.txt moved to build/check-time parsing with a deterministic compact runtime artifact and lazy bundled index seam.',
    repair:
      'Review tightened the full-dictionary smoke gate so all representative default anchors must hit unless a sparse override is intentional.',
    gates:
      'Artifact build/check/smoke, npm test, typecheck, script syntax, and diff check passed; the compact artifact was 9,596,136 bytes.',
  },
  {
    phase: '05',
    title: 'Native suggestion integration',
    issue: 'lyricslab-gg4',
    pr: '#20',
    status: 'merged',
    summary:
      'The native suggestion provider began returning offline CMU-backed rhyme suggestions while keeping SuggestionBar and insertSuggestion({ word }) unchanged.',
    repair:
      'Review removed a pre-filter candidate cap and added regressions for active-prefix and normalized exclusion behavior.',
    gates:
      'Focused suggestion tests, npm test, typecheck, editor:test, artifact smoke, diff check, and merge-tree passed.',
  },
  {
    phase: '06',
    title: 'Slant ranking and performance guard',
    issue: 'lyricslab-8um.2',
    pr: '#21',
    status: 'merged',
    summary:
      'findRhymeCandidates added deterministic mixed exact/slant ranking with bounded cache-backed lookup and non-default performance evidence.',
    repair:
      'Review split ranking into rhymeRanking.ts, fixed repetition-before-slice ordering, and repaired late-bucket slant discovery.',
    gates:
      'npm test passed 12 suites and 104 tests; typecheck, editor:test, artifact smoke, perf:rhyme-ranking, syntax, and diff check passed.',
  },
  {
    phase: '07',
    title: 'Device evidence and closeout',
    issue: 'lyricslab-bhs',
    pr: 'phase PR',
    status: 'pr-ready',
    summary:
      'Final gates, physical-device availability, follow-up inventory, and this storyboard are packaged for review and orchestrator-owned Beads closeout.',
    repair:
      'No product repair is claimed here. The key limitation is evidence: this Debian host has no physical-device session.',
    gates:
      'Automated gates are rerun in Phase 07; physical-device validation remains unavailable until a real-device run is recorded.',
  },
];

const diffSpecs = [
  {
    phase: '01',
    title: 'MVP scope lock',
    commit: '8730a48',
    paths: [
      'requirements.md',
    ],
  },
  {
    phase: '02',
    title: 'Editor suggestion contract',
    commit: '1da764f',
    paths: [
      'src/editor/suggestions.ts',
    ],
  },
  {
    phase: '03',
    title: 'Pure rhyme core',
    commit: '774b55c',
    paths: [
      'src/rhyme/rhymeIndex.ts',
    ],
  },
  {
    phase: '04',
    title: 'CMU artifact pipeline',
    commit: '112c0d3',
    paths: [
      'src/rhyme/artifact.ts',
    ],
  },
  {
    phase: '05',
    title: 'Native rhyme suggestions',
    commit: '3fb7982',
    paths: [
      'src/editor/suggestions.ts',
    ],
  },
  {
    phase: '06',
    title: 'Ranking review repair',
    commit: 'fafbe7b',
    paths: [
      'src/rhyme/rhymeRanking.ts',
    ],
  },
];

const followUps = [
  'highlighting',
  'phrase rhymes',
  'audio',
  'IAP',
  'sync',
  'AI collaborator room',
  'neural reranking',
  'user-teachable slant preferences',
];

const gateRows = [
  ['npm test', 'final automated gate'],
  ['npm run typecheck', 'TypeScript surface gate'],
  ['npm run editor:test', 'editor-web unit gate'],
  ['npm run build:editor-html', 'generated editor HTML repair/build gate'],
  ['npm run check:editor-html', 'freshness gate after build'],
  ['npx expo config --type public', 'Expo public config sanity check'],
  ['npm run check:rhyme-artifact', 'CMU artifact freshness gate'],
  ['npm run smoke:rhyme-artifact -- --compact', 'full artifact lookup smoke'],
  ['npm run perf:rhyme-ranking -- --compact', 'non-default ranking performance guard'],
  ['git diff --check', 'whitespace and patch sanity gate'],
];

await main();

async function main() {
  await validateCommits();
  const diffCards = await Promise.all(diffSpecs.map(renderDiffCard));
  const html = buildHtml(diffCards.join('\n'));
  validateHtml(html);

  if (options.check) {
    const current = await readFile(outputPath, 'utf8');
    if (current !== html) {
      throw new Error(
        `${path.relative(repoRoot, outputPath)} is stale. Run this script without --check.`,
      );
    }

    console.log(`Storyboard is fresh: ${path.relative(repoRoot, outputPath)}`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
}

async function validateCommits() {
  await Promise.all(
    diffSpecs.map((spec) =>
      execGit(['cat-file', '-e', `${spec.commit}^{commit}`]),
    ),
  );
}

async function renderDiffCard(spec) {
  const patch = await gitPatch(spec);
  validatePatch(spec, patch);

  const { prerenderedHTML } = await preloadPatchDiff({
    patch,
    options: {
      diffStyle: 'unified',
      overflow: 'scroll',
      lineDiffType: 'word',
    },
  });

  if (!prerenderedHTML.includes('data-diff')) {
    throw new Error(`SSR output for Phase ${spec.phase} did not include data-diff.`);
  }

  return `<article class="diff-card" aria-labelledby="diff-${spec.phase}-title">
  <header class="diff-card-header">
    <span class="phase-pill">Phase ${spec.phase}</span>
    <h3 id="diff-${spec.phase}-title">${escapeHtml(spec.title)}</h3>
  </header>
  <p>${escapeHtml(diffSummary(spec.phase))}</p>
  <div class="diff-scroll" tabindex="0" aria-label="SSR rendered diff for Phase ${spec.phase}">
    <div class="diff-rendered" data-renderer="@pierre/diffs/ssr">${prerenderedHTML}</div>
  </div>
</article>`;
}

async function gitPatch({ commit, paths }) {
  const { stdout } = await execGit([
    'show',
    '--format=',
    '--unified=3',
    commit,
    '--',
    ...paths,
  ]);

  return stdout;
}

async function execGit(args) {
  const result = await execFileAsync('git', args, {
    cwd: repoRoot,
    maxBuffer: 12 * 1024 * 1024,
  });

  return result;
}

function validatePatch(spec, patch) {
  if (!patch.includes('diff --git')) {
    throw new Error(`No git patch was produced for Phase ${spec.phase}.`);
  }

  if (patch.length > 1_800_000) {
    throw new Error(`Patch for Phase ${spec.phase} is too large for storyboard rendering.`);
  }

  const forbiddenDiffHeaders = [
    'diff --git a/src/rhyme/generated/cmuRhymeArtifact.json',
    'diff --git a/data/cmudict.txt',
  ];

  for (const header of forbiddenDiffHeaders) {
    if (patch.includes(header)) {
      throw new Error(`Patch for Phase ${spec.phase} includes forbidden large artifact diff ${header}.`);
    }
  }
}

function buildHtml(diffCards) {
  const phaseArticles = phaseLedger.map(phaseArticle).join('\n');
  const followUpItems = followUps
    .map(
      (item) =>
        `<li><span class="status-chip status-chip--follow-up">missing follow-up</span>${escapeHtml(item)}</li>`,
    )
    .join('\n');
  const gateTable = gateRows
    .map(
      ([command, purpose]) =>
        `<tr><td><code>${escapeHtml(command)}</code></td><td>${escapeHtml(purpose)}</td><td><span class="status-chip status-chip--pending">recorded in Phase 07 turn doc after local run</span></td></tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline Rhyme Suggestions MVP - Post-Run Storyboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #171922;
      --muted: #4b5568;
      --subtle: #70798c;
      --surface: #ffffff;
      --canvas: #f6f4ef;
      --canvas-cool: #eef3f6;
      --line: #d7dce4;
      --accent: #b72f5d;
      --accent-strong: #8f2248;
      --teal: #116f6f;
      --green-bg: #dff4e7;
      --green-ink: #124d2d;
      --blue-bg: #dceeff;
      --blue-ink: #16466f;
      --warn-bg: #f6e3a1;
      --warn-ink: #563b00;
      --follow-bg: #f2e5ff;
      --follow-ink: #523069;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    html {
      background: var(--canvas);
      color: var(--ink);
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-size: 16px;
      line-height: 1.56;
      letter-spacing: 0;
    }

    a {
      color: var(--accent-strong);
      text-decoration-thickness: 0.08em;
      text-underline-offset: 0.18em;
    }

    code {
      font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      font-size: 0.94em;
    }

    main {
      inline-size: min(1180px, calc(100% - 32px));
      margin-inline: auto;
      padding-block: 32px 64px;
    }

    .hero {
      display: grid;
      gap: 20px;
      padding-block: 14px 28px;
    }

    .hero h1 {
      max-inline-size: 820px;
      margin: 0;
      font-size: clamp(2.15rem, 5vw, 4.25rem);
      line-height: 0.98;
      letter-spacing: 0;
      text-wrap: balance;
    }

    .hero p {
      max-inline-size: 76ch;
      margin: 0;
      color: var(--muted);
      font-size: 1.05rem;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
      margin-block-start: 8px;
    }

    .metric,
    .phase-card,
    .evidence-panel,
    .diff-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .metric {
      padding: 14px;
    }

    .metric strong {
      display: block;
      font-size: 1.45rem;
      line-height: 1.1;
    }

    .metric span {
      color: var(--muted);
      font-size: 0.92rem;
    }

    section {
      margin-block-start: 42px;
    }

    section > h2 {
      margin: 0 0 14px;
      font-size: 1.55rem;
      line-height: 1.2;
      text-wrap: balance;
    }

    .phase-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }

    .phase-card {
      min-width: 0;
      padding: 16px;
    }

    .phase-card header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-block-end: 12px;
    }

    .phase-card h3,
    .diff-card h3 {
      margin: 0;
      font-size: 1.08rem;
      line-height: 1.25;
      text-wrap: balance;
    }

    .phase-card p,
    .diff-card p {
      margin: 10px 0 0;
      color: var(--muted);
    }

    .phase-pill,
    .status-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 0.78rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .phase-pill {
      background: #ece8df;
      color: #3f3a32;
    }

    .status-chip--passed {
      background: var(--green-bg);
      color: var(--green-ink);
    }

    .status-chip--unavailable,
    .status-chip--pending {
      background: var(--warn-bg);
      color: var(--warn-ink);
    }

    .status-chip--follow-up {
      background: var(--follow-bg);
      color: var(--follow-ink);
      margin-inline-end: 8px;
    }

    .status-chip--info {
      background: var(--blue-bg);
      color: var(--blue-ink);
    }

    .architecture {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
      padding: 16px;
      background: var(--canvas-cool);
      border: 1px solid #c9d6dd;
      border-radius: 8px;
    }

    .architecture div {
      padding: 12px;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid #dbe4ea;
      border-radius: 8px;
    }

    .architecture strong {
      display: block;
      margin-block-end: 5px;
    }

    .evidence-panel {
      padding: 16px;
    }

    .table-scroll {
      max-inline-size: 100%;
      overflow-x: auto;
    }

    table {
      inline-size: 100%;
      min-inline-size: 720px;
      border-collapse: collapse;
    }

    caption {
      color: var(--muted);
      text-align: left;
      margin-block-end: 10px;
    }

    th,
    td {
      border-block-end: 1px solid var(--line);
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      color: #2f3748;
      font-size: 0.9rem;
    }

    .follow-up-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 10px;
      padding: 0;
      list-style: none;
    }

    .follow-up-list li {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
    }

    .diff-grid {
      display: grid;
      gap: 16px;
    }

    .diff-card {
      min-width: 0;
      overflow: hidden;
    }

    .diff-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 14px 0;
    }

    .diff-card p {
      padding-inline: 14px;
    }

    .diff-scroll {
      max-inline-size: 100%;
      max-block-size: min(72vh, 48rem);
      overflow: auto;
      margin-block-start: 12px;
      border-block-start: 1px solid var(--line);
      background: #fff;
    }

    .diff-rendered {
      min-inline-size: 780px;
    }

    .note {
      padding: 14px;
      background: #fff7dd;
      border: 1px solid #e9cf77;
      border-radius: 8px;
      color: #4d3700;
    }

    @media (max-width: 700px) {
      main {
        inline-size: min(100% - 20px, 1180px);
        padding-block-start: 22px;
      }

      .hero h1 {
        font-size: 2.15rem;
      }

      .phase-card header,
      .diff-card-header {
        align-items: flex-start;
        flex-direction: column;
      }

      table {
        min-inline-size: 620px;
      }

      .diff-rendered {
        min-inline-size: 700px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <p><span class="status-chip status-chip--info">orchestrator-callback closeout</span></p>
      <h1>Offline Rhyme Suggestions MVP Post-Run Storyboard</h1>
      <p>
        This closeout tracks the path from placeholder native suggestions to deterministic offline CMU-backed rhyme suggestions. It records implementation, repairs, review evidence, final limits, and follow-up work without declaring the Expo rebuild primary before physical-device validation.
      </p>
      <div class="meta-grid" aria-label="Closeout metrics">
        <div class="metric"><strong>8 phases</strong><span>Phase 00 through Phase 07 in Beads epic lyricslab-8um.</span></div>
        <div class="metric"><strong>6 PRs</strong><span>PR #16 through PR #21 merged before final closeout packaging.</span></div>
        <div class="metric"><strong>8/8/8</strong><span>Scout, slice-plan, and implementation-helper swarms used for Phase 07.</span></div>
        <div class="metric"><strong>device limited</strong><span>No physical-device session is available on this Debian host.</span></div>
      </div>
    </header>

    <section aria-labelledby="phase-ledger-title">
      <h2 id="phase-ledger-title">Phase Ledger</h2>
      <div class="phase-grid">
        ${phaseArticles}
      </div>
    </section>

    <section aria-labelledby="architecture-title">
      <h2 id="architecture-title">Final Shape</h2>
      <div class="architecture">
        <div><strong>Native editor shell</strong><span>Owns songs, title input, persistence orchestration, and the horizontal suggestion bar.</span></div>
        <div><strong>WebView editor</strong><span>Owns body editing, cursor context, and insertion commands. No highlight protocol was added in this loop.</span></div>
        <div><strong>Provider seam</strong><span>Chooses anchors, applies exclusions, maps candidates to stable WordSuggestion payloads, and preserves fallback behavior.</span></div>
        <div><strong>Rhyme core</strong><span>Pure TypeScript CMU parsing, exact tails, artifact hydration, bounded slant ranking, and opt-in performance evidence.</span></div>
      </div>
    </section>

    <section aria-labelledby="evidence-title">
      <h2 id="evidence-title">Evidence Matrix</h2>
      <div class="evidence-panel">
        <div class="table-scroll">
          <table>
            <caption>Phase 07 final gates are recorded in the turn doc after this storyboard generation.</caption>
            <thead>
              <tr>
                <th scope="col">Command</th>
                <th scope="col">Purpose</th>
                <th scope="col">Closeout state</th>
              </tr>
            </thead>
            <tbody>
              ${gateTable}
            </tbody>
          </table>
        </div>
      </div>
      <p class="note">
        Physical-device validation is not replaced by these automated gates. The required manual checklist still includes launch through Expo dev-client, create/edit song, cursor movement, repeated suggestion insertion, persistence, body search, keyboard bar position, and offline/airplane-mode writing behavior.
      </p>
    </section>

    <section aria-labelledby="follow-up-title">
      <h2 id="follow-up-title">Follow-Up Inventory</h2>
      <p>The read-only Beads inventory found no distinct follow-up issue titles for the required post-MVP topics. This worker reports them for orchestrator-owned creation instead of mutating Beads.</p>
      <ul class="follow-up-list">
        ${followUpItems}
      </ul>
    </section>

    <section aria-labelledby="diffs-title">
      <h2 id="diffs-title">Representative SSR Diffs</h2>
      <p>Every diff below is rendered through <code>@pierre/diffs/ssr</code> from the existing editor-web package dependency. Large generated data artifacts are intentionally excluded from the diff gallery.</p>
      <div class="diff-grid">
        ${diffCards}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function phaseArticle(phase) {
  return `<article class="phase-card" aria-labelledby="phase-${phase.phase}-title">
  <header>
    <div>
      <span class="phase-pill">Phase ${phase.phase}</span>
      <h3 id="phase-${phase.phase}-title">${escapeHtml(phase.title)}</h3>
    </div>
    <span class="status-chip ${statusClass(phase.status)}">${escapeHtml(phase.status)}</span>
  </header>
  <p><strong>Issue:</strong> <code>${escapeHtml(phase.issue)}</code> · <strong>PR:</strong> ${escapeHtml(phase.pr)}</p>
  <p>${escapeHtml(phase.summary)}</p>
  <p><strong>Repair / limit:</strong> ${escapeHtml(phase.repair)}</p>
  <p><strong>Evidence:</strong> ${escapeHtml(phase.gates)}</p>
</article>`;
}

function statusClass(status) {
  if (status === 'closed' || status === 'merged') {
    return 'status-chip--passed';
  }

  if (status === 'pr-ready') {
    return 'status-chip--pending';
  }

  return 'status-chip--info';
}

function diffSummary(phase) {
  const summaries = {
    '01': 'The docs commit locks the loop to a native offline rhyme MVP and makes post-MVP scope explicit.',
    '02': 'The editor contract diff shows suggestion filtering, context extraction, and generated HTML freshness work.',
    '03': 'The core diff shows the first pure rhyme module boundary before full CMU artifact loading.',
    '04': 'The artifact diff shows deterministic build/check/runtime seams without rendering the huge generated JSON artifact.',
    '05': 'The provider diff shows rhyme-backed suggestions entering the existing native seam without bridge widening.',
    '06': 'The review repair diff shows the bounded slant ranking module and performance guard tightening.',
  };

  return summaries[phase] ?? 'Representative implementation diff.';
}

function validateHtml(html) {
  const renderedCount = countMatches(html, 'data-renderer="@pierre/diffs/ssr"');
  if (renderedCount !== EXPECTED_DIFF_COUNT) {
    throw new Error(`Expected ${EXPECTED_DIFF_COUNT} SSR diff blocks, found ${renderedCount}.`);
  }

  if (countMatches(html, 'data-diff') < EXPECTED_DIFF_COUNT) {
    throw new Error('SSR diff output is missing expected data-diff markers.');
  }

  for (const marker of ['TODO', 'SSR_RENDER_ERROR', 'Cannot find module']) {
    if (html.includes(marker)) {
      throw new Error(`Storyboard contains invalid marker: ${marker}`);
    }
  }

  for (const phase of phaseLedger) {
    if (!html.includes(`phase-${phase.phase}-title`)) {
      throw new Error(`Storyboard is missing Phase ${phase.phase}.`);
    }
  }
}

function countMatches(value, pattern) {
  return value.split(pattern).length - 1;
}

function parseArgs(args) {
  const parsed = {
    check: false,
    dateStamp: DEFAULT_DATE_STAMP,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--check') {
      parsed.check = true;
      continue;
    }

    if (arg === '--date') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--date requires a value like 07-11-2026.');
      }

      parsed.dateStamp = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!/^\d{2}-\d{2}-\d{4}$/.test(parsed.dateStamp)) {
    throw new Error(`Invalid date stamp: ${parsed.dateStamp}`);
  }

  return parsed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
