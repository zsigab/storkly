import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { EditEventPage } from "./EditEventPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), PATCH: vi.fn() } }));
const mockNavigate = vi.fn();
const mockParams = { id: "event-1" };
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
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

const eventFixture = {
  id: "event-1",
  title: "Baby Shower",
  eventDate: "2024-06-15T14:00:00Z",
  location: "123 Main St",
  description: null,
  rsvpToken: "token-abc",
  rsvpCapacity: null,
  timeSlots: [],
  attendees: [
    {
      id: "rsvp-1",
      displayName: "Alice",
      email: "alice@example.com",
      attending: true,
      confirmedAt: "2024-01-01T00:00:00Z",
      timeSlotLabel: null,
    },
    {
      id: "rsvp-2",
      displayName: "Bob",
      email: "bob@example.com",
      attending: false,
      confirmedAt: null,
      timeSlotLabel: null,
    },
  ],
  themeColor: "peach",
  themeBackground: "none",
  createdAt: "2024-01-01T00:00:00Z",
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <ThemeProvider>
        <AuthProvider>
          <EditEventPage />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  });
  Object.defineProperty(window, "location", {
    value: { origin: "http://localhost:3000" },
    writable: true,
  });
});

describe("EditEventPage", () => {
  it("loads and displays the current event values", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: eventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /edit event/i })).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("Baby Shower")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
  });

  it("calls PATCH and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: eventFixture,
      error: undefined,
      response: new Response(),
    });
    vi.mocked(api.PATCH).mockResolvedValueOnce({
      data: { ...eventFixture, title: "Updated Shower" },
      error: undefined,
      response: new Response(),
    } as never);
    renderPage();
    await waitFor(() => expect(screen.getByDisplayValue("Baby Shower")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Updated Shower" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(api.PATCH).toHaveBeenCalledWith("/api/events/{id}", {
        params: { path: { id: "event-1" } },
        body: {
          title: "Updated Shower",
          location: "123 Main St",
          description: null,
          rsvpCapacity: null,
          eventDate: expect.any(String),
          themeColor: "peach",
          themeBackground: "none",
        },
      }),
    );
  });

  it("renders back button", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: eventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /back to event/i })).toBeInTheDocument(),
    );
  });

  it("renders RSVP link with copy button", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: eventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByDisplayValue("http://localhost:3000/rsvp/token-abc")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("renders the RSVP link", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: eventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByDisplayValue("http://localhost:3000/rsvp/token-abc")).toBeInTheDocument(),
    );
  });

  it("shows error state when event cannot be loaded", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockRejectedValueOnce(new Error("Not found"));
    renderPage();
    await waitFor(() => expect(screen.getByText(/event not found/i)).toBeInTheDocument());
  });
});
