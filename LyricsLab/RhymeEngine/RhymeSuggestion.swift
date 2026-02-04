import Foundation

nonisolated enum RhymeSuggestionTarget: String, Sendable {
    case endRhyme
    case internalRhyme
}

nonisolated enum RhymeSuggestionMatch: String, Sendable {
    case exact
    case near
}

nonisolated struct RhymeSuggestion: Identifiable, Hashable, Sendable {
    // Stable within a single result set.
    var id: String { normalized }

    var display: String
    var normalized: String

    var target: RhymeSuggestionTarget
    var match: RhymeSuggestionMatch

    // UX flags (for badges / explanations).
    var isPersonal: Bool
    var isAlreadyUsedNearby: Bool
    var isSameAsAnchorWord: Bool

    // Optional: helps explain "why this target" in UI.
    var anchorWord: String?
}

