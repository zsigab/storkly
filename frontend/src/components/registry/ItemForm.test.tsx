import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ItemForm } from "./ItemForm";
import type { CategoryResponse } from "@/api/schema";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
vi.mock("@/hooks/useLinkPreview", () => ({
  useLinkPreview: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
vi.mock("@/hooks/useImageUpload", () => ({
  useImageUpload: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const defaultCategory: CategoryResponse = {
  id: "cat-1",
  registryId: null,
  name: "Toys",
  sortOrder: 0,
  isDefault: true,
  isSystem: false,
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderForm(props: Partial<Parameters<typeof ItemForm>[0]> = {}) {
  render(
    <QueryClientProvider client={makeClient()}>
      <ItemForm
        categories={[defaultCategory]}
        onSubmit={vi.fn()}
        isPending={false}
        isError={false}
        error={null}
        submitLabel="Save"
        {...props}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ItemForm", () => {
  it("renders the Product and Fund type buttons", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fund/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^event$/i })).not.toBeInTheDocument();
  });

  it("submits a PRODUCT item with the entered title", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    const titleInput = screen.getByRole("textbox", { name: /title/i });
    fireEvent.change(titleInput, { target: { value: "Test Product" } });

    const submitButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Test Product", itemType: "PRODUCT" }),
      );
    });
  });
});
