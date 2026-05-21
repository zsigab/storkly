import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventAttendeesTable } from "./EventAttendeesTable";

const mockAttendees = [
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
    confirmedAt: null,
  },
  {
    id: "rsvp-3",
    displayName: "Charlie",
    email: "charlie@example.com",
    attending: true,
    confirmedAt: null,
  },
];

describe("EventAttendeesTable", () => {
  it("renders table with attendee rows", () => {
    render(<EventAttendeesTable attendees={mockAttendees} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows email addresses", () => {
    render(<EventAttendeesTable attendees={mockAttendees} />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("shows attending status with badges", () => {
    render(<EventAttendeesTable attendees={mockAttendees} />);
    const yeses = screen.getAllByText("Yes");
    const nos = screen.getAllByText("No");
    expect(yeses).toHaveLength(2);
    expect(nos).toHaveLength(1);
  });

  it("shows confirmed status for RSVPs with confirmedAt", () => {
    render(<EventAttendeesTable attendees={mockAttendees} />);
    const confirmed = screen.getAllByText("Confirmed");
    const pending = screen.getAllByText("Pending");
    expect(confirmed).toHaveLength(1);
    expect(pending).toHaveLength(2);
  });

  it("renders empty table when no attendees", () => {
    render(<EventAttendeesTable attendees={[]} />);
    expect(screen.getByText("Attendees")).toBeInTheDocument();
  });
});
