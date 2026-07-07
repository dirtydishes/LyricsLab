import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import {
  installLyricsEditorCommands,
  postBridgeMessage,
  toEditorErrorMessage,
  type InsertSuggestionCommand,
  type LoadSongCommand,
  type LyricsEditorCommands,
  type SetThemeCommand,
} from './bridge';
import { extractSuggestionContext } from './suggestionContext';

export type LyricsEditorHandle = {
  commands: LyricsEditorCommands;
  destroy(): void;
  editor: Editor;
};

export type CreateLyricsEditorOptions = {
  element: HTMLElement;
  targetWindow?: Window;
};

export function createLyricsEditor({
  element,
  targetWindow = window,
}: CreateLyricsEditorOptions): LyricsEditorHandle {
  const editor = new Editor({
    autofocus: false,
    content: textToTiptapDoc(''),
    element,
    editorProps: {
      attributes: {
        autocapitalize: 'sentences',
        class: 'lyrics-editor-surface',
        spellcheck: 'true',
      },
      transformPastedText(text) {
        return normalizeLineEndings(text);
      },
    },
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        orderedList: false,
        strike: false,
      }),
    ],
    onBlur({ editor: blurEditor }) {
      safelyPost(() => {
        postBridgeMessage(
          {
            type: 'editorBlurred',
            context: getSelectionContext(blurEditor),
          },
          targetWindow,
        );
      }, 'editor_blurred_failed', targetWindow);
    },
    onCreate({ editor: createdEditor }) {
      safelyPost(() => {
        postBridgeMessage(
          {
            type: 'editorReady',
            ...getEditorSnapshot(createdEditor),
          },
          targetWindow,
        );
        postSelectionChanged(createdEditor, targetWindow);
      }, 'editor_ready_failed', targetWindow);
    },
    onFocus({ editor: focusedEditor }) {
      safelyPost(() => {
        postBridgeMessage(
          {
            type: 'editorFocused',
            context: getSelectionContext(focusedEditor),
          },
          targetWindow,
        );
      }, 'editor_focused_failed', targetWindow);
    },
    onSelectionUpdate({ editor: selectionEditor }) {
      postSelectionChanged(selectionEditor, targetWindow);
    },
    onUpdate({ editor: updatedEditor }) {
      safelyPost(() => {
        postBridgeMessage(
          {
            type: 'contentChanged',
            ...getEditorSnapshot(updatedEditor),
          },
          targetWindow,
        );
      }, 'content_changed_failed', targetWindow);
    },
  });

  const commands: LyricsEditorCommands = {
    focusEditor() {
      return safelyRunCommand(() => editor.commands.focus(), targetWindow);
    },

    insertSuggestion(command: InsertSuggestionCommand) {
      return safelyRunCommand(() => {
        const word = normalizeSuggestion(command);

        if (!word) {
          return false;
        }

        return editor.chain().focus().insertContent(`${word} `).run();
      }, targetWindow);
    },

    loadSong(command: LoadSongCommand = {}) {
      return safelyRunCommand(() => {
        const content = getLoadSongContent(command);
        editor.commands.setContent(content, { emitUpdate: false });
        postBridgeMessage(
          {
            type: 'contentChanged',
            ...getEditorSnapshot(editor),
          },
          targetWindow,
        );
        postSelectionChanged(editor, targetWindow);
        return true;
      }, targetWindow);
    },

    setTheme(command: SetThemeCommand = {}) {
      return safelyRunCommand(() => {
        const theme = command.theme?.trim();

        if (theme) {
          targetWindow.document.documentElement.dataset.theme = theme;
        } else {
          delete targetWindow.document.documentElement.dataset.theme;
        }

        return true;
      }, targetWindow);
    },
  };

  installLyricsEditorCommands(commands, targetWindow);

  return {
    commands,
    destroy() {
      if (targetWindow.LyricsLabEditor === commands) {
        delete targetWindow.LyricsLabEditor;
      }

      editor.destroy();
    },
    editor,
  };
}

export function textToTiptapDoc(text: string): JSONContent {
  const lines = normalizeLineEndings(text).split('\n');
  const paragraphs = lines.length > 0 ? lines : [''];

  return {
    type: 'doc',
    content: paragraphs.map((line) => {
      if (line.length === 0) {
        return {
          type: 'paragraph',
        };
      }

      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: line,
          },
        ],
      };
    }),
  };
}

function getLoadSongContent(command: LoadSongCommand): JSONContent {
  if (isJsonContent(command.bodyJson)) {
    return command.bodyJson;
  }

  return textToTiptapDoc(command.bodyText ?? '');
}

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeSuggestion(command: InsertSuggestionCommand) {
  return command.word.trim();
}

function getEditorSnapshot(editor: Editor) {
  return {
    bodyJson: editor.getJSON(),
    bodyText: editor.getText({ blockSeparator: '\n' }),
  };
}

function getSelectionContext(editor: Editor) {
  const { empty, from } = editor.state.selection;
  const textBeforeCursor = editor.state.doc.textBetween(0, from, '\n', '\n');

  return extractSuggestionContext({
    selectionEmpty: empty,
    textBeforeCursor,
  });
}

function postSelectionChanged(editor: Editor, targetWindow: Window) {
  safelyPost(() => {
    postBridgeMessage(
      {
        type: 'selectionChanged',
        context: getSelectionContext(editor),
      },
      targetWindow,
    );
  }, 'selection_changed_failed', targetWindow);
}

function safelyRunCommand(command: () => boolean, targetWindow: Window) {
  try {
    return command();
  } catch (error) {
    try {
      postBridgeMessage(
        toEditorErrorMessage(error, 'command_failed'),
        targetWindow,
      );
    } catch {
      // If the bridge itself is unavailable, the command still reports failure.
    }

    return false;
  }
}

function safelyPost(postMessage: () => void, code: string, targetWindow: Window) {
  try {
    postMessage();
  } catch (error) {
    try {
      postBridgeMessage(toEditorErrorMessage(error, code), targetWindow);
    } catch {
      // If the bridge itself is unavailable, there is nowhere reliable to report.
    }
  }
}

function normalizeLineEndings(text: string) {
  return text.replace(/\r\n?/g, '\n');
}
