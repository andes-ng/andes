/**
 * Which lucide icon an `<ng-icon>` drew, for the specs (internal, never published).
 *
 * A template's static `name="lucideX"` is an attribute, but a bound `[name]` is only an input,
 * so the drawn svg is what tells the icons apart: it is compared with the svg markup of each
 * candidate (the constants `@ng-icons/lucide` exports), parsed the same way `ng-icon` does.
 */
export function lucideName(
  icon: Element | null | undefined,
  candidates: Readonly<Record<string, string>>,
): string | null {
  const drawn = icon?.querySelector('svg');
  if (!drawn) {
    return null;
  }
  for (const [name, svg] of Object.entries(candidates)) {
    const template = document.createElement('template');
    template.innerHTML = svg;
    if (template.content.firstElementChild?.innerHTML === drawn.innerHTML) {
      return name;
    }
  }
  return null;
}
