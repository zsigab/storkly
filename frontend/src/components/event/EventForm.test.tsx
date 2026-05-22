import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/hooks/useTheme";
import { EventForm } from "./EventForm";

describe("EventForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      value: vi
        .fn()
        .mockReturnValue({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      writable: true,
    });
  });

  it("renders form fields", () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it("validates that title is required", async () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => expect(screen.getByText(/title is required/i)).toBeInTheDocument());
  });

  it("validates that event date is required", async () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => expect(screen.getByText(/event date is required/i)).toBeInTheDocument());
  });

  it("converts datetime-local to ISO format on submit", async () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2024-06-15T14:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    const call = mockOnSubmit.mock.calls[0]?.[0];
    expect(call?.eventDate).toMatch(/2024-06-15T14:00:00Z/);
  });

  it("submits form with all fields", async () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2024-06-15T14:00" },
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    const call = mockOnSubmit.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    if (call) {
      expect(call.title).toBe("Baby Shower");
      expect(call.eventDate).toContain("2024-06-15");
      expect(call.themeColor).toBe("peach");
      expect(call.themeBackground).toBe("none");
    }
  });

  it("submits location as null when empty or whitespace", async () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Baby Shower" } });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2024-06-15T14:00" },
    });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    const call = mockOnSubmit.mock.calls[0]?.[0];
    expect(call?.location).toBeNull();
  });

  it("pre-fills form with default values", () => {
    const defaults = {
      id: "event-1",
      title: "Baby Shower",
      eventDate: "2024-06-15T14:00:00Z",
      location: "123 Main St",
      rsvpToken: "token-abc",
      attendees: [],
      themeColor: "blue",
      themeBackground: "both",
      createdAt: "2024-01-01T00:00:00Z",
    };
    render(
      <ThemeProvider>
        <EventForm
          defaultValues={defaults}
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Save changes"
        />
      </ThemeProvider>,
    );
    expect(screen.getByDisplayValue("Baby Shower")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
  });

  it("shows error message when isError is true", () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={true}
          error={{ detail: "Event title already exists" }}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    expect(screen.getByText(/event title already exists/i)).toBeInTheDocument();
  });

  it("disables submit button when pending", () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={true}
          isError={false}
          error={undefined}
          submitLabel="Create event"
        />
      </ThemeProvider>,
    );
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });

  it("shows custom submit label", () => {
    render(
      <ThemeProvider>
        <EventForm
          onSubmit={mockOnSubmit}
          isPending={false}
          isError={false}
          error={undefined}
          submitLabel="Save changes"
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });
});
