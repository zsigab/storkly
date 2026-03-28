import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { RegisterPage } from "./RegisterPage";

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
          <RegisterPage />
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

describe("RegisterPage", () => {
  it("renders all form fields", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId("turnstile")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/display name is required/i)).toBeInTheDocument());
  });

  it("requires CAPTCHA completion before submitting", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
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
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("turnstile"));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/auth/register", {
        body: {
          displayName: "Alice",
          email: "a@b.com",
          password: "password123",
          captchaToken: "test-token",
        },
      }),
    );
  });

  it("shows success message after registration", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("turnstile"));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument(),
    );
  });
});
