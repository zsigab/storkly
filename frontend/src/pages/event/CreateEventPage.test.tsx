import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { CreateEventPage } from "./CreateEventPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
      <ThemeProvider>
        <AuthProvider>
          <CreateEventPage />
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
});

describe("CreateEventPage", () => {
  it("renders the create form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /create event/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("validates that title is required", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => expect(screen.getByText(/title is required/i)).toBeInTheDocument());
  });

  it("calls API and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "event-1",
        title: "Baby Shower",
        eventDate: "2024-06-15T14:00:00Z",
        location: "123 Main St",
        description: null,
        rsvpToken: "token-abc",
        attendees: [],
        themeColor: "peach",
        themeBackground: "none",
        createdAt: "2024-01-01T00:00:00Z",
      },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2024-06-15T14:00" },
    });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/events", {
        body: {
          title: "Baby Shower",
          location: "123 Main St",
          description: null,
          rsvpCapacity: null,
          eventDate: expect.stringContaining("2024-06-15"),
          themeColor: "peach",
          themeBackground: "none",
        },
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/e/event-1/edit");
  });

  it("shows error message on API failure", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: undefined,
      error: { status: 422, detail: "Event title is invalid" },
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2024-06-15T14:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => expect(screen.getByText(/event title is invalid/i)).toBeInTheDocument());
  });

  it("renders back to dashboard link", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
