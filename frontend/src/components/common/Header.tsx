import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

export function Header(): React.ReactElement {
  return (
    <header className="border-border bg-card border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-primary text-xl font-semibold">
          Storkly
        </Link>
        <nav className="flex items-center gap-4">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
