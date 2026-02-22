import Foundation
import Combine

#if canImport(UIKit)
@MainActor
final class EditorTextUndoBridge: ObservableObject {
    @Published private(set) var canUndo: Bool = false
    @Published private(set) var canRedo: Bool = false

    private weak var controller: EditorTextViewController?

    func attach(controller: EditorTextViewController) {
        self.controller = controller
        DispatchQueue.main.async { [weak self] in
            self?.refresh()
        }
    }

    func refresh() {
        canUndo = controller?.canUndo ?? false
        canRedo = controller?.canRedo ?? false
    }

    func updateAvailability(canUndo: Bool, canRedo: Bool) {
        self.canUndo = canUndo
        self.canRedo = canRedo
    }

    func undo() {
        controller?.performUndo()
        refresh()
    }

    func redo() {
        controller?.performRedo()
        refresh()
    }
}
#endif
