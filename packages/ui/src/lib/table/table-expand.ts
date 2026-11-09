import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  type EmbeddedViewRef,
  inject,
  input,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideChevronsDownUp,
  lucideChevronsUpDown,
} from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesTable } from './table';
import { AndesTableButtonAria } from './table-button-aria';
import type { AndesTableRowKey } from './table-context';
import { AndesTableRow } from './table-row';

/**
 * Expand/collapse button for a row. Place it in a cell of the row whose details
 * it reveals; it toggles that row's `rowKey` in
 * `AndesTable.expandedKeys` and exposes the state through `aria-expanded`.
 *
 * Only render it for rows that can expand. In tree data, give leaf rows a
 * `spacer` instead, so their content lines up with their expandable siblings.
 *
 * Projected content replaces the default chevron, e.g. a plus/minus icon; read
 * the state through `#toggle="andesTableExpandToggle"` and `toggle.expanded()`.
 */
@Component({
  selector: 'andes-table-expand-toggle',
  exportAs: 'andesTableExpandToggle',
  viewProviders: [provideIcons({ lucideChevronRight })],
  imports: [AndesButton, AndesTableButtonAria, NgIcon],
  styleUrl: './table-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-table-control',
    '[class]': "table.partClass('expand')",
    '[class.andes-table-control--expanded]': 'expanded()',
    '[style]': "table.partStyle('expand')",
  },
  template: `@if (spacer()) {
      <span
        class="andes-table-control__expand-spacer"
        aria-hidden="true"
      ></span>
    } @else {
      <andes-button
        class="andes-table-control__expand"
        variant="ghost"
        size="icon-xs"
        [ripple]="false"
        [andesTableAria]="aria()"
        [aria-label]="label()"
        [disabled]="resolvedKey() === undefined"
        (click)="toggle()"
      >
        <ng-content
          ><ng-icon
            class="andes-table-control__chevron"
            name="lucideChevronRight"
        /></ng-content>
      </andes-button>
    }`,
})
export class AndesTableExpandToggle {
  protected readonly table = inject(AndesTable);
  private readonly row = inject(AndesTableRow, { optional: true });

  /** `aria-expanded` and `aria-controls`, for the button the library draws. */
  protected readonly aria = computed(() => {
    const key = this.resolvedKey();
    const expanded = this.expanded();
    return {
      'aria-expanded': expanded,
      'aria-controls':
        expanded && key !== undefined ? this.table.detailId(key) : null,
    };
  });

  /** Key of the row this button expands. Defaults to the enclosing row's `rowKey`. */
  readonly rowKey = input<AndesTableRowKey | undefined>(undefined);

  /**
   * Accessible name. Kept constant while `aria-expanded` carries the state, so
   * include the row's identity, e.g. `Details for INV-001`.
   */
  readonly label = input('Row details');

  /**
   * Render an empty box of the toggle's size instead of a button - for leaf rows
   * of tree data.
   */
  readonly spacer = input(false, { transform: booleanAttribute });

  protected readonly resolvedKey = computed(
    () => this.rowKey() ?? this.row?.rowKey(),
  );

  /** Whether the row this toggle controls is expanded. */
  readonly expanded = computed(() => {
    const key = this.resolvedKey();
    return key !== undefined && this.table.isExpanded(key);
  });

  /** Expands or collapses the row. */
  toggle(): void {
    const key = this.resolvedKey();
    if (key !== undefined) {
      this.table.toggleExpanded(key);
    }
  }
}

/**
 * Header control that expands or collapses every expandable row at once - put it in
 * the header cell above the row toggles. `keys` lists the rows it controls (usually
 * every expandable row of the data, not only the rendered page). It shows the
 * "expand" pair of chevrons while some of them are collapsed, and the "collapse"
 * pair once all of them are open.
 *
 * ```html
 * <th andesTableHead>
 *   <andes-table-expand-all [keys]="expandableKeys" />
 * </th>
 * ```
 */
