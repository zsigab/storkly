import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the welcome heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /welcome to storkly/i })).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<HomePage />);
    expect(screen.getByText(/your gift registry, simplified/i)).toBeInTheDocument();
  });
});
