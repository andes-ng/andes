import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesDropdownMenu } from '../dropdown-menu/dropdown-menu';
import { AndesDropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import type { AndesDropdownMenuClickEvent } from '../dropdown-menu/dropdown-menu-types';
import { AndesRadio } from '../radio-group/radio';
import { AndesTable } from './table';
import {
  ANDES_TABLE_SELECTABLE,
  type AndesTableRowKey,
  type AndesTableSelectable,
} from './table-context';
import { AndesTableRow } from './table-row';

/** A custom entry of the "select all" menu. */
export interface AndesTableSelectionItem {
  readonly key: string;
  readonly text: string;
  /**
   * Runs when the entry is chosen, with the keys of the rendered rows whose
   * selection can change. Write the new selection to `selectedKeys` yourself.
   */
  readonly select: (changeableKeys: readonly AndesTableRowKey[]) => void;
}

/**
 * Built-in "select all" menu entries: select the rendered rows, invert them, or
 * clear the whole selection.
 */
export type AndesTableSelectionPreset = 'all' | 'invert' | 'none';

/** Texts of the built-in menu entries. */
export interface AndesTableSelectionLabels {
  readonly all: string;
  readonly invert: string;
  readonly none: string;
}

/** A click of the control itself (not of its label or the box around it). */
function isControlClick(event: MouseEvent): boolean {
  return event.target instanceof HTMLInputElement;
}

/**
 * Row selection control: the library checkbox, or a radio when the table's
 * `selectionType` is `radio`. Place it in the row's first cell; it selects the
 * row whose `rowKey` it sits in.
 *
 * ```html
 * <tr andesTableRow [rowKey]="row.id">
 *   <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
 *   ...
 * ```
 *
 * State lives in `AndesTable.selectedKeys`. Shift-click extends a checkbox
 * selection over the range from the previously clicked row. A `disabled` control
 * is also skipped by "select all".
 */
@Component({
  selector: 'andes-table-selection',
  imports: [AndesCheckbox, AndesRadio],
  styleUrl: './table-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ANDES_TABLE_SELECTABLE, useExisting: AndesTableSelection },
  ],
  host: {
    class: 'andes-table-control',
    '[class]': "table.partClass('selection')",
    '[style]': "table.partStyle('selection')",
  },
  template: `@if (table.selectionType() === 'radio') {
      <andes-radio
        [checked]="checked()"
        [disabled]="isDisabled()"
        [aria-label]="label()"
        (click)="onClick($event)"
        (checkedChange)="resync()"
      />
    } @else {
      <andes-checkbox
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="isDisabled()"
        [aria-label]="label()"
        (click)="onClick($event)"
        (changed)="resync()"
      />
    }`,
})
export class AndesTableSelection implements AndesTableSelectable {
  protected readonly table = inject(AndesTable);
  readonly owner = this.table;
  private readonly row = inject(AndesTableRow, { optional: true });
  private readonly checkbox = viewChild(AndesCheckbox);
  private readonly radio = viewChild(AndesRadio);

  /** Key of the row this control selects. Defaults to the enclosing row's `rowKey`. */
  readonly rowKey = input<AndesTableRowKey | undefined>(undefined);

  /** Disable this row's control (and keep it out of "select all"). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Accessible name. Include something that identifies the row - e.g.
   * `Select INV-001` - so a screen-reader user hears which row it selects.
   */
  readonly label = input('Select row');

  readonly resolvedKey = computed(() => this.rowKey() ?? this.row?.rowKey());

  readonly isDisabled = computed(
    () => this.disabled() || this.resolvedKey() === undefined,
  );

  protected readonly checked = computed(() => {
    const key = this.resolvedKey();
    return key !== undefined && this.table.isSelected(key);
  });

  /** A tree parent with only some of its descendants selected. */
  protected readonly indeterminate = computed(() => {
    const key = this.resolvedKey();
    return key !== undefined && this.table.isPartiallySelected(key);
  });

  protected onClick(event: MouseEvent): void {
    const key = this.resolvedKey();
    if (key === undefined || !isControlClick(event)) {
      return;
    }
    this.table.toggleSelected(key, event.shiftKey);
  }

  /**
   * The table's state is the source of truth; if a controlling parent rejected the
   * change the bound value never moved, so the control is set back to it.
   */
  protected resync(): void {
    this.checkbox()?.checked.set(this.checked());
    this.checkbox()?.indeterminate.set(this.indeterminate());
    this.radio()?.checked.set(this.checked());
  }
}

