import Foundation

nonisolated struct LyricsSection: Equatable, Sendable {
    var sourceIndex: Int
    var rangeInSource: NSRange
    var text: String
    var title: String
}

nonisolated struct LyricsSectionsParseResult: Equatable, Sendable {
    var sections: [LyricsSection]
    var sourceEndedWithNewline: Bool
}

nonisolated struct LyricsSectionsRearrangeResult: Equatable, Sendable {
    var text: String
    var selectedRange: NSRange
}

nonisolated enum LyricsSections {
    static func parse(text: String) -> LyricsSectionsParseResult {
        let ns = text as NSString
        let endedWithNewline: Bool
        if ns.length > 0 {
            let last = ns.character(at: ns.length - 1)
            endedWithNewline = last == 10 /* \n */ || last == 13 /* \r */
        } else {
            endedWithNewline = false
        }

        var out: [LyricsSection] = []
        out.reserveCapacity(16)

        var currentStart: Int?
        var currentEnd: Int?

        var idx = 0
        while idx < ns.length {
            var lineStart = 0
            var lineEnd = 0
            var contentsEnd = 0
            ns.getLineStart(&lineStart, end: &lineEnd, contentsEnd: &contentsEnd, for: NSRange(location: idx, length: 0))

            let contentRange = NSRange(location: lineStart, length: max(0, contentsEnd - lineStart))
            let lineContent = contentRange.length > 0 ? ns.substring(with: contentRange) : ""
            let isBlank = lineContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

            if isBlank {
                if let s = currentStart, let e = currentEnd, e > s {
                    let rawRange = NSRange(location: s, length: e - s)
                    let rawText = ns.substring(with: rawRange)
                    let normalized = trimLeadingAndTrailingNewlines(rawText)
                    if !normalized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        let sourceIndex = out.count
                        out.append(
                            LyricsSection(
                                sourceIndex: sourceIndex,
                                rangeInSource: rawRange,
                                text: normalized,
                                title: makeTitle(fromSectionText: normalized, fallbackIndex: sourceIndex)
                            )
                        )
                    }
                }
                currentStart = nil
                currentEnd = nil
            } else {
                if currentStart == nil {
                    currentStart = lineStart
                }
                currentEnd = lineEnd
            }

            idx = lineEnd
        }

        if let s = currentStart, let e = currentEnd, e > s {
            let rawRange = NSRange(location: s, length: e - s)
            let rawText = ns.substring(with: rawRange)
            let normalized = trimLeadingAndTrailingNewlines(rawText)
            if !normalized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                let sourceIndex = out.count
                out.append(
                    LyricsSection(
                        sourceIndex: sourceIndex,
                        rangeInSource: rawRange,
                        text: normalized,
                        title: makeTitle(fromSectionText: normalized, fallbackIndex: sourceIndex)
                    )
                )
            }
        }

        return LyricsSectionsParseResult(sections: out, sourceEndedWithNewline: endedWithNewline)
    }

    static func rearrange(
        sourceText: String,
        sourceSelectedRange: NSRange,
        parseResult: LyricsSectionsParseResult,
        order: [Int]
    ) -> LyricsSectionsRearrangeResult {
        let sections = parseResult.sections
        let endedWithNewline = parseResult.sourceEndedWithNewline
        let normalizedSections: [LyricsSection] = order.compactMap { idx in
            guard idx >= 0, idx < sections.count else { return nil }
            return sections[idx]
        }

        let separator = "\n\n"
        var pieces: [String] = []
        pieces.reserveCapacity(normalizedSections.count)
        for s in normalizedSections {
            let trimmed = trimLeadingAndTrailingNewlines(s.text)
            pieces.append(trimmed)
        }

        var newText = pieces.joined(separator: separator)
        if endedWithNewline, !newText.isEmpty {
            newText += "\n"
        }

        let newSel = mapSelection(
            sourceText: sourceText,
            sourceSelectedRange: sourceSelectedRange,
            oldSections: sections,
            newSections: normalizedSections,
            separator: separator,
            endedWithNewline: endedWithNewline
        )

        return LyricsSectionsRearrangeResult(text: newText, selectedRange: newSel)
    }

    private static func mapSelection(
        sourceText: String,
        sourceSelectedRange: NSRange,
        oldSections: [LyricsSection],
        newSections: [LyricsSection],
        separator: String,
        endedWithNewline: Bool
    ) -> NSRange {
        let sourceLen = (sourceText as NSString).length
        var start = sourceSelectedRange.location
        var end = sourceSelectedRange.location + sourceSelectedRange.length
        if start < 0 { start = 0 }
        if end < 0 { end = 0 }
        if start > sourceLen { start = sourceLen }
        if end > sourceLen { end = sourceLen }

        func sectionContaining(pos: Int) -> (section: LyricsSection, offset: Int)? {
            for s in oldSections {
                let lo = s.rangeInSource.location
                let hi = NSMaxRange(s.rangeInSource)
                if pos >= lo && pos <= hi {
                    let rawOffset = pos - lo
                    let maxOffset = (s.text as NSString).length
                    let clamped = max(0, min(maxOffset, rawOffset))
                    return (s, clamped)
                }
            }
            return nil
        }

        let startHit = sectionContaining(pos: start)
        let endHit = sectionContaining(pos: end)

        let sepLen = (separator as NSString).length
        var sectionStartOffsets: [Int: Int] = [:]
        sectionStartOffsets.reserveCapacity(newSections.count)

        var cursor = 0
        for (idx, s) in newSections.enumerated() {
            sectionStartOffsets[s.sourceIndex] = cursor
            cursor += (s.text as NSString).length
            if idx != newSections.count - 1 {
                cursor += sepLen
            }
        }
        if endedWithNewline, cursor > 0 {
            cursor += 1
        }

        func map(hit: (section: LyricsSection, offset: Int)?) -> Int? {
            guard let hit else { return nil }
            guard let base = sectionStartOffsets[hit.section.sourceIndex] else { return nil }
            return base + hit.offset
        }

        if let startHit, let endHit, startHit.section.sourceIndex == endHit.section.sourceIndex {
            if let newStart = map(hit: startHit), let newEnd = map(hit: endHit) {
                let clampedStart = max(0, min(cursor, newStart))
                let clampedEnd = max(clampedStart, min(cursor, newEnd))
                return NSRange(location: clampedStart, length: clampedEnd - clampedStart)
            }
        }

        if let newStart = map(hit: startHit) {
            let clamped = max(0, min(cursor, newStart))
            return NSRange(location: clamped, length: 0)
        }

        // If the selection isn't inside a recognizable section (or that section is removed),
        // keep a safe caret.
        return NSRange(location: 0, length: 0)
    }

    private static func makeTitle(fromSectionText text: String, fallbackIndex: Int) -> String {
        let lines = text.split(whereSeparator: \.isNewline).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        let firstNonEmpty = lines.first(where: { !$0.isEmpty })
        guard let firstNonEmpty else {
            return "Section \(fallbackIndex + 1)"
        }

        if firstNonEmpty.hasPrefix("[") {
            if let close = firstNonEmpty.firstIndex(of: "]"), close > firstNonEmpty.startIndex {
                let inside = firstNonEmpty[firstNonEmpty.index(after: firstNonEmpty.startIndex)..<close]
                let trimmed = inside.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    return String(trimmed)
                }
            }
        }

        if let colon = firstNonEmpty.firstIndex(of: ":"), colon > firstNonEmpty.startIndex {
            let head = firstNonEmpty[..<colon].trimmingCharacters(in: .whitespacesAndNewlines)
            if head.count <= 18, !head.isEmpty {
                return String(head)
            }
        }

        if firstNonEmpty.count <= 28 {
            return String(firstNonEmpty)
        }

        return String(firstNonEmpty.prefix(28)) + "..."
    }

    private static func trimLeadingAndTrailingNewlines(_ s: String) -> String {
        var out = s
        while out.hasPrefix("\n") || out.hasPrefix("\r") {
            out.removeFirst()
        }
        while out.hasSuffix("\n") || out.hasSuffix("\r") {
            out.removeLast()
        }
        return out
    }
}
