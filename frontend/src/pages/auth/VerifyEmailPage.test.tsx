import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { VerifyEmailPage } from "./VerifyEmailPage";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));

const mockSearchParams = new URLSearchParams();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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
        <VerifyEmailPage />
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

describe("VerifyEmailPage", () => {
  it("shows invalid link message when no token in URL", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /invalid link/i })).toBeInTheDocument();
  });

  it("shows success state after successful verification", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    mockSearchParams.set("token", "valid-token");
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /email verified/i })).toBeInTheDocument(),
    );
  });

  it("shows error state on failed verification", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: undefined,
      error: { status: 401, detail: "Token expired" },
      response: new Response(),
    });
    mockSearchParams.set("token", "expired-token");
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /verification failed/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/token expired/i)).toBeInTheDocument();
  });
});
