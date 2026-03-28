import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createElement } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("storkly-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("storkly-theme", theme);
  }, [theme]);

  const toggle = (): void => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return createElement(ThemeContext.Provider, { value: { theme, toggle } }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
