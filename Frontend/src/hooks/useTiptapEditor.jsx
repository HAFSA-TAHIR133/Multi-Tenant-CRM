import { useCurrentEditor } from "@tiptap/react";

/**
 * Custom hook to safely get the Tiptap editor instance from context 
 * or fallback to a custom passed editor prop.
 * 
 * @param {Object} [options]
 * @param {Object} [options.editor] - Optional explicit editor prop
 * @returns {Object|null} The Tiptap editor instance
 */
export function useTiptapEditor(options = {}) {
  // useCurrentEditor returns { editor } from Tiptap context
  const current = useCurrentEditor();
  
  // Prefer explicitly passed editor prop, fallback to context editor
  const editor = options?.editor || current?.editor || null;

  return editor;
}

export default useTiptapEditor;