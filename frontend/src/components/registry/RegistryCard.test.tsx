import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistryCard } from "./RegistryCard";

vi.mock("@/hooks/useRegistries", () => ({
  usePrefetchRegistry: () => () => undefined,
}));

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

const base = {
  id: "1",
  name: "Baby Registry",
  slug: "baby-registry",
  description: null,
  visibility: "PUBLIC" as const,
  contributorAccess: "ANYONE" as const,
  ownerId: "u1",
  createdAt: "2024-01-01T00:00:00Z",
  themeColor: "peach",
  themeBackground: "both",
};

describe("RegistryCard", () => {
  it("renders registry name and links to registry page", () => {
    render(<RegistryCard registry={base} />);
    expect(screen.getByText("Baby Registry")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/r/baby-registry");
  });

  it("shows Public badge for public registry", () => {
    render(<RegistryCard registry={base} />);
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("shows Private badge for private registry", () => {
    render(<RegistryCard registry={{ ...base, visibility: "PRIVATE" }} />);
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("shows description when present", () => {
    render(<RegistryCard registry={{ ...base, description: "Our baby shower list" }} />);
    expect(screen.getByText("Our baby shower list")).toBeInTheDocument();
  });

  it("omits description when null", () => {
    render(<RegistryCard registry={base} />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
