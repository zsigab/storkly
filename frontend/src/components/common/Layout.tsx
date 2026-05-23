import { Link, Outlet } from "react-router";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "./Header";

export function Layout(): React.ReactElement {
  const { bgStyle } = useTheme();
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" style={bgStyle} aria-hidden="true" />
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-8">
          <Outlet />
        </main>
        <footer className="border-border bg-card border-t">
          <div className="text-muted-foreground container mx-auto flex h-12 items-center justify-center gap-3 px-4 text-xs">
            <span className="text-primary font-semibold">Storkly</span>
            <span>·</span>
            <Link to="/privacy" viewTransition className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
