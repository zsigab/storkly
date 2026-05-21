import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/useTheme";
import { PublicEventPage } from "./PublicEventPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn() } }));
const mockParams = { id: "event-1" };
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useParams: () => mockParams,
  };
});

const publicEventFixture = {
  id: "event-1",
  title: "Baby Shower",
  eventDate: "2024-06-15T14:00:00Z",
  location: "123 Main St",
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderPage() {
  render(
    <QueryClientProvider client={makeClient()}>
      <ThemeProvider>
        <PublicEventPage />
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

describe("PublicEventPage", () => {
  it("renders the event title", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: publicEventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("Baby Shower")).toBeInTheDocument());
  });

  it("renders the formatted event date", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: publicEventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/2024-06-15/)).toBeInTheDocument());
  });

  it("renders the location when present", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: publicEventFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("123 Main St")).toBeInTheDocument());
  });

  it("omits location when null", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: { ...publicEventFixture, location: null },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("Baby Shower")).toBeInTheDocument());
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });

  it("shows loading state", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state when event not found", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { status: 404, detail: "Not found" },
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/event not found/i)).toBeInTheDocument());
  });
});
