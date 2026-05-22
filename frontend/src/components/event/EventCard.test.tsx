import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "./EventCard";

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
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

const baseEvent = {
  id: "event-1",
  title: "Baby Shower",
  eventDate: "2024-06-15T14:00:00Z",
  location: "123 Main St",
  rsvpToken: "token-abc",
  attendees: [
    {
      id: "rsvp-1",
      displayName: "Alice",
      email: "alice@example.com",
      attending: true,
      confirmedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "rsvp-2",
      displayName: "Bob",
      email: "bob@example.com",
      attending: false,
      confirmedAt: "2024-01-01T00:00:00Z",
    },
  ],
  themeColor: "peach",
  themeBackground: "none",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("EventCard", () => {
  it("renders event title with link to event page", () => {
    render(<EventCard event={baseEvent} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/e/event-1");
    expect(screen.getByText("Baby Shower")).toBeInTheDocument();
  });

  it("shows formatted event date", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText(/2024-06-15/)).toBeInTheDocument();
  });

  it("shows location when present", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("omits location when null", () => {
    render(<EventCard event={{ ...baseEvent, location: null }} />);
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });

  it("shows count of attending attendees", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("1 attending")).toBeInTheDocument();
  });
});
