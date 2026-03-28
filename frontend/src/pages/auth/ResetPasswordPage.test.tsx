import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ResetPasswordPage } from "./ResetPasswordPage";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));

const mockSearchParams = new URLSearchParams();
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
        <ResetPasswordPage />
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

describe("ResetPasswordPage", () => {
  it("shows invalid link when no token", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /invalid link/i })).toBeInTheDocument();
  });

  it("renders the form when token is present", () => {
    mockSearchParams.set("token", "abc");
    renderPage();
    expect(screen.getByRole("heading", { name: /set new password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("validates that passwords match", async () => {
    mockSearchParams.set("token", "abc");
    renderPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set new password/i }));
    await waitFor(() => expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument());
  });

  it("calls API and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    mockSearchParams.set("token", "valid-token");
    renderPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set new password/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/auth/reset-password", {
        body: { token: "valid-token", newPassword: "newpassword1" },
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
