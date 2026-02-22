#if canImport(UIKit)
import SwiftUI
import UIKit

@MainActor
final class EditorTextViewController: UIViewController {
    enum EnsureCaretReason {
        case typing
        case insertion
        case focus
        case externalUpdate
    }

    var onTextChanged: ((String) -> Void)?
    var onSelectionChanged: ((NSRange) -> Void)?
    var onFocusChanged: ((Bool) -> Void)?
    var onSuggestionAccepted: ((String) -> Void)?
    var onEndRhymeTailLengthChanged: ((Int) -> Void)?
    var onMiniPlayerTogglePlayPause: (() -> Void)?
    var onMiniPlayerStop: (() -> Void)?
    var onMiniPlayerMarkLoopStart: (() -> Void)?
    var onMiniPlayerMarkLoopEnd: (() -> Void)?
    var onMiniPlayerToggleLoop: (() -> Void)?
    var onMiniPlayerClearLoop: (() -> Void)?
    var onUndoStateChanged: ((Bool, Bool) -> Void)?

    private(set) var textView = UITextView()

    private var suggestionsHostingController: UIHostingController<EditorSuggestionsBar>?
    private var miniPlayerHostingController: UIHostingController<EditorMiniPlayerBar>?

    private var suggestionsHeightZero: NSLayoutConstraint?
    private var miniPlayerHeightZero: NSLayoutConstraint?

    private var isApplyingExternalText = false
    private var isApplyingExternalSelection = false
    private var isPerformingProgrammaticEdit = false
    private var isUserScrolling = false

    private var lastAppliedHighlights: [TextHighlight] = []
    private var pendingHighlights: [TextHighlight]?
    private var lastSuggestionsRenderState: SuggestionsRenderState?
    private var lastSuggestionsEndColor: UIColor?
    private var lastSuggestionsInternalColor: UIColor?
    private var lastMiniPlayerRenderState: MiniPlayerRenderState?

    private struct SuggestionsRenderState: Equatable {
        var suggestions: [RhymeSuggestion]
        var isLoading: Bool
        var barPosition: BarPosition?
        var endRhymeTailLength: Int
    }

    private struct MiniPlayerRenderState: Equatable {
        var title: String?
        var isPlaying: Bool
        var isLoading: Bool
        var currentTime: TimeInterval
        var duration: TimeInterval
        var meterLevels: [CGFloat]
        var loopStartTime: TimeInterval?
        var loopEndTime: TimeInterval?
        var isLoopEnabled: Bool
    }

    var canUndo: Bool {
        textView.undoManager?.canUndo ?? false
    }

    var canRedo: Bool {
        textView.undoManager?.canRedo ?? false
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear

        configureTextView()
        configureMiniPlayerBar()
        configureSuggestionsBar()
        configureLayout()
    }

    func update(
        text: String,
        selectedRange: NSRange,
        isFocused: Bool,
        highlights: [TextHighlight],
        suggestions: [RhymeSuggestion],
        isLoadingSuggestions: Bool,
        isSuggestionsEnabled: Bool,
        barPosition: BarPosition?,
        endRhymeTailLength: Int,
        miniPlayerTitle: String?,
        miniPlayerIsPlaying: Bool,
        miniPlayerIsLoading: Bool,
        miniPlayerCurrentTime: TimeInterval,
        miniPlayerDuration: TimeInterval,
        miniPlayerMeterLevels: [CGFloat],
        miniPlayerLoopStart: TimeInterval?,
        miniPlayerLoopEnd: TimeInterval?,
        miniPlayerLoopEnabled: Bool,
        endRhymeColor: Color,
        internalRhymeColor: Color,
        preferredColorScheme: ColorScheme?,
        preferredTextColor: Color?,
        preferredTintColor: Color?
    ) {
        applyAppearance(preferredColorScheme: preferredColorScheme, preferredTextColor: preferredTextColor, preferredTintColor: preferredTintColor)
        let isActivelyEditing = isFocused && textView.isFirstResponder
        let textDidChange = applyTextIfNeeded(text, allowExternalSync: !isActivelyEditing)
        _ = applySelectionIfNeeded(selectedRange, allowExternalSync: !isActivelyEditing)
        applyHighlightsIfNeeded(highlights)
        updateSuggestionsBar(
            suggestions: suggestions,
            isLoading: isLoadingSuggestions,
            barPosition: barPosition,
            endRhymeTailLength: endRhymeTailLength,
            endRhymeColor: endRhymeColor,
            internalRhymeColor: internalRhymeColor
        )
        updateMiniPlayerBar(
            title: miniPlayerTitle,
            isPlaying: miniPlayerIsPlaying,
            isLoading: miniPlayerIsLoading,
            currentTime: miniPlayerCurrentTime,
            duration: miniPlayerDuration,
            meterLevels: miniPlayerMeterLevels,
            loopStartTime: miniPlayerLoopStart,
            loopEndTime: miniPlayerLoopEnd,
            isLoopEnabled: miniPlayerLoopEnabled
        )
        setSuggestionsVisible(isFocused && isSuggestionsEnabled)
        setFocus(isFocused)
        if textDidChange {
            ensureCaretVisible(reason: .externalUpdate, animated: false)
        }
        reportUndoAvailability()
    }

