import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout(): React.ReactElement {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
