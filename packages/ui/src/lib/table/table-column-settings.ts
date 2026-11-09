import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronUp,
  lucideColumns3,
  lucidePin,
  lucidePinOff,
} from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesPopover } from '../popover/popover';
import { AndesPopoverContent } from '../popover/popover-content';
import { AndesPopoverTrigger } from '../popover/popover-trigger';
import { type AndesTableFixed } from './table-context';
import { andesMoveColumn } from './table-data';

/** One column offered by `andes-table-column-settings`. */
export interface AndesTableColumnSetting {
  /** Key of the column in the table's column order. */
  readonly key: string;
  /** Visible name in the menu. */
  readonly label: string;
  /** Whether the user may hide it. Defaults to true. */
  readonly hideable?: boolean;
  /** Whether the user may move it. Defaults to true. */
  readonly movable?: boolean;
  /** Whether the user may pin it to an edge. Defaults to true (shown with `pinnable`). */
  readonly pinnable?: boolean;
}

/** Edge each pinned column is fixed to, keyed by column key. */
export type AndesTablePinned = Readonly<Record<string, AndesTableFixed>>;

/**
 * "Columns" menu for a table whose header and body render from a column order
 * (`AndesTable.columnOrder` with `andesOrderColumns` / `andesVisibleColumns`): a
 * checkbox per column to show or hide it and buttons to move it earlier or
 * later - the keyboard-friendly companion of dragging the headers. Reads and
 * writes the same two-way `order` and `hidden` the table renders from; bind
 * `order` to the table's `[(columnOrder)]` and hidden columns keep their place
 * when headers are dragged. Reset restores the values they had on first render.
 * The last visible column cannot be hidden.
 *
 * ```html
 * <andes-table-column-settings
 *   andesTableTop
 *   [columns]="columns"
 *   [(order)]="order"
 *   [(hidden)]="hidden"
 * />
 * ```
 */
@Component({
  selector: 'andes-table-column-settings',
  viewProviders: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideColumns3,
      lucidePin,
      lucidePinOff,
    }),
  ],
  imports: [
    AndesButton,
    AndesCheckbox,
    AndesPopover,
    AndesPopoverContent,
    AndesPopoverTrigger,
    NgIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table-column-settings.css',
  host: {
    class: 'andes-table-column-settings',
    // The panel is drawn in the overlay layer: it is told the direction of the table.
    '(click)': 'captureDirection()',
  },
  template: `
    <andes-popover placement="bottomRight" [maxWidth]="320">
      <andes-button andesPopoverTrigger variant="outline" size="sm">
        <ng-icon slot="icon-start" name="lucideColumns3" />
        {{ label() }}
      </andes-button>
      <andes-popover-content class="andes-table-column-settings__panel">
        <ul
          #list
          [attr.dir]="dir()"
          class="andes-table-column-settings__list"
          [attr.aria-label]="label()"
        >
          @for (
            column of listed();
            track column.key;
            let first = $first;
            let last = $last
          ) {
            <li class="andes-table-column-settings__item">
              <andes-checkbox
                class="andes-table-column-settings__check"
                [checked]="!isHidden(column.key)"
                [disabled]="
                  column.hideable === false || isLastVisible(column.key)
                "
                (checkedChange)="setVisible(column.key, $event)"
              >
                {{ column.label }}
              </andes-checkbox>
              @if (pinnable() && column.pinnable !== false) {
                <andes-button
                  class="andes-table-column-settings__pin"
                  [class.andes-table-column-settings__pin--on]="
                    isPinned(column.key)
                  "
                  variant="ghost"
                  size="icon-xs"
                  [ripple]="false"
                  [aria-label]="pinLabel()(column.label, isPinned(column.key))"
                  (click)="togglePinned(column.key)"
                >
                  @if (isPinned(column.key)) {
                    <ng-icon
                      class="andes-table-column-settings__arrow"
                      name="lucidePinOff"
                    />
                  } @else {
                    <ng-icon
                      class="andes-table-column-settings__arrow"
                      name="lucidePin"
                    />
                  }
                </andes-button>
              }
              @if (column.movable !== false) {
                <andes-button
                  class="andes-table-column-settings__move andes-table-column-settings__move--up"
                  variant="ghost"
                  size="icon-xs"
                  [ripple]="false"
                  [aria-label]="moveLabel()(column.label, 'up')"
                  [disabled]="first"
                  (click)="move(column.key, -1, 'up')"
                >
                  <ng-icon
                    class="andes-table-column-settings__arrow"
                    name="lucideChevronUp"
                  />
                </andes-button>
                <andes-button
                  class="andes-table-column-settings__move andes-table-column-settings__move--down"
                  variant="ghost"
                  size="icon-xs"
                  [ripple]="false"
                  [aria-label]="moveLabel()(column.label, 'down')"
                  [disabled]="last"
                  (click)="move(column.key, 1, 'down')"
                >
                  <ng-icon
                    class="andes-table-column-settings__arrow"
                    name="lucideChevronDown"
                  />
                </andes-button>
              }
            </li>
          }
        </ul>
        <div class="andes-table-column-settings__actions">
          <andes-button
            class="andes-table-column-settings__reset"
            variant="link"
            size="sm"
            [disabled]="!changed()"
            (click)="reset()"
          >
            {{ resetText() }}
          </andes-button>
        </div>
      </andes-popover-content>
    </andes-popover>
  `,
})
export class AndesTableColumnSettings implements OnInit {
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly dir = signal<'ltr' | 'rtl'>('ltr');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  /** The columns the menu lists, in any order; the menu follows `order`. */
  readonly columns = input.required<readonly AndesTableColumnSetting[]>();

