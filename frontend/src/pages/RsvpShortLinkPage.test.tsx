import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/useTheme";
import { RsvpShortLinkPage } from "./RsvpShortLinkPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn() } }));
const mockNavigate = vi.fn();
const mockParams = { code: "abc123" };
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
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
        <RsvpShortLinkPage />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "matchMedia", {
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  });
});

describe("RsvpShortLinkPage", () => {
  it("resolves short code and navigates to RSVP form", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: { rsvpToken: "long-token-xyz" },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/rsvp/long-token-xyz", { replace: true }),
    );
  });

  it("shows error state for unknown code", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockRejectedValueOnce(new Error("Not found"));
    renderPage();
    await waitFor(() => expect(screen.getByText(/link not found/i)).toBeInTheDocument());
  });
});
