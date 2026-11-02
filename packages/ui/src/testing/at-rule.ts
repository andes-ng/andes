/**
 * Reads the rules inside CSS at-rules, for the stylesheet contract specs.
 *
 * `declaredValue()` (see `computed-style.ts`) skips rules nested in `@media`/`@supports`, so a
 * spec that needs a declaration made under `@media (prefers-reduced-motion: no-preference)`
 * or `@media (forced-colors: active)` first takes that block's inside with {@link atRule} and
 * looks the property up there.
 *
 * Internal to the unit tests: excluded from the library build in `tsconfig.lib.json`.
 */

/**
 * The inside of every at-rule whose prelude starts with `prelude` (for example
 * `@media (forced-colors: active)`), joined with newlines. Empty when there is none.
 * Plain string search with brace matching, so no pattern is built from the prelude.
 */
export function atRule(css: string, prelude: string): string {
  let inside = '';
  for (
    let at = css.indexOf(prelude);
    at !== -1;
    at = css.indexOf(prelude, at + 1)
  ) {
    const open = css.indexOf('{', at);
    if (open === -1) {
      break;
    }
    let depth = 0;
    let close = open;
    for (; close < css.length; close++) {
      if (css[close] === '{') {
        depth++;
      } else if (css[close] === '}' && --depth === 0) {
        break;
      }
    }
    inside += `${css.slice(open + 1, close)}\n`;
  }
  return inside;
}

/** The stylesheet with comments dropped and whitespace collapsed to single spaces. */
export function collapsed(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
}
