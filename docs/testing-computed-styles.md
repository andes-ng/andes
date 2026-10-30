# Testing computed styles (jsdom 28+)

From jsdom 28 on, `getComputedStyle()` returns computed values like a browser instead of echoing
the stylesheet: `2.375rem` reads `38px`, `0.75em` reads the font size times 0.75, `calc()` is
evaluated, `inherit` becomes the parent's value, `0` reads `0px`, and an undeclared property
reports its initial value (`none`, `0`, `auto`) rather than `''`. Two gaps remain: a longhand
holding `var()` is still reported verbatim, and a shorthand holding `var()` (such as
`border: 1px solid var(--x)`) is not expanded, so its longhands read as initial values.
jsdom also refuses `focus()` on a `hidden` element, as browsers do.

## Helper: `packages/ui/src/testing/computed-style.ts`

Internal to the specs (excluded in `tsconfig.lib.json`, never published). Rem resolves at 16px.
`px(value)`, `toRem(px)`, `toPx(length, { fontSize })`, `isZeroLength(value)`,
`expectLength(actual, expected, { fontSize })`, `expectInherited(el, props)`,
`declaredValue(css, selector, property)`.

```ts
expectLength(style.minBlockSize, '2.375rem'); // compared as 38px
expectLength(style.width, '0.75em', { fontSize: 14 }); // 10.5px
expect(declaredValue(css, '.a > .b', 'border-width')).toBe('0 0 1px');
```

## Checklist to migrate a spec

1. Run the suite and list every `getComputedStyle` failure; also grep the spec for expectations
   holding `rem`, `em`, `calc(`, `inherit`, `''` or `'0'`: some still pass but prove nothing.
2. Authored length (`rem`, `em`, `calc()`): keep the authored text, swap `toBe` for
   `expectLength`; pass `{ fontSize }` for `em`, taken from the element it is relative to.
3. Row or size math built on `parseFloat()` of a computed value: use `toPx('1.375rem')`.
4. `'0'` -> `expectLength(value, 0)`; `''` meaning "nothing" -> `'none'` for keywords, or
   `isZeroLength()` for lengths. Re-check every `not.toBe('')`: initial values are no longer `''`.
5. `inherit` / `font: inherit` -> `expectInherited(el, ['font-size', 'line-height'])`; if the
   environment cannot tell inherit from the default, also assert `declaredValue(...)`.
6. A shorthand holding `var()` -> assert `declaredValue()` on the selector, plus the class or
   attribute that makes the selector match. `var()` longhands may stay as authored strings.
7. Focus on a row that a change un-hides: run `fixture.detectChanges()` before `focus()`.
8. Never relax an assertion to make it pass; mutate the CSS once to see the test still fail.
