import SwiftUI

#if canImport(UIKit)

struct EditorTextViewControllerRepresentable: UIViewControllerRepresentable {
    @Binding var text: String
    @Binding var selectedRange: NSRange
    @Binding var isFocused: Bool
    @Binding var endRhymeTailLength: Int

    var highlights: [TextHighlight]
    var suggestions: [RhymeSuggestion]
    var isLoadingSuggestions: Bool
    var isSuggestionsEnabled: Bool
    var miniPlayerTitle: String?
    var miniPlayerIsPlaying: Bool
    var miniPlayerIsLoading: Bool
    var miniPlayerCurrentTime: TimeInterval
    var miniPlayerDuration: TimeInterval
    var miniPlayerMeterLevels: [CGFloat]
    var miniPlayerLoopStart: TimeInterval?
    var miniPlayerLoopEnd: TimeInterval?
    var miniPlayerLoopEnabled: Bool
    var onMiniPlayerTogglePlayPause: () -> Void
    var onMiniPlayerStop: () -> Void
    var onMiniPlayerMarkLoopStart: () -> Void
    var onMiniPlayerMarkLoopEnd: () -> Void
    var onMiniPlayerToggleLoop: () -> Void
    var onMiniPlayerClearLoop: () -> Void
    var barPosition: BarPosition?
    var onSuggestionAccepted: ((String) -> Void)?
    var endRhymeColor: Color = .blue
    var internalRhymeColor: Color = .purple

    var preferredColorScheme: ColorScheme? = nil
    var preferredTextColor: Color? = nil
    var preferredTintColor: Color? = nil
    var undoBridge: EditorTextUndoBridge? = nil

    func makeUIViewController(context: Context) -> EditorTextViewController {
        let vc = EditorTextViewController()
        undoBridge?.attach(controller: vc)
        vc.onTextChanged = { next in
            DispatchQueue.main.async {
                if text != next {
                    text = next
                }
            }
        }
        vc.onSelectionChanged = { next in
            DispatchQueue.main.async {
                if selectedRange != next {
                    selectedRange = next
                }
            }
        }
        vc.onFocusChanged = { focused in
            DispatchQueue.main.async {
                if isFocused != focused {
                    isFocused = focused
                }
            }
        }
        vc.onSuggestionAccepted = { word in
            onSuggestionAccepted?(word)
        }
        vc.onEndRhymeTailLengthChanged = { next in
            if endRhymeTailLength != next {
                endRhymeTailLength = next
            }
        }
        vc.onUndoStateChanged = { canUndo, canRedo in
            DispatchQueue.main.async {
                undoBridge?.updateAvailability(canUndo: canUndo, canRedo: canRedo)
            }
        }
        return vc
    }

    func updateUIViewController(_ uiViewController: EditorTextViewController, context: Context) {
        uiViewController.update(
            text: text,
            selectedRange: selectedRange,
            isFocused: isFocused,
            highlights: highlights,
            suggestions: suggestions,
            isLoadingSuggestions: isLoadingSuggestions,
            isSuggestionsEnabled: isSuggestionsEnabled,
            barPosition: barPosition,
            endRhymeTailLength: endRhymeTailLength,
            miniPlayerTitle: miniPlayerTitle,
            miniPlayerIsPlaying: miniPlayerIsPlaying,
            miniPlayerIsLoading: miniPlayerIsLoading,
            miniPlayerCurrentTime: miniPlayerCurrentTime,
            miniPlayerDuration: miniPlayerDuration,
            miniPlayerMeterLevels: miniPlayerMeterLevels,
            miniPlayerLoopStart: miniPlayerLoopStart,
            miniPlayerLoopEnd: miniPlayerLoopEnd,
            miniPlayerLoopEnabled: miniPlayerLoopEnabled,
            endRhymeColor: endRhymeColor,
            internalRhymeColor: internalRhymeColor,
            preferredColorScheme: preferredColorScheme,
            preferredTextColor: preferredTextColor,
            preferredTintColor: preferredTintColor
        )
        uiViewController.onUndoStateChanged = { canUndo, canRedo in
            DispatchQueue.main.async {
                undoBridge?.updateAvailability(canUndo: canUndo, canRedo: canRedo)
            }
        }
        uiViewController.onSuggestionAccepted = { word in
            onSuggestionAccepted?(word)
        }
        uiViewController.onMiniPlayerTogglePlayPause = onMiniPlayerTogglePlayPause
        uiViewController.onMiniPlayerStop = onMiniPlayerStop
        uiViewController.onMiniPlayerMarkLoopStart = onMiniPlayerMarkLoopStart
        uiViewController.onMiniPlayerMarkLoopEnd = onMiniPlayerMarkLoopEnd
        uiViewController.onMiniPlayerToggleLoop = onMiniPlayerToggleLoop
        uiViewController.onMiniPlayerClearLoop = onMiniPlayerClearLoop
    }
}

#endif
