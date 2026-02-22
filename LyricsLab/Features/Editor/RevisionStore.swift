import Foundation
import SwiftData

enum RevisionStore {
    struct ChangeMetrics: Equatable {
        var changedLineCount: Int
        var changedCharCount: Int
        var changeRatio: Double
    }

    static func sortedRevisions(for composition: Composition) -> [CompositionRevision] {
        composition.revisions.sorted { $0.createdAt > $1.createdAt }
    }

    static func captureAutoBackupIfNeeded(for composition: Composition, in modelContext: ModelContext) -> CompositionRevision? {
        let revisions = sortedRevisions(for: composition)
        let currentHash = CompositionRevision.makeSnapshotHash(title: composition.title, lyrics: composition.lyrics)
        if let latest = revisions.first, latest.snapshotHash == currentHash {
            return nil
        }

        let baseline = revisions.first(where: { $0.isMilestone }) ?? revisions.first
        let metrics = makeMetrics(
            oldTitle: baseline?.titleSnapshot ?? "",
            oldLyrics: baseline?.lyricsSnapshot ?? "",
            newTitle: composition.title,
            newLyrics: composition.lyrics
        )
        let isMilestone = qualifiesAsMilestone(metrics: metrics)
        let trigger: RevisionTrigger = isMilestone ? .autoMilestone : .autoBackup

        let revision = createRevision(
            trigger: trigger,
            composition: composition,
            modelContext: modelContext,
            metrics: metrics,
            isMilestone: isMilestone,
            note: nil
        )
        return revision
    }

    static func createManualBackup(
        for composition: Composition,
        in modelContext: ModelContext,
        note: String? = "Manual backup"
    ) -> CompositionRevision {
        let previous = sortedRevisions(for: composition).first
        let metrics = makeMetrics(
            oldTitle: previous?.titleSnapshot ?? "",
            oldLyrics: previous?.lyricsSnapshot ?? "",
            newTitle: composition.title,
            newLyrics: composition.lyrics
        )

        return createRevision(
            trigger: .manual,
            composition: composition,
            modelContext: modelContext,
            metrics: metrics,
            isMilestone: false,
            note: note
        )
    }

    @discardableResult
    static func restore(
        revision: CompositionRevision,
        into composition: Composition,
        in modelContext: ModelContext
    ) -> Bool {
        let previous = sortedRevisions(for: composition).first
        let preRestoreMetrics = makeMetrics(
            oldTitle: previous?.titleSnapshot ?? "",
            oldLyrics: previous?.lyricsSnapshot ?? "",
            newTitle: composition.title,
            newLyrics: composition.lyrics
        )

        _ = createRevision(
            trigger: .preRestore,
            composition: composition,
            modelContext: modelContext,
            metrics: preRestoreMetrics,
            isMilestone: false,
            note: "Before restore"
        )

        composition.title = revision.titleSnapshot
        composition.lyrics = revision.lyricsSnapshot
        composition.touch()
        do {
            try modelContext.save()
            return true
        } catch {
            return false
        }
    }

    static func makeMetrics(oldTitle: String, oldLyrics: String, newTitle: String, newLyrics: String) -> ChangeMetrics {
        let oldLines = oldLyrics.components(separatedBy: "\n")
        let newLines = newLyrics.components(separatedBy: "\n")
        let changedLineCount = changedLineCountBetween(oldLines: oldLines, newLines: newLines)

        let oldCombined = oldTitle + "\n" + oldLyrics
        let newCombined = newTitle + "\n" + newLyrics
        let changedCharCount = changedCharacterCountBetween(old: oldCombined, new: newCombined)

        let denominator = max(1, max(oldCombined.count, newCombined.count))
        let ratio = Double(changedCharCount) / Double(denominator)
        return ChangeMetrics(changedLineCount: changedLineCount, changedCharCount: changedCharCount, changeRatio: ratio)
    }

    static func qualifiesAsMilestone(metrics: ChangeMetrics) -> Bool {
        metrics.changedLineCount >= 3 || metrics.changedCharCount >= 120 || metrics.changeRatio >= 0.10
    }

    private static func createRevision(
        trigger: RevisionTrigger,
        composition: Composition,
        modelContext: ModelContext,
        metrics: ChangeMetrics,
        isMilestone: Bool,
        note: String?
    ) -> CompositionRevision {
        let revision = CompositionRevision(
            titleSnapshot: composition.title,
            lyricsSnapshot: composition.lyrics,
            trigger: trigger,
            isMilestone: isMilestone,
            changedLineCount: metrics.changedLineCount,
            changedCharCount: metrics.changedCharCount,
            changeRatio: metrics.changeRatio,
            note: note,
            composition: composition
        )
        modelContext.insert(revision)
        composition.touch()
        try? modelContext.save()
        return revision
    }

    private static func changedLineCountBetween(oldLines: [String], newLines: [String]) -> Int {
        let maxCount = max(oldLines.count, newLines.count)
        var changed = 0
        for index in 0..<maxCount {
            let oldValue = index < oldLines.count ? oldLines[index] : nil
            let newValue = index < newLines.count ? newLines[index] : nil
            if oldValue != newValue {
                changed += 1
            }
        }
        return changed
    }

    private static func changedCharacterCountBetween(old: String, new: String) -> Int {
        let oldChars = Array(old)
        let newChars = Array(new)
        let commonCount = min(oldChars.count, newChars.count)
        var changed = abs(oldChars.count - newChars.count)
        for index in 0..<commonCount where oldChars[index] != newChars[index] {
            changed += 1
        }
        return changed
    }
}
