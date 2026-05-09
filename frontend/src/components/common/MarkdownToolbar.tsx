import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  SeparatorHorizontal,
  SquareCode,
  Strikethrough,
} from "lucide-react";

export type MarkdownAction =
  | "bold"
  | "italic"
  | "strikethrough"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "orderedlist"
  | "tasklist"
  | "blockquote"
  | "inlinecode"
  | "codeblock"
  | "hr"
  | "link";

interface ApplyResult {
  value: string;
  selStart: number;
  selEnd: number;
}

export function computeResult(textarea: HTMLTextAreaElement, action: MarkdownAction): ApplyResult {
  const { value, selectionStart: start, selectionEnd: end } = textarea;
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  // Inline wrapping
  if (
    action === "bold" ||
    action === "italic" ||
    action === "strikethrough" ||
    action === "inlinecode"
  ) {
    const marker =
      action === "bold"
        ? "**"
        : action === "italic"
          ? "*"
          : action === "strikethrough"
            ? "~~"
            : "`";
    const m = marker.length;

    if (selected.length > 0) {
      if (
        selected.startsWith(marker) &&
        selected.endsWith(marker) &&
        selected.length >= 2 * m + 1
      ) {
        const inner = selected.slice(m, -m);
        return { value: before + inner + after, selStart: start, selEnd: start + inner.length };
      }
      return {
        value: before + marker + selected + marker + after,
        selStart: start + m,
        selEnd: end + m,
      };
    }

    const placeholder =
      action === "bold"
        ? "bold text"
        : action === "italic"
          ? "italic text"
          : action === "strikethrough"
            ? "strikethrough text"
            : "code";
    return {
      value: before + marker + placeholder + marker + after,
      selStart: start + m,
      selEnd: start + m + placeholder.length,
    };
  }

  // Code block
  if (action === "codeblock") {
    const inner = selected.length > 0 ? selected : "code";
    const insertion = "```\n" + inner + "\n```";
    return {
      value: before + insertion + after,
      selStart: start + 4,
      selEnd: start + 4 + inner.length,
    };
  }

  // Link
  if (action === "link") {
    if (selected.length > 0) {
      const insertion = `[${selected}](url)`;
      const urlStart = start + 1 + selected.length + 2;
      return { value: before + insertion + after, selStart: urlStart, selEnd: urlStart + 3 };
    }
    const insertion = "[link text](url)";
    return { value: before + insertion + after, selStart: start + 1, selEnd: start + 10 };
  }

  // Horizontal rule
  if (action === "hr") {
    const insertion = "\n---\n";
    return {
      value: before + insertion + after,
      selStart: start + insertion.length,
      selEnd: start + insertion.length,
    };
  }

  // Block prefix — toggle on current line
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const prefix =
    action === "h1"
      ? "# "
      : action === "h2"
        ? "## "
        : action === "h3"
          ? "### "
          : action === "bullet"
            ? "- "
            : action === "orderedlist"
              ? "1. "
              : action === "tasklist"
                ? "- [ ] "
                : "> "; // blockquote
  const pLen = prefix.length;
  const lineContent = value.slice(lineStart);

  if (lineContent.startsWith(prefix)) {
    return {
      value: value.slice(0, lineStart) + value.slice(lineStart + pLen),
      selStart: Math.max(lineStart, start - pLen),
      selEnd: Math.max(lineStart, end - pLen),
    };
  }

  return {
    value: value.slice(0, lineStart) + prefix + value.slice(lineStart),
    selStart: start + pLen,
    selEnd: end + pLen,
  };
}

function Divider(): React.ReactElement {
  return <span className="bg-border mx-0.5 my-0.5 w-px" aria-hidden="true" />;
}

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground hover:bg-background hover:text-foreground flex h-6 w-6 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MarkdownToolbar({
  textareaRef,
  onChange,
  disabled = false,
}: MarkdownToolbarProps): React.ReactElement {
  function handleAction(action: MarkdownAction): void {
    const textarea = textareaRef.current;
    if (textarea === null) return;
    const result = computeResult(textarea, action);
    onChange(result.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selStart, result.selEnd);
    });
  }

  return (
    <div className="border-input bg-muted flex flex-wrap gap-0.5 rounded-md border px-1 py-0.5">
      <ToolbarButton title="Bold" disabled={disabled} onClick={() => handleAction("bold")}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Italic" disabled={disabled} onClick={() => handleAction("italic")}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        disabled={disabled}
        onClick={() => handleAction("strikethrough")}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Heading 1" disabled={disabled} onClick={() => handleAction("h1")}>
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" disabled={disabled} onClick={() => handleAction("h2")}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" disabled={disabled} onClick={() => handleAction("h3")}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bullet list" disabled={disabled} onClick={() => handleAction("bullet")}>
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        disabled={disabled}
        onClick={() => handleAction("orderedlist")}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Task list" disabled={disabled} onClick={() => handleAction("tasklist")}>
        <ListTodo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Blockquote"
        disabled={disabled}
        onClick={() => handleAction("blockquote")}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        disabled={disabled}
        onClick={() => handleAction("inlinecode")}
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        disabled={disabled}
        onClick={() => handleAction("codeblock")}
      >
        <SquareCode className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" disabled={disabled} onClick={() => handleAction("hr")}>
        <SeparatorHorizontal className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Link" disabled={disabled} onClick={() => handleAction("link")}>
        <Link className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
