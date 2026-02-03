import SwiftUI
import Foundation

#if canImport(UIKit)
import UIKit

struct ArrangeSectionsSheet: View {
    fileprivate struct Item: Identifiable, Equatable {
        var id: Int { sourceIndex }
        var sourceIndex: Int
        var title: String
        var preview: String
        var text: String
        var lineCount: Int
    }

    @Environment(\.dismiss) private var dismiss

    private let sourceText: String
    private let sourceSelectedRange: NSRange
    private let parseResult: LyricsSectionsParseResult
    private var onApply: (LyricsSectionsRearrangeResult) -> Void

    @State private var items: [Item]
    @State private var editMode: EditMode = .active

    init(
        sourceText: String,
        sourceSelectedRange: NSRange,
        onApply: @escaping (LyricsSectionsRearrangeResult) -> Void
    ) {
        self.sourceText = sourceText
        self.sourceSelectedRange = sourceSelectedRange
        self.parseResult = LyricsSections.parse(text: sourceText)
        self.onApply = onApply

        let initialItems: [Item] = self.parseResult.sections.map { s in
            let firstLine = s.text
                .split(whereSeparator: \.isNewline)
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .first(where: { !$0.isEmpty })

            let preview = firstLine.map { String($0) } ?? ""
            let lineCount = max(1, s.text.split(omittingEmptySubsequences: false, whereSeparator: \.isNewline).count)

            return Item(
                sourceIndex: s.sourceIndex,
                title: s.title,
                preview: preview,
                text: s.text,
                lineCount: lineCount
            )
        }

        _items = State(initialValue: initialItems)
    }

    var body: some View {
        VStack(spacing: 0) {
            if items.isEmpty {
                VStack(spacing: 12) {
                    Text("No sections to arrange")
                        .font(.headline)
                    Text("Add blank lines between stanzas to create movable sections.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(24)
                Spacer(minLength: 0)
            } else {
                List {
                    Section {
                        ForEach(items) { item in
                            SectionRow(item: item)
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button {
                                        copyToPasteboard(item.text)
                                    } label: {
                                        Label("Copy", systemImage: "doc.on.doc")
                                    }
                                    .tint(.blue)

                                    Button(role: .destructive) {
                                        copyToPasteboard(item.text)
                                        items.removeAll(where: { $0.sourceIndex == item.sourceIndex })
                                    } label: {
                                        Label("Cut", systemImage: "scissors")
                                    }
                                }
                        }
                        .onMove(perform: move)
                    } header: {
                        Text("Drag to reorder")
                    } footer: {
                        Text("Sections are stanzas separated by blank lines. Apply creates one undo step: Rearrange Sections.")
                    }
                }
                .listStyle(.insetGrouped)
                .environment(\.editMode, $editMode)
            }
        }
        .navigationTitle("Arrange Sections")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Apply") {
                    apply()
                }
                .disabled(items.isEmpty)
                .fontWeight(.semibold)
            }
        }
    }

    private func move(from source: IndexSet, to destination: Int) {
        items.move(fromOffsets: source, toOffset: destination)
    }

    private func apply() {
        let order = items.map { $0.sourceIndex }
        let result = LyricsSections.rearrange(
            sourceText: sourceText,
            sourceSelectedRange: sourceSelectedRange,
            parseResult: parseResult,
            order: order
        )
        onApply(result)
        dismiss()
    }

    private func copyToPasteboard(_ text: String) {
        #if canImport(UIKit)
        UIPasteboard.general.string = text + "\n\n"
        #endif
    }
}

private struct SectionRow: View {
    let item: ArrangeSectionsSheet.Item

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.headline)
                if !item.preview.isEmpty {
                    Text(item.preview)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 10)

            Text("\(item.lineCount)")
                .font(.caption.monospacedDigit().weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    Capsule(style: .continuous)
                        .fill(.thinMaterial)
                )
        }
        .padding(.vertical, 4)
    }
}

#else

// Non-UIKit builds don't support the editor surface; keep a stub so the target still compiles.
struct ArrangeSectionsSheet: View {
    var body: some View {
        Text("Arrange Sections is unavailable on this platform")
    }
}

#endif
