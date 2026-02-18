import SwiftUI
import SwiftData
import Foundation
import UniformTypeIdentifiers

struct EditorView: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var composition: Composition

    @EnvironmentObject private var themeManager: ThemeManager
    @EnvironmentObject private var audioPlayer: AudioPlayer

    @State private var lyricsSelectedRange = NSRange(location: 0, length: 0)
    @State private var isLyricsFocused = false
    @State private var autosaveTask: Task<Void, Never>?

    @State private var rhymeTask: Task<Void, Never>?
    @State private var rhymeAnalysis: RhymeAnalysis = .empty

    @State private var warmUpTask: Task<Void, Never>?
    @State private var rhymeServiceReady = false

    @State private var suggestionsTask: Task<Void, Never>?

    @State private var suggestions: [RhymeSuggestion] = []
    @State private var isShowingAudioImporter = false
    @State private var showingAudioError = false
    @State private var barPosition: BarPosition?
    @State private var isShowingEditorHelp = false
    @State private var editSnapshotAtAppear = EditSnapshot.empty
    @State private var didTouchAfterAppear = false

    var body: some View {
        ZStack {
            themeManager.theme.backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 12) {
                TextField("Title", text: $composition.title)
                    .font(.title2.weight(.semibold))
                    #if os(iOS) || os(tvOS) || os(visionOS)
                    .textInputAutocapitalization(.sentences)
                    .submitLabel(.next)
                    #endif
                    .padding(.horizontal, 16)
                    .padding(.top, 12)

                Divider()
                    .opacity(0.5)

                #if canImport(UIKit)
                EditorTextViewControllerRepresentable(
                    text: $composition.lyrics,
                    selectedRange: $lyricsSelectedRange,
                    isFocused: $isLyricsFocused,
                    endRhymeTailLength: $composition.endRhymeTailLength,
                    highlights: textHighlights,
                    suggestions: suggestions,
                    isLoadingSuggestions: !rhymeServiceReady,
                    miniPlayerTitle: audioPlayer.track?.displayName,
                    miniPlayerIsPlaying: audioPlayer.isPlaying,
                    miniPlayerIsLoading: audioPlayer.isLoading,
                    onMiniPlayerTogglePlayPause: {
                        audioPlayer.togglePlayPause()
                    },
                    onMiniPlayerStop: {
                        audioPlayer.stop()
                    },
                    barPosition: barPosition,
                    onSuggestionAccepted: { word in
                        recordSuggestionAcceptance(word)
                    },
                    endRhymeColor: suggestionEndColor,
                    internalRhymeColor: suggestionInternalColor,
                    preferredColorScheme: themeManager.theme.colorScheme,
                    preferredTextColor: themeManager.theme.textPrimary,
                    preferredTintColor: themeManager.theme.accent
                )
                .ignoresSafeArea(.keyboard, edges: .bottom)
                #else
                LyricsTextView(
                    text: $composition.lyrics,
                    selectedRange: $lyricsSelectedRange,
                    insertion: .constant(nil),
                    isFocused: $isLyricsFocused,
                    highlights: textHighlights,
                    preferredColorScheme: themeManager.theme.colorScheme,
                    preferredTextColor: themeManager.theme.textPrimary,
                    preferredTintColor: themeManager.theme.accent
                ) {
                    EmptyView()
                }

                if let title = audioPlayer.track?.displayName {
                    EditorMiniPlayerBar(
                        title: title,
                        isPlaying: audioPlayer.isPlaying,
                        isLoading: audioPlayer.isLoading,
                        onTogglePlayPause: { audioPlayer.togglePlayPause() },
                        onStop: { audioPlayer.stop() }
                    )
                }

                EditorSuggestionsBar(
                    suggestions: suggestions,
                    isLoading: !rhymeServiceReady,
                    barPosition: barPosition,
                    endRhymeTailLength: composition.endRhymeTailLength,
                    onSetEndRhymeTailLength: { next in
                        let clamped = max(1, min(2, next))
                        if composition.endRhymeTailLength != clamped {
                            composition.endRhymeTailLength = clamped
                            try? modelContext.save()
                        }
                    },
                    endRhymeColor: suggestionEndColor,
                    internalRhymeColor: suggestionInternalColor
                ) { word in
                    insertSuggestionFallback(word)
                    recordSuggestionAcceptance(word)
                }
                #endif
            }
        }
        .navigationTitle(composition.title.isEmpty ? "Untitled" : composition.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    isShowingEditorHelp = true
                } label: {
                    Image(systemName: "questionmark.circle")
                }
                .accessibilityLabel("Help")
                .keyboardShortcut("h", modifiers: [.command, .option])

                Button {
                    isShowingAudioImporter = true
                } label: {
                    Image(systemName: "music.note")
                }
                .accessibilityLabel("Import Audio")
                .keyboardShortcut("o", modifiers: .command)
            }
        }
        .sheet(isPresented: $isShowingEditorHelp) {
            EditorHelpSheet(endRhymeColor: suggestionEndColor, internalRhymeColor: suggestionInternalColor)
        }
        .fileImporter(
            isPresented: $isShowingAudioImporter,
            allowedContentTypes: [.audio],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                audioPlayer.importAndLoad(from: url)
            case .failure(let error):
                audioPlayer.lastErrorMessage = error.localizedDescription
                showingAudioError = true
            }
        }
        .onChange(of: audioPlayer.lastErrorMessage) {
            if audioPlayer.lastErrorMessage != nil {
                showingAudioError = true
            }
        }
        .alert("Audio Error", isPresented: $showingAudioError) {
            Button("OK") {
                audioPlayer.lastErrorMessage = nil
            }
        } message: {
            Text(audioPlayer.lastErrorMessage ?? "Unknown error.")
        }
        .onAppear {
            isLyricsFocused = true
            editSnapshotAtAppear = currentEditSnapshot
            didTouchAfterAppear = false

            ensureCompositionLexiconState()

            warmUpTask?.cancel()
            warmUpTask = Task {
                await RhymeService.shared.warmUp()
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    rhymeServiceReady = true
                }
            }

            scheduleRhymeAnalysis()
            refreshAssist()
        }
        .onChange(of: composition.title) {
            scheduleAutosave()
        }
        .onChange(of: composition.lyrics) {
            scheduleAutosave()
            scheduleRhymeAnalysis()
            refreshAssist()
        }
        .onChange(of: composition.endRhymeTailLength) {
            // End-rhyme tail length affects both highlights (end groups) and suggestion targeting.
            scheduleAutosave()
            scheduleRhymeAnalysis()
            refreshAssist()
        }
        .onChange(of: lyricsSelectedRange) {
            refreshAssist()
        }
        .onSubmit {
            isLyricsFocused = true
        }
        .onDisappear {
            let hasEditedSinceAppear = currentEditSnapshot != editSnapshotAtAppear

            autosaveTask?.cancel()
            autosaveTask = nil

            rhymeTask?.cancel()
            rhymeTask = nil

            suggestionsTask?.cancel()
            suggestionsTask = nil

            warmUpTask?.cancel()
            warmUpTask = nil

            if hasEditedSinceAppear && !didTouchAfterAppear {
                withAnimation(.snappy(duration: 0.3, extraBounce: 0.06)) {
                    composition.touch()
                }
            }

            do {
                try modelContext.save()
            } catch {
                // Keep silent for now; we can add user-visible error UI once the basics are stable.
            }
        }
    }

    private func scheduleAutosave() {
        autosaveTask?.cancel()
        autosaveTask = Task { [modelContext, composition] in
            try? await Task.sleep(for: .milliseconds(450))
            await MainActor.run {
                withAnimation(.snappy(duration: 0.3, extraBounce: 0.06)) {
                    composition.touch()
                }
                didTouchAfterAppear = true
                do {
                    try modelContext.save()
                } catch {
                    // Keep silent for now; we can add user-visible error UI once the basics are stable.
                }
            }
        }
    }

    private func scheduleRhymeAnalysis() {
        rhymeTask?.cancel()
        rhymeTask = Task {
            try? await Task.sleep(for: .milliseconds(325))

            let snapshot = await MainActor.run { composition.lyrics }
            let tailLength = await MainActor.run { max(1, min(2, composition.endRhymeTailLength)) }
            let analysis = await RhymeService.shared.analyze(text: snapshot, endRhymeTailLength: tailLength)

            guard !Task.isCancelled else { return }
            await MainActor.run {
                rhymeAnalysis = analysis
                rhymeServiceReady = true
            }
        }
    }

    private func refreshAssist() {
        suggestionsTask?.cancel()

        let textSnapshot = composition.lyrics
        let cursorSnapshot = lyricsSelectedRange.location
        let tailLengthSnapshot = max(1, min(2, composition.endRhymeTailLength))

        // Snapshot the lexicon on the main actor (SwiftData), then compute assist off-main.
        let lexiconSnapshot = UserLexiconStore.fetchTopUserLexiconItems(in: modelContext, limit: 512)

        suggestionsTask = Task {
            let result = await RhymeService.shared.editorAssist(
                text: textSnapshot,
                cursorLocation: cursorSnapshot,
                userLexicon: lexiconSnapshot,
                endRhymeTailLength: tailLengthSnapshot,
                maxCount: 12
            )

            guard !Task.isCancelled else { return }
            await MainActor.run {
                suggestions = result.suggestions
                barPosition = result.barPosition
                rhymeServiceReady = true
            }
        }
    }

    private func ensureCompositionLexiconState() {
        guard composition.lexiconState == nil else { return }

        let state = CompositionLexiconState(composition: composition)
        composition.lexiconState = state
        modelContext.insert(state)
        try? modelContext.save()
    }

    private func recordSuggestionAcceptance(_ word: String) {
        UserLexiconStore.recordAcceptedWord(word, in: modelContext)
        try? modelContext.save()
    }

    private func insertSuggestionFallback(_ word: String) {
        let needsSpace: Bool
        if let last = composition.lyrics.unicodeScalars.last {
            needsSpace = !CharacterSet.whitespacesAndNewlines.contains(last)
        } else {
            needsSpace = true
        }

        composition.lyrics += word
        if needsSpace {
            composition.lyrics += " "
        }
        isLyricsFocused = true
    }

    private var currentEditSnapshot: EditSnapshot {
        EditSnapshot(
            title: composition.title,
            lyrics: composition.lyrics,
            endRhymeTailLength: composition.endRhymeTailLength
        )
    }

    private var suggestionEndColor: Color {
        let palette = themeManager.theme.highlightPalette
        return palette.first ?? themeManager.theme.accent
    }

    private var suggestionInternalColor: Color {
        let palette = themeManager.theme.highlightPalette
        if palette.count >= 2 {
            return palette[1]
        }
        return themeManager.theme.accent
    }

    private var textHighlights: [TextHighlight] {
        struct RangeKey: Hashable {
            var location: Int
            var length: Int
        }

        func precedence(for style: TextHighlight.Style) -> Int {
            switch style {
            case .end: return 3
            case .internal: return 2
            case .near: return 1
            }
        }

        let palette = themeManager.theme.highlightPalette
        guard !palette.isEmpty else { return [] }

        var best: [RangeKey: TextHighlight] = [:]
        best.reserveCapacity(rhymeAnalysis.groups.reduce(into: 0) { $0 += $1.occurrences.count })

        for group in rhymeAnalysis.groups {
            let c = palette[group.colorIndex % palette.count]
            for occ in group.occurrences {
                let style: TextHighlight.Style
                switch group.type {
                case .near:
                    style = .near
                case .end, .`internal`:
                    style = occ.isLineFinalToken ? .end : .internal
                }

                let key = RangeKey(location: occ.range.location, length: occ.range.length)

                #if canImport(UIKit)
                let candidate = TextHighlight(range: occ.range, style: style, color: UIColor(c))
                #else
                let candidate = TextHighlight(range: occ.range, style: style, color: c)
                #endif

                if let existing = best[key] {
                    if precedence(for: candidate.style) > precedence(for: existing.style) {
                        best[key] = candidate
                    }
                } else {
                    best[key] = candidate
                }
            }
        }

        return best.values.sorted { $0.range.location < $1.range.location }
    }
}

private struct EditSnapshot: Equatable {
    var title: String
    var lyrics: String
    var endRhymeTailLength: Int

    static let empty = EditSnapshot(title: "", lyrics: "", endRhymeTailLength: 1)
}

struct EditorView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            EditorView(composition: Composition(title: "Draft", lyrics: "Hello\nWorld"))
        }
        .modelContainer(for: [Composition.self, UserLexiconEntry.self, CompositionLexiconState.self], inMemory: true)
        .environmentObject(ThemeManager())
        .environmentObject(AudioPlayer())
    }
}
