// src/Features/tasks/components/NoteEditor.jsx

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  AlignRight,
} from "lucide-react";

export function NoteEditor({ value = "", onChange }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        // White background, dark text
        class:
          "focus:outline-none min-h-[140px] p-3 text-sm bg-white text-gray-900",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Tab = outdent
            if (
              editor?.isActive("bulletList") ||
              editor?.isActive("orderedList") ||
              editor?.isActive("taskList")
            ) {
              editor.commands.liftListItem("listItem") ||
                editor.commands.liftListItem("taskItem");
              return true;
            }
          } else {
            // Tab = indent
            if (
              editor?.isActive("bulletList") ||
              editor?.isActive("orderedList") ||
              editor?.isActive("taskList")
            ) {
              editor.commands.sinkListItem("listItem") ||
                editor.commands.sinkListItem("taskItem");
              return true;
            }
            editor?.commands.insertContent("    ");
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.setContent("");
    }
  }, [value, editor]);

  if (!editor) return null;

  const IconButton = ({ onClick, active, icon: Icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded border text-xs ${
        active
          ? "bg-gray-200 text-gray-900 border-gray-400"
          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    // IMPORTANT: no z-index higher than surrounding fields; use relative, not fixed z-10
    <div className="relative border border-gray-300 rounded-md bg-white flex flex-col min-h-[220px]">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-2 items-center rounded-t-md">
        {/* Marks */}
        <IconButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <IconButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <IconButton
          icon={Strikethrough}
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />

        {/* Lists */}
        <IconButton
          icon={ListIcon}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <IconButton
          icon={ListOrdered}
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        {/* Align */}
        <IconButton
          icon={AlignLeft}
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <IconButton
          icon={AlignCenter}
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <IconButton
          icon={AlignJustify}
          label="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        />
        <IconButton
          icon={AlignRight}
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-y-auto rounded-b-md max-h-[180px]">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

export default NoteEditor;