    private func configureTextView() {
        textView.backgroundColor = .clear
        textView.font = UIFont.preferredFont(forTextStyle: .body)
        textView.adjustsFontForContentSizeCategory = true
        textView.textContainerInset = UIEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        textView.keyboardDismissMode = .interactive
        textView.alwaysBounceVertical = true

        textView.delegate = self
        textView.scrollsToTop = true
    }

    private func configureSuggestionsBar() {
        let host = UIHostingController(
            rootView: EditorSuggestionsBar(
                suggestions: [],
                isLoading: false,
                barPosition: nil,
                endRhymeTailLength: 1,
                onSetEndRhymeTailLength: { [weak self] next in
                    self?.onEndRhymeTailLengthChanged?(next)
                },
                endRhymeColor: .blue,
                internalRhymeColor: .purple
            ) { [weak self] word in
                self?.insertSuggestion(word)
            }
        )
        host.view.backgroundColor = .clear
        host.view.translatesAutoresizingMaskIntoConstraints = false
        host.sizingOptions = [.intrinsicContentSize]

        host.view.setContentCompressionResistancePriority(.required, for: .vertical)
        host.view.setContentHuggingPriority(.required, for: .vertical)

        host.view.setContentCompressionResistancePriority(.required, for: .horizontal)
        host.view.setContentHuggingPriority(.defaultLow, for: .horizontal)

        addChild(host)
        view.addSubview(host.view)
        host.didMove(toParent: self)
        suggestionsHostingController = host
    }

    private func configureMiniPlayerBar() {
        let host = UIHostingController(
            rootView: EditorMiniPlayerBar(
                title: "",
                isPlaying: false,
                isLoading: false,
                currentTime: 0,
                duration: 0,
                meterLevels: Array(repeating: 0.08, count: 10),
                loopStartTime: nil,
                loopEndTime: nil,
                isLoopEnabled: false,
                onTogglePlayPause: { [weak self] in
                    self?.onMiniPlayerTogglePlayPause?()
                },
                onStop: { [weak self] in
                    self?.onMiniPlayerStop?()
                },
                onMarkLoopStart: { [weak self] in
                    self?.onMiniPlayerMarkLoopStart?()
                },
                onMarkLoopEnd: { [weak self] in
                    self?.onMiniPlayerMarkLoopEnd?()
                },
                onToggleLoop: { [weak self] in
                    self?.onMiniPlayerToggleLoop?()
                },
                onClearLoop: { [weak self] in
                    self?.onMiniPlayerClearLoop?()
                }
            )
        )
        host.view.backgroundColor = .clear
        host.view.translatesAutoresizingMaskIntoConstraints = false
        host.sizingOptions = [.intrinsicContentSize]

        host.view.setContentCompressionResistancePriority(.required, for: .vertical)
        host.view.setContentHuggingPriority(.required, for: .vertical)

        addChild(host)
        view.addSubview(host.view)
        host.didMove(toParent: self)
        miniPlayerHostingController = host
    }