@Component({
  selector: 'andes-table-expand-all',
  viewProviders: [provideIcons({ lucideChevronsDownUp, lucideChevronsUpDown })],
  imports: [AndesButton, NgIcon],
  styleUrl: './table-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-table-control',
    '[class]': "table.partClass('expand')",
    '[style]': "table.partStyle('expand')",
  },
  template: `<andes-button
    class="andes-table-control__expand"
    variant="ghost"
    size="icon-xs"
    [ripple]="false"
    [aria-label]="allExpanded() ? collapseLabel() : expandLabel()"
    [disabled]="keys().length === 0"
    (click)="toggle()"
  >
    @if (allExpanded()) {
      <ng-icon
        class="andes-table-control__chevron andes-table-control__chevron--all"
        name="lucideChevronsDownUp"
      />
    } @else {
      <ng-icon
        class="andes-table-control__chevron andes-table-control__chevron--all"
        name="lucideChevronsUpDown"
      />
    }
  </andes-button>`,
})
export class AndesTableExpandAll {
  protected readonly table = inject(AndesTable);

  /** Keys of the rows this control expands and collapses. */
  readonly keys = input.required<readonly AndesTableRowKey[]>();

  /** Accessible name while some rows are collapsed. */
  readonly expandLabel = input('Expand all rows');

  /** Accessible name once every row is expanded. */
  readonly collapseLabel = input('Collapse all rows');

  /** Whether every listed row is expanded. */
  readonly allExpanded = computed(
    () =>
      this.keys().length > 0 &&
      this.keys().every((key) => this.table.isExpanded(key)),
  );

  /** Expands every listed row, or collapses them all when they are all open. */
  toggle(): void {
    const listed = new Set(this.keys());
    const others = this.table.expandedKeys().filter((key) => !listed.has(key));
    this.table.expandedKeys.set(
      this.allExpanded() ? others : [...others, ...this.keys()],
    );
  }
}

/**
 * Structural directive for a row's expanded content.
 * Renders its template - normally a full-width `<tr>` right after the row it
 * belongs to - only while that key is in `AndesTable.expandedKeys`, so collapsed
 * details cost nothing. With `forceRender` the content is rendered up front and
 * only hidden while collapsed, so its state (form inputs, a nested table's
 * scroll position) survives collapsing.
 *
 * ```html
 * @for (row of rows(); track row.id) {
 *   <tr andesTableRow [rowKey]="row.id">...</tr>
 *   <tr *andesTableExpandedRow="row.id">
 *     <td andesTableCell colspan="5">{{ row.notes }}</td>
 *   </tr>
 * }
 * ```
 */
@Directive({ selector: '[andesTableExpandedRow]' })
export class AndesTableExpandedRow {
  private readonly table = inject(AndesTable);
  private readonly template = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);

  /** Key of the row whose details this is. */
  readonly rowKey = input.required<AndesTableRowKey>({
    alias: 'andesTableExpandedRow',
  });

  /**
   * Render the content before the row is first expanded and keep it while
   * collapsed, hidden. Microsyntax: `*andesTableExpandedRow="row.id; forceRender: true"`.
   */
  readonly forceRender = input(false, {
    alias: 'andesTableExpandedRowForceRender',
    transform: booleanAttribute,
  });

  private view: EmbeddedViewRef<unknown> | undefined;

  constructor() {
    effect(() => {
      const expanded = this.table.isExpanded(this.rowKey());
      const keep = this.forceRender();

      if ((expanded || keep) && !this.view) {
        this.view = this.viewContainer.createEmbeddedView(this.template);
        for (const node of this.view.rootNodes) {
          if (node instanceof Element) {
            this.renderer.addClass(node, 'andes-table__row');
            this.renderer.addClass(node, 'andes-table__expanded-row');
            this.renderer.setAttribute(
              node,
              'id',
              this.table.detailId(this.rowKey()),
            );
          }
        }
      } else if (!expanded && !keep && this.view) {
        this.viewContainer.clear();
        this.view = undefined;
      }

      for (const node of this.view?.rootNodes ?? []) {
        if (node instanceof Element) {
          if (expanded) {
            this.renderer.removeAttribute(node, 'hidden');
          } else {
            this.renderer.setAttribute(node, 'hidden', '');
          }
        }
      }
    });
  }
}
