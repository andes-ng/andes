import { readdirSync, readFileSync } from 'node:fs';

/*
 * The library draws every control with its own components, never with a native one. This guard
 * reads the sources of the table folder (templates, stylesheets, TypeScript) and every story, and
 * fails when one of them uses a native control, an element that imitates one, a hand-made
 * floating panel, a hand-drawn graphic, or the browser's own tooltip. There is no allow-list:
 * a story that needs a control uses `andes-button`, `andes-checkbox`, `andes-radio`, `andes-input`,
 * `andes-select`, `andes-switch`, `andes-date-picker`, `andes-input-number`, `andes-dropdown-menu`,
 * `andes-popover`, `andes-tooltip`, `andes-dialog`, `andes-tag`, `andes-badge`, `andes-avatar`,
 * `andes-empty` or `andes-skeleton`.
 */

const TABLE = 'packages/ui/src/lib/table';
const KIT = 'packages/ui/src/testing/table-story-kit.ts';

const sources = readdirSync(TABLE)
  .filter((file) => !file.endsWith('.spec.ts'))
  .map(
    (file) =>
      [`${TABLE}/${file}`, readFileSync(`${TABLE}/${file}`, 'utf8')] as const,
  );

const withKit = [...sources, [KIT, readFileSync(KIT, 'utf8')] as const];

/** Native elements: a control, a form part, a list of choices, a progress bar, a link. */
const NATIVE_ELEMENTS = [
  'input',
  'button',
  'select',
  'option',
  'optgroup',
  'datalist',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'details',
  'summary',
  'dialog',
  'progress',
  'meter',
  'output',
  'a',
  'img',
  'svg',
  'canvas',
  'iframe',
  'video',
  'audio',
];

/** Roles that make an ordinary element look like a control to assistive tech. */
const CONTROL_ROLES = [
  'checkbox',
  'radio',
  'switch',
  'button',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'combobox',
  'listbox',
  'option',
  'slider',
  'spinbutton',
  'textbox',
  'searchbox',
  'tab',
];

/** Opening tags found in a text, as `[name, whole tag]`. No dynamic patterns. */
function tagsOf(source: string): [string, string][] {
  const found: [string, string][] = [];
  let from = source.indexOf('<');
  while (from !== -1) {
    const next = source[from + 1];
    if (next !== undefined && /[a-z]/.test(next)) {
      let end = from + 1;
      let quote = '';
      while (end < source.length) {
        const char = source[end];
        if (quote) {
          if (char === quote) {
            quote = '';
          }
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === '>') {
          break;
        }
        end++;
      }
      const tag = source.slice(from, end + 1);
      let nameEnd = 1;
      while (nameEnd < tag.length && /[a-z0-9-]/i.test(tag[nameEnd])) {
        nameEnd++;
      }
      found.push([tag.slice(1, nameEnd).toLowerCase(), tag]);
    }
    from = source.indexOf('<', from + 1);
  }
  return found;
}

const isTemplateFile = (file: string) =>
  file.endsWith('.html') ||
  file.endsWith('.stories.ts') ||
  file.endsWith('table-story-kit.ts') ||
  // A component file holds its template inline.
  (file.endsWith('.ts') && !file.endsWith('.spec.ts'));

describe('the table draws no native control', () => {
  it('finds the table sources and the stories', () => {
    expect(sources.length).toBeGreaterThan(30);
    expect(
      sources.filter(([file]) => file.endsWith('.stories.ts')).length,
    ).toBeGreaterThanOrEqual(14);
  });

  it.each(withKit.filter(([file]) => isTemplateFile(file)))(
    '%s has no native control element',
    (file, source) => {
      const offenders = tagsOf(source)
        .map(([name]) => name)
        .filter((name) => NATIVE_ELEMENTS.includes(name));

      expect([file, offenders]).toEqual([file, []]);
    },
  );

  it.each(withKit.filter(([file]) => isTemplateFile(file)))(
    '%s has no element that imitates a control or a tooltip',
    (file, source) => {
      const offenders: string[] = [];
      for (const [name, tag] of tagsOf(source)) {
        const library = name.startsWith('andes-') || name.startsWith('ng-');
        for (const role of CONTROL_ROLES) {
          if (tag.includes(`role="${role}"`)) {
            offenders.push(`<${name}> role=${role}`);
          }
        }
        if (
          !library &&
          (tag.includes(' title="') || tag.includes('[attr.title]'))
        ) {
          offenders.push(`<${name}> title`);
        }
        if (tag.includes(' popover') || tag.includes('contenteditable')) {
          offenders.push(`<${name}> hand-made panel or editor`);
        }
        if (!library && tag.includes('type="number"')) {
          offenders.push(`<${name}> number field`);
        }
      }

      expect([file, offenders]).toEqual([file, []]);
    },
  );

  it.each(
    sources.filter(
      ([file]) => file.endsWith('.ts') && !file.endsWith('.stories.ts'),
    ),
  )(
    '%s sets no native title and opens no floating panel by hand',
    (file, source) => {
      expect([file, source.includes("setAttribute('title'")]).toEqual([
        file,
        false,
      ]);
      expect([file, source.includes('showPopover')]).toEqual([file, false]);
      expect([file, source.includes('document.createElement')]).toEqual([
        file,
        false,
      ]);
    },
  );

  it.each(sources.filter(([file]) => file.endsWith('.css')))(
    '%s styles no native control',
    (file, source) => {
      const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const element of ['input', 'select', 'textarea', 'button']) {
        expect([
          file,
          element,
          css.includes(` ${element}`) || css.includes(`\n${element}`),
        ]).toEqual([file, element, false]);
      }
    },
  );
});
