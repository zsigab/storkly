import { useTheme } from "@/hooks/useTheme";

interface GlassCardLayoutProps {
  children: React.ReactNode;
  viewTransitionName?: string;
}

export function GlassCardLayout({
  children,
  viewTransitionName,
}: GlassCardLayoutProps): React.ReactElement {
  const { bgStyle } = useTheme();

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="relative" style={{ viewTransitionName }} data-glass-layout="">
        <div
          className="from-primary/15 via-background to-secondary/20 pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-br blur-2xl"
          aria-hidden="true"
        />
        {/* Firefox VT capture excludes the fixed bg div from Layout; embed + filter:blur here instead so the snapshot has it. globals.css [data-glass-layout] suppresses the duplicate backdrop-filter. */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          aria-hidden="true"
        >
          <div
            className="absolute inset-[-10%]"
            style={{
              ...bgStyle,
              backgroundAttachment: "fixed",
              filter: "blur(16px) saturate(180%)",
            }}
          />
        </div>
        <div className="border-border/50 bg-card relative space-y-6 rounded-2xl border px-8 py-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
