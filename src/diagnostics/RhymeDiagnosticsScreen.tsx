import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import benchmarkCorpus from '../../benchmarks/rhyme-benchmark-corpus-v1.json';
import writerPacket from '../../evaluation/rhyme-writer-review/packet-v1.json';

import { SuggestionBar } from '../editor/SuggestionBar';
import type { SuggestionContext } from '../editor/bridge';
import { diagnosticsRuntime } from './diagnosticsRuntime';
import { useProductionRhyme } from '../platform/ProductionRhymeProvider';
import {
  PRODUCTION_RHYME_ARTIFACT_SHA256,
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../rhymeData/productionArtifact';
import { useAppTheme } from '../settings/SettingsProvider';
import type { ThemePreference } from '../theme/theme';

const WARMUP_ROUNDS = 1;
const SAMPLE_ROUNDS = 3;
const WARMUP_FRAMES = benchmarkCorpus.cases.length * WARMUP_ROUNDS;
const SAMPLE_FRAMES = benchmarkCorpus.cases.length * SAMPLE_ROUNDS;
const TOTAL_BENCHMARK_FRAMES = WARMUP_FRAMES + SAMPLE_FRAMES;

type Sample = { caseId: string; durationMs: number };

export default function RhymeDiagnosticsScreen() {
  const { setPreference, tokens } = useAppTheme();
  const { getSuggestionView, retry, snapshot } = useProductionRhyme();
  const mountedAt = useRef(performance.now());
  const coldLoadMs = useRef<number | null>(null);
  const frameStartedAt = useRef(0);
  const measuredSamples = useRef<Sample[]>([]);
  const [frameIndex, setFrameIndex] = useState<number | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [writerIndex, setWriterIndex] = useState(0);

  useEffect(() => {
    if (snapshot.state === 'ready' && coldLoadMs.current === null) {
      coldLoadMs.current = round(performance.now() - mountedAt.current);
    }
  }, [snapshot.state]);

  const benchmarkCase = benchmarkCorpus.cases[(frameIndex ?? 0) % benchmarkCorpus.cases.length]!;
  const writerCase = writerPacket.cases[writerIndex]!;
  const prompt = frameIndex === null ? writerCase.prompt : benchmarkCase;
  const context: SuggestionContext = {
    currentLineText: 'line' in prompt ? prompt.line : `signal ${prompt.anchor} ${prompt.prefix}`,
    previousToken: prompt.anchor,
    selectionEmpty: prompt.selectionEmpty,
    wordBeforeCursor: prompt.prefix,
  };
  const baseView = useMemo(
    () => getSuggestionView(context, context.currentLineText),
    [context.currentLineText, context.previousToken, context.selectionEmpty, context.wordBeforeCursor, getSuggestionView],
  );
  const view = useMemo(() => {
    if (frameIndex !== null || writerCase.category !== 'repetition' || baseView.kind !== 'results') return baseView;
    const repeatedSyntheticText = `${context.currentLineText} ${baseView.suggestions[0]?.word ?? ''}`;
    return getSuggestionView(context, repeatedSyntheticText);
  }, [baseView, context, frameIndex, getSuggestionView, writerCase.category]);

  useEffect(() => {
    if (frameIndex !== null) return;
    const state = writerCase.prompt.state === 'loading'
      ? 'loading'
      : writerCase.prompt.state === 'error' || writerCase.prompt.state === 'retry'
        ? 'error'
        : null;
    diagnosticsRuntime.setSyntheticState(state);
    void setPreference(toThemePreference(writerCase.prompt.theme));
  }, [frameIndex, setPreference, writerCase.prompt.state, writerCase.prompt.theme]);

  const frameCommitted = useCallback((committedFrame: number) => {
    const durationMs = round(performance.now() - frameStartedAt.current);
    if (committedFrame >= WARMUP_FRAMES) {
      measuredSamples.current.push({
        caseId: benchmarkCorpus.cases[committedFrame % benchmarkCorpus.cases.length]!.id,
        durationMs,
      });
    }
    if (committedFrame + 1 === TOTAL_BENCHMARK_FRAMES) {
      setReport(JSON.stringify(createReport(measuredSamples.current, coldLoadMs.current)));
      setFrameIndex(null);
      return;
    }
    frameStartedAt.current = performance.now();
    setFrameIndex(committedFrame + 1);
  }, []);

  const startBenchmark = useCallback(async () => {
    diagnosticsRuntime.setSyntheticState(null);
    await setPreference('system');
    measuredSamples.current = [];
    setReport(null);
    frameStartedAt.current = performance.now();
    setFrameIndex(0);
  }, [setPreference]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>Rhyme diagnostics</Text>
        <Text style={[styles.notice, { color: tokens.textSecondary }]}>Synthetic cases only. Reports contain case IDs and timings, never lyric text or returned suggestion words.</Text>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Status label="Engine" value={snapshot.state} />
          <Status label="Runtime version" value={snapshot.version} />
          <Status label="Artifact version" value={PRODUCTION_RHYME_ARTIFACT_VERSION} />
          <Status label="Manifest SHA-256" value={PRODUCTION_RHYME_MANIFEST_SHA256} />
          <Status label="Last-known-good" value={snapshot.usingLastKnownGood ? 'active' : 'not used'} />
          <Status label="Error" value={snapshot.errorMessage ?? 'none'} />
          <Pressable accessibilityRole="button" onPress={() => { void retry(); }} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Retry engine load</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => diagnosticsRuntime.setSyntheticState('error')} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Inject diagnostics-only load failure</Text></Pressable>
        </View>
        <Text style={[styles.heading, { color: tokens.text }]}>Production suggestion rendering</Text>
        <SuggestionBar onRetry={() => { void retry(); }} onSelectSuggestion={() => {}} view={view} />
        {frameIndex === null ? null : <CommittedFrameProbe frame={frameIndex} onCommit={frameCommitted} />}
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Status label="Writer case" value={`${writerCase.id} · ${writerCase.category} · ${writerIndex + 1}/60`} />
          <Pressable accessibilityRole="button" onPress={() => setWriterIndex((writerIndex + 1) % writerPacket.cases.length)} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Next sealed writer case</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={frameIndex !== null || snapshot.state !== 'ready'} onPress={() => { void startBenchmark(); }} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>{frameIndex === null ? 'Run 60-sample device benchmark' : 'Benchmark running…'}</Text></Pressable>
          {report ? <><Text selectable style={{ color: tokens.text }}>{report}</Text><Pressable accessibilityRole="button" onPress={() => { void Share.share({ message: report }); }} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Share benchmark JSON</Text></Pressable></> : null}
          <Status label="Quick benchmark" value="npm run benchmark:rhyme" />
          <Status label="Device benchmark" value="npm run benchmark:rhyme:ios -- --device UDID --app RELEASE.app --report REPORT --evidence FILE" />
          <Status label="Writer packet" value="npm run writer-review:rhyme -- --validate" />
          <Status label="Device evidence" value="npm run evidence:rhyme:ios -- --validate FILE" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CommittedFrameProbe({ frame, onCommit }: { frame: number; onCommit: (frame: number) => void }) {
  useLayoutEffect(() => onCommit(frame), [frame, onCommit]);
  return null;
}

function createReport(samples: readonly Sample[], coldDurationMs: number | null) {
  const ordered = samples.map(({ durationMs }) => durationMs).sort((a, b) => a - b);
  const thresholds = { p50MsExclusive: 50, p95MsExclusive: 100 };
  const latency = { p50Ms: percentile(ordered, 0.5), p95Ms: percentile(ordered, 0.95), maxMs: ordered.at(-1) ?? 0 };
  return {
    schemaVersion: 'lyricslab.rhyme-ios-benchmark/v1',
    measurement: { interval: 'selection-context-received-to-first-react-committed-suggestion-frame', commitSignal: 'useLayoutEffect', qualifiesAsPhysicalDeviceEvidence: true },
    build: { profile: 'release-diagnostics', release: !__DEV__, diagnosticsEnabled: true, bundleIdentifier: 'com.dirtydishes.lyricslab-mobile.diagnostics', appVersion: '1.0.0', gitCommit: String(Constants.expoConfig?.extra?.buildGitCommit ?? 'missing') },
    device: { platform: Platform.OS, osVersion: String(Platform.Version), identity: 'bound-by-selected-device-cli' },
    artifact: { version: PRODUCTION_RHYME_ARTIFACT_VERSION, artifactSha256: PRODUCTION_RHYME_ARTIFACT_SHA256, manifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256 },
    corpus: { version: benchmarkCorpus.version, schemaVersion: benchmarkCorpus.schemaVersion, seed: benchmarkCorpus.seed, sha256: writerPacket.seal.corpusSha256 },
    warmupRoundsDiscarded: WARMUP_ROUNDS,
    warmupsDiscarded: WARMUP_FRAMES,
    samples: samples.length,
    sampleRecords: samples,
    caseLatency: summarizeCases(samples),
    coldLoad: { durationMs: coldDurationMs, includedInLatency: false, interval: 'diagnostics-mount-to-production-engine-ready' },
    latency,
    thresholds,
    pass: samples.length === SAMPLE_FRAMES && coldDurationMs !== null && latency.p50Ms < thresholds.p50MsExclusive && latency.p95Ms < thresholds.p95MsExclusive,
    environment: { timer: 'performance.now', commitSignal: 'react-useLayoutEffect', localeIndependent: true, theme: 'system' },
  };
}

function summarizeCases(samples: readonly Sample[]) {
  return benchmarkCorpus.cases.map(({ id }) => {
    const durations = samples.filter(({ caseId }) => caseId === id).map(({ durationMs }) => durationMs).sort((a, b) => a - b);
    return { caseId: id, samples: durations.length, p50Ms: percentile(durations, 0.5), p95Ms: percentile(durations, 0.95), maxMs: durations.at(-1) ?? 0 };
  });
}

function Status({ label, value }: { label: string; value: string }) {
  const { tokens } = useAppTheme();
  return <View style={styles.row}><Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text><Text selectable style={[styles.value, { color: tokens.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 8, justifyContent: 'center', minHeight: 44, padding: 12 },
  card: { borderRadius: 10, borderWidth: 1, gap: 10, padding: 14 },
  content: { gap: 14, padding: 16 }, heading: { fontSize: 16, fontWeight: '800' }, label: { fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 14, lineHeight: 20 }, row: { gap: 2 }, safeArea: { flex: 1 }, title: { fontSize: 24, fontWeight: '900' }, value: { fontSize: 13 },
});

function percentile(values: readonly number[], value: number) { return round(values[Math.min(values.length - 1, Math.ceil(values.length * value) - 1)] ?? 0); }
function round(value: number) { return Number(value.toFixed(3)); }
function toThemePreference(value: string): ThemePreference { return value === 'light' || value === 'dark' ? value : 'system'; }
