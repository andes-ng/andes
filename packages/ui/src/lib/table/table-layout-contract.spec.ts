import { readFileSync } from 'node:fs';

/*
 * The CSS contract of the small things that were off by a pixel or two: icon buttons and icons
 * centred on the line of their text, the resize handle's hit area and its fade, the toolbar's
 * spacing, the loading state below the header. The rules cannot be measured in the unit-test DOM, so
 * these read the stylesheets for the declarations the look depends on.
 */

const read = (name: string) =>
  readFileSync(`packages/ui/src/lib/table/${name}`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

const rule = (css: string, selector: string): string => {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) {
    return '';
  }
  return css.slice(at, css.indexOf('}', at));
};

describe('table layout contract', () => {
  const table = read('table.css');

  it('centres every icon button and icon on the line of its neighbours', () => {
    for (const css of [
      'table-controls.css',
      'table-filter.css',
      'table-column-settings.css',
    ]) {
      const button = rule(read(css), '.andes-table-icon-button');

      expect(button).toContain('display: inline-flex');
      expect(button).toContain('align-items: center');
      expect(button).toContain('justify-content: center');
      expect(button).toContain('line-height: 0');
      expect(button).toContain('vertical-align: middle');
      expect(button).not.toContain('vertical-align: baseline');
    }
    const icon = rule(table, '.andes-table ::ng-deep :is(td, th) ng-icon');
    expect(icon).toContain('display: inline-flex');
    expect(icon).toContain('vertical-align: middle');
    expect(
      rule(table, '.andes-table ::ng-deep :is(td, th) ng-icon svg'),
    ).toContain('display: block');
  });

  it('gives the resize handle a 16px hit area, a fade and room for its pill', () => {
    const handle = rule(
      table,
      '.andes-table ::ng-deep .andes-table__resize-handle',
    );
    const line = rule(
      table,
      '.andes-table ::ng-deep .andes-table__resize-handle::after',
    );
    const grip = rule(
      table,
      '.andes-table ::ng-deep .andes-table__resize-icon',
    );

    expect(handle).toContain('width: 1rem');
    expect(handle).toContain('cursor: col-resize');
    expect(handle).toContain('touch-action: none');
    expect(line).toContain('150ms');
    expect(grip).toContain('transition: opacity 150ms ease, scale 150ms ease');
    expect(grip).toContain('width: 1rem');
    expect(grip).toContain('height: 1.5rem');
    expect(table).toContain(
      '.andes-table__head--resizable.andes-table__ellipsis { overflow: visible; }',
    );
    expect(table).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[^@]*resize-icon/,
    );
  });

  it('spaces the toolbar 12px from the table and 8px between controls', () => {
    expect(rule(table, ':host ::ng-deep .andes-table__toolbar')).toContain(
      'gap: var(--andes-space-3, 0.75rem)',
    );
    expect(
      rule(table, ':host ::ng-deep [andesTableTop].andes-table__toolbar'),
    ).toContain('margin-block-end: var(--andes-space-3, 0.75rem)');
    expect(
      rule(table, ':host ::ng-deep .andes-table__toolbar-group'),
    ).toContain('gap: var(--andes-space-2, 0.5rem)');
  });

  it('draws the loading state below the header and dims only the body', () => {
    expect(rule(table, '.andes-table__container--loading')).toContain(
      'min-height: calc(var(--andes-table-head-height, 0px) + 8.25rem)',
    );
    expect(
      rule(
        table,
        '.andes-table--loading-overlay ::ng-deep tbody:not(.andes-table__skeleton, .andes-table__body tbody, td tbody)',
      ),
    ).toContain('opacity: 0.5');
    expect(rule(table, '.andes-table__spinner')).toContain(
      'animation: andes-table-spin 1s linear infinite',
    );
  });
});
