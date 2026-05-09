import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownToolbar, computeResult } from "./MarkdownToolbar";

function Wrapper({ onChange = vi.fn() }: { onChange?: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  return (
    <>
      <MarkdownToolbar textareaRef={ref} onChange={onChange} />
      <textarea ref={ref} defaultValue="hello world" />
    </>
  );
}

describe("MarkdownToolbar", () => {
  it("renders all formatting buttons", () => {
    render(<Wrapper />);
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Italic")).toBeInTheDocument();
    expect(screen.getByTitle("Strikethrough")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 1")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 2")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 3")).toBeInTheDocument();
    expect(screen.getByTitle("Bullet list")).toBeInTheDocument();
    expect(screen.getByTitle("Numbered list")).toBeInTheDocument();
    expect(screen.getByTitle("Task list")).toBeInTheDocument();
    expect(screen.getByTitle("Blockquote")).toBeInTheDocument();
    expect(screen.getByTitle("Inline code")).toBeInTheDocument();
    expect(screen.getByTitle("Code block")).toBeInTheDocument();
    expect(screen.getByTitle("Horizontal rule")).toBeInTheDocument();
    expect(screen.getByTitle("Link")).toBeInTheDocument();
  });

  it("all buttons have type=button", () => {
    render(<Wrapper />);
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toHaveAttribute("type", "button");
    });
  });

  it("disables all buttons when disabled prop is true", () => {
    const ref = { current: null };
    render(<MarkdownToolbar textareaRef={ref} onChange={vi.fn()} disabled />);
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});

function makeTextarea(value: string, start: number, end: number): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  el.value = value;
  el.selectionStart = start;
  el.selectionEnd = end;
  return el;
}

describe("computeResult — bold", () => {
  it("wraps selected text in **", () => {
    const r = computeResult(makeTextarea("hello world", 0, 5), "bold");
    expect(r.value).toBe("**hello** world");
    expect(r.selStart).toBe(2);
    expect(r.selEnd).toBe(7);
  });

  it("inserts placeholder when nothing is selected", () => {
    const r = computeResult(makeTextarea("", 0, 0), "bold");
    expect(r.value).toBe("**bold text**");
    expect(r.selStart).toBe(2);
    expect(r.selEnd).toBe(11);
  });

  it("unwraps already-bold selection", () => {
    const r = computeResult(makeTextarea("**hello**", 0, 9), "bold");
    expect(r.value).toBe("hello");
  });
});

describe("computeResult — italic", () => {
  it("wraps selected text in *", () => {
    const r = computeResult(makeTextarea("hello", 0, 5), "italic");
    expect(r.value).toBe("*hello*");
  });

  it("inserts placeholder when nothing is selected", () => {
    const r = computeResult(makeTextarea("", 0, 0), "italic");
    expect(r.value).toBe("*italic text*");
  });
});

describe("computeResult — strikethrough", () => {
  it("wraps selected text in ~~", () => {
    const r = computeResult(makeTextarea("hello", 0, 5), "strikethrough");
    expect(r.value).toBe("~~hello~~");
  });

  it("unwraps already-struck selection", () => {
    const r = computeResult(makeTextarea("~~hello~~", 0, 9), "strikethrough");
    expect(r.value).toBe("hello");
  });
});

describe("computeResult — inline code", () => {
  it("wraps selected text in backticks", () => {
    const r = computeResult(makeTextarea("foo", 0, 3), "inlinecode");
    expect(r.value).toBe("`foo`");
  });

  it("inserts placeholder when nothing is selected", () => {
    const r = computeResult(makeTextarea("", 0, 0), "inlinecode");
    expect(r.value).toBe("`code`");
  });
});

describe("computeResult — code block", () => {
  it("wraps selection in a fenced code block", () => {
    const r = computeResult(makeTextarea("foo", 0, 3), "codeblock");
    expect(r.value).toBe("```\nfoo\n```");
    expect(r.selStart).toBe(4);
    expect(r.selEnd).toBe(7);
  });

  it("inserts placeholder when nothing is selected", () => {
    const r = computeResult(makeTextarea("", 0, 0), "codeblock");
    expect(r.value).toBe("```\ncode\n```");
    expect(r.selStart).toBe(4);
    expect(r.selEnd).toBe(8);
  });
});

describe("computeResult — link", () => {
  it("wraps selection as link text and selects url placeholder", () => {
    const r = computeResult(makeTextarea("Google", 0, 6), "link");
    expect(r.value).toBe("[Google](url)");
    expect(r.selStart).toBe(9);
    expect(r.selEnd).toBe(12);
  });

  it("inserts link template with link text selected when nothing is selected", () => {
    const r = computeResult(makeTextarea("", 0, 0), "link");
    expect(r.value).toBe("[link text](url)");
    expect(r.selStart).toBe(1);
    expect(r.selEnd).toBe(10);
  });
});

describe("computeResult — horizontal rule", () => {
  it("inserts --- on a new line", () => {
    const r = computeResult(makeTextarea("above", 5, 5), "hr");
    expect(r.value).toBe("above\n---\n");
    expect(r.selStart).toBe(r.selEnd); // collapsed cursor
  });
});

describe("computeResult — block actions", () => {
  it("adds # prefix for h1", () => {
    expect(computeResult(makeTextarea("My heading", 0, 0), "h1").value).toBe("# My heading");
  });

  it("adds ## prefix for h2", () => {
    expect(computeResult(makeTextarea("Sub heading", 0, 0), "h2").value).toBe("## Sub heading");
  });

  it("adds ### prefix for h3", () => {
    expect(computeResult(makeTextarea("Minor heading", 0, 0), "h3").value).toBe(
      "### Minor heading",
    );
  });

  it("adds - prefix for bullet", () => {
    expect(computeResult(makeTextarea("Item", 0, 0), "bullet").value).toBe("- Item");
  });

  it("adds 1. prefix for ordered list", () => {
    expect(computeResult(makeTextarea("Item", 0, 0), "orderedlist").value).toBe("1. Item");
  });

  it("adds - [ ] prefix for task list", () => {
    expect(computeResult(makeTextarea("Task", 0, 0), "tasklist").value).toBe("- [ ] Task");
  });

  it("adds > prefix for blockquote", () => {
    expect(computeResult(makeTextarea("Quote", 0, 0), "blockquote").value).toBe("> Quote");
  });

  it("removes existing h1 prefix when toggling off", () => {
    expect(computeResult(makeTextarea("# My heading", 0, 0), "h1").value).toBe("My heading");
  });

  it("adds prefix to the correct line in multi-line text", () => {
    const text = "first line\nsecond line";
    const r = computeResult(makeTextarea(text, 11, 11), "bullet");
    expect(r.value).toBe("first line\n- second line");
  });
});
