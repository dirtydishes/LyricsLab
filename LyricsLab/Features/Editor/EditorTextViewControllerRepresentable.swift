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
    var miniPlayerTitle: String?
    var miniPlayerIsPlaying: Bool
    var miniPlayerIsLoading: Bool
    var onMiniPlayerTogglePlayPause: () -> Void
    var onMiniPlayerStop: () -> Void
    var barPosition: BarPosition?
    var onSuggestionAccepted: ((String) -> Void)?
    var endRhymeColor: Color = .blue
    var internalRhymeColor: Color = .purple

    var preferredColorScheme: ColorScheme? = nil
    var preferredTextColor: Color? = nil
    var preferredTintColor: Color? = nil

    private func wireCallbacks(for vc: EditorTextViewController) {
        let textBinding = $text
        vc.onTextChanged = { next in
            if textBinding.wrappedValue != next {
                textBinding.wrappedValue = next
            }
        }

        let selectedRangeBinding = $selectedRange
        vc.onSelectionChanged = { next in
            if selectedRangeBinding.wrappedValue != next {
                selectedRangeBinding.wrappedValue = next
            }
        }

        let focusBinding = $isFocused
        vc.onFocusChanged = { focused in
            if focusBinding.wrappedValue != focused {
                focusBinding.wrappedValue = focused
            }
        }

        let endRhymeBinding = $endRhymeTailLength
        vc.onEndRhymeTailLengthChanged = { next in
            if endRhymeBinding.wrappedValue != next {
                endRhymeBinding.wrappedValue = next
            }
        }
    }

    func makeUIViewController(context: Context) -> EditorTextViewController {
        let vc = EditorTextViewController()
        wireCallbacks(for: vc)
        vc.onSuggestionAccepted = { word in
            onSuggestionAccepted?(word)
        }
        return vc
    }

    func updateUIViewController(_ uiViewController: EditorTextViewController, context: Context) {
        wireCallbacks(for: uiViewController)
        uiViewController.update(
            text: text,
            selectedRange: selectedRange,
            isFocused: isFocused,
            highlights: highlights,
            suggestions: suggestions,
            isLoadingSuggestions: isLoadingSuggestions,
            barPosition: barPosition,
            endRhymeTailLength: endRhymeTailLength,
            miniPlayerTitle: miniPlayerTitle,
            miniPlayerIsPlaying: miniPlayerIsPlaying,
            miniPlayerIsLoading: miniPlayerIsLoading,
            endRhymeColor: endRhymeColor,
            internalRhymeColor: internalRhymeColor,
            preferredColorScheme: preferredColorScheme,
            preferredTextColor: preferredTextColor,
            preferredTintColor: preferredTintColor
        )
        uiViewController.onSuggestionAccepted = { word in
            onSuggestionAccepted?(word)
        }
        uiViewController.onMiniPlayerTogglePlayPause = onMiniPlayerTogglePlayPause
        uiViewController.onMiniPlayerStop = onMiniPlayerStop
    }
}

#endif
