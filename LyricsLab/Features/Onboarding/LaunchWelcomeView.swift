import SwiftUI

struct LaunchWelcomeView: View {
    @EnvironmentObject private var themeManager: ThemeManager

    var onDismiss: () -> Void

    private var appName: String {
        themeManager.themeID == .davyDollas ? "Lyric$Lab" : "LyricsLab"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                themeManager.theme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Thanks for testing \(appName)!")
                                .font(.title2.weight(.bold))
                            Text("This early build focuses on the core writing loop. Your feedback will shape what we add next.")
                                .foregroundStyle(.secondary)
                        }

                        GroupBox {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("• Create a composition from Home with the + button, or open an existing draft.")
                                Text("• Titles and lyrics auto-save as you type.")
                                Text("• Import a reference track with the music note button to play along.")
                                Text("• Accepted suggestions teach the app your personal word choices.")
                            }
                            .font(.subheadline)
                            .foregroundStyle(themeManager.theme.textSecondary)
                            .padding(.vertical, 4)
                        } label: {
                            Text("How \(appName) works")
                        }

                        GroupBox("Rhyme highlighting") {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("• End rhymes: stronger highlight on line-ending words that rhyme.")
                                Text("• Internal rhymes: lighter highlight inside lines and nearby lines.")
                                Text("• Near rhymes: dotted underline for close matches.")
                            }
                            .font(.subheadline)
                            .foregroundStyle(themeManager.theme.textSecondary)
                            .padding(.vertical, 4)
                        }

                        GroupBox("Suggestions") {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("• The bar targets end rhymes from your recent line endings and internal rhymes from the word at your cursor.")
                                Text("• End target 1 is looser for drafting; 2 is tighter for polishing.")
                                Text("• Long-press a suggestion to see why it appears.")
                                Text("• Tap the ? button in the bar for the full legend.")
                            }
                            .font(.subheadline)
                            .foregroundStyle(themeManager.theme.textSecondary)
                            .padding(.vertical, 4)
                        }

                        GroupBox("Settings") {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("• Tap the gear to change themes and iCloud sync.")
                                Text("• Themes also change highlight colors so rhyme groups stay readable.")
                            }
                            .font(.subheadline)
                            .foregroundStyle(themeManager.theme.textSecondary)
                            .padding(.vertical, 4)
                        }

                        GroupBox("Looking ahead") {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("• Export and share options for drafts.")
                                Text("• Faster analysis for long songs and smoother scrolling.")
                                Text("• More rhyme controls for multis, stress, and custom dictionaries.")
                            }
                            .font(.subheadline)
                            .foregroundStyle(themeManager.theme.textSecondary)
                            .padding(.vertical, 4)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Please send feedback at any time.")
                                .font(.headline)
                            Text("If you are testing via TestFlight, use Send Feedback. Otherwise, share notes with whoever provided this build.")
                                .foregroundStyle(.secondary)
                        }

                        Button {
                            onDismiss()
                        } label: {
                            Text("Start Writing")
                                .frame(maxWidth: .infinity)
                        }
                        .keyboardShortcut(.escape, modifiers: [])
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Welcome")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        onDismiss()
                    }
                    .keyboardShortcut(.escape, modifiers: [])
                }
            }
        }
    }
}

struct LaunchWelcomeView_Previews: PreviewProvider {
    static var previews: some View {
        LaunchWelcomeView(onDismiss: {})
            .environmentObject(ThemeManager())
    }
}
