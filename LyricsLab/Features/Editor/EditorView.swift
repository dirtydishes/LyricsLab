import SwiftUI
import SwiftData
import Foundation
import UniformTypeIdentifiers

private struct LineEditorState {
    var lines: [String] = [""]
    var anchorIndex: Int?
    var selectedRange: ClosedRange<Int>?
    var undoStack: [[String]] = []
    var redoStack: [[String]] = []

    var canUndo: Bool {
        !undoStack.isEmpty
    }

    var canRedo: Bool {
        !redoStack.isEmpty
    }
}

struct EditorView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.undoManager) private var undoManager
    @Bindable var composition: Composition

    @EnvironmentObject private var themeManager: ThemeManager
    @EnvironmentObject private var audioPlayer: AudioPlayer

    @State private var lyricsSelectedRange = NSRange(location: 0, length: 0)
    @State private var isLyricsFocused = false
    @State private var autosaveTask: Task<Void, Never>?
    @State private var revisionBackupTask: Task<Void, Never>?

    @State private var rhymeTask: Task<Void, Never>?
    @State private var rhymeAnalysis: RhymeAnalysis = .empty

    @State private var warmUpTask: Task<Void, Never>?
    @State private var rhymeServiceReady = false

    @State private var suggestionsTask: Task<Void, Never>?
    @State private var assistRefreshTask: Task<Void, Never>?
    @State private var renderedHighlights: [TextHighlight] = []

    @State private var suggestions: [RhymeSuggestion] = []
    @State private var isShowingAudioImporter = false
    @State private var showingAudioError = false
    @State private var barPosition: BarPosition?
    @State private var isShowingEditorHelp = false
    @State private var isShowingRevisionHistory = false

    @State private var isEditMode = false
    @State private var lineEditorState = LineEditorState()
    @State private var pendingManualBackupMessage: String?

    #if canImport(UIKit)
    @StateObject private var textUndoBridge = EditorTextUndoBridge()
    #endif

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

                editorBody
            }
        }
        .navigationTitle(composition.title.isEmpty ? "Untitled" : composition.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    toggleEditMode()
                } label: {
                    Image(systemName: isEditMode ? "checkmark.circle.fill" : "rectangle.and.pencil.and.ellipsis")
                }
                .accessibilityLabel(isEditMode ? "Exit Edit Mode" : "Enter Edit Mode")

                Menu {
                    Button {
                        performUndoAction()
                    } label: {
                        Label("Undo", systemImage: "arrow.uturn.backward")
                    }
                    .disabled(!canPerformUndo)

                    Button {
                        performRedoAction()
                    } label: {
                        Label("Redo", systemImage: "arrow.uturn.forward")
                    }
                    .disabled(!canPerformRedo)

                    Divider()

                    Button {
                        isShowingRevisionHistory = true
                    } label: {
                        Label("Revisions", systemImage: "clock.arrow.circlepath")
                    }

                    Button {
                        createManualBackup()
                    } label: {
                        Label("Create Backup Now", systemImage: "externaldrive.badge.plus")
                    }

                    Divider()

                    Button {
                        isShowingAudioImporter = true
                    } label: {
                        Label("Import Audio", systemImage: "music.note")
                    }

                    Button {
                        isShowingEditorHelp = true
                    } label: {
                        Label("Help", systemImage: "questionmark.circle")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
                .accessibilityLabel("Editor Menu")
            }
        }
        .sheet(isPresented: $isShowingEditorHelp) {
            EditorHelpSheet(endRhymeColor: suggestionEndColor, internalRhymeColor: suggestionInternalColor)
        }
        .sheet(isPresented: $isShowingRevisionHistory) {
            RevisionHistorySheet(
                revisions: sortedRevisions,
                accent: themeManager.theme.accent
            ) { revision in
                restoreRevision(revision)
            }
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
        .alert("Backup Created", isPresented: Binding(get: {
            pendingManualBackupMessage != nil
        }, set: { showing in
            if !showing {
                pendingManualBackupMessage = nil
            }
        })) {
            Button("OK", role: .cancel) {
                pendingManualBackupMessage = nil
            }
        } message: {
            Text(pendingManualBackupMessage ?? "Manual backup saved.")
        }
        .onAppear {
            composition.lastOpenedAt = Date()
            isLyricsFocused = true

            ensureCompositionLexiconState()

            warmUpTask?.cancel()
            warmUpTask = Task {
                await RhymeService.shared.warmUp()
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    rhymeServiceReady = true
                }
            }

            scheduleRhymeAnalysis(immediate: true)
            scheduleAssistRefresh(immediate: true)
        }
        .onChange(of: composition.title) {
            scheduleAutosave()
            scheduleRevisionBackup()
        }
        .onChange(of: composition.lyrics) {
            scheduleAutosave()
            scheduleRevisionBackup()
            if !isEditMode {
                scheduleRhymeAnalysis()
                scheduleAssistRefresh(immediate: true)
            } else {
                syncLineEditorFromComposition(resetSelection: false)
            }
        }
        .onChange(of: composition.endRhymeTailLength) {
            scheduleAutosave()
            if !isEditMode {
                scheduleRhymeAnalysis()
                scheduleAssistRefresh(immediate: true)
            }
        }
        .onChange(of: lyricsSelectedRange) {
            guard !isEditMode else { return }
            scheduleAssistRefresh()
        }
        .onChange(of: themeManager.theme.id) {
            rebuildTextHighlights(from: rhymeAnalysis)
        }
        .onSubmit {
            if !isEditMode {
                isLyricsFocused = true
            }
        }
        .onDisappear {
            autosaveTask?.cancel()
            autosaveTask = nil

            revisionBackupTask?.cancel()
            revisionBackupTask = nil

            rhymeTask?.cancel()
            rhymeTask = nil

            suggestionsTask?.cancel()
            suggestionsTask = nil

            assistRefreshTask?.cancel()
            assistRefreshTask = nil

            warmUpTask?.cancel()
            warmUpTask = nil

            composition.touch()
            do {
                try modelContext.save()
            } catch {
                // Keep silent for now; we can add user-visible error UI once the basics are stable.
            }
        }
    }

    @ViewBuilder
    private var editorBody: some View {
        #if canImport(UIKit)
        if isEditMode {
            editModeContent
        } else {
            EditorTextViewControllerRepresentable(
                text: $composition.lyrics,
                selectedRange: $lyricsSelectedRange,
                isFocused: $isLyricsFocused,
                endRhymeTailLength: $composition.endRhymeTailLength,
                highlights: renderedHighlights,
                suggestions: suggestions,
                isLoadingSuggestions: !rhymeServiceReady,
                isSuggestionsEnabled: !isEditMode,
                miniPlayerTitle: audioPlayer.track?.displayName,
                miniPlayerIsPlaying: audioPlayer.isPlaying,
                miniPlayerIsLoading: audioPlayer.isLoading,
                miniPlayerCurrentTime: audioPlayer.currentTime,
                miniPlayerDuration: audioPlayer.duration,
                miniPlayerMeterLevels: audioPlayer.meterLevels,
                miniPlayerLoopStart: audioPlayer.loopStartTime,
                miniPlayerLoopEnd: audioPlayer.loopEndTime,
                miniPlayerLoopEnabled: audioPlayer.isLoopEnabled,
                onMiniPlayerTogglePlayPause: {
                    audioPlayer.togglePlayPause()
                },
                onMiniPlayerStop: {
                    audioPlayer.stop()
                },
                onMiniPlayerMarkLoopStart: {
                    audioPlayer.markLoopStart()
                },
                onMiniPlayerMarkLoopEnd: {
                    audioPlayer.markLoopEnd()
                },
                onMiniPlayerToggleLoop: {
                    audioPlayer.toggleLoopEnabled()
                },
                onMiniPlayerClearLoop: {
                    audioPlayer.clearLoop()
                },
                barPosition: barPosition,
                onSuggestionAccepted: { word in
                    recordSuggestionAcceptance(word)
                },
                endRhymeColor: suggestionEndColor,
                internalRhymeColor: suggestionInternalColor,
                preferredColorScheme: themeManager.theme.colorScheme,
                preferredTextColor: themeManager.theme.textPrimary,
                preferredTintColor: themeManager.theme.accent,
                undoBridge: textUndoBridge
            )
            .ignoresSafeArea(.keyboard, edges: .bottom)
        }
        #else
        if isEditMode {
            editModeContent
        } else {
            LyricsTextView(
                text: $composition.lyrics,
                selectedRange: $lyricsSelectedRange,
                insertion: .constant(nil),
                isFocused: $isLyricsFocused,
                highlights: renderedHighlights,
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
                    currentTime: audioPlayer.currentTime,
                    duration: audioPlayer.duration,
                    meterLevels: audioPlayer.meterLevels,
                    loopStartTime: audioPlayer.loopStartTime,
                    loopEndTime: audioPlayer.loopEndTime,
                    isLoopEnabled: audioPlayer.isLoopEnabled,
                    onTogglePlayPause: { audioPlayer.togglePlayPause() },
                    onStop: { audioPlayer.stop() },
                    onMarkLoopStart: { audioPlayer.markLoopStart() },
                    onMarkLoopEnd: { audioPlayer.markLoopEnd() },
                    onToggleLoop: { audioPlayer.toggleLoopEnabled() },
                    onClearLoop: { audioPlayer.clearLoop() }
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
        }
        #endif
    }

    private var editModeContent: some View {
        VStack(spacing: 0) {
            LineRearrangeView(
                lines: lineEditorState.lines,
                selectedRange: lineEditorState.selectedRange,
                accent: themeManager.theme.accent,
                onSelectLine: { index in
                    selectLine(index)
                },
                onMoveSelection: { insertionIndex in
                    moveSelectedLines(to: insertionIndex)
                }
            )

            if let title = audioPlayer.track?.displayName {
                EditorMiniPlayerBar(
                    title: title,
                    isPlaying: audioPlayer.isPlaying,
                    isLoading: audioPlayer.isLoading,
                    currentTime: audioPlayer.currentTime,
                    duration: audioPlayer.duration,
                    meterLevels: audioPlayer.meterLevels,
                    loopStartTime: audioPlayer.loopStartTime,
                    loopEndTime: audioPlayer.loopEndTime,
                    isLoopEnabled: audioPlayer.isLoopEnabled,
                    onTogglePlayPause: { audioPlayer.togglePlayPause() },
                    onStop: { audioPlayer.stop() },
                    onMarkLoopStart: { audioPlayer.markLoopStart() },
                    onMarkLoopEnd: { audioPlayer.markLoopEnd() },
                    onToggleLoop: { audioPlayer.toggleLoopEnabled() },
                    onClearLoop: { audioPlayer.clearLoop() }
                )
            }
        }
    }

    private var sortedRevisions: [CompositionRevision] {
        RevisionStore.sortedRevisions(for: composition)
    }

    private var canPerformUndo: Bool {
        if isEditMode {
            return lineEditorState.canUndo
        }

        #if canImport(UIKit)
        return textUndoBridge.canUndo
        #else
        return undoManager?.canUndo ?? false
        #endif
    }

    private var canPerformRedo: Bool {
        if isEditMode {
            return lineEditorState.canRedo
        }

        #if canImport(UIKit)
        return textUndoBridge.canRedo
        #else
        return undoManager?.canRedo ?? false
        #endif
    }

    private func performUndoAction() {
        if isEditMode {
            performEditModeUndo()
            return
        }

        #if canImport(UIKit)
        textUndoBridge.undo()
        #else
        undoManager?.undo()
        #endif
    }

    private func performRedoAction() {
        if isEditMode {
            performEditModeRedo()
            return
        }

        #if canImport(UIKit)
        textUndoBridge.redo()
        #else
        undoManager?.redo()
        #endif
    }

    private func toggleEditMode() {
        isEditMode.toggle()
        if isEditMode {
            isLyricsFocused = false
            syncLineEditorFromComposition(resetSelection: true)
        } else {
            isLyricsFocused = true
        }
    }

    private func syncLineEditorFromComposition(resetSelection: Bool) {
        let nextLines = splitLines(from: composition.lyrics)
        guard lineEditorState.lines != nextLines || resetSelection else { return }

        lineEditorState.lines = nextLines
        if resetSelection {
            lineEditorState.anchorIndex = nil
            lineEditorState.selectedRange = nil
            lineEditorState.undoStack.removeAll()
            lineEditorState.redoStack.removeAll()
        }
    }

    private func selectLine(_ index: Int) {
        guard lineEditorState.lines.indices.contains(index) else { return }

        if lineEditorState.anchorIndex == nil {
            lineEditorState.anchorIndex = index
            lineEditorState.selectedRange = index...index
            return
        }

        guard let anchorIndex = lineEditorState.anchorIndex else { return }
        if lineEditorState.selectedRange == (anchorIndex...anchorIndex), index != anchorIndex {
            let lower = min(anchorIndex, index)
            let upper = max(anchorIndex, index)
            lineEditorState.selectedRange = lower...upper
            return
        }

        lineEditorState.anchorIndex = index
        lineEditorState.selectedRange = index...index
    }

    private func moveSelectedLines(to insertionIndex: Int) {
        guard let selectedRange = lineEditorState.selectedRange else { return }

        let previous = lineEditorState.lines
        let movedResult = movedLines(
            lines: previous,
            selectedRange: selectedRange,
            insertionIndex: insertionIndex
        )
        guard movedResult.lines != previous else { return }

        lineEditorState.undoStack.append(previous)
        lineEditorState.redoStack.removeAll()
        lineEditorState.lines = movedResult.lines
        lineEditorState.selectedRange = movedResult.selectedRange
        lineEditorState.anchorIndex = movedResult.selectedRange.lowerBound

        applyLineEdit(to: movedResult.lines)
        registerReorderUndo(oldLines: previous, newLines: movedResult.lines)
    }

    private func performEditModeUndo() {
        guard let previous = lineEditorState.undoStack.popLast() else { return }
        let current = lineEditorState.lines
        lineEditorState.redoStack.append(current)
        lineEditorState.lines = previous
        lineEditorState.anchorIndex = nil
        lineEditorState.selectedRange = nil
        applyLineEdit(to: previous)
    }

    private func performEditModeRedo() {
        guard let next = lineEditorState.redoStack.popLast() else { return }
        let current = lineEditorState.lines
        lineEditorState.undoStack.append(current)
        lineEditorState.lines = next
        lineEditorState.anchorIndex = nil
        lineEditorState.selectedRange = nil
        applyLineEdit(to: next)
    }

    private func applyLineEdit(to lines: [String]) {
        let nextLyrics = lines.joined(separator: "\n")
        guard composition.lyrics != nextLyrics else { return }
        composition.lyrics = nextLyrics
    }

    private func registerReorderUndo(oldLines: [String], newLines _: [String]) {
        let oldLyrics = oldLines.joined(separator: "\n")
        let manager = undoManager

        manager?.registerUndo(withTarget: composition) { target in
            let redoLyrics = target.lyrics
            target.lyrics = oldLyrics
            target.touch()
            manager?.registerUndo(withTarget: target) { target in
                target.lyrics = redoLyrics
                target.touch()
            }
        }
        manager?.setActionName("Rearrange Lines")
    }

    private func movedLines(
        lines: [String],
        selectedRange: ClosedRange<Int>,
        insertionIndex: Int
    ) -> (lines: [String], selectedRange: ClosedRange<Int>) {
        guard !lines.isEmpty else { return (lines, selectedRange) }

        let lower = selectedRange.lowerBound
        let upper = selectedRange.upperBound
        let blockCount = upper - lower + 1

        var result = lines
        let block = Array(result[lower...upper])
        result.removeSubrange(lower...upper)

        var adjustedInsertion = max(0, min(insertionIndex, lines.count))
        if adjustedInsertion > upper {
            adjustedInsertion -= blockCount
        }
        adjustedInsertion = max(0, min(adjustedInsertion, result.count))

        result.insert(contentsOf: block, at: adjustedInsertion)
        let nextRange = adjustedInsertion...(adjustedInsertion + blockCount - 1)

        return (result, nextRange)
    }

    private func splitLines(from lyrics: String) -> [String] {
        let lines = lyrics.components(separatedBy: "\n")
        return lines.isEmpty ? [""] : lines
    }

    private func createManualBackup() {
        let revision = RevisionStore.createManualBackup(for: composition, in: modelContext)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        pendingManualBackupMessage = "Manual backup saved at \(formatter.string(from: revision.createdAt))."
    }

    private func restoreRevision(_ revision: CompositionRevision) {
        let didRestore = RevisionStore.restore(revision: revision, into: composition, in: modelContext)
        guard didRestore else { return }

        if isEditMode {
            syncLineEditorFromComposition(resetSelection: true)
        } else {
            isLyricsFocused = true
        }

        scheduleRhymeAnalysis(immediate: true)
        scheduleAssistRefresh(immediate: true)
    }

    private func scheduleAutosave() {
        autosaveTask?.cancel()
        autosaveTask = Task { [modelContext, composition] in
            try? await Task.sleep(for: .milliseconds(450))
            await MainActor.run {
                composition.touch()
                do {
                    try modelContext.save()
                } catch {
                    // Keep silent for now; we can add user-visible error UI once the basics are stable.
                }
            }
        }
    }

    private func scheduleRevisionBackup() {
        revisionBackupTask?.cancel()
        revisionBackupTask = Task { [modelContext, composition] in
            try? await Task.sleep(for: .seconds(1))
            guard !Task.isCancelled else { return }
            await MainActor.run {
                _ = RevisionStore.captureAutoBackupIfNeeded(for: composition, in: modelContext)
            }
        }
    }

    private func scheduleRhymeAnalysis(immediate: Bool = false) {
        rhymeTask?.cancel()
        rhymeTask = Task {
            if !immediate {
                try? await Task.sleep(for: .milliseconds(325))
            }
            guard !Task.isCancelled else { return }

            let snapshot = await MainActor.run { composition.lyrics }
            let tailLength = await MainActor.run { max(1, min(2, composition.endRhymeTailLength)) }
            let analysis = await RhymeService.shared.analyze(text: snapshot, endRhymeTailLength: tailLength)

            guard !Task.isCancelled else { return }
            await MainActor.run {
                rhymeAnalysis = analysis
                rebuildTextHighlights(from: analysis)
                rhymeServiceReady = true
            }
        }
    }

    private func scheduleAssistRefresh(immediate: Bool = false) {
        assistRefreshTask?.cancel()
        assistRefreshTask = Task {
            if !immediate {
                try? await Task.sleep(for: .milliseconds(90))
            }
            guard !Task.isCancelled else { return }
            await MainActor.run {
                refreshAssist()
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

    private func rebuildTextHighlights(from analysis: RhymeAnalysis) {
        renderedHighlights = buildTextHighlights(from: analysis, palette: themeManager.theme.highlightPalette)
    }

    private func buildTextHighlights(from analysis: RhymeAnalysis, palette: [Color]) -> [TextHighlight] {
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

        guard !palette.isEmpty else { return [] }

        var best: [RangeKey: TextHighlight] = [:]
        best.reserveCapacity(analysis.groups.reduce(into: 0) { $0 += $1.occurrences.count })

        for group in analysis.groups {
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

struct EditorView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            EditorView(composition: Composition(title: "Draft", lyrics: "Hello\nWorld"))
        }
        .modelContainer(for: [Composition.self, CompositionRevision.self, UserLexiconEntry.self, CompositionLexiconState.self], inMemory: true)
        .environmentObject(ThemeManager())
        .environmentObject(AudioPlayer())
    }
}
