/** Wall-clock time in ms. Server components that need "now" call this (rather than `Date.now()` inline). */
export function currentTimeMs(): number {
  return Date.now();
}
