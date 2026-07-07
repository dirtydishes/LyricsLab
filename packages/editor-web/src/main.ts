import './styles.css';

import { postBridgeMessage, toEditorErrorMessage } from './bridge';
import { createLyricsEditor } from './createLyricsEditor';

const editorElement = document.querySelector<HTMLElement>('#editor');

if (!editorElement) {
  postBridgeMessage({
    type: 'editorError',
    code: 'editor_mount_missing',
    message: 'Editor mount element was not found.',
  });
} else {
  createLyricsEditor({ element: editorElement });
}

window.addEventListener('error', (event) => {
  postBridgeMessage({
    type: 'editorError',
    code: 'runtime_error',
    message: event.message,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  postBridgeMessage(toEditorErrorMessage(event.reason, 'unhandled_rejection'));
});
