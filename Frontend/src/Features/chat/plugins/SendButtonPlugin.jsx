/**
 * Send button plugin for Lexical chat editor.
 * Calls onSubmit with the current editor state, then clears the editor.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, CLEAR_EDITOR_COMMAND } from "lexical";
import { useCallback } from "react";

export function SendButtonPlugin({ onSubmit }) {
  const [editor] = useLexicalComposerContext();

  const handleClick = useCallback(() => {
    const hasContent = editor
      .getEditorState()
      .read(() => $getRoot().getTextContent().trim() !== "");

    if (hasContent) {
      onSubmit(editor.getEditorState());
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    }
  }, [editor, onSubmit]);

  return (
    <button
      type="button"
      className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-indigo-500 text-white transition-[background-color,transform] duration-150 hover:bg-indigo-600 active:scale-[0.92] dark:bg-indigo-600 dark:hover:bg-indigo-700"
      title="Send message (Enter)"
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  );
}