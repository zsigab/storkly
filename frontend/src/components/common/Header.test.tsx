import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@/hooks/useTheme";
import { Header } from "./Header";

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
  });
});

function renderHeader(): void {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("Header", () => {
  it("renders the Storkly logo link", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /storkly/i })).toBeInTheDocument();
  });

  it("logo link points to home", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /storkly/i })).toHaveAttribute("href", "/");
  });

  it("renders the theme toggle button", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });
});
