import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RsvpForm } from "./RsvpForm";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess?: (token: string) => void }) => (
    <button type="button" data-testid="turnstile" onClick={() => onSuccess?.("test-captcha-token")}>
      Turnstile Mock
    </button>
  ),
}));

const eventFixture = {
  eventId: "event-1",
  eventTitle: "Baby Shower",
  eventDate: "2024-06-15T14:00:00Z",
  eventDateOffsetSeconds: null,
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

describe("RsvpForm", () => {
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

  it("renders form fields for anonymous users", () => {
    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventFixture} />);

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/will you be attending/i)).toBeInTheDocument();
    expect(screen.getByTestId("turnstile")).toBeInTheDocument();
  });

  it("validates required fields on submit", async () => {
    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventFixture} />);

    const submitButton = screen.getByRole("button", { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
      expect(screen.getByText(/please complete the captcha/i)).toBeInTheDocument();
    });
  });

  it("toggles attending option", async () => {
    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventFixture} />);

    const yesButton = screen.getByRole("button", { name: /yes, i'll be there/i });
    const noButton = screen.getByRole("button", { name: /no, i can't make it/i });

    expect(yesButton).toHaveClass("bg-primary");
    fireEvent.click(noButton);

    expect(noButton).toHaveClass("bg-primary");
    expect(yesButton).not.toHaveClass("bg-primary");
  });

  it("shows confirmation message after successful submit", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValue({ data: undefined, error: undefined });

    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventFixture} />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
    fireEvent.click(screen.getByTestId("turnstile"));

    const submitButton = screen.getByRole("button", { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/confirmation link/i)).toBeInTheDocument();
    });
  });

  it("displays error alert on submit failure", async () => {
    const { api } = await import("@/api");
    const errorObj = { status: 400, detail: "Invalid RSVP token" };
    vi.mocked(api.POST).mockResolvedValue({ data: undefined, error: errorObj });

    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventFixture} />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
    fireEvent.click(screen.getByTestId("turnstile"));

    const submitButton = screen.getByRole("button", { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid rsvp token/i)).toBeInTheDocument();
    });
  });

  it("shows time slot buttons when event has slots and attending is yes", () => {
    const eventWithSlots = {
      ...eventFixture,
      timeSlots: [
        { id: "slot-1", slotTime: "2024-06-15T08:00:00Z", spotsLeft: 5, slotOffsetSeconds: null },
        {
          id: "slot-2",
          slotTime: "2024-06-16T08:00:00Z",
          spotsLeft: null,
          slotOffsetSeconds: null,
        },
        { id: "slot-3", slotTime: "2024-06-17T08:00:00Z", spotsLeft: 0, slotOffsetSeconds: null },
      ],
    };
    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventWithSlots} />);

    // Three slot buttons should be rendered (timezone-agnostic check)
    const slotButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.match(/2024-06-1[5-7]/));
    expect(slotButtons).toHaveLength(3);
    expect(screen.getByText("5 spots left")).toBeInTheDocument();
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("hides time slot buttons when attending is no", () => {
    const eventWithSlots = {
      ...eventFixture,
      timeSlots: [
        { id: "slot-1", slotTime: "2024-06-15T08:00:00Z", spotsLeft: 5, slotOffsetSeconds: null },
      ],
    };
    renderWithProviders(<RsvpForm rsvpToken="token-abc" event={eventWithSlots} />);

    fireEvent.click(screen.getByRole("button", { name: /no, i can't make it/i }));

    const slotButtons = screen
      .queryAllByRole("button")
      .filter((b) => b.textContent?.match(/2024-06-15/));
    expect(slotButtons).toHaveLength(0);
  });
});
