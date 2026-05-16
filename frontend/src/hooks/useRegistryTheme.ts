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
        : "both";
      setRegistryOverride(color, background);
    }
    return () => clearRegistryOverride();
  }, [registry, setRegistryOverride, clearRegistryOverride]);
}
