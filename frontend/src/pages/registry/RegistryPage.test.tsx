import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { RegistryPage } from "./RegistryPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
const mockNavigate = vi.fn();
const mockParams = { slug: "my-registry" };
const mockSearchParams = new URLSearchParams();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams],
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
  ownerId: "owner-uuid",
  createdAt: "2024-01-01T00:00:00Z",
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function renderPage(storedUser: object | null = null) {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(storedUser !== null ? JSON.stringify(storedUser) : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
  });
  render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <RegistryPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.delete("invite");
});

describe("RegistryPage", () => {
  it("shows registry name and description", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("My Registry")).toBeInTheDocument());
    expect(screen.getByText("A great registry")).toBeInTheDocument();
  });

  it("shows edit and delete buttons for the owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage({ id: "owner-uuid", email: "owner@example.com", displayName: "Owner" });
    await waitFor(() => expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("hides edit and delete buttons for non-owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage({ id: "other-uuid", email: "other@example.com", displayName: "Other" });
    await waitFor(() => expect(screen.getByText("My Registry")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows join banner when invite token is present", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    mockSearchParams.set("invite", "tok123");
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/you've been invited to join/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /join registry/i })).toBeInTheDocument();
  });

  it("calls join API when join button clicked", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({
      data: registryFixture,
      error: undefined,
      response: new Response(),
    });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: null,
      error: undefined,
      response: new Response(),
    });
    mockSearchParams.set("invite", "tok123");
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /join registry/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /join registry/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/registries/{slug}/join", {
        params: { path: { slug: "my-registry" } },
        body: { token: "tok123" },
      }),
    );
  });

  it("shows 403 error state for private registry", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { status: 403, detail: "Forbidden" },
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /private registry/i })).toBeInTheDocument(),
    );
  });

  it("shows 404 error state for missing registry", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { status: 404, detail: "Not Found" },
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /not found/i })).toBeInTheDocument(),
    );
  });
});
