import { Outlet } from "react-router";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "./Header";

export function Layout(): React.ReactElement {
  const { bgStyle } = useTheme();
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" style={bgStyle} aria-hidden="true" />
      <div className="bg-background text-foreground min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}
