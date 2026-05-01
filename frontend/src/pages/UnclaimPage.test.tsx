import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { UnclaimPage } from "./UnclaimPage";

vi.mock("@/api", () => ({ api: { DELETE: vi.fn() } }));

const mockSearchParams = new URLSearchParams();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams],
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <UnclaimPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.delete("token");
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
});

describe("UnclaimPage", () => {
  it("shows invalid link message when no token in URL", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /invalid link/i })).toBeInTheDocument();
  });

  it("shows success state after claim is released", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.DELETE).mockResolvedValueOnce({
      data: undefined,
      error: undefined,
      response: new Response(),
    });
    mockSearchParams.set("token", "valid-token");
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /claim released/i })).toBeInTheDocument(),
    );
  });

  it("shows error state when token is invalid", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.DELETE).mockResolvedValueOnce({
      data: undefined,
      error: { status: 401, detail: "This claim has already been released" },
      response: new Response(),
    });
    mockSearchParams.set("token", "expired-token");
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/this claim has already been released/i)).toBeInTheDocument();
  });
});
