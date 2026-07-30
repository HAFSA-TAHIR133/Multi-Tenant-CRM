// ChatMessage.jsx
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { RichTextExtension } from "@lexical/rich-text";
import { defineExtension } from "lexical";
import { useMemo } from "react";

const chatMessageTheme = {
  paragraph: "m-0",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
};

export function ChatMessage({ initialState }) {
  const extension = useMemo(
    () =>
      defineExtension({
        $initialEditorState: initialState,
        dependencies: [RichTextExtension],
        editable: false,
        name: "@lexical/website/chat-message",
        namespace: "@lexical/website/chat-message",
        theme: chatMessageTheme,
      }),
    [initialState]
  );

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ContentEditable className="text-sm leading-[1.45] break-words outline-none" />
    </LexicalExtensionComposer>
  );
}