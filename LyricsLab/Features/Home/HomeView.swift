import SwiftUI
import SwiftData

#if canImport(UIKit)
import UIKit
#endif

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Composition.updatedAt, order: .reverse) private var compositions: [Composition]

    @EnvironmentObject private var themeManager: ThemeManager
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var searchText = ""
    @State private var debouncedSearchText = ""
    @State private var searchDebounceTask: Task<Void, Never>?
    @State private var showingSettings = false
    @State private var gearRotation: Angle = .zero
    @State private var newComposition: Composition?
    @State private var showingLaunchWelcome = false
    @State private var splitViewVisibility: NavigationSplitViewVisibility = .all
    @State private var selectedCompositionID: UUID?
    @State private var isShowingShortcutsSheet = false
    @FocusState private var isProjectSearchFocused: Bool

    @AppStorage("hasSeenLaunchWelcome") private var hasSeenLaunchWelcome = false

    private var filteredCompositions: [Composition] {
        let q = debouncedSearchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return compositions }
        return compositions.filter { $0.searchBlob.contains(q) }
    }

    var body: some View {
        let isDavyDollas = themeManager.themeID == .davyDollas

        ZStack {
            themeManager.theme.backgroundGradient
                .ignoresSafeArea()

            if horizontalSizeClass == .regular {
                iPadBody(isDavyDollas: isDavyDollas)
            } else {
                iPhoneBody(isDavyDollas: isDavyDollas)
            }

            if horizontalSizeClass == .regular {
                iPadKeyboardShortcutCommandHost
            }
        }
        .onAppear {
            debouncedSearchText = searchText
            if !hasSeenLaunchWelcome {
                showingLaunchWelcome = true
            }
        }
        .onChange(of: searchText) {
            searchDebounceTask?.cancel()
            let snapshot = searchText
            searchDebounceTask = Task {
                try? await Task.sleep(for: .milliseconds(200))
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    debouncedSearchText = snapshot
                }
            }
        }
        .onDisappear {
            searchDebounceTask?.cancel()
            searchDebounceTask = nil
        }
        .sheet(isPresented: $showingSettings) {
            NavigationStack {
                SettingsView {
                    showingSettings = false
                    Task { @MainActor in
                        try? await Task.sleep(for: .milliseconds(180))
                        isShowingShortcutsSheet = true
                    }
                }
            }
            .environmentObject(themeManager)
            .tint(themeManager.theme.accent)
        }
        .sheet(isPresented: $isShowingShortcutsSheet) {
            KeyboardShortcutsSheet(sections: keyboardShortcutSections)
                .environmentObject(themeManager)
                .tint(themeManager.theme.accent)
        }
        .sheet(isPresented: $showingLaunchWelcome, onDismiss: {
            hasSeenLaunchWelcome = true
        }) {
            LaunchWelcomeView {
                hasSeenLaunchWelcome = true
                showingLaunchWelcome = false
            }
            .environmentObject(themeManager)
            .tint(themeManager.theme.accent)
        }
        .sheet(item: $newComposition) { composition in
            NavigationStack {
                EditorView(composition: composition)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Done") {
                                newComposition = nil
                            }
                            .keyboardShortcut(.escape, modifiers: [])
                        }
                    }
            }
            .environmentObject(themeManager)
            .tint(themeManager.theme.accent)
        }
    }

    private func iPhoneBody(isDavyDollas: Bool) -> some View {
        NavigationStack {
            List {
                ForEach(filteredCompositions) { composition in
                    NavigationLink {
                        EditorView(composition: composition)
                    } label: {
                        CompositionRow(composition: composition)
                    }
                    .listRowBackground(themeManager.theme.surface)
                }
                .onDelete(perform: delete)
            }
            .animation(.snappy(duration: 0.34, extraBounce: 0.08), value: filteredCompositions.map(\.id))
            .scrollContentBackground(.hidden)
            .navigationTitle(isDavyDollas ? "" : "LyricsLab")
            .searchable(text: $searchText, prompt: "Search projects")
            .searchFocused($isProjectSearchFocused)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackgroundVisibility(.visible, for: .navigationBar)
            .toolbar {
                if isDavyDollas {
                    ToolbarItem(placement: .principal) {
                        DavyDollasTitleView()
                    }
                }

                ToolbarItem(placement: .topBarLeading) {
                    settingsButton
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        createComposition(presentation: .modalEditor)
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("New Composition")
                    .keyboardShortcut("n", modifiers: .command)
                }
            }
        }
    }

    private func iPadBody(isDavyDollas: Bool) -> some View {
        NavigationSplitView(columnVisibility: $splitViewVisibility) {
            iPadSidebar(isDavyDollas: isDavyDollas)
        } detail: {
            iPadDetail
        }
        .navigationSplitViewStyle(.balanced)
        .onChange(of: compositions.map(\.id)) { _, ids in
            guard let selectedCompositionID else { return }
            if !ids.contains(selectedCompositionID) {
                self.selectedCompositionID = nil
            }
        }
    }

    private func iPadSidebar(isDavyDollas: Bool) -> some View {
        ZStack(alignment: .bottomTrailing) {
            List {
                ForEach(filteredCompositions) { composition in
                    iPadSidebarRow(for: composition)
                }
                .onDelete(perform: delete)
            }
            .animation(.snappy(duration: 0.34, extraBounce: 0.08), value: filteredCompositions.map(\.id))
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
            .searchable(text: $searchText, prompt: "Search projects")
            .searchFocused($isProjectSearchFocused)
            .safeAreaInset(edge: .bottom) {
                Color.clear.frame(height: 72)
            }

            sidebarPlusButton
                .padding(16)
        }
        .navigationTitle(isDavyDollas ? "" : "Projects")
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .toolbarBackgroundVisibility(.visible, for: .navigationBar)
        .toolbar {
            if isDavyDollas {
                ToolbarItem(placement: .principal) {
                    DavyDollasTitleView()
                }
            }

            ToolbarItem(placement: .topBarLeading) {
                settingsButton
            }
        }
    }

    private var iPadDetail: some View {
        NavigationStack {
            if compositions.isEmpty {
                HomeDetailPlaceholder(
                    systemImage: "plus.circle",
                    message: "press the plus (+) button to create your first project;",
                    secondaryMessage: "You can also use ⌘ + N to create a new project."
                )
            } else if let composition = selectedComposition {
                EditorView(composition: composition)
            } else {
                HomeDetailPlaceholder(
                    systemImage: "sidebar.left",
                    message: "select a project"
                )
            }
        }
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .toolbarBackgroundVisibility(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                sidebarToggleButton
            }
        }
    }

    private func iPadSidebarRow(for composition: Composition) -> some View {
        SidebarCompositionRowButton(
            composition: composition,
            isSelected: composition.id == selectedCompositionID,
            surface: themeManager.theme.surface,
            elevatedSurface: themeManager.theme.elevatedSurface,
            accent: themeManager.theme.accent
        ) {
            selectedCompositionID = composition.id
        }
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
        .listRowBackground(Color.clear)
    }

    private var selectedComposition: Composition? {
        guard let selectedCompositionID else { return nil }
        return compositions.first(where: { $0.id == selectedCompositionID })
    }

    private var settingsButton: some View {
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.65)) {
                gearRotation += .degrees(240)
            }
            showingSettings = true
        } label: {
            Image(systemName: "gearshape.fill")
                .rotationEffect(gearRotation)
        }
        .accessibilityLabel("Settings")
        .keyboardShortcut(",", modifiers: .command)
    }

    private var sidebarToggleButton: some View {
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                toggleSidebar()
            }
        } label: {
            Image(systemName: "sidebar.left")
        }
        .accessibilityLabel("Toggle Sidebar")
    }

    private var sidebarPlusButton: some View {
        Button {
            createComposition(presentation: .selectInDetail)
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(themeManager.theme.accent)
                .frame(width: 48, height: 48)
                .background(Circle().fill(.ultraThinMaterial))
                .overlay {
                    Circle()
                        .strokeBorder(themeManager.theme.surface.opacity(0.8), lineWidth: 1)
                }
                .shadow(color: Color.black.opacity(themeManager.theme.colorScheme == .dark ? 0.30 : 0.12), radius: 14, x: 0, y: 10)
        }
        .accessibilityLabel("New Project")
        .keyboardShortcut("n", modifiers: .command)
    }

    private enum CreatePresentation {
        case modalEditor
        case selectInDetail
    }

    private func createComposition(presentation: CreatePresentation) {
        let composition = Composition(title: "Untitled")
        modelContext.insert(composition)

        switch presentation {
        case .modalEditor:
            newComposition = composition
        case .selectInDetail:
            selectedCompositionID = composition.id
            splitViewVisibility = .all
            searchText = ""
            debouncedSearchText = ""
        }
    }

    private func delete(_ indexSet: IndexSet) {
        let items = filteredCompositions
        let idsToDelete: [UUID] = indexSet.compactMap { index in
            guard items.indices.contains(index) else { return nil }
            return items[index].id
        }
        for index in indexSet {
            guard items.indices.contains(index) else { continue }
            modelContext.delete(items[index])
        }

        if let selectedCompositionID, idsToDelete.contains(selectedCompositionID) {
            self.selectedCompositionID = nil
        }
    }

    private func toggleSidebar() {
        if splitViewVisibility == .detailOnly {
            splitViewVisibility = .all
        } else {
            splitViewVisibility = .detailOnly
        }
    }

    private var filteredCompositionIDs: [UUID] {
        filteredCompositions.map(\.id)
    }

    private func focusProjectSearch() {
        guard splitViewVisibility != .detailOnly else { return }
        isProjectSearchFocused = true
    }

    private func deleteSelectedCompositionIfPossible() {
        guard let targetID = HomeKeyboardActions.deletableSelectionID(from: selectedCompositionID),
              let composition = compositions.first(where: { $0.id == targetID }) else { return }
        modelContext.delete(composition)
        selectedCompositionID = nil
    }

    private func selectNextComposition() {
        guard let nextID = HomeKeyboardActions.nextSelection(from: selectedCompositionID, in: filteredCompositionIDs) else { return }
        selectedCompositionID = nextID
        splitViewVisibility = .all
    }

    private func selectPreviousComposition() {
        guard let previousID = HomeKeyboardActions.previousSelection(from: selectedCompositionID, in: filteredCompositionIDs) else { return }
        selectedCompositionID = previousID
        splitViewVisibility = .all
    }

    private var keyboardShortcutSections: [KeyboardShortcutSection] {
        [
            KeyboardShortcutSection(
                title: "Home / Projects",
                items: [
                    KeyboardShortcutItem(
                        title: "New project",
                        keys: [.command, .character("N")]
                    ),
                    KeyboardShortcutItem(
                        title: "Settings",
                        keys: [.command, .character(",")]
                    ),
                    KeyboardShortcutItem(
                        title: "Toggle sidebar",
                        keys: [.command, .character("\\")]
                    ),
                    KeyboardShortcutItem(
                        title: "Focus project search",
                        keys: [.command, .character("F")],
                        context: "When the sidebar is visible"
                    ),
                    KeyboardShortcutItem(
                        title: "Delete selected project",
                        keys: [.command, .delete],
                        context: "Selection required"
                    ),
                    KeyboardShortcutItem(
                        title: "Select next project",
                        keys: [.option, .command, .arrowDown]
                    ),
                    KeyboardShortcutItem(
                        title: "Select previous project",
                        keys: [.option, .command, .arrowUp]
                    ),
                    KeyboardShortcutItem(
                        title: "Show keyboard shortcuts",
                        keys: [.command, .character("?")]
                    )
                ]
            ),
            KeyboardShortcutSection(
                title: "Editor",
                items: [
                    KeyboardShortcutItem(
                        title: "Editor help",
                        keys: [.option, .command, .character("H")]
                    ),
                    KeyboardShortcutItem(
                        title: "Import audio",
                        keys: [.command, .character("O")]
                    )
                ]
            )
        ]
    }

    private var iPadKeyboardShortcutCommandHost: some View {
        HStack(spacing: 0) {
            Button {
                toggleSidebar()
            } label: {
                EmptyView()
            }
            .keyboardShortcut("\\", modifiers: .command)

            Button {
                focusProjectSearch()
            } label: {
                EmptyView()
            }
            .keyboardShortcut("f", modifiers: .command)

            Button {
                deleteSelectedCompositionIfPossible()
            } label: {
                EmptyView()
            }
            .keyboardShortcut(.delete, modifiers: .command)
            .disabled(HomeKeyboardActions.deletableSelectionID(from: selectedCompositionID) == nil)

            Button {
                selectNextComposition()
            } label: {
                EmptyView()
            }
            .keyboardShortcut(.downArrow, modifiers: [.command, .option])

            Button {
                selectPreviousComposition()
            } label: {
                EmptyView()
            }
            .keyboardShortcut(.upArrow, modifiers: [.command, .option])

            Button {
                isShowingShortcutsSheet = true
            } label: {
                EmptyView()
            }
            .keyboardShortcut("/", modifiers: [.command, .shift])
        }
        .frame(width: 1, height: 1)
        .opacity(0.01)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct DavyDollasTitleView: View {
    private var titleFont: Font {
        #if canImport(UIKit)
        if UIFont(name: "Copperplate-Bold", size: 22) != nil {
            return .custom("Copperplate-Bold", size: 22)
        }
        if UIFont(name: "Copperplate", size: 22) != nil {
            return .custom("Copperplate", size: 22)
        }
        #endif

        return .system(.title2, design: .serif).weight(.black)
    }

    var body: some View {
        Text("Lyric$Lab")
            .font(titleFont)
            .tracking(1.0)
            .shadow(color: Color.black.opacity(0.55), radius: 6, x: 0, y: 2)
            .accessibilityLabel("Lyric$Lab")
    }
}

private struct CompositionRow: View {
    let composition: Composition

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(composition.title.isEmpty ? "Untitled" : composition.title)
                .font(.headline)

            if let snippet = snippet, !snippet.isEmpty {
                Text(snippet)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 2)
    }

    private var snippet: String? {
        let lines = composition.lyrics
            .split(whereSeparator: \Character.isNewline)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

        return lines.first(where: { !$0.isEmpty })
    }
}

