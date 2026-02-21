import SwiftUI

struct EditorSuggestionsBar: View {
    var suggestions: [RhymeSuggestion]
    var isLoading: Bool = false
    var barPosition: BarPosition? = nil
    var endRhymeTailLength: Int = 1
    var onSetEndRhymeTailLength: ((Int) -> Void)? = nil
    var endRhymeColor: Color = .blue
    var internalRhymeColor: Color = .purple
    var onInsert: (String) -> Void

    @State private var isShowingHelp = false

    var body: some View {
        VStack(spacing: 0) {
            Divider()

            if let barPosition {
                BarRulerView(barPosition: barPosition)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
            }

            if let onSetEndRhymeTailLength {
                HStack(spacing: 10) {
                    Text("End target")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)

                    Picker(
                        "End rhyme target",
                        selection: Binding(
                            get: { max(1, min(2, endRhymeTailLength)) },
                            set: { onSetEndRhymeTailLength($0) }
                        )
                    ) {
                        Text("1").tag(1)
                        Text("2").tag(2)
                    }
                    .pickerStyle(.segmented)

                    Spacer(minLength: 8)

                    Button {
                        isShowingHelp = true
                    } label: {
                        Image(systemName: "questionmark.circle")
                            .imageScale(.medium)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Help")
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 8)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 10) {
                    if suggestions.isEmpty {
                        HStack(spacing: 10) {
                            if isLoading {
                                ProgressView()
                                    .controlSize(.small)
                            }
                            Text(isLoading ? "Loading rhymes..." : "No suggestions")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                    } else {
                        ForEach(suggestions) { suggestion in
                            Button {
                                onInsert(suggestion.display)
                            } label: {
                                SuggestionChip(
                                    suggestion: suggestion,
                                    endRhymeColor: endRhymeColor,
                                    internalRhymeColor: internalRhymeColor
                                )
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                SuggestionContextMenu(suggestion: suggestion)
                            }
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
        }
        .background(.thinMaterial)
        .sheet(isPresented: $isShowingHelp) {
            EditorHelpSheet(endRhymeColor: endRhymeColor, internalRhymeColor: internalRhymeColor)
        }
    }
}

private struct SuggestionChip: View {
    var suggestion: RhymeSuggestion
    var endRhymeColor: Color
    var internalRhymeColor: Color

    private var baseColor: Color {
        switch suggestion.target {
        case .endRhyme:
            return endRhymeColor
        case .internalRhyme:
            return internalRhymeColor
        }
    }

    private var borderStyle: StrokeStyle {
        switch suggestion.match {
        case .exact:
            return StrokeStyle(lineWidth: 1)
        case .near:
            return StrokeStyle(lineWidth: 1, dash: [4, 3])
        }
    }

    private var badgeSystemName: String? {
        if suggestion.isSameAsAnchorWord {
            return "equal.circle.fill"
        }
        if suggestion.isAlreadyUsedNearby {
            return "repeat.circle.fill"
        }
        if suggestion.isPersonal {
            return "star.circle.fill"
        }
        return nil
    }

    var body: some View {
        let color = (suggestion.match == .exact) ? baseColor : baseColor.opacity(0.72)
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text(suggestion.display)
                .font(.subheadline.weight(.semibold))

            if let badgeSystemName {
                Image(systemName: badgeSystemName)
                    .imageScale(.small)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule(style: .continuous)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            Capsule(style: .continuous)
                .strokeBorder(color.opacity(0.30), style: borderStyle)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(suggestion.display)
        .accessibilityHint(SuggestionContextMenu.hintText(for: suggestion))
    }
}

private struct SuggestionContextMenu: View {
    var suggestion: RhymeSuggestion

    static func hintText(for suggestion: RhymeSuggestion) -> String {
        let target: String
        switch suggestion.target {
        case .endRhyme:
            target = "End rhyme"
        case .internalRhyme:
            target = "Internal rhyme"
        }

        let match: String
        switch suggestion.match {
        case .exact:
            match = "exact"
        case .near:
            match = "near"
        }

        var parts: [String] = ["\(target) (\(match))"]
        if suggestion.isPersonal { parts.append("boosted") }
        if suggestion.isAlreadyUsedNearby { parts.append("already used") }
        if suggestion.isSameAsAnchorWord { parts.append("same as anchor") }
        return parts.joined(separator: ", ")
    }

    private var targetTitle: String {
        switch suggestion.target {
        case .endRhyme:
            return "End rhyme"
        case .internalRhyme:
            return "Internal rhyme"
        }
    }

    private var matchTitle: String {
        switch suggestion.match {
        case .exact:
            return "Perfect match"
        case .near:
            return "Near match"
        }
    }

    var body: some View {
        Text("\(targetTitle) • \(matchTitle)")

        if let anchor = suggestion.anchorWord?.trimmingCharacters(in: .whitespacesAndNewlines),
           !anchor.isEmpty,
           suggestion.isSameAsAnchorWord {
            Text("Same as anchor word (“\(anchor)”).")
        } else if let anchor = suggestion.anchorWord?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !anchor.isEmpty {
            switch suggestion.target {
            case .internalRhyme:
                Text("Anchored to your last word (“\(anchor)”).")
            case .endRhyme:
                Text("Anchored to a recent line ending (“\(anchor)”).")
            }
        }

        if suggestion.isPersonal {
            Text("Boosted because you’ve accepted it before.")
        }
        if suggestion.isAlreadyUsedNearby {
            Text("Already used nearby (we still surface it if it fits).")
        }
    }
}

private struct BarRulerView: View {
    var barPosition: BarPosition

    var body: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                ForEach(0..<16, id: \.self) { idx in
                    Capsule(style: .continuous)
                        .fill(idx == barPosition.step ? Color.primary.opacity(0.70) : Color.primary.opacity(0.18))
                        .frame(width: 10, height: 4)
                }
            }

            Spacer(minLength: 6)

            Text("\(barPosition.syllablesBeforeCaret)/\(barPosition.totalSyllables)")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)

            if barPosition.lowConfidenceTokenCount > 0 {
                Text("est")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Bar position")
        .accessibilityValue("Step \(barPosition.step + 1) of 16")
    }
}

struct EditorSuggestionsBar_Previews: PreviewProvider {
    static var previews: some View {
        EditorSuggestionsBar(
            suggestions: [
                RhymeSuggestion(
                    display: "time",
                    normalized: "time",
                    target: .endRhyme,
                    match: .exact,
                    isPersonal: false,
                    isAlreadyUsedNearby: false,
                    isSameAsAnchorWord: false,
                    anchorWord: "time"
                ),
                RhymeSuggestion(
                    display: "rhyme",
                    normalized: "rhyme",
                    target: .endRhyme,
                    match: .near,
                    isPersonal: true,
                    isAlreadyUsedNearby: false,
                    isSameAsAnchorWord: false,
                    anchorWord: "time"
                ),
                RhymeSuggestion(
                    display: "shine",
                    normalized: "shine",
                    target: .internalRhyme,
                    match: .exact,
                    isPersonal: false,
                    isAlreadyUsedNearby: true,
                    isSameAsAnchorWord: false,
                    anchorWord: "line"
                ),
            ],
            barPosition: BarPosition(step: 6, syllablesBeforeCaret: 7, totalSyllables: 15, lowConfidenceTokenCount: 1),
            endRhymeTailLength: 2,
            onSetEndRhymeTailLength: { _ in }
        ) { _ in }
            .previewLayout(.sizeThatFits)
    }
}
