import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AndesEmpty } from '../empty/empty';

/**
 * Empty state for a table body: an `andes-empty` (the `table` preset - the simple picture and
 * "No data") unless you project your own content, which replaces it, as Ant Design's
 * `locale.emptyText` does. Put it in a single cell that spans every column, typically from a
 * `@for`'s `@empty` block:
 *
 * ```html
 * @for (row of rows(); track row.id) { ... } @empty {
 *   <tr andesTableRow>
 *     <td andesTableCell colspan="4"><andes-table-empty>No invoices yet</andes-table-empty></td>
 *   </tr>
 * }
 * ```
 *
 * The picture and the message follow `provideAndesEmpty()` / `[andesEmptyProvider]` like every
 * other empty state, so `<andes-table-empty />` inside a provider shows its image and text.
 * For a picture with another message, project an `<andes-empty preset="table" description="..." />`.
 */
@Component({
  selector: 'andes-table-empty',
  imports: [AndesEmpty],
  styleUrl: './table-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'andes-table-empty' },
  template: `<ng-content><andes-empty preset="table" /></ng-content>`,
})
export class AndesTableEmpty {}
