import { useCallback, useSyncExternalStore } from "react";

/** Subscribe to a CSS media query. Always false during static prerendering. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Touch devices, narrow phones and landscape phones can't hover to grow the guess map,
 * so they get a tap-to-expand mini map instead.
 */
export const COMPACT_LAYOUT_QUERY =
  "(hover: none), (max-width: 639px), (max-height: 500px)";
