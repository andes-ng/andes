/**
 * Helpers for asserting `getComputedStyle()` values in the jsdom unit tests.
 *
 * Why this exists: from jsdom 28 on, `getComputedStyle()` returns *computed* values the way a
 * browser does instead of echoing the authored text. Lengths resolve to pixels (`2.375rem` ->
 * `38px`, `0.75em` -> the element's font size times 0.75, `calc((1.5rem - 1em) / 2)` -> `5px`),
 * `inherit` resolves to the parent's value, `0` reads as `0px`, and an undeclared property
 * reports its initial value (`none`, `0`, `auto`) rather than `''`. Two jsdom limitations remain:
 * a longhand holding `var()` is still reported verbatim, and a shorthand holding `var()` (for
 * example `border: 1px solid var(--x)`) is not expanded at all, so its longhands read as their
 * initial values.
 *
 * A spec keeps writing its expectation the way the stylesheet authors it (`'2.375rem'`) and
 * compares it in resolved pixels with {@link expectLength}; where jsdom cannot compute a value
 * (a `var()` shorthand), it asserts the declaration itself with {@link declaredValue}.
 *
 * Internal to the unit tests: excluded from the library build in `tsconfig.lib.json`.
 */

/** The root font size jsdom (and a browser with default settings) resolves `rem` against. */
export const ROOT_FONT_SIZE_PX = 16;

/** What a relative length resolves against. Both sizes are in pixels. */
export interface LengthContext {
  /** The element's own computed font size, for `em`. Defaults to the root font size. */
  readonly fontSize?: number;
  /** The root element's font size, for `rem`. Defaults to {@link ROOT_FONT_SIZE_PX}. */
  readonly rootFontSize?: number;
}

const PX_VALUE = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px)?$/i;

/**
 * Reads a resolved pixel length (`'38px'`, `'-5px'`, or the bare `'0'` jsdom reports for an
 * initial zero) as a number. Throws on anything else, so an unresolved value fails loudly.
 */
export function px(value: string): number {
  const match = PX_VALUE.exec(value.trim());
  const amount = match ? Number(match[1]) : Number.NaN;
  if (!match || Number.isNaN(amount) || (!match[2] && amount !== 0)) {
    throw new Error(`Expected a resolved px length, got "${value}"`);
  }
  return amount;
}

/** Converts a pixel amount to `rem` against the given root font size. */
export function toRem(pixels: number, rootPx = ROOT_FONT_SIZE_PX): number {
  return pixels / rootPx;
}

/**
 * Resolves an authored length to pixels: `px`, `rem`, `em`, a bare `0`, `calc()` with
 * `+ - * /` and parentheses, and `var(--name, fallback)` (custom properties are not defined in
 * the unit tests, so a `var()` resolves to its fallback; one without a fallback throws).
 */
export function toPx(
  length: string | number,
  context: LengthContext = {},
): number {
  if (typeof length === 'number') {
    return length;
  }
  const parser = new LengthParser(substituteFallbacks(length), {
    fontSize: context.fontSize ?? context.rootFontSize ?? ROOT_FONT_SIZE_PX,
    rootFontSize: context.rootFontSize ?? ROOT_FONT_SIZE_PX,
  });
  const result = parser.parse();
  if (!result.isLength && result.value !== 0) {
    throw new Error(`"${length}" is a number, not a length`);
  }
  return result.value;
}

/** True for a value that draws no length at all: `''`, `0`, `0px`, `0rem`, `0em`. */
export function isZeroLength(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || /^-?0*\.?0+(px|rem|em)?$/i.test(trimmed);
}

/**
 * Asserts that a computed length equals an authored one once both are in pixels.
 *
 * `expected` is written as the stylesheet writes it (`'2.375rem'`, `'0.75em'`,
 * `'calc((1.5rem - 1em) / 2)'`, `0`). An `em` needs `context.fontSize`. A `var()` expectation is
 * also accepted verbatim, because jsdom still reports a `var()` longhand as authored.
 */
export function expectLength(
  actual: string,
  expected: string | number,
  context: LengthContext = {},
): void {
  if (
    typeof expected === 'string' &&
    expected.includes('var(') &&
    actual === expected
  ) {
    return;
  }
  const want = toPx(expected, context);
  expect(
    px(actual),
    `"${actual}" should resolve to ${expected} (${want}px)`,
  ).toBeCloseTo(want, 3);
}

/**
 * Asserts that `child` resolved each property to its parent's value, which is what `inherit`
 * (or `font: inherit`) computes to. Properties are CSS names (`'font-size'`, `'line-height'`).
 * A parent value of `''` would make the comparison vacuous, so it throws instead.
 */
export function expectInherited(
  child: Element,
  properties: readonly string[],
  parent: Element | null = child.parentElement,
): void {
  if (!parent) {
    throw new Error('expectInherited needs a parent element');
  }
  const own = getComputedStyle(child);
  const inherited = getComputedStyle(parent);
  for (const property of properties) {
    const value = inherited.getPropertyValue(property);
    if (value === '') {
      throw new Error(`The parent has no computed "${property}" to inherit`);
    }
    expect(
      own.getPropertyValue(property),
      `${property} should be inherited`,
    ).toBe(value);
  }
}

/**
 * Returns the value a stylesheet declares for `property` in the last top-level rule whose
 * selector list contains `selector` (compared as written, whitespace collapsed), or `undefined`.
 * Rules inside at-rules (`@media`, `@supports`) are skipped. For declarations jsdom cannot
 * compute, such as a shorthand holding `var()`.
 */
