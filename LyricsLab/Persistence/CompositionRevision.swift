import Foundation
import SwiftData
import CryptoKit

enum RevisionTrigger: String, CaseIterable, Codable {
    case autoBackup
    case autoMilestone
    case manual
    case preRestore

    var displayName: String {
        switch self {
        case .autoBackup:
            return "Auto"
        case .autoMilestone:
            return "Milestone"
        case .manual:
            return "Manual"
        case .preRestore:
            return "Pre-Restore"
        }
    }
}

@Model
final class CompositionRevision: Identifiable {
    var id: UUID = UUID()
    var createdAt: Date = Date()
    var titleSnapshot: String = ""
    var lyricsSnapshot: String = ""
    var triggerRaw: String = RevisionTrigger.autoBackup.rawValue
    var isMilestone: Bool = false
    var changedLineCount: Int = 0
    var changedCharCount: Int = 0
    var changeRatio: Double = 0
    var note: String?
    var snapshotHash: String = ""

    @Relationship(inverse: \Composition.revisions)
    var composition: Composition?

    init(
        id: UUID = UUID(),
        createdAt: Date = Date(),
        titleSnapshot: String,
        lyricsSnapshot: String,
        trigger: RevisionTrigger,
        isMilestone: Bool = false,
        changedLineCount: Int = 0,
        changedCharCount: Int = 0,
        changeRatio: Double = 0,
        note: String? = nil,
        composition: Composition? = nil
    ) {
        self.id = id
        self.createdAt = createdAt
        self.titleSnapshot = titleSnapshot
        self.lyricsSnapshot = lyricsSnapshot
        self.triggerRaw = trigger.rawValue
        self.isMilestone = isMilestone
        self.changedLineCount = changedLineCount
        self.changedCharCount = changedCharCount
        self.changeRatio = changeRatio
        self.note = note
        self.snapshotHash = Self.makeSnapshotHash(title: titleSnapshot, lyrics: lyricsSnapshot)
        self.composition = composition
    }

    var trigger: RevisionTrigger {
        get { RevisionTrigger(rawValue: triggerRaw) ?? .autoBackup }
        set { triggerRaw = newValue.rawValue }
    }

    static func makeSnapshotHash(title: String, lyrics: String) -> String {
        let input = Data((title + "\u{1f}" + lyrics).utf8)
        let digest = SHA256.hash(data: input)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
