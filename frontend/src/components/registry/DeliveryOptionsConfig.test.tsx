import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryOptionsConfig } from "./DeliveryOptionsConfig";

const saveMutate = vi.fn();

vi.mock("@/hooks/useDeliveryOptions", () => ({
  useDeliveryOptions: () => ({ data: [], isPending: false }),
  useSaveDeliveryOption: () => ({
    mutate: saveMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteDeliveryOption: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useEvents", () => ({
  useMyEvents: () => ({
    data: [
      { id: "event-1", title: "Baby Shower" },
      { id: "event-2", title: "Birthday" },
    ],
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DeliveryOptionsConfig", () => {
  it("creates an EVENT claim type bound to an event with derived label and instructions", async () => {
    render(<DeliveryOptionsConfig slug="baby-shower" isPublic={false} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add" }));

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "EVENT" } });
    fireEvent.change(screen.getByLabelText("Event"), { target: { value: "event-1" } });

    expect(screen.getByDisplayValue("Handover at Baby Shower")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(saveMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "EVENT",
          label: "Baby Shower",
          description: "Handover at Baby Shower",
          eventId: "event-1",
        }),
        expect.anything(),
      );
    });
  });

  it("blocks submitting an EVENT claim type when no event is selected", async () => {
    render(<DeliveryOptionsConfig slug="baby-shower" isPublic={false} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add" }));

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "EVENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(screen.getByText("Please select an event")).toBeInTheDocument();
    });
    expect(saveMutate).not.toHaveBeenCalled();
  });
});