  /** Every column key in display order. Two-way. */
  readonly order = model.required<readonly string[]>();

  /** Keys of the hidden columns. Two-way. */
  readonly hidden = model<readonly string[]>([]);

  /**
   * Offers a pin button per column. Two-way `pinned` holds the edge of each pinned
   * column; bind a header's `fixed` to it (`[fixed]="pinned()['name']"`).
   */
  readonly pinnable = input(false, { transform: booleanAttribute });

  /** The edge every pinned column is fixed to, keyed by column key. Two-way. */
  readonly pinned = model<AndesTablePinned>({});

  /** Accessible name of a pin button. */
  readonly pinLabel = input<(label: string, pinned: boolean) => string>(
    (label, pinned) => (pinned ? `Unpin ${label}` : `Pin ${label}`),
  );

  /** Text of the button and accessible name of the menu. */
  readonly label = input('Columns');

  readonly resetText = input('Reset');

  /** Accessible name of a move button. */
  readonly moveLabel = input<
    (label: string, direction: 'up' | 'down') => string
  >(
    (label, direction) =>
      `Move ${label} ${direction === 'up' ? 'earlier' : 'later'}`,
  );

  private readonly initial = signal<{
    order: readonly string[];
    hidden: readonly string[];
    pinned: AndesTablePinned;
  }>({ order: [], hidden: [], pinned: {} });

  private readonly hiddenSet = computed(() => new Set(this.hidden()));

  /** The listed columns, in the table's current order. */
  protected readonly listed = computed(() => {
    const byKey = new Map(this.columns().map((column) => [column.key, column]));
    return this.order()
      .map((key) => byKey.get(key))
      .filter((column): column is AndesTableColumnSetting => !!column);
  });

  private readonly visibleCount = computed(
    () => this.order().filter((key) => !this.hiddenSet().has(key)).length,
  );

  protected readonly changed = computed(
    () =>
      !same(this.order(), this.initial().order) ||
      !same([...this.hidden()].sort(), [...this.initial().hidden].sort()) ||
      !samePins(this.pinned(), this.initial().pinned),
  );

  ngOnInit(): void {
    this.initial.set({
      order: this.order(),
      hidden: this.hidden(),
      pinned: this.pinned(),
    });
  }

  protected captureDirection(): void {
    this.dir.set(
      getComputedStyle(this.host.nativeElement).direction === 'rtl'
        ? 'rtl'
        : 'ltr',
    );
  }

  protected isHidden(key: string): boolean {
    return this.hiddenSet().has(key);
  }

  protected isLastVisible(key: string): boolean {
    return !this.isHidden(key) && this.visibleCount() === 1;
  }

  protected setVisible(key: string, visible: boolean): void {
    if (visible === !this.isHidden(key)) {
      return;
    }
    this.hidden.set(
      visible
        ? this.hidden().filter((item) => item !== key)
        : [...this.hidden(), key],
    );
  }

  protected isPinned(key: string): boolean {
    return this.pinned()[key] !== undefined;
  }

  protected togglePinned(key: string): void {
    const { [key]: current, ...rest } = this.pinned();
    this.pinned.set(current === undefined ? { ...rest, [key]: 'start' } : rest);
  }

  protected move(key: string, delta: -1 | 1, direction: 'up' | 'down'): void {
    const keys = this.listed().map((column) => column.key);
    const target = keys[keys.indexOf(key) + delta];
    if (target === undefined) {
      return;
    }
    this.order.set(andesMoveColumn(this.order(), key, target));

    // Keep focus on the same arrow of the moved row (or the other one at an end).
    afterNextRender(
      () => {
        const items = this.list()?.nativeElement.querySelectorAll('li');
        const index = this.listed().findIndex((column) => column.key === key);
        const item = items?.[index];
        const buttonOf = (name: string) =>
          item?.querySelector<HTMLButtonElement>(
            `.andes-table-column-settings__move--${name} button`,
          );
        const same = buttonOf(direction);
        const other = buttonOf(direction === 'up' ? 'down' : 'up');
        (same && !same.disabled ? same : other)?.focus();
      },
      { injector: this.injector },
    );
  }

  protected reset(): void {
    this.order.set(this.initial().order);
    this.hidden.set(this.initial().hidden);
    this.pinned.set(this.initial().pinned);
  }
}

function same(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function samePins(a: AndesTablePinned, b: AndesTablePinned): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
}
