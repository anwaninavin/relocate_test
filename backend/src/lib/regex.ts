/** Escapes regex metacharacters so user-typed search text can be safely embedded in a
 * `new RegExp(...)` without being interpreted as a pattern. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
