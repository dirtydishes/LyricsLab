import SwiftUI

struct EditorMiniPlayerBar: View {
    var title: String
    var isPlaying: Bool
    var isLoading: Bool
    var onTogglePlayPause: () -> Void
    var onStop: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Divider()
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
            onTogglePlayPause: {},
            onStop: {}
        )
        .previewLayout(.sizeThatFits)
    }
}

