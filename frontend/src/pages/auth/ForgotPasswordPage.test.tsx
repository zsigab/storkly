import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess?: (token: string) => void }) => (
    <button type="button" data-testid="turnstile" onClick={() => onSuccess?.("test-token")}>
      Complete CAPTCHA
    </button>
  ),
}));

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
});

describe("ForgotPasswordPage", () => {
  it("renders the form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByTestId("turnstile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-email" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument());
  });

  it("requires CAPTCHA completion before submitting", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText(/please complete the captcha/i)).toBeInTheDocument(),
    );
  });

  it("calls API on valid submission", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByTestId("turnstile"));
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/auth/forgot-password", {
        body: { email: "a@b.com", captchaToken: "test-token" },
      }),
    );
  });

  it("shows success message after submission", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByTestId("turnstile"));
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument(),
    );
  });
});
