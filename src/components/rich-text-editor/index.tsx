import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useReducer } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** 空内容时的占位提示 */
  placeholder?: string;
  className?: string;
}

/** 工具栏按钮 */
interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(active && "bg-muted text-foreground")}
      // 避免点击工具栏时编辑器失焦丢选区
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon />
    </Button>
  );
}

function ToolbarDivider() {
  return <div className="bg-border mx-0.5 h-5 w-px shrink-0" />;
}

/** 编辑器内容区样式(Tailwind typography 未安装,用任意变体选择器实现) */
const CONTENT_CLASS =
  "min-h-44 px-3 py-2.5 text-sm outline-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold " +
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 " +
  "[&_pre]:bg-muted [&_pre]:my-2 [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-sm [&_pre]:whitespace-pre-wrap " +
  "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] " +
  "[&_hr]:border-border [&_hr]:my-3";

/** 基于 Tiptap 的富文本编辑器,受控组件,value 为 HTML 字符串 */
function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  // 选中态/光标变化时重新渲染工具栏按钮状态
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);

  const editor = useEditor({
    // 弹窗等延迟挂载场景下避免渲染时机问题
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: CONTENT_CLASS,
      },
    },
    // 内容变化时同步给外部表单
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // 外部重置表单值时(如弹窗重新打开)同步回编辑器
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", forceUpdate);
    return () => {
      editor.off("transaction", forceUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "bg-background border-input focus-within:border-ring focus-within:ring-ring/50 overflow-hidden rounded-lg border shadow-xs transition-all focus-within:ring-3",
        className,
      )}
    >
      <div className="border-border/60 flex flex-wrap items-center gap-0.5 border-b p-1.5">
        <ToolButton
          icon={Undo2}
          label="撤销"
          active={false}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolButton
          icon={Redo2}
          label="重做"
          active={false}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
        <ToolbarDivider />
        <ToolButton
          icon={Bold}
          label="加粗"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          icon={Italic}
          label="斜体"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          icon={Underline}
          label="下划线"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolButton
          icon={Strikethrough}
          label="删除线"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarDivider />
        <ToolButton
          icon={Heading1}
          label="标题 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolButton
          icon={Heading2}
          label="标题 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarDivider />
        <ToolButton
          icon={List}
          label="无序列表"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          icon={ListOrdered}
          label="有序列表"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          icon={Quote}
          label="引用"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolButton
          icon={Code}
          label="代码块"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolButton
          icon={Minus}
          label="分割线"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export type { RichTextEditorProps };
export { RichTextEditor };
