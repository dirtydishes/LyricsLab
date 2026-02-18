import Foundation
import Testing

@testable import LyricsLab

struct HomeKeyboardActionsTests {
    private let firstID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
    private let secondID = UUID(uuidString: "00000000-0000-0000-0000-000000000002")!
    private let thirdID = UUID(uuidString: "00000000-0000-0000-0000-000000000003")!

    @Test func nextSelectionWithNilSelectionChoosesFirstFilteredProject() {
        let filtered = [firstID, secondID, thirdID]
        let next = HomeKeyboardActions.nextSelection(from: nil, in: filtered)
        #expect(next == firstID)
    }

    @Test func previousSelectionWithNilSelectionChoosesLastFilteredProject() {
        let filtered = [firstID, secondID, thirdID]
        let previous = HomeKeyboardActions.previousSelection(from: nil, in: filtered)
        #expect(previous == thirdID)
    }

    @Test func nextSelectionClampsAtLastProject() {
        let filtered = [firstID, secondID, thirdID]
        let next = HomeKeyboardActions.nextSelection(from: thirdID, in: filtered)
        #expect(next == thirdID)
    }

    @Test func previousSelectionClampsAtFirstProject() {
        let filtered = [firstID, secondID, thirdID]
        let previous = HomeKeyboardActions.previousSelection(from: firstID, in: filtered)
        #expect(previous == firstID)
    }

    @Test func selectedIndexUsesFilteredOrdering() {
        let filtered = [thirdID, firstID]
        let index = HomeKeyboardActions.selectedIndex(for: firstID, in: filtered)
        #expect(index == 1)
    }

    @Test func deletableSelectionIDMatchesSelectedProject() {
        let deletableID = HomeKeyboardActions.deletableSelectionID(from: secondID)
        #expect(deletableID == secondID)
    }

    @Test func deletableSelectionIDIsNilWithoutSelection() {
        let deletableID = HomeKeyboardActions.deletableSelectionID(from: nil)
        #expect(deletableID == nil)
    }
}
