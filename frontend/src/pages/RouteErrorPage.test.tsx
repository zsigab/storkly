import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { RouteErrorPage } from "./RouteErrorPage";

function renderPage() {
  render(
    <MemoryRouter>
      <RouteErrorPage />
    </MemoryRouter>,
  );
}

describe("RouteErrorPage", () => {
  it("renders something went wrong heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  });

  it("renders a go home link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});
