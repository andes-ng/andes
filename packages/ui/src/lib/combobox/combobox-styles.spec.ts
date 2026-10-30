import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The stylesheet with comments dropped and whitespace collapsed, for contract checks. */
const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'combobox.css'),
  'utf-8',
)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ');

describe('AndesCombobox styles', () => {
  describe('clear button', () => {
    const rule = css.match(/\.andes-combobox-clear \{[^}]*\}/)?.[0] ?? '';

    it('has a 24px hit area that the negative margin takes back out of the layout', () => {
      expect(rule).toContain('padding: calc((1.5rem - 1em) / 2);');
      expect(rule).toContain('margin: calc((1em - 1.5rem) / 2);');
    });

    it('shows on hover or focus-within, and always on devices without hover', () => {
      expect(rule).toContain('visibility: hidden;');
      expect(css).toContain(
        '.andes-combobox-field:hover .andes-combobox-clear, .andes-combobox-field:focus-within .andes-combobox-clear { visibility: visible; }',
      );
      expect(css).toContain(
        '@media (hover: none) { .andes-combobox-clear { visibility: visible; } }',
      );
    });

    it('draws a muted disc with the "x" knocked out, darkening on hover, with a focus ring', () => {
      expect(css).toContain(
        '.andes-combobox-clear__icon circle { fill: currentColor; }',
      );
      expect(css).toContain(
        '.andes-combobox-clear__icon path { fill: none; stroke: var(--andes-color-background);',
      );
      expect(css).toContain(
        '.andes-combobox-clear:hover { color: var(--andes-color-muted-foreground); }',
      );
      expect(css).toContain(
        '.andes-combobox-clear:focus-visible { outline: 2px solid var(--andes-color-focus-ring);',
      );
    });
  });

  describe('popup motion', () => {
    it('enters over 260ms (the slow duration and a third) on the decelerating curve', () => {
      expect(css).toContain(
        '.andes-combobox-content { animation: andes-combobox-enter calc(var(--andes-duration-slow, 200ms) * 1.3) var(--andes-ease-out, cubic-bezier(0.2, 0, 0, 1)); }',
      );
    });

    it('drifts 3px and scales from 98% on the way in, and mirrors it on the way out', () => {
      expect(css).toContain(
        '@keyframes andes-combobox-enter { from { opacity: 0; transform: translateY(-0.1875rem) scale(0.98); } }',
      );
      expect(css).toContain(
        '@keyframes andes-combobox-enter-above { from { opacity: 0; transform: translateY(0.1875rem) scale(0.98); } }',
      );
      expect(css).toContain(
        '@keyframes andes-combobox-exit { to { opacity: 0; transform: translateY(-0.1875rem) scale(0.98); } }',
      );
      expect(css).toContain(
        ".andes-combobox-content[data-side='top'][data-andes-closing] { animation-name: andes-combobox-exit-above; }",
      );
    });

    it('exits over 200ms, easing both ends, while the overlay marks the popup closing', () => {
      expect(css).toContain(
        '.andes-combobox-content[data-andes-closing] { animation: andes-combobox-exit var(--andes-duration-slow, 200ms) var(--andes-motion-ease-in-out, cubic-bezier(0.645, 0.045, 0.355, 1)) forwards; }',
      );
    });

    it('only fades in, and closes at once, with reduced motion', () => {
      const reduced =
        css.match(
          /@media \(prefers-reduced-motion: reduce\) \{ \.andes-combobox-content,[^@]*\}\s*\}/,
        )?.[0] ?? '';
      expect(reduced).toContain('animation-name: andes-combobox-fade;');
      expect(reduced).toContain(
        ".andes-combobox-content[data-andes-closing], .andes-combobox-content[data-side='top'][data-andes-closing] { animation: none; }",
      );
    });
  });

  describe('popup surface', () => {
    it('keeps its look at zero specificity, so a panelClass rule overrides it', () => {
      expect(css).toContain(
        ':where(.andes-combobox-content) { max-height: 16rem; overflow-y: auto;',
      );
    });

    it('fills the overlay pane, which is sized to the field', () => {
      expect(css).toMatch(
        /\.andes-combobox-content \{ font-family: [^}]*width: 100%; box-sizing: border-box; \}/,
      );
    });
  });

  describe('option states', () => {
    it('lists options in 32px rows of 14px/22px text', () => {
      const rule = css.match(/\.andes-combobox-item \{[^}]*\}/)?.[0] ?? '';
      expect(rule).toContain(
        'min-height: var(--andes-control-height-md, 2rem);',
      );
      expect(rule).toContain('font-size: 0.875rem;');
      expect(rule).toContain('line-height: 1.375rem;');
    });

    it('mixes the highlight from the accent hover tone and the popover, visible in dark too', () => {
      expect(css).toContain(
        '--andes-combobox-option-highlight: color-mix( in srgb, var(--andes-color-accent-hover) 70%, var(--andes-color-popover) );',
      );
      expect(css).toContain(
        '.andes-combobox-item[data-active] { background-color: var(--andes-combobox-option-highlight); }',
      );
    });

    it('tints a selected option and sets it semibold, with a stronger tint under the cursor', () => {
      expect(css).toContain(
        '.andes-combobox-item[data-selected] { background-color: var(--andes-combobox-option-selected); font-weight: var(--andes-font-weight-semibold); }',
      );
      expect(css).toContain(
        '--andes-combobox-option-selected: var( --andes-color-selected-bg, var(--andes-color-primary-subtle) );',
      );
      expect(css).toContain(
        '.andes-combobox-item[data-selected][data-active] { background-color: var(--andes-combobox-option-selected-highlight); }',
      );
    });

    it('fades a disabled option and never paints a highlight on it', () => {
      expect(css).toContain(
        '.andes-combobox-item[data-disabled] { cursor: not-allowed; opacity: 0.5; }',
      );
      expect(css).toContain(
        '.andes-combobox-item[data-disabled][data-active]:not([data-selected]) { background-color: transparent; }',
      );
    });

    it('outlines the cursor and uses the system selection colours in forced colors', () => {
      const forced =
        css.match(
          /@media \(forced-colors: active\) \{ \.andes-combobox-item[^@]*\}\s*\}/,
        )?.[0] ?? '';
      expect(forced).toContain(
        '.andes-combobox-item[data-active] { outline: 2px solid Highlight; outline-offset: -2px; }',
      );
      expect(forced).toContain('background-color: SelectedItem;');
    });

    it('has no :hover rule, so a row under a resting pointer is never painted', () => {
      expect(css).not.toContain('.andes-combobox-item:hover');
    });
  });

  describe('multiple mode box', () => {
    it('draws the box on the field and none on the input inside it', () => {
      expect(css).toContain(
        '.andes-combobox-input:focus, .andes-combobox-field[data-multiple]:focus-within {',
      );
      const inner =
        css.match(
          /\.andes-combobox-field\[data-multiple\] \.andes-combobox-input \{[^}]*\}/,
        )?.[0] ?? '';
      expect(inner).toContain('border: 0;');
      expect(inner).toContain('box-shadow: none;');
      expect(inner).toContain('background: transparent;');
    });

    it('keeps a one-line box at the control height, with 22px chips', () => {
      expect(css).toContain(
        '--_combobox-tag-height: calc(var(--andes-control-height-md, 2rem) - 0.625rem);',
      );
      expect(css).toContain(
        'min-height: var(--andes-control-height-md, 2rem); padding-block: 0.25rem;',
      );
    });
  });
});