    private func configureLayout() {
        textView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(textView)

        guard let suggestionsView = suggestionsHostingController?.view else {
            assertionFailure("Expected suggestionsHostingController to exist")
            return
        }

        guard let miniPlayerView = miniPlayerHostingController?.view else {
            assertionFailure("Expected miniPlayerHostingController to exist")
            return
        }

        view.bringSubviewToFront(suggestionsView)
        view.bringSubviewToFront(miniPlayerView)

        // When suggestions are hidden, collapse their height so the text view can fill.
        suggestionsHeightZero = suggestionsView.heightAnchor.constraint(equalToConstant: 0)
        suggestionsHeightZero?.priority = .required

        // When the mini-player is hidden, collapse it.
        miniPlayerHeightZero = miniPlayerView.heightAnchor.constraint(equalToConstant: 0)
        miniPlayerHeightZero?.priority = .required

        NSLayoutConstraint.activate([
            textView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            textView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            textView.topAnchor.constraint(equalTo: view.topAnchor),
            textView.bottomAnchor.constraint(equalTo: miniPlayerView.topAnchor),

            miniPlayerView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            miniPlayerView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            miniPlayerView.bottomAnchor.constraint(equalTo: suggestionsView.topAnchor),

            suggestionsView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            suggestionsView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            suggestionsView.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
        ])

        // Default: hidden until focused (suggestions) and until track loaded (mini-player).
        suggestionsHeightZero?.isActive = true
        miniPlayerHeightZero?.isActive = true

        suggestionsView.isHidden = true
        miniPlayerView.isHidden = true
    }

    private func applyAppearance(preferredColorScheme: ColorScheme?, preferredTextColor: Color?, preferredTintColor: Color?) {
        if let preferredColorScheme {
            textView.keyboardAppearance = preferredColorScheme == .dark ? .dark : .light
        }
        if let preferredTextColor {
            textView.textColor = UIColor(preferredTextColor)
        }
        if let preferredTintColor {
            textView.tintColor = UIColor(preferredTintColor)
        }
    }

    private func applyTextIfNeeded(_ nextText: String, allowExternalSync: Bool) -> Bool {
        guard allowExternalSync else { return false }
        guard textView.text != nextText else { return false }
        isApplyingExternalText = true
        textView.text = nextText
        isApplyingExternalText = false
        return true
    }

    private func applySelectionIfNeeded(_ nextRange: NSRange, allowExternalSync: Bool) -> Bool {
        guard allowExternalSync else { return false }
        let textLength = (textView.text as NSString).length
        var clamped = nextRange
        if clamped.location < 0 { clamped.location = 0 }
        if clamped.location > textLength { clamped.location = textLength }
        if clamped.length < 0 { clamped.length = 0 }
        if clamped.location + clamped.length > textLength {
            clamped.length = max(0, textLength - clamped.location)
        }

        guard textView.selectedRange != clamped else { return false }
        isApplyingExternalSelection = true
        textView.selectedRange = clamped
        isApplyingExternalSelection = false
        return true
    }

    private func applyHighlightsIfNeeded(_ highlights: [TextHighlight]) {
        guard highlights != lastAppliedHighlights else {
            pendingHighlights = nil
            return
        }
        if isUserScrolling {
            pendingHighlights = highlights
            return
        }
        lastAppliedHighlights = highlights
        pendingHighlights = nil

        let fullRange = NSRange(location: 0, length: (textView.text as NSString).length)
        guard fullRange.length > 0 else { return }

        textView.textStorage.beginEditing()
        textView.textStorage.removeAttribute(.backgroundColor, range: fullRange)
        textView.textStorage.removeAttribute(.underlineStyle, range: fullRange)
        textView.textStorage.removeAttribute(.underlineColor, range: fullRange)

        for h in highlights {
            guard NSMaxRange(h.range) <= fullRange.length else { continue }
            switch h.style {
            case .end:
                textView.textStorage.addAttribute(.backgroundColor, value: h.color.withAlphaComponent(0.26), range: h.range)
            case .internal:
                let style = NSUnderlineStyle.single.rawValue
                textView.textStorage.addAttribute(.underlineStyle, value: style, range: h.range)
                textView.textStorage.addAttribute(.underlineColor, value: h.color.withAlphaComponent(0.68), range: h.range)
            case .near:
                let style = NSUnderlineStyle.single.rawValue | NSUnderlineStyle.patternDot.rawValue
                textView.textStorage.addAttribute(.underlineStyle, value: style, range: h.range)
                textView.textStorage.addAttribute(.underlineColor, value: h.color.withAlphaComponent(0.52), range: h.range)
            }
        }
        textView.textStorage.endEditing()
    }

    private func applyPendingHighlightsIfNeeded() {
        guard let pendingHighlights else { return }
        applyHighlightsIfNeeded(pendingHighlights)
    }

