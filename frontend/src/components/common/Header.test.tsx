import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "./Header";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
  });
});

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function renderHeader(): void {
  render(
    <MemoryRouter>
      <QueryClientProvider client={makeClient()}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("Header", () => {
  it("renders the Storkly logo link", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /storkly/i })).toBeInTheDocument();
  });

  it("logo links to / when guest", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /storkly/i })).toHaveAttribute("href", "/");
  });

  it("logo links to /dashboard when authenticated", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi
          .fn()
          .mockReturnValue(JSON.stringify({ id: "u1", email: "a@b.com", displayName: "Alice" })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    renderHeader();
    expect(screen.getByRole("link", { name: /storkly/i })).toHaveAttribute("href", "/dashboard");
  });

  it("renders the theme settings button", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: /theme settings/i })).toBeInTheDocument();
  });

  it("shows sign in and register links when logged out", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("shows sign out and display name when logged in", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi
          .fn()
          .mockReturnValue(JSON.stringify({ id: "u1", email: "a@b.com", displayName: "Alice" })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    renderHeader();
    expect(screen.queryByRole("link", { name: /^dashboard$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