export function declaredValue(
  css: string,
  selector: string,
  property: string,
): string | undefined {
  const wanted = collapse(selector);
  const name = property.trim().toLowerCase();
  let found: string | undefined;
  for (const rule of topLevelRules(css.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    if (
      !splitTopLevel(rule.prelude, ',').some(
        (part) => collapse(part) === wanted,
      )
    ) {
      continue;
    }
    for (const declaration of splitTopLevel(rule.body, ';')) {
      const colon = declaration.indexOf(':');
      if (
        colon > 0 &&
        declaration.slice(0, colon).trim().toLowerCase() === name
      ) {
        found = collapse(declaration.slice(colon + 1));
      }
    }
  }
  return found;
}

// ------------------------------------------------------------------ internals

interface Quantity {
  readonly value: number;
  readonly isLength: boolean;
}

const TOKEN =
  /\s*(calc\(|[()+\-*/]|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:px|rem|em)?)/iy;

class LengthParser {
  private readonly tokens: string[] = [];
  private index = 0;

  constructor(
    private readonly source: string,
    private readonly sizes: { fontSize: number; rootFontSize: number },
  ) {
    let position = 0;
    while (source.slice(position).trim() !== '') {
      TOKEN.lastIndex = position;
      const match = TOKEN.exec(source);
      if (!match) {
        this.fail();
      }
      this.tokens.push(match[1].toLowerCase());
      position = TOKEN.lastIndex;
    }
  }

  parse(): Quantity {
    const result = this.sum();
    if (this.index !== this.tokens.length) {
      this.fail();
    }
    return result;
  }

  private sum(): Quantity {
    let left = this.product();
    while (this.peek() === '+' || this.peek() === '-') {
      const operator = this.next();
      const right = this.product();
      if (left.isLength !== right.isLength) {
        this.fail();
      }
      left = {
        value:
          operator === '+'
            ? left.value + right.value
            : left.value - right.value,
        isLength: left.isLength,
      };
    }
    return left;
  }

  private product(): Quantity {
    let left = this.factor();
    while (this.peek() === '*' || this.peek() === '/') {
      const operator = this.next();
      const right = this.factor();
      if (operator === '*') {
        if (left.isLength && right.isLength) {
          this.fail();
        }
        left = {
          value: left.value * right.value,
          isLength: left.isLength || right.isLength,
        };
      } else {
        if (right.isLength) {
          this.fail();
        }
        left = { value: left.value / right.value, isLength: left.isLength };
      }
    }
    return left;
  }

  private factor(): Quantity {
    const token = this.next();
    if (token === '-') {
      const inner = this.factor();
      return { value: -inner.value, isLength: inner.isLength };
    }
    if (token === '(' || token === 'calc(') {
      const inner = this.sum();
      if (this.next() !== ')') {
        this.fail();
      }
      return inner;
    }
    const match = /^((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|rem|em)?$/.exec(
      token ?? '',
    );
    if (!match) {
      this.fail();
    }
    const amount = Number(match[1]);
    switch (match[2]) {
      case 'px':
        return { value: amount, isLength: true };
      case 'rem':
        return { value: amount * this.sizes.rootFontSize, isLength: true };
      case 'em':
        return { value: amount * this.sizes.fontSize, isLength: true };
      default:
        return { value: amount, isLength: false };
    }
  }

  private peek(): string | undefined {
    return this.tokens[this.index];
  }

  private next(): string | undefined {
    return this.tokens[this.index++];
  }

  private fail(): never {
    throw new Error(`Cannot resolve "${this.source}" as a px/rem/em length`);
  }
}

/** Replaces every `var(--name, fallback)` with its fallback, innermost first. */
function substituteFallbacks(text: string): string {
  let result = text;
  for (
    let start = result.lastIndexOf('var(');
    start !== -1;
    start = result.lastIndexOf('var(')
  ) {
    const close = matchingParen(result, start + 3);
    const args = splitTopLevel(result.slice(start + 4, close), ',');
    if (args.length < 2) {
      throw new Error(`"${text}" has a var() without a fallback`);
    }
    const fallback = args.slice(1).join(',').trim();
    result = `${result.slice(0, start)}${fallback}${result.slice(close + 1)}`;
  }
  return result;
}

function matchingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') {
      depth++;
    } else if (text[i] === ')' && --depth === 0) {
      return i;
    }
  }
  throw new Error(`Unbalanced parentheses in "${text}"`);
}

/** Splits on `separator` outside parentheses and brackets; drops empty parts. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth--;
    }
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

/** The `prelude { body }` rules at the top level of a stylesheet, skipping at-rule blocks. */
function topLevelRules(css: string): { prelude: string; body: string }[] {
  const rules: { prelude: string; body: string }[] = [];
  let preludeStart = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === ';' && css.slice(preludeStart, i).trim().startsWith('@')) {
      preludeStart = i + 1; // A statement at-rule such as `@import ...;`.
    } else if (css[i] === '{') {
      const prelude = css.slice(preludeStart, i).trim();
      const close = matchingBrace(css, i);
      if (!prelude.startsWith('@')) {
        rules.push({ prelude, body: css.slice(i + 1, close) });
      }
      i = close;
      preludeStart = close + 1;
    }
  }
  return rules;
}

function matchingBrace(css: string, open: number): number {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') {
      depth++;
    } else if (css[i] === '}' && --depth === 0) {
      return i;
    }
  }
  throw new Error('Unbalanced braces in the stylesheet');
}

function collapse(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
