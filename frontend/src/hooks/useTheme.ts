import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createElement } from "react";

export type ThemeColor = "peach" | "blue" | "pink" | "green" | "purple" | "beige";
export type ThemeStyle = "glass";
export type ThemeMode = "light" | "dark";
export type ThemeBackground = "none" | "default" | "tiles";

export interface ThemeState {
  color: ThemeColor;
  style: ThemeStyle;
  mode: ThemeMode;
  background: ThemeBackground;
}

interface ThemeContextValue {
  theme: ThemeState;
  setColor: (color: ThemeColor) => void;
  setStyle: (style: ThemeStyle) => void;
  toggleMode: () => void;
  setBackground: (bg: ThemeBackground) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "storkly-theme";
const COLORS: readonly ThemeColor[] = ["peach", "blue", "pink", "green", "purple", "beige"];
const STYLES: readonly ThemeStyle[] = ["glass"];
const BACKGROUNDS: readonly ThemeBackground[] = ["none", "default", "tiles"];

// Concrete HSL values per colour/mode — mirrors globals.css accent overrides.
// Using literal values (not var(--primary)) means the backgroundImage string
// actually changes when colour changes, so the browser invalidates its GPU
// compositing cache and repaints instead of serving a stale tile.
const BLOB_HSL: Record<ThemeColor, { light: string; dark: string }> = {
  peach: { light: "15 85% 68%", dark: "15 75% 65%" },
  blue: { light: "217 91% 60%", dark: "217 85% 70%" },
  pink: { light: "340 75% 64%", dark: "340 70% 68%" },
  green: { light: "160 84% 39%", dark: "160 70% 50%" },
  purple: { light: "271 81% 56%", dark: "271 75% 70%" },
  beige: { light: "35 50% 70%", dark: "35 40% 65%" },
};

// Corner-anchored radial blobs: centres pushed 10 % off-viewport so only the
// soft spread shows — no hard circular edges visible.
function makeBlobBg(color: ThemeColor, mode: ThemeMode): string {
  const hsl = BLOB_HSL[color][mode];
  const c = (alpha: number) => `hsl(${hsl} / ${alpha})`;
  const light = mode === "light";
  return [
    `radial-gradient(ellipse 90% 75% at -10% -10%, ${c(light ? 0.55 : 0.34)} 0%, transparent 65%)`,
    `radial-gradient(ellipse 75% 90% at 110% -10%, ${c(light ? 0.45 : 0.26)} 0%, transparent 65%)`,
    `radial-gradient(ellipse 90% 75% at 110% 110%, ${c(light ? 0.5 : 0.3)} 0%, transparent 65%)`,
    `radial-gradient(ellipse 75% 90% at -10% 110%, ${c(light ? 0.4 : 0.23)} 0%, transparent 65%)`,
    `radial-gradient(ellipse 70% 60% at 50% 50%, ${c(light ? 0.06 : 0.04)} 0%, transparent 70%)`,
  ].join(", ");
}

function isThemeColor(v: unknown): v is ThemeColor {
  return typeof v === "string" && (COLORS as readonly string[]).includes(v);
}

function isThemeStyle(v: unknown): v is ThemeStyle {
  return typeof v === "string" && (STYLES as readonly string[]).includes(v);
}

function isThemeBackground(v: unknown): v is ThemeBackground {
  return typeof v === "string" && (BACKGROUNDS as readonly string[]).includes(v);
}

function getInitialTheme(): ThemeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed: unknown = JSON.parse(stored);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "color" in parsed &&
        "style" in parsed &&
        "mode" in parsed
      ) {
        const p = parsed as Record<string, unknown>;
        const mode = p["mode"] === "dark" ? "dark" : "light";
        const background = isThemeBackground(p["background"]) ? p["background"] : "none";
        if (isThemeColor(p["color"]) && isThemeStyle(p["style"])) {
          return { color: p["color"], style: p["style"], mode, background };
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    color: "peach",
    style: "glass",
    mode: prefersDark ? "dark" : "light",
    background: "none",
  };
}

function applyTheme(theme: ThemeState): void {
  const el = document.documentElement;
  el.dataset["color"] = theme.color;
  el.dataset["style"] = theme.style;
  el.dataset["background"] = theme.background;
  el.classList.toggle("dark", theme.mode === "dark");

  // "default" puts blobs on the html element background (visible through glass).
  // "tiles" puts blobs on cards via CSS — no inline style needed here.
  if (theme.background === "default") {
    el.style.backgroundImage = makeBlobBg(theme.color, theme.mode);
    el.style.backgroundSize = "auto";
    el.style.backgroundPosition = "0 0";
    el.style.backgroundAttachment = "fixed";
  } else {
    el.style.backgroundImage = "";
    el.style.backgroundSize = "";
    el.style.backgroundPosition = "";
    el.style.backgroundAttachment = "";
  }
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<ThemeState>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const setColor = (color: ThemeColor): void => {
    setTheme((t) => ({ ...t, color }));
  };

  const setStyle = (style: ThemeStyle): void => {
    setTheme((t) => ({ ...t, style }));
  };

  const toggleMode = (): void => {
    setTheme((t) => ({ ...t, mode: t.mode === "dark" ? "light" : "dark" }));
  };

  const setBackground = (background: ThemeBackground): void => {
    setTheme((t) => ({ ...t, background }));
  };

  return createElement(
    ThemeContext.Provider,
    { value: { theme, setColor, setStyle, toggleMode, setBackground } },
    children,
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
