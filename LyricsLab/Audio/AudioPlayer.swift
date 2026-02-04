import Foundation
import Combine

#if canImport(AVFoundation)
import AVFoundation
#endif

@MainActor
final class AudioPlayer: NSObject, ObservableObject {
    struct Track: Equatable {
        var url: URL
        var displayName: String
    }

    @Published private(set) var track: Track?
    @Published private(set) var isPlaying: Bool = false
    @Published private(set) var isLoading: Bool = false
    @Published var lastErrorMessage: String?

    #if canImport(AVFoundation)
    private var player: AVAudioPlayer?
    #endif

    func importAndLoad(from sourceURL: URL) {
        isLoading = true
        lastErrorMessage = nil

        Task.detached(priority: .utility) { [weak self] in
            guard let self else { return }

            do {
                let destURL = try Self.copyIntoSandbox(sourceURL: sourceURL)
                await self.load(from: destURL)
            } catch {
                await MainActor.run {
                    self.isLoading = false
                    self.lastErrorMessage = "Couldn't import audio file: \(error.localizedDescription)"
                }
            }
        }
    }

    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }

    func play() {
        #if canImport(AVFoundation)
        guard let player else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true, options: [])
        } catch {
            // Best-effort: playback may still work; don't hard-fail.
        }
        player.play()
        isPlaying = true
        #endif
    }

    func pause() {
        #if canImport(AVFoundation)
        player?.pause()
        #endif
        isPlaying = false
    }

    func stop() {
        #if canImport(AVFoundation)
        player?.stop()
        player = nil
        #endif
        track = nil
        isPlaying = false
        isLoading = false
    }

    private func load(from url: URL) async {
        #if canImport(AVFoundation)
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.delegate = self
            p.prepareToPlay()

            let displayName = url.deletingPathExtension().lastPathComponent
            track = Track(url: url, displayName: displayName.isEmpty ? url.lastPathComponent : displayName)
            player = p
            isPlaying = false
            isLoading = false
        } catch {
            isLoading = false
            lastErrorMessage = "Couldn't load audio file: \(error.localizedDescription)"
        }
        #else
        isLoading = false
        lastErrorMessage = "Audio playback isn't available on this platform."
        #endif
    }

    nonisolated private static func copyIntoSandbox(sourceURL: URL) throws -> URL {
        let fm = FileManager.default

        let baseDir = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let dir = baseDir
            .appendingPathComponent("LyricsLab", isDirectory: true)
            .appendingPathComponent("AudioImports", isDirectory: true)
        try fm.createDirectory(at: dir, withIntermediateDirectories: true)

        let ext = sourceURL.pathExtension
        let filename = UUID().uuidString + (ext.isEmpty ? "" : ".\(ext)")
        let dest = dir.appendingPathComponent(filename, isDirectory: false)

        let needsSecurityScope = sourceURL.startAccessingSecurityScopedResource()
        defer {
            if needsSecurityScope {
                sourceURL.stopAccessingSecurityScopedResource()
            }
        }

        do {
            try fm.copyItem(at: sourceURL, to: dest)
        } catch {
            // If we collide (or previously imported), overwrite.
            try? fm.removeItem(at: dest)
            try fm.copyItem(at: sourceURL, to: dest)
        }

        return dest
    }
}

#if canImport(AVFoundation)
extension AudioPlayer: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isPlaying = false
        }
    }
}
#endif
