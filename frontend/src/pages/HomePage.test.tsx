import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { HomePage } from "./HomePage";

function renderPage() {
  Object.defineProperty(window, "matchMedia", {
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  });
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

const storedUser = JSON.stringify({ id: "1", email: "a@b.com", displayName: "Alice" });

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
});

describe("HomePage", () => {
  it("renders the welcome heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /welcome to storkly/i })).toBeInTheDocument();
  });

  it("renders the intro description", () => {
    renderPage();
    expect(screen.getByText(/self-hosted gift registry/i)).toBeInTheDocument();
  });

  it("renders a login button linking to /login", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("renders a get started button linking to /register", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/register");
  });

  it("redirects to /dashboard when logged in", () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue(storedUser);
    renderPage();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /welcome to storkly/i })).not.toBeInTheDocument();
  });
});
