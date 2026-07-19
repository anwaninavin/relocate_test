/**
 * Lightweight pub-sub (same pattern as refresh-bus.ts) so a nav item or home card that's been
 * turned off by the admin's "Live" toggle can pop the coming-soon dialog without threading a
 * dialog-open callback through every nav-rendering component.
 */
const listeners = new Set<(label: string) => void>();

export function emitComingSoon(label: string) {
  for (const listener of listeners) listener(label);
}

export function subscribeComingSoon(listener: (label: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
