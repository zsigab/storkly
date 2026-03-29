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

function renderDialog(open = true) {
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
        body: { claimerName: "Alice", claimerEmail: "alice@example.com", quantityClaimed: 1 },
      }),
    );
  });
});
