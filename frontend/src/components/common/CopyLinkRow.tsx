interface CopyLinkRowProps {
  url: string;
  copied: boolean;
  onCopy: () => void;
}

export function CopyLinkRow({ url, copied, onCopy }: CopyLinkRowProps): React.ReactElement {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        readOnly
        value={url}
        className="border-input bg-background/60 text-muted-foreground flex h-10 flex-1 rounded-md border px-3 py-2 text-sm backdrop-blur-sm"
      />
      <button
        type="button"
        onClick={onCopy}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
