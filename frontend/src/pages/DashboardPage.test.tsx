import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardPage } from "./DashboardPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useViewTransitionState: () => false,
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
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
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

describe("DashboardPage", () => {
  it("shows registry explanation text", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [],
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/shareable wishlists/i)).toBeInTheDocument());
  });

  it("shows no empty state CTA when no registries exist", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [],
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/shareable wishlists/i)).toBeInTheDocument());
    expect(
      screen.queryByRole("link", { name: /create your first registry/i }),
    ).not.toBeInTheDocument();
  });

  it("shows owned registry cards", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return {
          data: [
            {
              id: "1",
              name: "Baby Registry",
              slug: "baby-registry",
              description: null,
              visibility: "PUBLIC",
              ownerId: "u1",
              createdAt: "2024-01-01T00:00:00Z",
              themeColor: "peach",
              themeBackground: "both",
            },
          ],
          error: undefined,
          response: new Response(),
        };
      }
      return { data: null, error: undefined, response: new Response() };
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("Baby Registry")).toBeInTheDocument());
  });

  it("shows subscribed registries in Following section", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return {
          data: [
            {
              id: "2",
              name: "Friend's Registry",
              slug: "friends-registry",
              description: null,
              visibility: "PUBLIC",
              ownerId: "other-user",
              createdAt: "2024-01-01T00:00:00Z",
              themeColor: "peach",
              themeBackground: "both",
            },
          ],
          error: undefined,
          response: new Response(),
        };
      }
      return { data: null, error: undefined, response: new Response() };
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Following")).toBeInTheDocument();
      expect(screen.getByText("Friend's Registry")).toBeInTheDocument();
    });
  });

  it("has link to create a new registry", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [],
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /new registry/i })).toHaveAttribute(
        "href",
        "/registry/new",
      ),
    );
  });

  it("shows error message when API fails", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { status: 401, detail: "Unauthorized" },
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/unauthorized/i)).toBeInTheDocument());
  });
});
