import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves Tailwind CSS class conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Parses keyboard shortcut key arrays or objects into platform-friendly string displays.
 */
export function parseShortcutKeys(keys) {
  if (!keys) return "";
  if (typeof keys === "string") return keys;

  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgentData?.platform || "");

  const keyArray = Array.isArray(keys) ? keys : [keys];

  return keyArray
    .map((key) => {
      // 1. Convert to string safely to avoid calling .toLowerCase() on numbers or undefined
      const keyString = String(key ?? "");

      switch (keyString.toLowerCase()) {
        case "mod":
        case "cmd":
        case "command":
          return isMac ? "⌘" : "Ctrl";
        case "alt":
        case "option":
          return isMac ? "⌥" : "Alt";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "ctrl":
        case "control":
          return "Ctrl";
        case "enter":
          return "↵";
        case "backspace":
          return "⌫";
        default:
          return keyString.toUpperCase();
      }
    })
    .join(isMac ? " " : " + ");
}

/**
 * Checks if a specific Tiptap extension is registered/available in the editor.
 */
export function isExtensionAvailable(editor, extensionName) {
  if (!editor || !editor.extensionManager) return false;
  return editor.extensionManager.extensions.some(
    (ext) => ext.name === extensionName
  );
}

/**
 * Checks if a given position is valid within the editor state.
 */
export function isValidPosition(pos, editor) {
  if (typeof pos !== "number" || pos < 0) return false;
  if (!editor || !editor.state || !editor.state.doc) return false;
  return pos <= editor.state.doc.content.size;
}

/**
 * Finds the node at a specific document position.
 */
export function findNodeAtPosition(editor, pos) {
  if (!editor || !editor.state || !isValidPosition(pos, editor)) return null;
  return editor.state.doc.nodeAt(pos) || null;
}

/**
 * Finds the position and node details for a specific node in the editor document.
 */
export function findNodePosition({ editor, node, type }) {
  if (!editor || !editor.state || !editor.state.doc) return null;

  let result = null;

  editor.state.doc.descendants((docNode, pos) => {
    if (result) return false;

    if (node && docNode === node) {
      result = {
        pos,
        start: pos,
        end: pos + docNode.nodeSize,
        node: docNode,
      };
      return false;
    }

    if (type && docNode.type.name === type) {
      result = {
        pos,
        start: pos,
        end: pos + docNode.nodeSize,
        node: docNode,
      };
      return false;
    }

    return true;
  });

  return result;
}

/**
 * Checks if a given mark type exists in the editor's schema.
 */
export function isMarkInSchema(type, editor) {
  if (!editor || !editor.schema) return false;
  return Boolean(editor.schema.marks[type]);
}

/**
 * Checks if a given node type exists in the editor's schema.
 */
export function isNodeInSchema(type, editor) {
  if (!editor || !editor.schema) return false;
  return Boolean(editor.schema.nodes[type]);
}

/**
 * Checks if the specified node type (or node types) is currently selected in the editor.
 */
export function isNodeTypeSelected(editor, type, attributes = {}) {
  if (!editor) return false;
  
  if (Array.isArray(type)) {
    return type.some((t) => editor.isActive(t, attributes));
  }
  
  return editor.isActive(type, attributes);
}

/**
 * Alias for checking node selection.
 */
export function isNodeActive(editor, type, attributes = {}) {
  return isNodeTypeSelected(editor, type, attributes);
}