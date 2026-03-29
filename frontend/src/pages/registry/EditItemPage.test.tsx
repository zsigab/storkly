import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { EditItemPage } from "./EditItemPage";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), PATCH: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "baby-shower", id: "item-1" }),
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

const itemFixture = {
  id: "item-1",
  registryId: "reg-1",
  categoryId: null,
  addedByUserId: "u1",
  urlOriginal: "https://example.com",
  sourceSite: "MANUAL" as const,
  title: "Baby Carrier",
  description: "Great carrier",
  imageUrl: null,
  priceReference: 189.99,
  currency: "USD",
  priceCapturedAt: null,
  quantityDesired: 1,
  flag: "EXACT_ONLY" as const,
  notes: "Blue preferred",
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

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
        <EditItemPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("EditItemPage", () => {
  it("loads and displays current item values", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: itemFixture,
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /edit item/i })).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("Baby Carrier")).toBeInTheDocument();
  });

  it("calls PATCH and navigates on success", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: itemFixture,
      error: undefined,
      response: new Response(),
    });
    vi.mocked(api.PATCH).mockResolvedValueOnce({
      data: { ...itemFixture, title: "Updated Carrier" },
      error: undefined,
      response: new Response(),
    } as never);
    renderPage();
    await waitFor(() => expect(screen.getByDisplayValue("Baby Carrier")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Updated Carrier" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(api.PATCH).toHaveBeenCalledWith(
        "/api/items/{id}",
        expect.objectContaining({
          params: { path: { id: "item-1" } },
        }),
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/r/baby-shower");
  });
});
