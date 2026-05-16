import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createElement } from "react";

export type ThemeColor = "peach" | "blue" | "pink" | "green" | "purple" | "beige";
export type ThemeStyle = "glass";
export type ThemeMode = "light" | "dark" | "system";
export type ThemeBackground = "none" | "default" | "stars" | "both";

export interface ThemeState {
  color: ThemeColor;
  style: ThemeStyle;
  mode: ThemeMode;
  background: ThemeBackground;
}

interface ThemeContextValue {
  theme: ThemeState;
  bgStyle: CSSProperties;
  setColor: (color: ThemeColor) => void;
  setStyle: (style: ThemeStyle) => void;
  setMode: (mode: ThemeMode) => void;
  setBackground: (bg: ThemeBackground) => void;
  setRegistryOverride: (color: ThemeColor, background: ThemeBackground) => void;
  clearRegistryOverride: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "storkly-theme";
const COLORS: readonly ThemeColor[] = ["peach", "blue", "pink", "green", "purple", "beige"];
const STYLES: readonly ThemeStyle[] = ["glass"];
const BACKGROUNDS: readonly ThemeBackground[] = ["none", "default", "stars", "both"];

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

// HSL base per colour/mode used for star colour generation.
const STAR_BASE_HSL: Record<
  ThemeColor,
  { light: readonly [number, number, number]; dark: readonly [number, number, number] }
> = {
  peach: { light: [15, 85, 68], dark: [15, 75, 65] },
  blue: { light: [217, 91, 60], dark: [217, 85, 70] },
  pink: { light: [340, 75, 64], dark: [340, 70, 68] },
  green: { light: [160, 84, 39], dark: [160, 70, 50] },
  purple: { light: [271, 81, 56], dark: [271, 75, 70] },
  beige: { light: [35, 50, 70], dark: [35, 40, 65] },
};

// LCG PRNG — same seed always produces the same sequence.
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function starPath(cx: number, cy: number, r: number): string {
  const d = r * 0.35 * 0.7071;
  const t = (n: number): string => n.toFixed(1);
  return (
    `M${t(cx)} ${t(cy - r)}` +
    `L${t(cx + d)} ${t(cy - d)}` +
    `L${t(cx + r)} ${t(cy)}` +
    `L${t(cx + d)} ${t(cy + d)}` +
    `L${t(cx)} ${t(cy + r)}` +
    `L${t(cx - d)} ${t(cy + d)}` +
    `L${t(cx - r)} ${t(cy)}` +
    `L${t(cx - d)} ${t(cy - d)}Z`
  );
}

// Positions use a fixed seed so they stay stable across colour/mode changes.
// Colours use a different seed so the hue/lightness offsets are independent.
const STAR_POS_SEED = 0x5a1ad1ce;
const STAR_COL_SEED = 0xdeadbeef;

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function makeStarBg(color: ThemeColor, mode: "light" | "dark"): string {
  const hsl = STAR_BASE_HSL[color][mode];
  const bh = hsl[0];
  const bs = hsl[1];
  const bl = hsl[2];

  const posRng = seededRng(STAR_POS_SEED);
  const colRng = seededRng(STAR_COL_SEED);
  const paths: string[] = [];

  for (let i = 0; i < 200; i++) {
    const cx = posRng() * 1920;
    const cy = posRng() * 1080;
    const r = 4 + posRng() * 8; // radius 4–12
    const rot = Math.floor(posRng() * 90); // 0–89°

    const dh = (colRng() - 0.5) * 8; // ±4 hue
    // Light mode: wider saturation swing for punchier colours against pale bg
    const ds = mode === "light" ? (colRng() - 0.5) * 50 : (colRng() - 0.5) * 30;
    // Light mode: bias toward darker so stars read against near-white page;
    // roughly −42 to +8 range keeps most stars well below the background lightness
    const dl = mode === "light" ? (colRng() - 0.85) * 50 : (colRng() - 0.5) * 50;
    // Light mode: higher floor opacity so even small stars stay visible
    const opacity = mode === "light" ? 0.4 + colRng() * 0.5 : 0.2 + colRng() * 0.45;

    const h = (((bh + dh) % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, bs + ds));
    const l = Math.max(10, Math.min(mode === "light" ? 68 : 90, bl + dl));
    const cxs = cx.toFixed(1);
    const cys = cy.toFixed(1);

    paths.push(
      `<path d="${starPath(cx, cy, r)}" fill="hsl(${h | 0} ${s | 0}% ${l | 0}%)" opacity="${opacity.toFixed(2)}" transform="rotate(${rot},${cxs},${cys})"/>`,
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">${paths.join("")}</svg>`;
  return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
}

// Corner-anchored radial blobs: centres pushed 10 % off-viewport so only the
// soft spread shows — no hard circular edges visible.
function makeBlobBg(color: ThemeColor, mode: "light" | "dark"): string {
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

export function isThemeColor(v: unknown): v is ThemeColor {
  return typeof v === "string" && (COLORS as readonly string[]).includes(v);
}

function isThemeStyle(v: unknown): v is ThemeStyle {
  return typeof v === "string" && (STYLES as readonly string[]).includes(v);
}

export function isThemeBackground(v: unknown): v is ThemeBackground {
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
        const mode = p["mode"] === "dark" ? "dark" : p["mode"] === "system" ? "system" : "light";
        const background = isThemeBackground(p["background"]) ? p["background"] : "both";
        if (isThemeColor(p["color"]) && isThemeStyle(p["style"])) {
          return { color: p["color"], style: p["style"], mode, background };
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return {
    color: "peach",
    style: "glass",
    mode: "system",
    background: "both",
  };
}

function applyTheme(theme: ThemeState): void {
  const el = document.documentElement;
  el.dataset["color"] = theme.color;
  el.dataset["style"] = theme.style;
  el.dataset["background"] = theme.background;
  const isDark =
    theme.mode === "dark" ||
    (theme.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  el.classList.toggle("dark", isDark);
}

// Chrome puts <html> inline backgrounds into a root compositor layer that
// backdrop-filter cannot access, so the frosted-glass blur has nothing to
// blur. Returning a CSSProperties object instead lets the caller render a
// position:fixed div in the normal compositing flow, which backdrop-filter
// can blur in both Chrome and Firefox.
function computeBgStyle(theme: ThemeState): CSSProperties {
  const mode = resolveMode(theme.mode);
  if (theme.background === "default") {
    return {
      backgroundImage: makeBlobBg(theme.color, mode),
      backgroundSize: "auto",
      backgroundPosition: "0 0",
    };
  }
  if (theme.background === "stars") {
    return {
      backgroundImage: makeStarBg(theme.color, mode),
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (theme.background === "both") {
    return {
      backgroundImage: `${makeStarBg(theme.color, mode)}, ${makeBlobBg(theme.color, mode)}`,
      backgroundSize: "cover, auto",
      backgroundPosition: "center, 0 0",
    };
  }
  return {};
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<ThemeState>(getInitialTheme);
  const [registryOverride, setRegistryTheme] = useState<{
    color: ThemeColor;
    background: ThemeBackground;
  } | null>(null);

  const effectiveColor = registryOverride?.color ?? theme.color;
  const effectiveBackground = registryOverride?.background ?? theme.background;

  useEffect(() => {
    const el = document.documentElement;
    el.dataset["color"] = effectiveColor;
    el.dataset["style"] = theme.style;
    el.dataset["background"] = effectiveBackground;
    const isDark =
      theme.mode === "dark" ||
      (theme.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    el.classList.toggle("dark", isDark);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme, effectiveColor, effectiveBackground]);

  useEffect(() => {
    if (theme.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent): void => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme.mode]);

  const bgStyle = useMemo(
    () => computeBgStyle({ ...theme, color: effectiveColor, background: effectiveBackground }),
    [theme, effectiveColor, effectiveBackground],
  );

  const setColor = (color: ThemeColor): void => {
    setTheme((t) => ({ ...t, color }));
  };

  const setStyle = (style: ThemeStyle): void => {
    setTheme((t) => ({ ...t, style }));
  };

  const setMode = (mode: ThemeMode): void => {
    setTheme((t) => ({ ...t, mode }));
  };

  const setBackground = (background: ThemeBackground): void => {
    setTheme((t) => ({ ...t, background }));
  };

  const setRegistryOverride = useCallback(
    (color: ThemeColor, background: ThemeBackground): void => {
      setRegistryTheme({ color, background });
    },
    [],
  );

  const clearRegistryOverride = useCallback((): void => {
    setRegistryTheme(null);
  }, []);

  return createElement(
    ThemeContext.Provider,
    {
      value: {
        theme,
        bgStyle,
        setColor,
        setStyle,
        setMode,
        setBackground,
        setRegistryOverride,
        clearRegistryOverride,
      },
    },
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
