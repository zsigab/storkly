import { useState } from "react";
import { flushSync } from "react-dom";

export function useViewTransitionToggle(setState: (value: boolean) => void): {
  toggle: (open: boolean) => void;
  transitioning: boolean;
} {
  const [transitioning, setTransitioning] = useState(false);

  const toggle = (open: boolean): void => {
    if (!document.startViewTransition) {
      setState(open);
      return;
    }
    flushSync(() => setTransitioning(true));
    const vt = document.startViewTransition(() => {
      flushSync(() => setState(open));
    });
    void vt.finished.then(() => setTransitioning(false));
  };

  return { toggle, transitioning };
}
