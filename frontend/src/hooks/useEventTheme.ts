import { useLayoutEffect } from "react";
import { usePublicEvent } from "./useEvents";
import { isThemeBackground, isThemeColor, useTheme } from "./useTheme";

export function useEventTheme(id: string): void {
  const { data: event } = usePublicEvent(id);
  const { setRegistryOverride, clearRegistryOverride } = useTheme();

  useLayoutEffect(() => {
    if (event !== undefined) {
      const color = isThemeColor(event.themeColor) ? event.themeColor : "peach";
      const background = isThemeBackground(event.themeBackground) ? event.themeBackground : "none";
      setRegistryOverride(color, background);
    }
  }, [event, setRegistryOverride]);

  useLayoutEffect(() => {
    return () => clearRegistryOverride();
  }, [clearRegistryOverride]);
}
