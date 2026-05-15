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
      <div className="relative" style={{ viewTransitionName }}>
        <div
          className="from-primary/15 via-background to-secondary/20 pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-br blur-2xl"
          aria-hidden="true"
        />
        <div className="border-border/50 bg-card relative space-y-6 rounded-2xl border px-8 py-8 shadow-xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
