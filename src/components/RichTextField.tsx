import { Input } from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  error?: React.ReactNode;
  minHeight?: number;
};

// Stored as sanitized HTML. Render it with <RichText html=... /> or sanitize again.
export const sanitize = (html: string) => DOMPurify.sanitize(html);

// Value is read once on mount (the editor is uncontrolled afterwards), so
// render it inside something that remounts when the record changes, e.g. a Modal.
export default function RichTextField({
  label,
  value,
  onChange,
  error,
  minHeight = 120,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) =>
      onChange(editor.isEmpty ? "" : sanitize(editor.getHTML())),
  });

  return (
    <Input.Wrapper label={label} error={error}>
      <RichTextEditor editor={editor} mt={4}>
        <RichTextEditor.Toolbar>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content mih={minHeight} />
      </RichTextEditor>
    </Input.Wrapper>
  );
}

// Read-only, sanitized, clamped to a few lines (for table cells).
export function RichTextPreview({
  html,
  lines = 3,
}: {
  html: string | null;
  lines?: number;
}) {
  if (!html) return null;
  return (
    <div
      style={{
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        fontSize: "var(--mantine-font-size-sm)",
      }}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}

// Read-only, sanitized, full-length rich text.
export function RichText({ html }: { html: string }) {
  return (
    <div
      style={{ fontSize: "var(--mantine-font-size-sm)" }}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
