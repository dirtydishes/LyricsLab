import SwiftUI

struct KeyboardShortcutsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var themeManager: ThemeManager

    let sections: [KeyboardShortcutSection]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    introCard

                    ForEach(sections) { section in
                        shortcutSectionCard(section)
                    }
                }
                .padding(20)
                .frame(maxWidth: 760)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .background(themeManager.theme.backgroundGradient.ignoresSafeArea())
            .navigationTitle("Keyboard Shortcuts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .keyboardShortcut(.escape, modifiers: [])
                }
            }
        }
    }

    private var introCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Magic Keyboard ready")
                .font(.title3.weight(.semibold))
                .foregroundStyle(themeManager.theme.textPrimary)

            Text("Hold ⌘ anytime to open the system shortcut HUD.")
                .font(.callout)
                .foregroundStyle(themeManager.theme.textSecondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(themeManager.theme.surface.opacity(0.9), lineWidth: 1)
        }
    }

    private func shortcutSectionCard(_ section: KeyboardShortcutSection) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(section.title)
                .font(.headline.weight(.semibold))
                .foregroundStyle(themeManager.theme.textPrimary)

            ForEach(section.items) { item in
                KeyboardShortcutRow(item: item)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(themeManager.theme.surface.opacity(0.9), lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(themeManager.theme.colorScheme == .dark ? 0.2 : 0.08), radius: 12, x: 0, y: 6)
    }
}

private struct KeyboardShortcutRow: View {
    @EnvironmentObject private var themeManager: ThemeManager

    let item: KeyboardShortcutItem

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(themeManager.theme.textPrimary)

                if let context = item.context {
                    Text(context)
                        .font(.footnote)
                        .foregroundStyle(themeManager.theme.textSecondary)
                }
            }

            Spacer(minLength: 12)

            KeyboardShortcutKeyCaps(keys: item.keys)
        }
        .padding(.vertical, 2)
    }
}

private struct KeyboardShortcutKeyCaps: View {
    @EnvironmentObject private var themeManager: ThemeManager

    let keys: [KeyboardShortcutKey]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(Array(keys.enumerated()), id: \.offset) { index, key in
                if index > 0 {
                    Text("+")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(themeManager.theme.textSecondary)
                }
                KeyboardShortcutKeyCap(label: key.label)
            }
        }
    }
}

private struct KeyboardShortcutKeyCap: View {
    @EnvironmentObject private var themeManager: ThemeManager

    let label: String

    var body: some View {
        Text(label)
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundStyle(themeManager.theme.textPrimary)
            .lineLimit(1)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(themeManager.theme.surface.opacity(0.92), lineWidth: 1)
            }
    }
}
