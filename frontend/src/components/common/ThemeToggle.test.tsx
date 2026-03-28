import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

function setup(): void {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
  });
  document.documentElement.classList.remove("dark");
}

beforeEach(setup);

function renderToggle(): void {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("renders the toggle button", () => {
    renderToggle();
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("adds dark class to html element when toggled to dark", () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when toggled back to light", () => {
    renderToggle();
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
