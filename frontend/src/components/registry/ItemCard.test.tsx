import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ItemCard } from "./ItemCard";
import type { ItemResponse } from "@/api/schema";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

const base: ItemResponse = {
  id: "item-1",
  registryId: "reg-1",
  categoryId: null,
  addedByUserId: "u1",
  urlOriginal: null,
  sourceSite: "MANUAL",
  title: "Baby Carrier",
  description: "Great for newborns",
  imageUrl: null,
  priceReference: 189.99,
  currency: "USD",
  priceCapturedAt: null,
  quantityDesired: 1,
  flag: "EXACT_ONLY",
  notes: null,
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function renderCard(props: Partial<Parameters<typeof ItemCard>[0]> = {}, storedUser: object | null = null) {
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
        <ItemCard item={base} slug="baby-shower" isOwner={false} {...props} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ItemCard", () => {
  it("renders item title and description", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard();
    expect(screen.getByText("Baby Carrier")).toBeInTheDocument();
    expect(screen.getByText("Great for newborns")).toBeInTheDocument();
  });

  it("renders price and flag badge", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard();
    expect(screen.getByText("Exact only")).toBeInTheDocument();
    expect(screen.getByText(/189\.99/)).toBeInTheDocument();
  });

  it("renders url as link when present", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard({ item: { ...base, urlOriginal: "https://example.com/item" } });
    expect(screen.getByRole("link", { name: "Baby Carrier" })).toHaveAttribute("href", "https://example.com/item");
  });

  it("shows edit and delete for owner", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard({ isOwner: true });
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("shows claim button for logged-out user when not claimed", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard();
    await waitFor(() => expect(screen.getByRole("button", { name: /claim/i })).toBeInTheDocument());
  });

  it("shows claim dialog when anonymous user clicks claim", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    renderCard();
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /^claim$/i })));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it("shows Claimed when item is fully claimed", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({
      data: [{ id: "c1", itemId: "item-1", claimerUserId: null, claimerName: "Alice", claimerEmail: "a@b.com", quantityClaimed: 1, claimedAt: "2024-01-01T00:00:00Z" }],
      error: undefined,
      response: new Response(),
    });
    renderCard();
    await waitFor(() => expect(screen.getByText("Claimed")).toBeInTheDocument());
  });

  it("shows unclaim button when logged-in user has claimed", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({
      data: [{ id: "c1", itemId: "item-1", claimerUserId: "user-1", claimerName: "Alice", claimerEmail: "a@b.com", quantityClaimed: 1, claimedAt: "2024-01-01T00:00:00Z" }],
      error: undefined,
      response: new Response(),
    });
    renderCard({}, { id: "user-1", email: "a@b.com", displayName: "Alice" });
    await waitFor(() => expect(screen.getByRole("button", { name: /unclaim/i })).toBeInTheDocument());
  });
});
