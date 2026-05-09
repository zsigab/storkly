import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeSelector } from "./ThemeSelector";

function makeStorage(initial: Record<string, string> = {}): Storage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

function setup(initial: Record<string, string> = {}): void {
  Object.defineProperty(window, "localStorage", {
    value: makeStorage(initial),
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
  });
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset["color"];
  delete document.documentElement.dataset["style"];
  delete document.documentElement.dataset["background"];
  document.documentElement.style.backgroundImage = "";
}

beforeEach(() => setup());

function renderSelector(): void {
  render(
    <ThemeProvider>
      <ThemeSelector />
    </ThemeProvider>,
  );
}

function openPanel(): void {
  fireEvent.click(screen.getByRole("button", { name: /theme settings/i }));
}

describe("ThemeSelector", () => {
  it("renders the theme settings button", () => {
    renderSelector();
    expect(screen.getByRole("button", { name: /theme settings/i })).toBeInTheDocument();
  });

  it("opens the popover on click", () => {
    renderSelector();
    openPanel();
    expect(screen.getByRole("region", { name: /color accent/i })).toBeInTheDocument();
  });

  it("renders all six color swatches", () => {
    renderSelector();
    openPanel();
    for (const label of ["Peach", "Blue", "Pink", "Green", "Purple", "Beige"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("sets data-color attribute when a color swatch is clicked", () => {
    renderSelector();
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Blue" }));
    expect(document.documentElement.dataset["color"]).toBe("blue");
  });

  it("adds dark class when mode toggle is clicked (light to dark)", () => {
    renderSelector();
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when toggled back to light", () => {
    renderSelector();
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /switch to light mode/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("restores saved theme from localStorage on mount", () => {
    setup({
      "storkly-theme": JSON.stringify({
        color: "purple",
        style: "glass",
        mode: "dark",
        background: "none",
      }),
    });
    renderSelector();
    expect(document.documentElement.dataset["color"]).toBe("purple");
    expect(document.documentElement.dataset["style"]).toBe("glass");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  describe("Background section", () => {
    it("renders Off, Blobs, and Blobs Cards background buttons", () => {
      renderSelector();
      openPanel();
      expect(screen.getByRole("button", { name: /^off$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^blobs$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^cards$/i })).toBeInTheDocument();
    });

    it("sets data-background to default when Blobs is clicked", () => {
      renderSelector();
      openPanel();
      fireEvent.click(screen.getByRole("button", { name: /^blobs$/i }));
      expect(document.documentElement.dataset["background"]).toBe("default");
    });

    it("applies background-image to html element when Blobs is clicked", () => {
      renderSelector();
      openPanel();
      fireEvent.click(screen.getByRole("button", { name: /^blobs$/i }));
      expect(document.documentElement.style.backgroundImage).toContain("radial-gradient");
    });

    it("clears background-image when Off is clicked after Blobs", () => {
      renderSelector();
      openPanel();
      fireEvent.click(screen.getByRole("button", { name: /^blobs$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^off$/i }));
      expect(document.documentElement.dataset["background"]).toBe("none");
      expect(document.documentElement.style.backgroundImage).toBe("");
    });

    it("sets data-background to tiles when Cards is clicked", () => {
      renderSelector();
      openPanel();
      fireEvent.click(screen.getByRole("button", { name: /^cards$/i }));
      expect(document.documentElement.dataset["background"]).toBe("tiles");
    });
  });
});
