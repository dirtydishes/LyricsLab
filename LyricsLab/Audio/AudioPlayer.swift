import Foundation
import Combine
import CoreGraphics

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
    @Published private(set) var currentTime: TimeInterval = 0
    @Published private(set) var duration: TimeInterval = 0
    @Published private(set) var loopStartTime: TimeInterval?
    @Published private(set) var loopEndTime: TimeInterval?
    @Published private(set) var isLoopEnabled: Bool = false
    @Published private(set) var meterLevels: [CGFloat] = Array(repeating: 0.08, count: 10)

    #if canImport(AVFoundation)
    private var player: AVAudioPlayer?
    #endif
    private var playbackTimer: Timer?
    private let minimumLoopSpan: TimeInterval = 0.25

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
        startPlaybackTimer()
        #endif
    }

    func pause() {
        #if canImport(AVFoundation)
        player?.pause()
        #endif
        isPlaying = false
        stopPlaybackTimer()
        decayMeterLevels()
    }

    func stop() {
        #if canImport(AVFoundation)
        player?.stop()
        player = nil
        #endif
        stopPlaybackTimer()
        track = nil
        isPlaying = false
        isLoading = false
        currentTime = 0
        duration = 0
        loopStartTime = nil
        loopEndTime = nil
        isLoopEnabled = false
        meterLevels = Array(repeating: 0.08, count: meterLevels.count)
    }

    func markLoopStart() {
        let cursor = normalizedCurrentTime()
        loopStartTime = cursor
        if let end = loopEndTime, end <= cursor + minimumLoopSpan {
            loopEndTime = nil
        }
        refreshLoopEnabledState()
    }

    func markLoopEnd() {
        guard duration > 0 else { return }

        let cursor = normalizedCurrentTime()
        let start = loopStartTime ?? max(0, cursor - 2.0)
        let end = min(duration, max(start + minimumLoopSpan, cursor))

        loopStartTime = start
        loopEndTime = end
        refreshLoopEnabledState()
    }

    func clearLoop() {
        loopStartTime = nil
        loopEndTime = nil
        isLoopEnabled = false
    }

    func toggleLoopEnabled() {
        guard hasValidLoopRange else {
            isLoopEnabled = false
            return
        }
        isLoopEnabled.toggle()
    }

    private func load(from url: URL) async {
        #if canImport(AVFoundation)
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.delegate = self
            p.isMeteringEnabled = true
            p.prepareToPlay()

            let displayName = url.deletingPathExtension().lastPathComponent
            track = Track(url: url, displayName: displayName.isEmpty ? url.lastPathComponent : displayName)
            player = p
            isPlaying = false
            isLoading = false
            currentTime = 0
            duration = p.duration
            loopStartTime = nil
            loopEndTime = nil
            isLoopEnabled = false
            meterLevels = Array(repeating: 0.08, count: meterLevels.count)
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

    private var hasValidLoopRange: Bool {
        guard let start = loopStartTime, let end = loopEndTime else {
            return false
        }
        return end - start >= minimumLoopSpan
    }

    private func refreshLoopEnabledState() {
        if !hasValidLoopRange {
            isLoopEnabled = false
        } else if isLoopEnabled == false {
            isLoopEnabled = true
        }
    }

    private func normalizedCurrentTime() -> TimeInterval {
        guard duration > 0 else { return 0 }
        return max(0, min(duration, currentTime))
    }

    private func startPlaybackTimer() {
        stopPlaybackTimer()
        let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
            guard let strongSelf = self else { return }
            Task { @MainActor in
                strongSelf.handlePlaybackTick()
            }
        }
        playbackTimer = timer
        RunLoop.main.add(timer, forMode: .common)
    }

    private func stopPlaybackTimer() {
        playbackTimer?.invalidate()
        playbackTimer = nil
    }

    private func handlePlaybackTick() {
        #if canImport(AVFoundation)
        guard let player else { return }

        currentTime = player.currentTime
        duration = player.duration

        if isLoopEnabled,
           let start = loopStartTime,
           let end = loopEndTime,
           end - start >= minimumLoopSpan,
           isPlaying,
           player.currentTime >= end {
            player.currentTime = start
            currentTime = start
        }

        player.updateMeters()
        let averagePower = player.averagePower(forChannel: 0)
        let normalizedPower = max(0, min(1, CGFloat((averagePower + 60) / 60)))
        var nextLevels = meterLevels
        if nextLevels.isEmpty {
            nextLevels = Array(repeating: 0.08, count: 10)
        }
        nextLevels.removeFirst()
        nextLevels.append(max(0.08, normalizedPower))
        meterLevels = nextLevels
        #endif
    }

    private func decayMeterLevels() {
        meterLevels = meterLevels.map { max(0.08, $0 * 0.5) }
    }
}

#if canImport(AVFoundation)
extension AudioPlayer: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isPlaying = false
            self.stopPlaybackTimer()
            self.currentTime = self.duration
            self.decayMeterLevels()
        }
    }
}
#endif
