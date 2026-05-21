import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RsvpConfirmPage } from "./RsvpConfirmPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => {
      const searchParams = new URLSearchParams("token=test-confirm-token");
      return [searchParams] as const;
    },
  };
});

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

describe("RsvpConfirmPage", () => {
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

  it("navigates to event page on successful confirmation", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({
      data: { eventId: "event-1" },
      error: undefined,
    });

    renderWithProviders(<RsvpConfirmPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/e/event-1", { replace: true });
    });
  });

  it("shows error message when confirmation fails", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: new Error("Invalid token"),
    });

    renderWithProviders(<RsvpConfirmPage />);

    await waitFor(() => {
      expect(screen.getByText(/confirmation link is invalid/i)).toBeInTheDocument();
    });
  });
});
