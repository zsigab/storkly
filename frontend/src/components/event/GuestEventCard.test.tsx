import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuestEventCard } from "./GuestEventCard";
import type { EventPublicResponse } from "@/api/schema";

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

vi.mock("@/hooks/useEvents", () => ({
  usePrefetchPublicEvent: () => () => undefined,
}));

const event: EventPublicResponse = {
  id: "event-abc",
  title: "Baby Shower",
  eventDate: "2025-06-15T14:00:00Z",
  location: "123 Main St",
  description: null,
  themeColor: "peach",
  themeBackground: "none",
};

describe("GuestEventCard", () => {
  it("renders event title and date", () => {
    render(<GuestEventCard event={event} />);
    expect(screen.getByText("Baby Shower")).toBeInTheDocument();
    expect(screen.getByText(/2025-06-15/)).toBeInTheDocument();
  });

  it("renders location when present", () => {
    render(<GuestEventCard event={event} />);
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("links to public event page", () => {
    render(<GuestEventCard event={event} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/e/event-abc");
  });

  it("does not render location when null", () => {
    render(<GuestEventCard event={{ ...event, location: null }} />);
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });
});