private struct SidebarCompositionRowButton: View {
    let composition: Composition
    let isSelected: Bool
    let surface: Color
    let elevatedSurface: Color
    let accent: Color
    let onSelect: () -> Void

    var body: some View {
        Button {
            onSelect()
        } label: {
            CompositionRow(composition: composition)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(isSelected ? elevatedSurface : surface)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .strokeBorder(
                            (isSelected ? accent.opacity(0.45) : surface.opacity(0.85)),
                            lineWidth: 1
                        )
                }
        }
        .buttonStyle(.plain)
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
            .modelContainer(for: [Composition.self, UserLexiconEntry.self, CompositionLexiconState.self], inMemory: true)
            .environmentObject(ThemeManager())
    }
}

private struct HomeDetailPlaceholder: View {
    @EnvironmentObject private var themeManager: ThemeManager

    let systemImage: String
    let message: String
    let secondaryMessage: String?

    init(systemImage: String, message: String, secondaryMessage: String? = nil) {
        self.systemImage = systemImage
        self.message = message
        self.secondaryMessage = secondaryMessage
    }

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: systemImage)
                .font(.system(size: 44, weight: .semibold))
                .foregroundStyle(themeManager.theme.accent)

            Text(message)
                .font(.title3.weight(.semibold))
                .foregroundStyle(themeManager.theme.textPrimary)
                .multilineTextAlignment(.center)

            if let secondaryMessage {
                Text(secondaryMessage)
                    .font(.callout)
                    .foregroundStyle(themeManager.theme.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(32)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(themeManager.theme.surface.opacity(0.9), lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(themeManager.theme.colorScheme == .dark ? 0.22 : 0.08), radius: 18, x: 0, y: 12)
        .padding(24)
        .frame(maxWidth: 560)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
