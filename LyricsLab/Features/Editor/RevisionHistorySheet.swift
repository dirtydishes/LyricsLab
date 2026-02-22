import SwiftUI

struct RevisionHistorySheet: View {
    var revisions: [CompositionRevision]
    var accent: Color
    var onRestore: (CompositionRevision) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var pendingRestore: CompositionRevision?

    var body: some View {
        NavigationStack {
            Group {
                if revisions.isEmpty {
                    ContentUnavailableView(
                        "No Revisions Yet",
                        systemImage: "clock.arrow.circlepath",
                        description: Text("Backups will appear after edits or when you create a manual backup.")
                    )
                } else {
                    List(revisions) { revision in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 8) {
                                Text(revision.createdAt, style: .date)
                                    .font(.subheadline.weight(.semibold))
                                Text(revision.createdAt, style: .time)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                TriggerChip(
                                    trigger: revision.trigger,
                                    isMilestone: revision.isMilestone,
                                    accent: accent
                                )
                            }

                            HStack(spacing: 12) {
                                Label("\(revision.changedLineCount) lines", systemImage: "text.alignleft")
                                Label("\(revision.changedCharCount) chars", systemImage: "character.cursor.ibeam")
                                Text("\(Int((revision.changeRatio * 100).rounded()))%")
                            }
                            .font(.caption)
                            .foregroundStyle(.secondary)

                            if let note = revision.note, !note.isEmpty {
                                Text(note)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Button {
                                pendingRestore = revision
                            } label: {
                                Label("Restore This Revision", systemImage: "arrow.counterclockwise")
                            }
                            .buttonStyle(.borderless)
                        }
                        .padding(.vertical, 4)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Revisions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .alert("Restore Revision?", isPresented: Binding(get: {
            pendingRestore != nil
        }, set: { showing in
            if !showing {
                pendingRestore = nil
            }
        })) {
            Button("Cancel", role: .cancel) {
                pendingRestore = nil
            }
            Button("Restore", role: .destructive) {
                guard let pendingRestore else { return }
                onRestore(pendingRestore)
                self.pendingRestore = nil
            }
        } message: {
            Text("Current text will be replaced. A pre-restore backup will be saved first.")
        }
    }
}

private struct TriggerChip: View {
    var trigger: RevisionTrigger
    var isMilestone: Bool
    var accent: Color

    var body: some View {
        Text(isMilestone ? "Milestone" : trigger.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule(style: .continuous)
                    .fill(accent.opacity(0.18))
            )
            .overlay(
                Capsule(style: .continuous)
                    .strokeBorder(accent.opacity(0.42), lineWidth: 1)
            )
    }
}
