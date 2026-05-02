import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { OAuthCallbackPage } from "./OAuthCallbackPage";

vi.mock("@/api", () => ({
  api: { GET: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/oauth/callback"]}>
      <AuthProvider>
        <Routes>
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
});

describe("OAuthCallbackPage", () => {
  it("shows signing in message while loading", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
  });

  it("navigates to dashboard on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: { id: "uuid-1", email: "a@b.com", displayName: "Alice" },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("redirects to login on API error", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { status: 401, detail: "Unauthorized" },
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth", { replace: true }),
    );
  });
});
