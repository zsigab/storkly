import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
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
  Object.defineProperty(window, "matchMedia", {
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  });
  render(
    <QueryClientProvider client={makeClient()}>
      <ThemeProvider>
        <AuthProvider>
          <AddItemPage />
        </AuthProvider>
      </ThemeProvider>
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
    expect(mockNavigate).toHaveBeenCalledWith("/r/baby-shower", { viewTransition: true });
  });

  it("strips query params from product URL before saving", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        id: "item-1",
        registryId: "reg-1",
        categoryId: null,
        addedByUserId: "u1",
        urlOriginal: "https://www.lazada.com.ph/products/pdp-i123.html",
        sourceSite: "LAZADA_PH",
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
    fireEvent.change(screen.getByLabelText(/product url/i), {
      target: {
        value:
          "https://www.lazada.com.ph/products/pdp-i123.html?clickTrackInfo=query%3A%3Bnid%3A123&source=search&spm=a2o4l",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith(
        "/api/registries/{slug}/items",
        expect.objectContaining({
          body: expect.objectContaining({
            urlOriginal: "https://www.lazada.com.ph/products/pdp-i123.html",
          }),
        }),
      ),
    );
  });

  it("auto-fills form fields after URL blur when scraping returns a result", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        url: "https://www.lazada.com.ph/products/stroller-123",
        supported: true,
        sourceSite: "LAZADA_PH",
        title: "Baby Stroller Pro",
        description: "Lightweight and foldable",
        imageUrl: null,
        priceReference: 4999.0,
        currency: "PHP",
      },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/url/i)).toBeInTheDocument());

    const urlInput = screen.getByLabelText(/url/i);
    await userEvent.type(urlInput, "https://www.lazada.com.ph/products/stroller-123");
    fireEvent.blur(urlInput);

    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith(
        "/api/link-preview",
        expect.objectContaining({
          body: { url: "https://www.lazada.com.ph/products/stroller-123" },
        }),
      ),
    );
    await waitFor(() => expect(screen.getByDisplayValue("Baby Stroller Pro")).toBeInTheDocument());
    expect(screen.getByText(/fields auto-filled from url/i)).toBeInTheDocument();
  });

  it("shows source toggle when URL is pasted after manual title is entered", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        url: "https://www.lazada.com.ph/products/stroller-123",
        supported: true,
        sourceSite: "LAZADA_PH",
        title: "Baby Stroller Pro",
        description: null,
        imageUrl: null,
        priceReference: null,
        currency: null,
      },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "My Custom Title" } });

    const urlInput = screen.getByLabelText(/url/i);
    await userEvent.type(urlInput, "https://www.lazada.com.ph/products/stroller-123");
    fireEvent.blur(urlInput);

    // "Custom" only appears on the conflict toggle, not in the image source selector
    await waitFor(() => expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument());
    // Original title is preserved while source pill is on "custom"
    expect(screen.getByDisplayValue("My Custom Title")).toBeInTheDocument();
  });

  it("does not show auto-filled banner when scraping returns unsupported", async () => {
    const { api } = await import("@/api");
    vi.mocked(api.GET).mockResolvedValue({ data: [], error: undefined, response: new Response() });
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: {
        url: "https://unknown-shop.example.com/item-1",
        supported: false,
        sourceSite: "MANUAL",
        title: null,
        description: null,
        imageUrl: null,
        priceReference: null,
        currency: null,
      },
      error: undefined,
      response: new Response(),
    });
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/url/i)).toBeInTheDocument());

    const urlInput = screen.getByLabelText(/url/i);
    await userEvent.type(urlInput, "https://unknown-shop.example.com/item-1");
    fireEvent.blur(urlInput);

    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith("/api/link-preview", expect.anything()),
    );
    expect(screen.queryByText(/fields auto-filled from url/i)).not.toBeInTheDocument();
  });
});
