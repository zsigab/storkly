interface GlassCardLayoutProps {
  children: React.ReactNode;
  viewTransitionName?: string;
}

export function GlassCardLayout({
  children,
  viewTransitionName,
}: GlassCardLayoutProps): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div
        className="bg-card border-border space-y-6 rounded-xl border p-6 shadow-md"
        style={{ viewTransitionName }}
      >
        {children}
      </div>
    </div>
  );
}