    private func updateSuggestionsBar(
        suggestions: [RhymeSuggestion],
        isLoading: Bool,
        barPosition: BarPosition?,
        endRhymeTailLength: Int,
        endRhymeColor: Color,
        internalRhymeColor: Color
    ) {
        guard let host = suggestionsHostingController else { return }

        let nextState = SuggestionsRenderState(
            suggestions: suggestions,
            isLoading: isLoading,
            barPosition: barPosition,
            endRhymeTailLength: endRhymeTailLength
        )
        let nextEndColor = UIColor(endRhymeColor)
        let nextInternalColor = UIColor(internalRhymeColor)
        let endColorUnchanged = (lastSuggestionsEndColor?.isEqual(nextEndColor) ?? false)
        let internalColorUnchanged = (lastSuggestionsInternalColor?.isEqual(nextInternalColor) ?? false)
        if lastSuggestionsRenderState == nextState, endColorUnchanged, internalColorUnchanged {
            return
        }

        lastSuggestionsRenderState = nextState
        lastSuggestionsEndColor = nextEndColor
        lastSuggestionsInternalColor = nextInternalColor

        host.rootView = EditorSuggestionsBar(
            suggestions: suggestions,
            isLoading: isLoading,
            barPosition: barPosition,
            endRhymeTailLength: endRhymeTailLength,
            onSetEndRhymeTailLength: { [weak self] next in
                self?.onEndRhymeTailLengthChanged?(next)
            },
            endRhymeColor: endRhymeColor,
            internalRhymeColor: internalRhymeColor
        ) { [weak self] word in
            self?.insertSuggestion(word)
        }
    }

    private func updateMiniPlayerBar(
        title: String?,
        isPlaying: Bool,
        isLoading: Bool,
        currentTime: TimeInterval,
        duration: TimeInterval,
        meterLevels: [CGFloat],
        loopStartTime: TimeInterval?,
        loopEndTime: TimeInterval?,
        isLoopEnabled: Bool
    ) {
        let resolvedTitle = title?.trimmingCharacters(in: .whitespacesAndNewlines)
        let shouldShow = (resolvedTitle?.isEmpty == false)

        guard shouldShow || miniPlayerHostingController != nil else { return }

        let nextState = MiniPlayerRenderState(
            title: resolvedTitle,
            isPlaying: isPlaying,
            isLoading: isLoading,
            currentTime: currentTime,
            duration: duration,
            meterLevels: meterLevels,
            loopStartTime: loopStartTime,
            loopEndTime: loopEndTime,
            isLoopEnabled: isLoopEnabled
        )
        if lastMiniPlayerRenderState == nextState {
            return
        }
        lastMiniPlayerRenderState = nextState

        if shouldShow, let resolvedTitle {
            miniPlayerHostingController?.rootView = EditorMiniPlayerBar(
                title: resolvedTitle,
                isPlaying: isPlaying,
                isLoading: isLoading,
                currentTime: currentTime,
                duration: duration,
                meterLevels: meterLevels,
                loopStartTime: loopStartTime,
                loopEndTime: loopEndTime,
                isLoopEnabled: isLoopEnabled,
                onTogglePlayPause: { [weak self] in
                    self?.onMiniPlayerTogglePlayPause?()
                },
                onStop: { [weak self] in
                    self?.onMiniPlayerStop?()
                },
                onMarkLoopStart: { [weak self] in
                    self?.onMiniPlayerMarkLoopStart?()
                },
                onMarkLoopEnd: { [weak self] in
                    self?.onMiniPlayerMarkLoopEnd?()
                },
                onToggleLoop: { [weak self] in
                    self?.onMiniPlayerToggleLoop?()
                },
                onClearLoop: { [weak self] in
                    self?.onMiniPlayerClearLoop?()
                }
            )
            setMiniPlayerVisible(true)
        } else {
            setMiniPlayerVisible(false)
        }
    }

    private func setMiniPlayerVisible(_ isVisible: Bool) {
        guard let miniPlayerView = miniPlayerHostingController?.view else { return }

        if isVisible {
            if miniPlayerHeightZero?.isActive == true {
                miniPlayerHeightZero?.isActive = false
            }
            miniPlayerView.isHidden = false
        } else {
            miniPlayerHeightZero?.isActive = true
            miniPlayerView.isHidden = true
        }
    }

