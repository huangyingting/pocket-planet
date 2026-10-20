/** A font stack from the stylesheet (e.g. `--font-hud`), so canvas text uses the same faces as the HTML. */
export function cssFont(name: string): string {
  const v = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || 'system-ui, sans-serif';
}
