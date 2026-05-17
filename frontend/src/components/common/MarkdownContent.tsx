import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS: Components = {
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:opacity-80"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="list-disc pl-4">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal pl-4">{children}</ol>;
  },
  h1({ children }) {
    return <h1 className="text-base font-bold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-sm font-bold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-sm font-semibold">{children}</h3>;
  },
};

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  className,
}: MarkdownContentProps): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
