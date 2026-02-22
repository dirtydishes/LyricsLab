import SwiftUI

private struct RowFramePreferenceKey: PreferenceKey {
    static var defaultValue: [Int: CGRect] = [:]

    static func reduce(value: inout [Int: CGRect], nextValue: () -> [Int: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { $1 })
    }
}

struct LineRearrangeView: View {
    var lines: [String]
    var selectedRange: ClosedRange<Int>?
    var accent: Color
    var onSelectLine: (Int) -> Void
    var onMoveSelection: (Int) -> Void

    @State private var rowFrames: [Int: CGRect] = [:]
    @State private var dropInsertionIndex: Int?

    var body: some View {
        VStack(spacing: 0) {
            Divider()

            ScrollView {
                ZStack(alignment: .topLeading) {
                    LazyVStack(spacing: 0) {
                        ForEach(Array(lines.enumerated()), id: \.offset) { index, line in
                            row(for: index, line: line)
                        }
                    }

                    if let dropInsertionIndex,
                       let indicatorY = indicatorY(for: dropInsertionIndex) {
                        Rectangle()
                            .fill(accent)
                            .frame(height: 2)
                            .padding(.horizontal, 12)
                            .offset(y: indicatorY - 1)
                            .allowsHitTesting(false)
                    }
                }
                .coordinateSpace(name: "line-rearrange-space")
                .onPreferenceChange(RowFramePreferenceKey.self) { frames in
                    rowFrames = frames
                }
            }
        }
    }

    private func row(for index: Int, line: String) -> some View {
        let isSelected = selectedRange?.contains(index) ?? false
        let isSelectionStart = selectedRange?.lowerBound == index
        let isSelectionEnd = selectedRange?.upperBound == index

        return HStack(spacing: 10) {
            Text("\(index + 1)")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
                .frame(width: 30, alignment: .trailing)

            Text(line.isEmpty ? " " : line)
                .font(.body)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineLimit(nil)
                .padding(.vertical, 10)
                .contentShape(Rectangle())

            if isSelectionStart {
                Image(systemName: "line.3.horizontal")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(accent)
                    .frame(width: 30, height: 30)
                    .background(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(accent.opacity(0.16))
                    )
                    .gesture(dragGesture(forSelectionStart: index))
                    .accessibilityLabel("Move selected lines")
            } else {
                Color.clear.frame(width: 30, height: 30)
            }
        }
        .padding(.horizontal, 12)
        .background(
            Group {
                if isSelected {
                    accent.opacity(0.16)
                } else {
                    Color.clear
                }
            }
        )
        .overlay {
            if isSelected {
                SelectionOutline(
                    color: accent.opacity(0.74),
                    showTop: isSelectionStart,
                    showBottom: isSelectionEnd
                )
            }
        }
        .background(
            GeometryReader { proxy in
                Color.clear.preference(
                    key: RowFramePreferenceKey.self,
                    value: [index: proxy.frame(in: .named("line-rearrange-space"))]
                )
            }
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onSelectLine(index)
        }
    }

    private func dragGesture(forSelectionStart _: Int) -> some Gesture {
        DragGesture(minimumDistance: 4, coordinateSpace: .named("line-rearrange-space"))
            .onChanged { value in
                guard let selectedRange else { return }
                guard let sourceFrame = rowFrames[selectedRange.lowerBound] else { return }

                let dragY = sourceFrame.midY + value.translation.height
                dropInsertionIndex = insertionIndex(for: dragY)
            }
            .onEnded { _ in
                guard let dropInsertionIndex else { return }
                onMoveSelection(dropInsertionIndex)
                self.dropInsertionIndex = nil
            }
    }

    private func insertionIndex(for y: CGFloat) -> Int {
        guard !lines.isEmpty else { return 0 }

        for index in lines.indices {
            guard let frame = rowFrames[index] else { continue }
            if y < frame.midY {
                return index
            }
        }
        return lines.count
    }

    private func indicatorY(for insertionIndex: Int) -> CGFloat? {
        guard !lines.isEmpty else { return nil }
        if insertionIndex <= 0 {
            return rowFrames[0]?.minY
        }
        if insertionIndex >= lines.count {
            return rowFrames[lines.count - 1]?.maxY
        }
        return rowFrames[insertionIndex]?.minY
    }
}

private struct SelectionOutline: View {
    var color: Color
    var showTop: Bool
    var showBottom: Bool

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            Path { path in
                path.move(to: CGPoint(x: 0, y: 0))
                path.addLine(to: CGPoint(x: 0, y: height))
                path.move(to: CGPoint(x: width, y: 0))
                path.addLine(to: CGPoint(x: width, y: height))
                if showTop {
                    path.move(to: CGPoint(x: 0, y: 0))
                    path.addLine(to: CGPoint(x: width, y: 0))
                }
                if showBottom {
                    path.move(to: CGPoint(x: 0, y: height))
                    path.addLine(to: CGPoint(x: width, y: height))
                }
            }
            .stroke(color, lineWidth: 1.4)
        }
    }
}

struct LineRearrangeView_Previews: PreviewProvider {
    static var previews: some View {
        LineRearrangeView(
            lines: ["Line one", "Line two", "", "Line four"],
            selectedRange: 1...2,
            accent: .blue,
            onSelectLine: { _ in },
            onMoveSelection: { _ in }
        )
    }
}
