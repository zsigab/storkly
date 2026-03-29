import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { AddItemPage } from "./AddItemPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "baby-shower" }),
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
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <AddItemPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("AddItemPage", () => {
  it("renders the add item form", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderPage();
    expect(screen.getByRole("heading", { name: /add item/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toBeInTheDocument());
  });

  it("shows validation error when title is empty", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderPage();
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /add item/i })));
    await waitFor(() => expect(screen.getByText(/title is required/i)).toBeInTheDocument());
  });

  it("calls API and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "item-1",
        registryId: "reg-1",
        categoryId: null,
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
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Carrier" } });
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith(
        "/api/registries/{slug}/items",
        expect.objectContaining({
          params: { path: { slug: "baby-shower" } },
        }),
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/r/baby-shower");
  });
});
