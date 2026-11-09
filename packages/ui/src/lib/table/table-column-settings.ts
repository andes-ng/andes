import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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

import {
  andesPlacePanel,
  type AndesPanelSide,
  type AndesTableFixed,
} from './table-context';
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

let nextSettingsId = 0;

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
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table-column-settings.css',
  host: {
    class: 'andes-table-column-settings',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <button
      #trigger
      type="button"
      class="andes-table-column-settings__trigger"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? id : null"
      (click)="toggle()"
    >
      <ng-icon
        class="andes-table-column-settings__icon"
        name="lucideColumns3"
      />
      {{ label() }}
    </button>
    @if (open()) {
      <div
        #panel
        class="andes-table-column-settings__panel"
        animate.enter="andes-table-column-settings__panel--enter"
        animate.leave="andes-table-column-settings__panel--leave"
        popover="manual"
        role="dialog"
        [id]="id"
        [attr.aria-label]="label()"
        [attr.data-side]="side()"
      >
        <ul class="andes-table-column-settings__list">
          @for (
            column of listed();
            track column.key;
            let first = $first;
            let last = $last
          ) {
            <li class="andes-table-column-settings__item">
              <label class="andes-table-column-settings__check">
                <input
                  type="checkbox"
                  [checked]="!isHidden(column.key)"
                  [disabled]="
                    column.hideable === false || isLastVisible(column.key)
                  "
                  (change)="toggleHidden(column.key)"
                />
                <span>{{ column.label }}</span>
              </label>
              @if (pinnable() && column.pinnable !== false) {
                <button
                  type="button"
                  class="andes-table-column-settings__pin"
                  [class.andes-table-column-settings__pin--on]="
                    isPinned(column.key)
                  "
                  [attr.aria-pressed]="isPinned(column.key)"
                  [attr.aria-label]="
                    pinLabel()(column.label, isPinned(column.key))
                  "
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
                </button>
              }
              @if (column.movable !== false) {
                <button
                  type="button"
                  class="andes-table-column-settings__move andes-table-column-settings__move--up"
                  [attr.aria-label]="moveLabel()(column.label, 'up')"
                  [disabled]="first"
                  (click)="move(column.key, -1, 'up')"
                >
                  <ng-icon
                    class="andes-table-column-settings__arrow"
                    name="lucideChevronUp"
                  />
                </button>
                <button
                  type="button"
                  class="andes-table-column-settings__move andes-table-column-settings__move--down"
                  [attr.aria-label]="moveLabel()(column.label, 'down')"
                  [disabled]="last"
                  (click)="move(column.key, 1, 'down')"
                >
                  <ng-icon
                    class="andes-table-column-settings__arrow"
                    name="lucideChevronDown"
                  />
                </button>
              }
            </li>
          }
        </ul>
        <div class="andes-table-column-settings__actions">
          <button
            type="button"
            class="andes-table-column-settings__reset"
            [disabled]="!changed()"
            (click)="reset()"
          >
            {{ resetText() }}
          </button>
        </div>
      </div>
    }
  `,
})
export class AndesTableColumnSettings implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

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

  protected readonly id = `andes-table-column-settings-${nextSettingsId++}`;
  protected readonly open = signal(false);
  protected readonly side = signal<AndesPanelSide>('below');

  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

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

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) {
        return;
      }
      const reposition = (event: Event) => {
        const panel = this.panel()?.nativeElement;
        if (
          panel &&
          event.target instanceof Node &&
          panel.contains(event.target)
        ) {
          return;
        }
        this.place();
      };
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      onCleanup(() => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      });
    });
  }

  ngOnInit(): void {
    this.initial.set({
      order: this.order(),
      hidden: this.hidden(),
      pinned: this.pinned(),
    });
  }

  protected isHidden(key: string): boolean {
    return this.hiddenSet().has(key);
  }

  protected isLastVisible(key: string): boolean {
    return !this.isHidden(key) && this.visibleCount() === 1;
  }

  protected toggleHidden(key: string): void {
    this.hidden.set(
      this.isHidden(key)
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
        const items = this.panel()?.nativeElement.querySelectorAll('li');
        const index = this.listed().findIndex((column) => column.key === key);
        const item = items?.[index];
        const same = item?.querySelector<HTMLButtonElement>(
          `.andes-table-column-settings__move--${direction}`,
        );
        const other = item?.querySelector<HTMLButtonElement>(
          `.andes-table-column-settings__move--${direction === 'up' ? 'down' : 'up'}`,
        );
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

  protected toggle(): void {
    if (this.open()) {
      this.close(false);
      return;
    }
    this.open.set(true);
    afterNextRender(
      () => {
        const panel = this.panel()?.nativeElement;
        if (!panel) {
          return;
        }
        if (typeof panel.showPopover === 'function') {
          panel.showPopover();
        }
        this.place();
        panel
          .querySelector<HTMLElement>(
            'input:not([disabled]), button:not([disabled])',
          )
          ?.focus();
      },
      { injector: this.injector },
    );
  }

  private close(restoreFocus: boolean): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (restoreFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  private place(): void {
    const panel = this.panel()?.nativeElement;
    if (panel) {
      this.side.set(andesPlacePanel(panel, this.trigger().nativeElement));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && !this.host.nativeElement.contains(next)) {
      this.close(false);
    }
  }

  protected onDocumentPointerDown(event: Event): void {
    if (
      this.open() &&
      event.target instanceof Node &&
      !this.host.nativeElement.contains(event.target)
    ) {
      this.close(false);
    }
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
