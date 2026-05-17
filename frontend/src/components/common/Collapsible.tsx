interface CollapsibleProps {
  open: boolean;
  children: React.ReactNode;
}

export function Collapsible({ open, children }: CollapsibleProps): React.ReactElement {
  return (
    <div
      className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
