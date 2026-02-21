import Foundation

struct KeyboardShortcutSection: Identifiable, Hashable {
    let title: String
    let items: [KeyboardShortcutItem]

    var id: String { title }
}

struct KeyboardShortcutItem: Identifiable, Hashable {
    let title: String
    let keys: [KeyboardShortcutKey]
    let context: String?

    var id: String {
        let keySignature = keys.map(\.label).joined(separator: "|")
        return "\(title)|\(context ?? "")|\(keySignature)"
    }

    init(title: String, keys: [KeyboardShortcutKey], context: String? = nil) {
        self.title = title
        self.keys = keys
        self.context = context
    }
}

enum KeyboardShortcutKey: Hashable {
    case command
    case option
    case shift
    case delete
    case arrowUp
    case arrowDown
    case character(String)

    var label: String {
        switch self {
        case .command:
            return "⌘"
        case .option:
            return "⌥"
        case .shift:
            return "⇧"
        case .delete:
            return "⌫"
        case .arrowUp:
            return "↑"
        case .arrowDown:
            return "↓"
        case .character(let value):
            return value.uppercased()
        }
    }
}
