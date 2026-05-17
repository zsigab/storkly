import { useLayoutEffect } from "react";
import { useRegistry } from "./useRegistries";
import { isThemeBackground, isThemeColor, useTheme } from "./useTheme";

export function useRegistryTheme(slug: string): void {
  const { data: registry } = useRegistry(slug);
  const { setRegistryOverride, clearRegistryOverride } = useTheme();

  useLayoutEffect(() => {
    if (registry !== undefined) {
      const color = isThemeColor(registry.themeColor) ? registry.themeColor : "peach";
      const background = isThemeBackground(registry.themeBackground)
        ? registry.themeBackground
        : "none";
      setRegistryOverride(color, background);
    }
  }, [registry, setRegistryOverride]);

  useLayoutEffect(() => {
    return () => clearRegistryOverride();
  }, [clearRegistryOverride]);
}
