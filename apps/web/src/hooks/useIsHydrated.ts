"use client";

import { useSyncExternalStore } from "react";

const noop = () => {};
const subscribeToNothing = () => noop;

/**
 * Returns `false` while rendering on the server and `true` once the component has been
 * hydrated on the client.
 *
 * This replaces the `useEffect(() => setMounted(true), [])` pattern: the hydration state is
 * read from an external store instead of being written back into React state, which avoids
 * the extra render pass (and the cascading render it triggers) on every mount.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}
