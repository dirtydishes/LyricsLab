// LyricsLabApp.swift

import SwiftUI
import SwiftData

@main
struct LyricsLabApp: App {
    @StateObject private var themeManager = ThemeManager()
    @StateObject private var audioPlayer = AudioPlayer()

    private let modelContainer: ModelContainer = {
        do {
            return try PersistenceFactory.makeContainer(iCloudSyncEnabled: UserDefaults.standard.object(forKey: "icloudSyncEnabled") as? Bool ?? true)
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(themeManager)
                .environmentObject(audioPlayer)
                .tint(themeManager.theme.accent)
                .preferredColorScheme(themeManager.theme.colorScheme)
                .task(priority: .utility) {
                    await RhymeService.shared.warmUp()
                }
        }
        .modelContainer(modelContainer)
    }
}
