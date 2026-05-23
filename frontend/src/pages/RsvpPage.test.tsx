import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RsvpPage } from "./RsvpPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn() } }));
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile">Turnstile Mock</div>,
}));
const mockParams = { token: "test-token" };
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useParams: () => mockParams,
  };
});

const eventFixture = {
  eventId: "event-1",
  eventTitle: "Baby Shower",
  eventDate: "2024-06-15T14:00:00Z",
  location: "123 Main St",
  spotsLeft: null,
  timeSlots: [],
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithProviders(
  element: React.ReactElement,
  { queryClient = makeClient() }: { queryClient?: QueryClient } = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{element}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("RsvpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
      writable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders loading state initially", () => {
    renderWithProviders(<RsvpPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders event details and RSVP form on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: eventFixture, error: undefined });

    renderWithProviders(<RsvpPage />);

    await waitFor(() => {
      expect(screen.getByText(/you're invited/i)).toBeInTheDocument();
      expect(screen.getByText(eventFixture.eventTitle)).toBeInTheDocument();
      expect(screen.getByTestId("turnstile")).toBeInTheDocument();
    });
  });

  it("shows error message when event not found", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: undefined, error: new Error("Not found") });

    renderWithProviders(<RsvpPage />);

    await waitFor(() => {
      expect(screen.getByText(/event not found/i)).toBeInTheDocument();
    });
  });
});
