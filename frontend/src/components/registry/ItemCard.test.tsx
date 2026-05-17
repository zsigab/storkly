import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ItemCard } from "./ItemCard";
import type { ClaimResponse, ItemResponse } from "@/api/schema";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useViewTransitionState: () => false,
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
  alreadyOwned: false,
  itemType: "PRODUCT",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function makeClaim(overrides: Partial<ClaimResponse> = {}): ClaimResponse {
  return {
    id: "c1",
    itemId: "item-1",
    claimerUserId: null,
    claimerName: "Alice",
    claimerEmail: "a@b.com",
    quantityClaimed: 1,
    amountContributed: null,
    percentageContributed: null,
    claimedAt: "2024-01-01T00:00:00Z",
    confirmedAt: "2024-01-01T00:00:00Z",
    deliveryOptionId: null,
    deliveryType: null,
    receivedAt: null,
    amountReceived: null,
    releasedAt: null,
    ...overrides,
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderCard(
  props: Partial<Parameters<typeof ItemCard>[0]> = {},
  storedUser: object | null = null,
) {
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
        <ItemCard
          item={base}
          slug="baby-shower"
          isOwner={false}
          onOpenClaim={vi.fn()}
          isClaimDialogOpen={false}
          isClaimTransitioning={false}
          {...props}
        />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ItemCard", () => {
  it("renders item title", () => {
    renderCard();
    expect(screen.getByText("Baby Carrier")).toBeInTheDocument();
  });

  it("shows description in expanded view after clicking card", () => {
    renderCard();
    fireEvent.click(screen.getByText("Baby Carrier").closest("div")!);
    expect(screen.getByText("Great for newborns")).toBeInTheDocument();
  });

  it("shows notes for gifters in collapsed view when notes are set", () => {
    renderCard({ item: { ...base, notes: "Please get size L" } });
    expect(screen.getAllByText("Please get size L").length).toBeGreaterThan(0);
  });

  it("shows full description and notes in expanded view after clicking card", () => {
    renderCard({ item: { ...base, notes: "Please get size L" } });
    fireEvent.click(screen.getByText("Baby Carrier").closest("div")!);
    expect(screen.getByText("Great for newborns")).toBeInTheDocument();
    expect(screen.getByText("Please get size L")).toBeInTheDocument();
  });

  it("renders price and flag badge", () => {
    renderCard();
    expect(screen.getByText("Exact only")).toBeInTheDocument();
    expect(screen.getByText(/189\.99/)).toBeInTheDocument();
  });

  it("renders url as link when present", () => {
    renderCard({ item: { ...base, urlOriginal: "https://example.com/item" } });
    expect(screen.getByRole("link", { name: "Baby Carrier" })).toHaveAttribute(
      "href",
      "https://example.com/item",
    );
  });

  it("renders domain link in expanded view", () => {
    renderCard({ item: { ...base, urlOriginal: "https://www.example.com/item" } });
    fireEvent.click(screen.getByText("Baby Carrier").closest("div")!);
    expect(screen.getByRole("link", { name: "example.com" })).toHaveAttribute(
      "href",
      "https://www.example.com/item",
    );
  });

  it("renders image when imageUrl is present", () => {
    renderCard({ item: { ...base, imageUrl: "https://example.com/image.jpg" } });
    const img = screen.getByAltText("Baby Carrier");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("renders category placeholder when imageUrl is null and categoryName is provided", () => {
    renderCard({ categoryName: "Furniture" });
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("renders generic placeholder when imageUrl and categoryName are both null", () => {
    renderCard();
    const icon = document.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("shows edit link for owner", () => {
    renderCard({ isOwner: true });
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
  });

  it("shows claim button for logged-out user when not claimed", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /claim/i })).toBeInTheDocument();
  });

  it("calls onOpenClaim when anonymous user clicks claim", () => {
    const onOpenClaim = vi.fn();
    renderCard({ onOpenClaim });
    fireEvent.click(screen.getByRole("button", { name: /^claim$/i }));
    expect(onOpenClaim).toHaveBeenCalled();
  });

  it("shows Claimed when item is fully claimed", () => {
    renderCard({ claims: [makeClaim()] });
    expect(screen.getByText("Claimed")).toBeInTheDocument();
  });

  it("shows unclaim button when logged-in user has claimed", () => {
    renderCard(
      { claims: [makeClaim({ claimerUserId: "user-1" })] },
      { id: "user-1", email: "a@b.com", displayName: "Alice" },
    );
    expect(screen.getByRole("button", { name: /unclaim/i })).toBeInTheDocument();
  });

  it("fund item shows Contribute button instead of Claim", () => {
    renderCard({ item: { ...base, itemType: "FUND", priceReference: 200, currency: "USD" } });
    expect(screen.getByRole("button", { name: /contribute/i })).toBeInTheDocument();
  });

  it("fund item shows Fund closed badge when alreadyOwned is true", () => {
    renderCard({
      item: { ...base, itemType: "FUND", alreadyOwned: true, priceReference: 200, currency: "USD" },
    });
    expect(screen.getByText("Fund closed")).toBeInTheDocument();
  });

  it("fund item shows Fully funded when contributions meet target", () => {
    renderCard({
      item: { ...base, itemType: "FUND", priceReference: 200, currency: "USD" },
      claims: [makeClaim({ amountContributed: 200 })],
    });
    expect(screen.getByText("Fully funded")).toBeInTheDocument();
  });

  it("fund item does not show flag badge", async () => {
    renderCard({ item: { ...base, itemType: "FUND" } });
    await waitFor(() => expect(screen.queryByText("Exact only")).not.toBeInTheDocument());
  });
});
