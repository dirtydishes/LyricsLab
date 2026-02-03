import Foundation
import Testing

@testable import LyricsLab

struct LyricsSectionsTests {
    @Test func parseSplitsStanzasByBlankLines() async throws {
        let text = """
        One line
        Two line

        Three


        Four
        """

        let result = LyricsSections.parse(text: text)
        #expect(result.sections.count == 3)
        #expect(result.sections[0].text == "One line\nTwo line")
        #expect(result.sections[1].text == "Three")
        #expect(result.sections[2].text == "Four")
    }

    @Test func rearrangeMovesSectionAndMapsCaretOffset() async throws {
        let text = """
        One
        Two

        Three
        """

        let ns = text as NSString
        let cursorAtTwo = ("One\n" as NSString).length
        #expect(ns.substring(from: cursorAtTwo).hasPrefix("Two"))

        let parse = LyricsSections.parse(text: text)
        let result = LyricsSections.rearrange(
            sourceText: text,
            sourceSelectedRange: NSRange(location: cursorAtTwo, length: 0),
            parseResult: parse,
            order: [1, 0]
        )

        #expect(result.text == "Three\n\nOne\nTwo\n")

        let expectedCursor = ("Three\n\nOne\n" as NSString).length
        #expect(result.selectedRange.location == expectedCursor)
        #expect(result.selectedRange.length == 0)
    }

    @Test func rearrangePreservesSelectionWithinSameSection() async throws {
        let text = """
        Alpha beta gamma

        Delta epsilon
        """

        let start = ("Alpha " as NSString).length
        let sel = NSRange(location: start, length: ("beta" as NSString).length)

        let parse = LyricsSections.parse(text: text)
        let result = LyricsSections.rearrange(
            sourceText: text,
            sourceSelectedRange: sel,
            parseResult: parse,
            order: [1, 0]
        )

        // "beta" lives in the first section; after reorder it should still be selected.
        let expectedStart = ("Delta epsilon\n\nAlpha " as NSString).length
        #expect(result.selectedRange.location == expectedStart)
        #expect(result.selectedRange.length == ("beta" as NSString).length)
    }
}
