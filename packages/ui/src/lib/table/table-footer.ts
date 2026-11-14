import { booleanAttribute, Directive, inject, input } from '@angular/core';

import { AndesTable } from './table';

/**
 * Styles a native `<tfoot>` - the place for a totals or summary row.
 *
 * `fixed` keeps the summary pinned to the bottom of the scroll area while the body
 * scrolls, when the table has a `scrollY`.
 */
@Directive({
  selector: 'tfoot[andesTableFooter]',
  host: {
    class: 'andes-table__footer',
    '[class.andes-table__footer--fixed]': 'fixed()',
    '[class]': "table?.partClass('footer')",
    '[style]': "table?.partStyle('footer')",
  },
})
export class AndesTableFooter {
  protected readonly table = inject(AndesTable, { optional: true });

  /** Stick to the bottom of a vertically scrolling table. */
  readonly fixed = input(false, { transform: booleanAttribute });
}
