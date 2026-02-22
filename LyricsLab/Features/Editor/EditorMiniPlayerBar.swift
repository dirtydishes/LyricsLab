import SwiftUI
import Foundation

struct EditorMiniPlayerBar: View {
    var title: String
    var isPlaying: Bool
    var isLoading: Bool
    var currentTime: TimeInterval
    var duration: TimeInterval
    var meterLevels: [CGFloat]
    var loopStartTime: TimeInterval?
    var loopEndTime: TimeInterval?
    var isLoopEnabled: Bool
    var onTogglePlayPause: () -> Void
    var onStop: () -> Void
    var onMarkLoopStart: () -> Void
    var onMarkLoopEnd: () -> Void
    var onToggleLoop: () -> Void
    var onClearLoop: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Divider()
            VStack(spacing: 8) {
                HStack(spacing: 12) {
                    Image(systemName: "music.note")
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Now Playing")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Text(title)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                    }

                    Spacer(minLength: 8)

                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                    }

                    Button {
                        onTogglePlayPause()
                    } label: {
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .frame(width: 34, height: 34)
                            .background(Circle().fill(.ultraThinMaterial))
                            .overlay(Circle().strokeBorder(.primary.opacity(0.12), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(isPlaying ? "Pause" : "Play")

                    Button {
                        onStop()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                            .frame(width: 30, height: 30)
                            .background(Circle().fill(.ultraThinMaterial))
                            .overlay(Circle().strokeBorder(.primary.opacity(0.10), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Stop")
                }

                HStack(spacing: 10) {
                    MiniMeterView(levels: meterLevels)
                        .frame(width: 66, height: 14)

                    Text("\(formatTime(currentTime)) / \(formatTime(duration))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                        .lineLimit(1)

                    Spacer(minLength: 8)

                    Button("A") {
                        onMarkLoopStart()
                    }
                    .buttonStyle(.borderless)
                    .font(.caption.weight(.semibold))

                    Button("B") {
                        onMarkLoopEnd()
                    }
                    .buttonStyle(.borderless)
                    .font(.caption.weight(.semibold))

                    Button(isLoopEnabled ? "Loop On" : "Loop") {
                        onToggleLoop()
                    }
                    .buttonStyle(.borderless)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(isLoopEnabled ? .green : .secondary)
                    .disabled(loopStartTime == nil || loopEndTime == nil)

                    if loopStartTime != nil || loopEndTime != nil {
                        Button {
                            onClearLoop()
                        } label: {
                            Image(systemName: "arrow.uturn.backward.circle")
                        }
                        .buttonStyle(.plain)
                        .font(.caption)
                        .accessibilityLabel("Clear loop")
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
        }
        .background(.thinMaterial)
    }
}

struct EditorMiniPlayerBar_Previews: PreviewProvider {
    static var previews: some View {
        EditorMiniPlayerBar(
            title: "beat-001",
            isPlaying: true,
            isLoading: false,
            currentTime: 37.2,
            duration: 92.6,
            meterLevels: [0.12, 0.2, 0.15, 0.5, 0.35, 0.7, 0.4, 0.2, 0.55, 0.3],
            loopStartTime: 12,
            loopEndTime: 48,
            isLoopEnabled: true,
            onTogglePlayPause: {},
            onStop: {},
            onMarkLoopStart: {},
            onMarkLoopEnd: {},
            onToggleLoop: {},
            onClearLoop: {}
        )
        .previewLayout(.sizeThatFits)
    }
}

private struct MiniMeterView: View {
    let levels: [CGFloat]

    var body: some View {
        HStack(alignment: .bottom, spacing: 2) {
            ForEach(Array(levels.enumerated()), id: \.offset) { _, level in
                Capsule(style: .continuous)
                    .fill(.secondary.opacity(0.75))
                    .frame(width: 4, height: max(2, 2 + (level * 10)))
            }
        }
    }
}

private func formatTime(_ seconds: TimeInterval) -> String {
    guard seconds.isFinite, seconds > 0 else { return "0:00" }

    let total = Int(seconds.rounded(.down))
    let mins = total / 60
    let secs = total % 60
    return "\(mins):\(String(format: "%02d", secs))"
}
