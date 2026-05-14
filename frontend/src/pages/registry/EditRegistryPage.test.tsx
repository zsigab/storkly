import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { EditRegistryPage } from "./EditRegistryPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() } }));
const mockNavigate = vi.fn();
const mockParams = { slug: "my-registry" };
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

const registryFixture = {
  id: "1",
  name: "My Registry",
  slug: "my-registry",
  description: "A great registry",
  visibility: "PUBLIC" as const,
  ownerId: "u1",
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
      <AuthProvider>
        <EditRegistryPage />
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

describe("EditRegistryPage", () => {
  it("loads and displays the current registry values", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /edit registry/i })).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("My Registry")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A great registry")).toBeInTheDocument();
  });

  it("calls PATCH and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    vi.mocked(api.PATCH).mockResolvedValueOnce({
      data: { ...registryFixture, name: "Updated Registry" },
      error: undefined,
      response: new Response(),
    } as never);
    renderPage();
    await waitFor(() => expect(screen.getByDisplayValue("My Registry")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Updated Registry" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(api.PATCH).toHaveBeenCalledWith("/api/registries/{slug}", {
        params: { path: { slug: "my-registry" } },
        body: { name: "Updated Registry", description: "A great registry", visibility: "PUBLIC" },
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/r/my-registry");
  });

  it("renders back to registry button", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /back to registry/i })).toBeInTheDocument(),
    );
  });

  it("renders delete registry button", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete registry/i })).toBeInTheDocument(),
    );
  });

  it("opens delete confirmation dialog when delete button is clicked", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete registry/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /delete registry/i }));
    expect(screen.getByRole("heading", { name: /delete registry/i })).toBeInTheDocument();
  });

  it("calls DELETE and navigates when delete is confirmed", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    vi.mocked(api.DELETE).mockResolvedValueOnce({ data: null, response: new Response() });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete registry/i })).toBeInTheDocument(),
    );
    const buttons = screen.getAllByRole("button", { name: /delete registry/i });
    fireEvent.click(buttons[0]!);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /delete registry/i })).toBeInTheDocument(),
    );
    const inputField = screen.getByPlaceholderText("My Registry") as HTMLInputElement;
    fireEvent.change(inputField, { target: { value: "My Registry" } });
    const allButtons = screen.getAllByRole("button", { name: /delete registry/i });
    fireEvent.click(allButtons[allButtons.length - 1]!);
    await waitFor(() =>
      expect(api.DELETE).toHaveBeenCalledWith("/api/registries/{slug}", {
        params: { path: { slug: "my-registry" } },
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
