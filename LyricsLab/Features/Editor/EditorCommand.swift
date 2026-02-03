import Foundation

nonisolated struct EditorCommand: Equatable, Sendable {
    var id: UUID
    var kind: Kind

    nonisolated enum Kind: Equatable, Sendable {
        case replaceText(text: String, selectedRange: NSRange, undoActionName: String)
    }

    static func replaceText(text: String, selectedRange: NSRange, undoActionName: String) -> EditorCommand {
        EditorCommand(id: UUID(), kind: .replaceText(text: text, selectedRange: selectedRange, undoActionName: undoActionName))
    }
}
