import { CdkDrag } from '@angular/cdk/drag-drop';
import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

import { AndesTable } from './table';
import type { AndesTableRowKey } from './table-context';

// Clicks that land on these belong to the control, never to "expand row by click".
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [tabindex], [contenteditable]';

/**
 * Styles a native `<tr>`, keeping its implicit `row` role.
 *
 * Give a body row a `rowKey` to make it selectable and
 * expandable: the `andes-table-selection` and `andes-table-expand-toggle`
 * controls inside it read the key from here, and the row reflects the table's
 * selection/expansion state as `andes-table__row--selected` /
 * `andes-table__row--expanded` classes and a `data-row-key` attribute.
 *
 * In tree data, `level` is the row's depth; cells marked `indent` shift by it.
 *
 * Put `cdkDrag` on the row to make it draggable. The floating copy keeps the
 * row's own column widths, as a loose `<tr>` would otherwise shrink to its content.
 */
@Directive({
  selector: 'tr[andesTableRow]',
  host: {
    class: 'andes-table__row',
    '[class.andes-table__row--selected]': 'selected()',
    '[class.andes-table__row--expanded]': 'expanded()',
    '[class.andes-table__row--clickable]': 'expandByClick()',
    '[class]': "table?.partClass('row')",
    '[style]': "table?.partStyle('row')",
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.data-row-key]': 'rowKey() ?? null',
    '[attr.data-level]': 'level() || null',
    '[style.--andes-table-level]': 'level() || null',
    '(click)': 'onClick($event)',
  },
})
export class AndesTableRow {
  protected readonly table = inject(AndesTable, { optional: true });
  private readonly drag = inject(CdkDrag, { self: true, optional: true });

  constructor() {
    const drag = this.drag;
    if (!drag) {
      return;
    }
    // The copy stays inside the body, so the table's cell styles still reach it.
    drag.previewContainer = 'parent';
    drag.previewClass = 'andes-table__row-preview';
    // The drag builds its placeholder and preview around this event.
    const started = drag.started.subscribe(() =>
      queueMicrotask(() => this.pinPreviewWidths(drag)),
    );
    inject(DestroyRef).onDestroy(() => started.unsubscribe());
  }

  /** Gives every cell of the floating copy the width its cell has in the table. */
  private pinPreviewWidths(drag: CdkDrag): void {
    // The placeholder takes the row's place in the body; the preview is its sibling.
    const placeholder = drag.getPlaceholderElement();
    const preview = placeholder?.parentElement?.querySelector<HTMLElement>(
      ':scope > .andes-table__row-preview',
    );
    if (!preview || !placeholder) {
      return;
    }
    const source = placeholder.children;
    Array.from(preview.children).forEach((cell, index) => {
      const width = source[index]?.getBoundingClientRect().width;
      if (width) {
        (cell as HTMLElement).style.width = `${width}px`;
      }
    });
  }

  /** Unique key of the record this row renders. */
  readonly rowKey = input<AndesTableRowKey | undefined>(undefined);

  /** Depth of this row in tree data; 0 for a top-level row. */
  readonly level = input(0, { transform: numberAttribute });

  /** Whether this row is in the table's `selectedKeys`. */
  readonly selected = computed(() => {
    const key = this.rowKey();
    return key !== undefined && !!this.table?.isSelected(key);
  });

  /** Whether this row is in the table's `expandedKeys`. */
  readonly expanded = computed(() => {
    const key = this.rowKey();
    return key !== undefined && !!this.table?.isExpanded(key);
  });

  /** Grid rows say whether they are selected; in a plain table the state stays visual. */
  protected readonly ariaSelected = computed(() =>
    this.table?.gridNavigation() && this.rowKey() !== undefined
      ? this.selected()
      : null,
  );

  protected readonly expandByClick = computed(
    () => this.rowKey() !== undefined && !!this.table?.expandRowByClick(),
  );

  protected onClick(event: MouseEvent): void {
    const key = this.rowKey();
    if (!this.expandByClick() || key === undefined) {
      return;
    }

    const target = event.target as Element | null;
    const host = event.currentTarget as Element;
    const interactive = target?.closest(INTERACTIVE);
    if (interactive && host.contains(interactive)) {
      return;
    }

    this.table?.toggleExpanded(key);
  }
}
