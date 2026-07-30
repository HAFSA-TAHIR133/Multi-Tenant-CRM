/**
 * Submit on Enter plugin for Lexical chat editor.
 * - Enter (without Shift) => submit
 * - Shift+Enter => new line
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect } from "react";

export function SubmitOnEnterPlugin({ onSubmit }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Shift+Enter => allow new line
        if (event !== null && event.shiftKey) {
          return false;
        }

        if (event !== null) {
          event.preventDefault();
        }

        const hasContent = editor
          .getEditorState()
          .read(() => $getRoot().getTextContent().trim() !== "");

        if (hasContent) {
          onSubmit(editor.getEditorState());
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        }

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onSubmit]);

  return null;
}