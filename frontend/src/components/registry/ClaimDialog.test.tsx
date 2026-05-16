import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ClaimDialog } from "./ClaimDialog";

vi.mock("@/api", () => ({ api: { POST: vi.fn() } }));
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => vi.fn() };
});

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function renderDialog(props: Partial<Parameters<typeof ClaimDialog>[0]> = {}, open = true) {
  Object.defineProperty(window, "localStorage", {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <ClaimDialog
          open={open}
          onOpenChange={vi.fn()}
          itemId="item-1"
          itemTitle="Baby Carrier"
          slug="baby-shower"
          {...props}
        />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("ClaimDialog", () => {
  it("renders name and email fields when open", () => {
    renderDialog();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
  });

  it("shows validation errors when submitted empty", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /claim item/i }));
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
  });

  it("calls API with name and email on valid submit", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "c1",
        itemId: "item-1",
        claimerUserId: null,
        claimerName: "Alice",
        claimerEmail: "alice@example.com",
        quantityClaimed: 1,
        claimedAt: "2024-01-01T00:00:00Z",
      },
      error: undefined,
      response: new Response(),
    });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /claim item/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/items/{id}/claims", {
        params: { path: { id: "item-1" } },
        body: {
          claimerName: "Alice",
          claimerEmail: "alice@example.com",
          quantityClaimed: 1,
          amountContributed: null,
          percentageContributed: null,
          deliveryOptionId: null,
        },
      }),
    );
  });
});

describe("ClaimDialog — fund mode", () => {
  it("shows Contribute button and title in fund mode", () => {
    renderDialog({ isFund: true, isAuthenticated: true });
    expect(screen.getByRole("heading", { name: /contribute to fund/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^contribute$/i })).toBeInTheDocument();
  });

  it("does not show partial amount checkbox in fund mode", () => {
    renderDialog({ isFund: true, isAuthenticated: true });
    expect(screen.queryByText(/contribute a partial amount/i)).not.toBeInTheDocument();
  });

  it("shows amount field immediately in fund mode", () => {
    renderDialog({ isFund: true, isAuthenticated: true, priceReference: 200, currency: "USD" });
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it("shows validation error when amount is 0 in fund mode", async () => {
    renderDialog({ isFund: true, isAuthenticated: true, priceReference: 200, currency: "USD" });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /^contribute$/i }));
    await waitFor(() =>
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument(),
    );
  });

  it("shows over-limit warning when amount exceeds remaining", () => {
    renderDialog({
      isFund: true,
      isAuthenticated: true,
      priceReference: 200,
      currency: "USD",
      maxAmount: 50,
    });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "75" } });
    expect(screen.getByText(/25\.00 over the target/i)).toBeInTheDocument();
  });

  it("calls API with amountContributed on valid fund submit", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "c1",
        itemId: "item-1",
        claimerUserId: "u1",
        claimerName: null,
        claimerEmail: null,
        quantityClaimed: 1,
        amountContributed: 50,
        claimedAt: "2024-01-01T00:00:00Z",
      },
      error: undefined,
      response: new Response(),
    });
    renderDialog({ isFund: true, isAuthenticated: true, priceReference: 200, currency: "USD" });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /^contribute$/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/items/{id}/claims", {
        params: { path: { id: "item-1" } },
        body: {
          claimerName: null,
          claimerEmail: null,
          quantityClaimed: 1,
          amountContributed: 50,
          percentageContributed: null,
          deliveryOptionId: null,
        },
      }),
    );
  });
});
