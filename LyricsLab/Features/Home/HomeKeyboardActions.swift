import Foundation

struct HomeKeyboardActions {
    static func selectedIndex(for selectedID: UUID?, in filteredIDs: [UUID]) -> Int? {
        guard let selectedID else { return nil }
        return filteredIDs.firstIndex(of: selectedID)
    }

    static func nextSelection(from selectedID: UUID?, in filteredIDs: [UUID]) -> UUID? {
        guard !filteredIDs.isEmpty else { return nil }
        guard let currentIndex = selectedIndex(for: selectedID, in: filteredIDs) else {
            return filteredIDs.first
        }
        let nextIndex = min(currentIndex + 1, filteredIDs.count - 1)
        return filteredIDs[nextIndex]
    }

    static func previousSelection(from selectedID: UUID?, in filteredIDs: [UUID]) -> UUID? {
        guard !filteredIDs.isEmpty else { return nil }
        guard let currentIndex = selectedIndex(for: selectedID, in: filteredIDs) else {
            return filteredIDs.last
        }
        let previousIndex = max(currentIndex - 1, 0)
        return filteredIDs[previousIndex]
    }

    static func deletableSelectionID(from selectedID: UUID?) -> UUID? {
        selectedID
    }
}
