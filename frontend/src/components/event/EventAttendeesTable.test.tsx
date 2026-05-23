import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventAttendeesTable } from "./EventAttendeesTable";

vi.mock("@/api", () => ({ api: { GET: vi.fn(), DELETE: vi.fn() } }));

const mockAttendees = [
  {
    id: "rsvp-1",
    displayName: "Alice",
    email: "alice@example.com",
    attending: true,
    confirmedAt: "2024-01-01T00:00:00Z",
    timeSlotTime: "2024-06-15T08:00:00Z",
  },
  {
    id: "rsvp-2",
    displayName: "Bob",
    email: "bob@example.com",
    attending: false,
    confirmedAt: null,
    timeSlotTime: null,
  },
  {
    id: "rsvp-3",
    displayName: "Charlie",
    email: "charlie@example.com",
    attending: true,
    confirmedAt: null,
    timeSlotTime: null,
  },
];

function renderTable(props: { ownerEventId?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EventAttendeesTable attendees={mockAttendees} {...props} />
    </QueryClientProvider>,
  );
}

describe("EventAttendeesTable", () => {
  it("renders collapsible header with attendee count", () => {
    renderTable();
    expect(screen.getByRole("button", { name: /Attendees/ })).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("renders attendee names in the DOM", () => {
    renderTable();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows email addresses", () => {
    renderTable();
    expect(screen.getByText(/alice/)).toBeInTheDocument();
    expect(screen.getByText(/bob/)).toBeInTheDocument();
  });

  it("shows attending status with badges", () => {
    renderTable();
    const yeses = screen.getAllByText("Yes");
    const nos = screen.getAllByText("No");
    expect(yeses).toHaveLength(2);
    expect(nos).toHaveLength(1);
  });

  it("shows confirmed status for RSVPs with confirmedAt", () => {
    renderTable();
    expect(screen.getAllByText("Confirmed")).toHaveLength(1);
    expect(screen.getAllByText("Pending")).toHaveLength(2);
  });

  it("shows formatted time slot when present", () => {
    renderTable();
    expect(screen.getByText(/2024-06-15/)).toBeInTheDocument();
  });

  it("shows dash when time slot is null", () => {
    renderTable();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("toggles open state when header is clicked", () => {
    renderTable();
    const toggle = screen.getByRole("button", { name: /Attendees/ });
    expect(toggle).toHaveTextContent("▼");
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent("▲");
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent("▼");
  });

  it("sorts by name descending when Name header is clicked (initial state is name asc)", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.at(0)?.textContent).toContain("Charlie");
    expect(rows.at(-1)?.textContent).toContain("Alice");
  });

  it("reverses back to ascending on second click of Name header", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.at(0)?.textContent).toContain("Alice");
    expect(rows.at(-1)?.textContent).toContain("Charlie");
  });

  it("does not show delete buttons without ownerEventId", () => {
    renderTable();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows delete buttons when ownerEventId is provided", () => {
    renderTable({ ownerEventId: "event-1" });
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  });

  it("opens confirm dialog when Delete is clicked", async () => {
    renderTable({ ownerEventId: "event-1" });
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0] ?? document.body);
    await waitFor(() => expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument());
    expect(screen.getByText("Delete RSVP?")).toBeInTheDocument();
  });

  it("closes confirm dialog on Cancel", async () => {
    renderTable({ ownerEventId: "event-1" });
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0] ?? document.body);
    await waitFor(() => expect(screen.getByText("Cancel")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument(),
    );
  });

  it("renders empty state when no attendees", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <EventAttendeesTable attendees={[]} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("No RSVPs yet.")).toBeInTheDocument();
  });
});