    private func setSuggestionsVisible(_ isVisible: Bool) {
        let shouldShow = isVisible

        guard let suggestionsView = suggestionsHostingController?.view else { return }

        if shouldShow {
            if suggestionsHeightZero?.isActive == true {
                suggestionsHeightZero?.isActive = false
            }
            suggestionsView.isHidden = false
        } else {
            suggestionsHeightZero?.isActive = true
            suggestionsView.isHidden = true
        }
    }

    private func setFocus(_ isFocused: Bool) {
        if isFocused {
            if !textView.isFirstResponder {
                textView.becomeFirstResponder()
            }
        } else {
            if textView.isFirstResponder {
                textView.resignFirstResponder()
            }
        }
        reportUndoAvailability()
    }

    private func reportUndoAvailability() {
        onUndoStateChanged?(canUndo, canRedo)
    }

    func performUndo() {
        textView.undoManager?.undo()
        onTextChanged?(textView.text)
        onSelectionChanged?(textView.selectedRange)
        reportUndoAvailability()
    }

    func performRedo() {
        textView.undoManager?.redo()
        onTextChanged?(textView.text)
        onSelectionChanged?(textView.selectedRange)
        reportUndoAvailability()
    }

    private func ensureCaretVisible(reason: EnsureCaretReason, animated: Bool) {
        if isUserScrolling {
            return
        }
        guard textView.isFirstResponder else { return }
        guard let selectedTextRange = textView.selectedTextRange else { return }

        let caret = textView.caretRect(for: selectedTextRange.end)
        let paddingTop: CGFloat = 12
        let paddingBottom: CGFloat = 18

        var target = caret
        target.origin.y -= paddingTop
        target.size.height += paddingTop + paddingBottom

        let inset = textView.adjustedContentInset
        let visibleRect = CGRect(
            x: textView.contentOffset.x,
            y: textView.contentOffset.y + inset.top,
            width: textView.bounds.width,
            height: max(0, textView.bounds.height - inset.top - inset.bottom)
        )
        let isOutOfView = target.minY < visibleRect.minY || target.maxY > visibleRect.maxY
        if !isOutOfView {
            return
        }

        switch reason {
        case .typing, .insertion, .focus, .externalUpdate:
            break
        }
        textView.scrollRectToVisible(target, animated: animated)
    }

    private func insertSuggestion(_ word: String) {
        guard textView.markedTextRange == nil else { return }

        let selected = textView.selectedRange
        let nsText = textView.text as NSString? ?? "" as NSString

        var suffix = " "
        let insertionEnd = selected.location + selected.length
        if insertionEnd < nsText.length {
            let next = nsText.character(at: insertionEnd)
            if let scalar = UnicodeScalar(next), CharacterSet.whitespacesAndNewlines.contains(scalar) {
                suffix = ""
            }
        }

        let replacement = word + suffix

        isPerformingProgrammaticEdit = true
        if let range = textView.selectedTextRange {
            textView.replace(range, withText: replacement)
        } else {
            // Fallback to textStorage replacement.
            textView.textStorage.replaceCharacters(in: selected, with: replacement)
        }

        let newCursor = selected.location + (replacement as NSString).length
        textView.selectedRange = NSRange(location: newCursor, length: 0)
        isPerformingProgrammaticEdit = false

        onTextChanged?(textView.text)
        onSelectionChanged?(textView.selectedRange)
        onSuggestionAccepted?(word)

        ensureCaretVisible(reason: .insertion, animated: false)
        reportUndoAvailability()
    }
}

extension EditorTextViewController: UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {
        guard !isApplyingExternalText else { return }
        guard !isPerformingProgrammaticEdit else { return }
        onTextChanged?(textView.text)
        ensureCaretVisible(reason: .typing, animated: false)
        reportUndoAvailability()
    }

    func textViewDidChangeSelection(_ textView: UITextView) {
        guard !isApplyingExternalSelection else { return }
        guard !isPerformingProgrammaticEdit else { return }
        onSelectionChanged?(textView.selectedRange)
    }

    func textViewDidBeginEditing(_ textView: UITextView) {
        onFocusChanged?(true)
        ensureCaretVisible(reason: .focus, animated: false)
        reportUndoAvailability()
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        onFocusChanged?(false)
        reportUndoAvailability()
    }
}

extension EditorTextViewController: UIScrollViewDelegate {
    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        isUserScrolling = true
    }

    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        if !decelerate {
            isUserScrolling = false
            applyPendingHighlightsIfNeeded()
        }
    }

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        isUserScrolling = false
        applyPendingHighlightsIfNeeded()
    }
}

#endif
