import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import clsx from 'clsx';

import { AndesTable, type AndesTableAlign } from './table';
import {
  andesCellModifiers,
  andesCssLength,
  andesSyncEllipsisTitle,
  type AndesTableBreakpoint,
  type AndesTableFixed,
} from './table-context';

/**
 * Styles a native `<td>`, keeping its implicit `cell` role.
 *
 * `fixed` pins the cell (and, used on every cell of a column, the column) to an
 * edge while the table scrolls horizontally. Its offset from that edge is worked
 * out from the pinned cells before it unless `fixedOffset` sets it.
 *
 * In tree data, `indent` shifts the cell's content by its row's `level` times the
 * table's `indentSize` - put it on the cell holding the expand toggle.
 */
@Directive({
  selector: 'td[andesTableCell]',
  host: {
    '[class]': 'classes()',
    '[style]': 'extraStyle()',
    '[attr.data-label]': 'label() || null',
    '[style.inset-inline-start]': "fixed() === 'start' ? offset() : null",
    '[style.inset-inline-end]': "fixed() === 'end' ? offset() : null",
    '(mouseenter)': 'onPointerEnter()',
  },
})
export class AndesTableCell {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly table = inject(AndesTable, { optional: true });

  /** Whether this cell sits in the table's `<tfoot>`: a summary cell, not a data cell. */
  private readonly inFooter = signal(false);

  /** Horizontal alignment - `end` for numeric columns. */
  readonly align = input<AndesTableAlign>('start');

  /** Pin this cell to the start or end edge of the scroll container. */
  readonly fixed = input<AndesTableFixed | undefined>(undefined);

  /**
   * Distance from the pinned edge: pixels or a CSS length. Leave it unset to have
   * the table sum the widths of the pinned cells before this one.
   */
  readonly fixedOffset = input<string | number | undefined>(undefined);

  /**
   * Truncate overflowing content on one line with an ellipsis. Needs a bounded
   * column width - `tableLayout="fixed"` or an explicit width. While the text is
   * truncated, the full text shows as a native tooltip.
   */
  readonly ellipsis = input(false, { transform: booleanAttribute });

  /** Hide this cell on viewports narrower than the breakpoint. */
  readonly hideBelow = input<AndesTableBreakpoint | undefined>(undefined);

  /**
   * Name of the column, shown before the value when the table turns its rows into
   * cards (`cards` on the table) and read by assistive tech there.
   */
  readonly label = input<string | undefined>(undefined);

  /** Indent the content by the row's tree `level`. */
  readonly indent = input(false, { transform: booleanAttribute });

  protected readonly offset = computed(() =>
    andesCssLength(this.fixedOffset()),
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-table__cell',
      `andes-table__align--${this.align()}`,
      this.indent() && 'andes-table__cell--indent',
      andesCellModifiers(this.fixed(), this.ellipsis(), this.hideBelow()),
      this.table?.partClass(this.inFooter() ? 'summary' : 'cell'),
    ),
  );

  protected readonly extraStyle = computed(
    () => this.table?.partStyle(this.inFooter() ? 'summary' : 'cell') ?? null,
  );

  constructor() {
    afterNextRender(() =>
      this.inFooter.set(!!this.host.nativeElement.closest('tfoot')),
    );
  }

  protected onPointerEnter(): void {
    if (this.ellipsis()) {
      andesSyncEllipsisTitle(this.host.nativeElement);
    }
  }
}
