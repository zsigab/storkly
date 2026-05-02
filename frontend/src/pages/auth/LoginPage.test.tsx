import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { LoginPage } from "./LoginPage";

vi.mock("@/api", () => ({
  api: { POST: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
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

describe("LoginPage", () => {
  it("renders sign in heading and fields", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows links to register and forgot password", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot your password/i })).toBeInTheDocument();
  });

  it("renders Google OAuth button pointing to backend", () => {
    renderPage();
    const googleLink = screen.getByRole("link", { name: /continue with google/i });
    expect(googleLink).toHaveAttribute("href", "/api/auth/oauth/google/authorize");
  });

  it("shows validation error for invalid email", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument());
  });

  it("calls API on valid submission", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: { email: "a@b.com", displayName: "Alice" },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/auth/login", {
        body: { email: "a@b.com", password: "secret123" },
      }),
    );
  });

  it("shows error alert on failed login", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: undefined,
      error: { status: 401, detail: "Invalid credentials" },
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
  });

  it("redirects to /dashboard when already logged in", () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue(storedUser);
    renderPage();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
