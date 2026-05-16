import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { CreateRegistryPage } from "./CreateRegistryPage";

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
      <AuthProvider>
        <CreateRegistryPage />
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

describe("CreateRegistryPage", () => {
  it("renders the create form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /create registry/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("validates that name is required", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /create registry/i }));
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
  });

  it("calls API and navigates to registry on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "1",
        name: "My Registry",
        slug: "my-registry",
        description: null,
        visibility: "PUBLIC",
        ownerId: "u1",
        themeColor: "peach",
        themeBackground: "none",
        createdAt: "2024-01-01T00:00:00Z",
      },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "My Registry" } });
    fireEvent.click(screen.getByRole("button", { name: /create registry/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/registries", {
        body: {
          name: "My Registry",
          description: null,
          visibility: "PUBLIC",
          themeColor: "peach",
          themeBackground: "none",
        },
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/r/my-registry");
  });

  it("shows error message on API failure", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: undefined,
      error: { status: 422, detail: "Name already taken" },
      response: new Response(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Taken Name" } });
    fireEvent.click(screen.getByRole("button", { name: /create registry/i }));
    await waitFor(() => expect(screen.getByText(/name already taken/i)).toBeInTheDocument());
  });

  it("renders back to dashboard link", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
