import SwiftUI

struct EditorHelpSheet: View {
    var endRhymeColor: Color
    var internalRhymeColor: Color

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Rhyme Assist")
                            .font(.title2.weight(.bold))
                        Text("We built a bunch of little “craft superpowers” into this editor. Here’s what you’re seeing, and how to use it without breaking your flow.")
                            .foregroundStyle(.secondary)
                    }

                    GroupBox("Suggestion colors") {
                        VStack(alignment: .leading, spacing: 10) {
                            LegendRow(
                                dotColor: endRhymeColor,
                                borderColor: endRhymeColor.opacity(0.30),
                                borderStyle: StrokeStyle(lineWidth: 1),
                                title: "End rhyme (perfect match)",
                                subtitle: "Rhymes with the active end-of-line pattern inferred from your recent line endings."
                            )
                            LegendRow(
                                dotColor: endRhymeColor.opacity(0.72),
                                borderColor: endRhymeColor.opacity(0.30),
                                borderStyle: StrokeStyle(lineWidth: 1, dash: [4, 3]),
                                title: "End rhyme (near match)",
                                subtitle: "Close rhyme (slant). Still useful, but not a full lock."
                            )
                            LegendRow(
                                dotColor: internalRhymeColor,
                                borderColor: internalRhymeColor.opacity(0.30),
                                borderStyle: StrokeStyle(lineWidth: 1),
                                title: "Internal rhyme (perfect match)",
                                subtitle: "Rhymes with the last completed word in your current line."
                            )
                            LegendRow(
                                dotColor: internalRhymeColor.opacity(0.72),
                                borderColor: internalRhymeColor.opacity(0.30),
                                borderStyle: StrokeStyle(lineWidth: 1, dash: [4, 3]),
                                title: "Internal rhyme (near match)",
                                subtitle: "Close internal rhyme (slant)."
                            )

                            Divider().opacity(0.5)

                            BadgeRow(
                                systemName: "star.circle.fill",
                                title: "Personal boost",
                                subtitle: "You’ve accepted this word before, so we’ll surface it more often."
                            )
                            BadgeRow(
                                systemName: "repeat.circle.fill",
                                title: "Already used nearby",
                                subtitle: "You used it in the last few lines. We down-rank repeats, but keep them if they fit."
                            )
                            BadgeRow(
                                systemName: "equal.circle.fill",
                                title: "Same as anchor",
                                subtitle: "It matches your anchor word exactly (you might want it for emphasis)."
                            )

                            Text("Tip: long-press any suggestion to see why it’s here.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .padding(.top, 4)
                        }
                        .padding(.vertical, 4)
                    }

                    GroupBox("Highlights in your lyrics") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("We also mark rhyme structure directly in your text:")
                                .foregroundStyle(.secondary)

                            HighlightRow(
                                title: "End rhymes",
                                subtitle: "Stronger highlight on line-ending words that rhyme with each other."
                            )
                            HighlightRow(
                                title: "Internal rhymes",
                                subtitle: "Lighter treatment for rhymes inside a line (and connected across nearby lines)."
                            )
                            HighlightRow(
                                title: "Near rhymes",
                                subtitle: "Dotted underline for “close” matches when they form real groups."
                            )
                        }
                        .padding(.vertical, 4)
                    }

                    GroupBox("End target (1 vs 2)") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("This controls how strict end rhymes are:")
                                .foregroundStyle(.secondary)
                            Text("• **1**: faster and looser (great for drafting)\n• **2**: tighter, punchier end rhymes (great for polishing)")
                                .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }

                    GroupBox("Why would I see the same word?") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Sometimes repeating a word is actually the move (hooks, emphasis, parallel bars).")
                                .foregroundStyle(.secondary)
                            Text("If a suggestion is the same as your anchor word or something you just used, we label it with a badge so you can tell it’s intentional—not a bug.")
                                .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }
                }
                .padding(16)
            }
            .navigationTitle("Help")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .keyboardShortcut(.cancelAction)
                }
            }
        }
    }
}

private struct LegendRow: View {
    var dotColor: Color
    var borderColor: Color
    var borderStyle: StrokeStyle
    var title: String
    var subtitle: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            HStack(spacing: 8) {
                Circle()
                    .fill(dotColor)
                    .frame(width: 8, height: 8)

                Capsule(style: .continuous)
                    .fill(.ultraThinMaterial)
                    .frame(width: 44, height: 18)
                    .overlay(
                        Capsule(style: .continuous)
                            .strokeBorder(borderColor, style: borderStyle)
                    )
            }
            .padding(.top, 3)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct BadgeRow: View {
    var systemName: String
    var title: String
    var subtitle: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemName)
                .imageScale(.medium)
                .foregroundStyle(.secondary)
                .frame(width: 22)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct HighlightRow: View {
    var title: String
    var subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            Text(subtitle)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}
