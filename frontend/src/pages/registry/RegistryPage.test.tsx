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
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Mock all GET calls: registry returns registryFixture, categories and items return []. */
function mockGetSuccess() {
  return vi.fn().mockImplementation((path: string) => {
    if (path === "/api/registries/{slug}") {
      return Promise.resolve({ data: registryFixture, error: undefined, response: new Response() });
    }
    return Promise.resolve({ data: [], error: undefined, response: new Response() });
  });
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
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage();
    await waitFor(() => expect(screen.getByText("My Registry")).toBeInTheDocument());
    expect(screen.getByText("A great registry")).toBeInTheDocument();
  });

  it("shows edit and delete buttons for the owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage({ id: "owner-uuid", email: "owner@example.com", displayName: "Owner" });
    await waitFor(() => expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("hides edit and delete buttons for non-owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage({ id: "other-uuid", email: "other@example.com", displayName: "Other" });
    await waitFor(() => expect(screen.getByText("My Registry")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows join banner when invite token is present", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    mockSearchParams.set("invite", "tok123");
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/you've been invited to join/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /join registry/i })).toBeInTheDocument();
  });

  it("calls join API when join button clicked", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
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

  it("shows items grouped by category", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation((path: string) => {
      if (path === "/api/registries/{slug}") {
        return Promise.resolve({
          data: registryFixture,
          error: undefined,
          response: new Response(),
        });
      }
      if (path === "/api/registries/{slug}/categories") {
        return Promise.resolve({
          data: [
            { id: "cat-1", registryId: "1", name: "Essentials", sortOrder: 0, isDefault: true },
          ],
          error: undefined,
          response: new Response(),
        });
      }
      if (path === "/api/registries/{slug}/items") {
        return Promise.resolve({
          data: [
            {
              id: "item-1",
              registryId: "1",
              categoryId: "cat-1",
              addedByUserId: "u1",
              urlOriginal: null,
              sourceSite: "MANUAL",
              title: "Baby Carrier",
              description: null,
              imageUrl: null,
              priceReference: null,
              currency: null,
              priceCapturedAt: null,
              quantityDesired: 1,
              flag: "EXACT_ONLY",
              notes: null,
              sortOrder: 0,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          error: undefined,
          response: new Response(),
        });
      }
      return Promise.resolve({ data: [], error: undefined, response: new Response() });
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("Baby Carrier")).toBeInTheDocument());
    expect(screen.getByText("Essentials")).toBeInTheDocument();
  });

  it("shows add item button for owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage({ id: "owner-uuid", email: "owner@example.com", displayName: "Owner" });
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /add item/i })).toBeInTheDocument(),
    );
  });

  it("shows back to dashboard link when authenticated", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage({ id: "user-uuid", email: "user@example.com", displayName: "User" });
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("hides back to dashboard link when guest", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockImplementation(mockGetSuccess());
    renderPage();
    await waitFor(() => expect(screen.getByText("My Registry")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: /back to dashboard/i })).not.toBeInTheDocument();
  });
});