/**
 * "Select all" control for the selection column's header.
 * Checked when every rendered, enabled row is selected; indeterminate when only
 * some are. Toggling it selects or clears exactly those rows.
 *
 * `selections` adds a menu button next to it with more ways to select: the
 * built-in `'all'`, `'invert'` and `'none'` entries and any custom ones, e.g.
 * "Select odd rows". The menu is the library's dropdown menu.
 *
 * With radio selection there is nothing to select all, so it renders only its
 * `label` as visually hidden text, keeping the header cell named. Leave it out
 * entirely to hide the "select all" control.
 */
@Component({
  selector: 'andes-table-select-all',
  viewProviders: [provideIcons({ lucideChevronDown })],
  imports: [
    AndesButton,
    AndesCheckbox,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
    NgIcon,
  ],
  styleUrl: './table-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-table-control',
    // Keys inside the header control must never reach a sortable header.
    '(keydown)': '$event.stopPropagation()',
  },
  template: `@if (table.selectionType() === 'checkbox') {
      <andes-checkbox
        [checked]="table.selectAllState() === 'all'"
        [indeterminate]="table.selectAllState() === 'some'"
        [disabled]="disabled() || !table.hasSelectableRows()"
        [aria-label]="resolvedLabel()"
        (click)="onClick($event)"
        (changed)="resync()"
      />
      @if (menuItems().length > 0) {
        <andes-dropdown-menu
          [items]="menuOptions()"
          [disabled]="disabled() || !table.hasSelectableRows()"
          (itemClick)="choose($event)"
        >
          <andes-button
            andesDropdownMenuTrigger
            class="andes-table-control__menu-trigger"
            variant="ghost"
            size="icon-xs"
            [aria-label]="menuLabel()"
            [disabled]="disabled() || !table.hasSelectableRows()"
          >
            <ng-icon
              class="andes-table-control__caret"
              name="lucideChevronDown"
            />
          </andes-button>
        </andes-dropdown-menu>
      }
    } @else {
      <span class="andes-table-control__sr-only">{{ resolvedLabel() }}</span>
    }`,
})
export class AndesTableSelectAll {
  protected readonly table = inject(AndesTable);
  private readonly checkbox = viewChild(AndesCheckbox);

  /** Accessible name. Defaults to "Select all rows" (checkbox) or "Selection" (radio). */
  readonly label = input<string | undefined>(undefined);

  /** Disable the "select all" checkbox (and its menu). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Entries of the selection menu; empty hides the menu button. */
  readonly selections = input<
    readonly (AndesTableSelectionPreset | AndesTableSelectionItem)[]
  >([]);

  /** Texts of the built-in menu entries. */
  readonly selectionLabels = input<AndesTableSelectionLabels>({
    all: 'Select current page',
    invert: 'Invert current page',
    none: 'Clear selection',
  });

  /** Accessible name of the menu button and menu. */
  readonly menuLabel = input('Selection options');

  protected readonly resolvedLabel = computed(
    () =>
      this.label() ??
      (this.table.selectionType() === 'radio'
        ? 'Selection'
        : 'Select all rows'),
  );

  protected readonly menuItems = computed<readonly AndesTableSelectionItem[]>(
    () => {
      const labels = this.selectionLabels();
      return this.selections().map((entry) => {
        if (typeof entry !== 'string') {
          return entry;
        }
        const select: Record<AndesTableSelectionPreset, () => void> = {
          all: () => this.table.selectAll(),
          invert: () => this.table.invertSelection(),
          none: () => this.table.clearSelection(),
        };
        return { key: entry, text: labels[entry], select: select[entry] };
      });
    },
  );

  /** The entries in the shape the dropdown menu takes. */
  protected readonly menuOptions = computed(() =>
    this.menuItems().map((item) => ({ key: item.key, label: item.text })),
  );

  protected onClick(event: MouseEvent): void {
    if (isControlClick(event)) {
      this.table.toggleAllSelected();
    }
  }

  protected resync(): void {
    const state = this.table.selectAllState();
    this.checkbox()?.checked.set(state === 'all');
    this.checkbox()?.indeterminate.set(state === 'some');
  }

  protected choose(event: AndesDropdownMenuClickEvent): void {
    const item = this.menuItems().find((entry) => entry.key === event.key);
    item?.select(this.table.enabledKeys());
  }
}
