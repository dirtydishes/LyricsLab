import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import benchmarkCorpus from '../../benchmarks/rhyme-benchmark-corpus-v1.json';
import writerPacket from '../../evaluation/rhyme-writer-review/packet-v1.json';

import { SuggestionBar } from '../editor/SuggestionBar';
import type { SuggestionContext } from '../editor/bridge';
import { useProductionRhyme } from '../platform/ProductionRhymeProvider';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../rhymeData/productionArtifact';
import { useAppTheme } from '../settings/SettingsProvider';

const TOTAL_BENCHMARK_FRAMES = 65;

export default function RhymeDiagnosticsScreen() {
  const { tokens } = useAppTheme();
  const { getSuggestionView, retry, snapshot } = useProductionRhyme();
  const [frameIndex, setFrameIndex] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [writerIndex, setWriterIndex] = useState(0);
  const benchmarkCase = benchmarkCorpus.cases[(frameIndex ?? 0) % benchmarkCorpus.cases.length]!;
  const writerCase = writerPacket.cases[writerIndex]!;
  const prompt = frameIndex === null ? writerCase.prompt : benchmarkCase;
  const context: SuggestionContext = {
    currentLineText: 'line' in prompt ? prompt.line : `signal ${prompt.anchor} ${prompt.prefix}`,
    previousToken: prompt.anchor,
    selectionEmpty: prompt.selectionEmpty,
    wordBeforeCursor: prompt.prefix,
  };
  const receivedAt = frameIndex === null ? undefined : performance.now();
  const view = useMemo(
    () => getSuggestionView(context, context.currentLineText),
    [context.currentLineText, context.previousToken, context.selectionEmpty, context.wordBeforeCursor, getSuggestionView],
  );
  const frameCommitted = useCallback((durationMs: number) => {
    setFrameIndex((current) => {
      if (current === null) return null;
      const nextSamples = current >= 5 ? [...samples, durationMs] : samples;
      setSamples(nextSamples);
      if (current + 1 >= TOTAL_BENCHMARK_FRAMES) {
        const ordered = [...nextSamples].sort((a, b) => a - b);
        const p50 = percentile(ordered, 0.5);
        const p95 = percentile(ordered, 0.95);
        setReport(JSON.stringify({ schemaVersion: 'lyricslab.rhyme-ios-benchmark/v1', samples: ordered.length, warmupsDiscarded: 5, p50Ms: p50, p95Ms: p95, maxMs: ordered.at(-1), pass: p50 < 50 && p95 < 100 }));
        return null;
      }
      return current + 1;
    });
  }, [samples]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>Rhyme diagnostics</Text>
        <Text style={[styles.notice, { color: tokens.textSecondary }]}>
          Synthetic cases only. This surface has no editor storage or network export.
        </Text>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Status label="Engine" value={snapshot.state} />
          <Status label="Runtime version" value={snapshot.version} />
          <Status label="Artifact version" value={PRODUCTION_RHYME_ARTIFACT_VERSION} />
          <Status label="Manifest SHA-256" value={PRODUCTION_RHYME_MANIFEST_SHA256} />
          <Status label="Last-known-good" value={snapshot.usingLastKnownGood ? 'active' : 'not used'} />
          <Status label="Error" value={snapshot.errorMessage ?? 'none'} />
          <Pressable
            accessibilityRole="button"
            onPress={() => { void retry(); }}
            style={[styles.button, { backgroundColor: tokens.primaryAction }]}
          >
            <Text style={{ color: tokens.primaryActionText }}>Retry engine load</Text>
          </Pressable>
        </View>
        <Text style={[styles.heading, { color: tokens.text }]}>Production suggestion rendering</Text>
        <SuggestionBar measurementReceivedAt={receivedAt} onFirstCommittedFrame={frameCommitted} onRetry={() => { void retry(); }} onSelectSuggestion={() => {}} view={view} />
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Status label="Writer case" value={`${writerCase.id} · ${writerCase.category} · ${writerIndex + 1}/60`} />
          <Pressable accessibilityRole="button" onPress={() => setWriterIndex((writerIndex + 1) % writerPacket.cases.length)} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Next sealed writer case</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={frameIndex !== null} onPress={() => { setSamples([]); setReport(null); setFrameIndex(0); }} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>{frameIndex === null ? 'Run 60-sample device benchmark' : 'Benchmark running…'}</Text></Pressable>
          {report ? <><Text selectable style={{ color: tokens.text }}>{report}</Text><Pressable accessibilityRole="button" onPress={() => { void Share.share({ message: report }); }} style={[styles.button, { backgroundColor: tokens.primaryAction }]}><Text style={{ color: tokens.primaryActionText }}>Share benchmark JSON</Text></Pressable></> : null}
          <Status label="Quick benchmark" value="npm run benchmark:rhyme" />
          <Status label="Device benchmark" value="npm run benchmark:rhyme:ios -- --device DEVICE" />
          <Status label="Writer packet" value="npm run writer-review:rhyme -- --validate" />
          <Status label="Device evidence" value="npm run evidence:rhyme:ios -- --validate FILE" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  const { tokens } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.value, { color: tokens.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 8, justifyContent: 'center', minHeight: 44, padding: 12 },
  card: { borderRadius: 10, borderWidth: 1, gap: 10, padding: 14 },
  content: { gap: 14, padding: 16 },
  heading: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 14, lineHeight: 20 },
  row: { gap: 2 },
  safeArea: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900' },
  value: { fontSize: 13 },
});

function percentile(values: readonly number[], value: number) {
  return Number((values[Math.min(values.length - 1, Math.ceil(values.length * value) - 1)] ?? 0).toFixed(3));
}
