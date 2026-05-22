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

beforeEach(async () => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  const { api } = await import("@/api");
  vi.mocked(api.GET).mockResolvedValue({
    data: [],
    error: undefined,
    response: new Response(),
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

  it("renders 'My Dashboard' heading", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [],
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());
  });

  it("has link to create a new event", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [],
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /new event/i })).toHaveAttribute(
        "href",
        "/event/new",
      ),
    );
  });

  it("shows Events section when events exist", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return {
          data: [],
          error: undefined,
          response: new Response(),
        };
      }
      if (path === "/api/events") {
        return {
          data: [
            {
              id: "event-1",
              title: "Baby Shower",
              eventDate: "2024-06-15T14:00:00Z",
              location: "123 Main St",
              rsvpToken: "token-abc",
              attendees: [
                {
                  id: "rsvp-1",
                  displayName: "Alice",
                  email: "alice@example.com",
                  attending: true,
                  confirmedAt: "2024-01-01T00:00:00Z",
                },
              ],
              createdAt: "2024-01-01T00:00:00Z",
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
      expect(screen.getByText("Events")).toBeInTheDocument();
      expect(screen.getByText("Baby Shower")).toBeInTheDocument();
    });
  });

  it("shows events error message when events API fails", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return {
          data: [],
          error: undefined,
          response: new Response(),
        };
      }
      if (path === "/api/events") {
        return {
          data: undefined,
          error: { status: 500, detail: "Server error" },
          response: new Response(),
        };
      }
      return { data: null, error: undefined, response: new Response() };
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
  });

  it("shows 'Going to' section when user has RSVPed attending events", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return { data: [], error: undefined, response: new Response() };
      }
      if (path === "/api/events") {
        return { data: [], error: undefined, response: new Response() };
      }
      if (path === "/api/events/rsvped") {
        return {
          data: [
            {
              id: "event-rsvp-1",
              title: "Friend's Baby Shower",
              eventDate: "2025-07-20T15:00:00Z",
              location: "Community Hall",
              themeColor: "peach",
              themeBackground: "none",
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
      expect(screen.getByText("Going to")).toBeInTheDocument();
      expect(screen.getByText("Friend's Baby Shower")).toBeInTheDocument();
    });
  });

  it("does not show 'Going to' section when no RSVPed events", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(async (path: string) => {
      if (path === "/api/registries") {
        return { data: [], error: undefined, response: new Response() };
      }
      return { data: [], error: undefined, response: new Response() };
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());
    expect(screen.queryByText("Going to")).not.toBeInTheDocument();
  });
});
