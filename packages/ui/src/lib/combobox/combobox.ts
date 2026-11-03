import {
  AndesListNavigation,
  AndesOverlayPrimitive,
  andesOverlayPreset,
  provideAndesOverlay,
  type AndesListNavigationItemRef,
  type AndesOverlayAlign,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxEmpty } from './combobox-empty';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';
import { ANDES_COMBOBOX } from './combobox-token';
import { andesComboboxScrolledOutOfView } from './combobox-visibility';

/** Converts an item to the text shown in the input and matched against while filtering. */
export type AndesComboboxItemToString<T> = (item: T) => string;

/** Custom filter predicate, given the raw item and the input's current (untrimmed) text. */
export type AndesComboboxFilterPredicate<T> = (
  item: T,
  query: string,
) => boolean;

/** Equality check used to determine which item (if any) is the current selection. */
export type AndesComboboxCompareWith<T> = (a: T, b: T) => boolean;

/** One suggestion in the data-driven `[options]` mode. */
export interface AndesComboboxOption<T = string> {
  readonly value: T;
  /** Text shown in the list and put in the input once chosen. Defaults to `itemToStringValue(value)`. */
  readonly label?: string;
  readonly disabled?: boolean;
}

/** A labelled group of suggestions in the `[options]` mode. */
export interface AndesComboboxOptionGroup<T = string> {
  readonly label: string;
  readonly options: readonly AndesComboboxOption<T>[];
}

/** An entry of `[options]`: a suggestion, or a group of them. */
export type AndesComboboxOptionEntry<T = string> =
  AndesComboboxOption<T> | AndesComboboxOptionGroup<T>;

/**
 * A custom `filterOption` function: given the input's current (untrimmed) text and a
 * suggestion, decides whether that suggestion stays in the list. In the projected-items
 * mode each item is handed over wrapped as `{ value: item, label: itemToStringValue(item) }`.
 */
export type AndesComboboxFilterOption<T> = (
  query: string,
  option: AndesComboboxOption<T>,
) => boolean;

export type AndesComboboxSize = 'sm' | 'md' | 'lg';
export type AndesComboboxStatus = 'error' | 'warning';
export type AndesComboboxVariant =
  'outlined' | 'filled' | 'borderless' | 'underlined';
export type AndesComboboxPlacement =
  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/** Extra classes for the suggestion popup, as `[class]` takes them. */
export type AndesComboboxPanelClass = string | readonly string[];

/** Payload of `(optionSelect)` and `(optionDeselect)`: the value and the option it came from. */
export interface AndesComboboxSelectEvent<T = string> {
  readonly value: T;
  readonly option: AndesComboboxOption<T>;
}

/** Context of an `[optionTemplate]`. */
export interface AndesComboboxOptionContext<T = string> {
  readonly $implicit: AndesComboboxOption<T>;
  /** The input's current text, e.g. for highlighting the matched part. */
  readonly query: string;
}

/** Context of a `[groupLabelTemplate]`. */
export interface AndesComboboxGroupContext<T = string> {
  /** The group exactly as passed in `[options]`, extra properties included. */
  readonly $implicit: AndesComboboxOptionGroup<T>;
  /** The group's options that match the input's current text. */
  readonly options: readonly AndesComboboxOption<T>[];
  /** The input's current text. */
  readonly query: string;
}

/** Context of a `[popupTemplate]`. */
export interface AndesComboboxPopupContext {
  /**
   * The popup's default body - the options, or the empty or loading state. Render it with
   * `*ngTemplateOutlet` wherever it belongs among the extra content.
   */
  readonly $implicit: TemplateRef<void>;
  /** The input's current text. */
  readonly query: string;
}

/** Context of a `[createLabel]` template: the trimmed text a new option would be made from. */
export interface AndesComboboxCreateContext {
  readonly $implicit: string;
}

/** @internal One chip of the `multiple` mode. */
export interface AndesComboboxTag<T> {
  readonly value: T;
  readonly label: string;
  /** False for a value whose option is disabled: its chip has no remove button. */
  readonly removable: boolean;
}

/** @internal One row of the `[options]` mode's rendered list. */
export type AndesComboboxRenderedEntry<T> =
  | {
      readonly kind: 'group';
      readonly key: string;
      readonly label: string;
      readonly group: AndesComboboxOptionGroup<T>;
      readonly options: readonly AndesComboboxOption<T>[];
    }
  | {
      readonly kind: 'option';
      readonly key: T;
      readonly option: AndesComboboxOption<T>;
    };

/**
 * What placed the active option, which decides what happens to it next:
 * - `typing`: auto-highlighted after the user typed; re-placed on every new list.
 * - `keyboard`: moved by a navigation key; kept while it stays in the list.
 * - `pointer`: moved by the pointer; dropped when the pointer leaves the list.
 */
type AndesComboboxCursorOrigin = 'typing' | 'keyboard' | 'pointer';

const defaultItemToString = <T>(item: T): string => `${item}`;
const defaultCompareWith = <T>(a: T, b: T): boolean => a === b;

function isGroup<T>(
  entry: AndesComboboxOptionEntry<T>,
): entry is AndesComboboxOptionGroup<T> {
  return Array.isArray((entry as AndesComboboxOptionGroup<T>).options);
}

/** `filterOption` accepts a bare attribute (`filterOption="false"`) as well as a function. */
function filterOptionAttribute<T>(
  value: boolean | string | AndesComboboxFilterOption<T>,
): boolean | AndesComboboxFilterOption<T> {
  return typeof value === 'function' ? value : booleanAttribute(value);
}

/** `popupMatchSelectWidth` as `boolean | number`, attribute-friendly. */
function matchWidthAttribute(
  value: boolean | number | string,
): boolean | number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
    return numberAttribute(value);
  }
  return booleanAttribute(value);
}

function optionalNumberAttribute(value: unknown): number | undefined {
  return value == null || value === '' ? undefined : numberAttribute(value);
}

const MIRRORED_ALIGN: Readonly<Record<AndesOverlayAlign, AndesOverlayAlign>> = {
  start: 'end',
  center: 'center',
  end: 'start',
};

/** Rows a page key moves by when the list has not been laid out (jsdom, a hidden panel). */
const FALLBACK_PAGE_SIZE = 10;

let nextUniqueId = 0;

/**
 * Root of the Combobox / autocomplete component: a free-text input backed by a filtered,
 * keyboard-navigable list of suggestions.
 *
 * Composes two shared behavior primitives directly rather than reinventing either:
 * `AndesOverlayPrimitive` for the popup (portal, positioning, dismissal - configured as a
 * non-modal, anchored popover that never traps or steals focus) and `AndesListNavigation`
 * in its `'active-descendant'` focus mode for the suggestion list (the highlighted option
 * is communicated purely via `aria-activedescendant`, since real DOM focus must stay on
 * the `<input>` at all times - see `AndesComboboxInput`).
 *
 * It can be used two ways.
 *
 * **Data-driven**: pass `[options]` and the component renders the input, the popup,
 * groups, options and the empty/loading states itself.
 *
 * ```html
 * <andes-combobox [options]="fruits" placeholder="Search fruit..." [(ngModel)]="fruit" />
 * ```
 *
 * **Compound**, for full control over the markup: assemble the parts in the host template.
 *
 * ```html
 * <andes-combobox #combobox [items]="fruits" [(ngModel)]="selectedFruit">
 *   <input andesComboboxInput placeholder="Search fruit..." />
 *   <div andesComboboxContent>
 *     @for (fruit of combobox.filteredItems(); track fruit) {
 *       <div andesComboboxItem [value]="fruit">{{ fruit }}</div>
 *     } @empty {
 *       <div andesComboboxEmpty>No results found.</div>
 *     }
 *   </div>
 * </andes-combobox>
 * ```
 *
 * **The highlighted option.** One option at a time is "active": it is what Enter picks,
 * what `aria-activedescendant` names and the only row drawn highlighted - the three never
 * disagree. Nothing is active when the popup opens (by focus, click or code), so a list
 * that appears under a resting pointer shows no highlight and Enter picks nothing the
 * user has not seen. After that an option becomes active when:
 * - the pointer *moves* over it (a pointer that merely rests while the list appears or
 *   re-filters underneath it does not count, nor does touch); leaving the list drops it;
 * - a navigation key moves the cursor (the first ArrowDown/ArrowUp lands on the selected
 *   option when there is one, else on the first/last option);
 * - the user types and `autoHighlight` is on: the first match, so Enter picks it.
 *
 * Every input, output and model applies to both modes, except where a doc comment says
 * otherwise. `filteredItems`, `labelOf` and every other `@internal` member exists for the
 * parts to compose against - it is the equivalent of React context for this compound
 * component, not part of the supported public API.
 */
@Component({
  selector: 'andes-combobox',
  imports: [
    NgTemplateOutlet,
    AndesComboboxInput,
    AndesComboboxContent,
    AndesComboboxItem,
    AndesComboboxEmpty,
  ],
  templateUrl: './combobox.html',
  styleUrl: './combobox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The input, popup, options and empty-state are content projected in through the
  // andesCombobox* directives (or rendered into a portal), so emulated encapsulation's
  // scoping attribute would never reach them - see combobox.css.
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideAndesOverlay(),
    AndesListNavigation,
    {
      provide: ANDES_COMBOBOX,
      useExisting: forwardRef(() => AndesCombobox),
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesCombobox),
      multi: true,
    },
  ],
  host: {
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    // `id` names the input (see the `id` input), never this host as well.
    '[attr.id]': 'null',
  },
})
export class AndesCombobox<T = string> implements ControlValueAccessor {
  /**
   * The current selection: `null` until a suggestion is chosen, and again once the text is
   * edited away from the chosen suggestion's label. Two-way bindable as `[(value)]`, and
   * written by `[(ngModel)]`/`[formControl]` through the ControlValueAccessor as well.
   *
   * Unless `freeText` is on, `value` is never the input's free text: that is reported by
   * `(searchChange)`, the chosen suggestion by `value`/`(optionSelect)`. With `multiple`
   * on, the selection is `values` instead and this stays `null`.
   */
  readonly value = model<T | null>(null);

  /**
   * The selection of the `multiple` mode, in the order it was chosen, shown as chips in
   * the field. Two-way bindable as `[(values)]`; a bound form control receives the same
   * array. Ignored unless `multiple` is on.
   */
  readonly values = model<readonly T[]>([]);

  /**
   * Whether the suggestion popup is open. Two-way bindable as `[(open)]`, and kept in sync
   * however the popup opens or closes (focus, typing, Escape, an outside click, a
   * selection) - `(openChange)` is the open/close notification. Named `isOpen` on the
   * class so the imperative `open()`/`close()` methods keep their names.
   */
  readonly isOpen = model(false, { alias: 'open' });

  /**
   * Opens the popup once, right after the first render, as though the field had been
   * focused - for a field whose suggestions should be on show from the start. Later
   * opening and closing are up to the user (or `[(open)]`).
   */
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  /**
   * Data-driven suggestions: `{ label, value }` objects, optionally nested one level into
   * `{ label, options }` groups. When set, the component renders its own input and popup
   * and ignores projected `andesComboboxInput`/`andesComboboxContent` parts.
   */
  readonly options = input<readonly AndesComboboxOptionEntry<T>[] | undefined>(
    undefined,
  );

  /** The compound mode's data source: what `filteredItems` is filtered from. */
  readonly items = input<readonly T[]>([]);

  /**
   * Converts an item to the string shown in the input once selected and matched against
   * while filtering. Defaults to template-literal stringification, which is exactly right
   * for `T = string` and a reasonable fallback for anything else - override it for object
   * items. In the `[options]` mode it is the fallback for an option without a `label`.
   */
  readonly itemToStringValue =
    input<AndesComboboxItemToString<T>>(defaultItemToString);

  /**
   * Client-side filtering. `true` (the default) keeps suggestions whose
   * `optionFilterProp` contains the input's text, case-insensitively; `false` turns
   * client-side filtering off entirely - for suggestions already filtered by a server; a
   * function decides per suggestion.
   */
  readonly filterOption = input<
    boolean | AndesComboboxFilterOption<T>,
    boolean | string | AndesComboboxFilterOption<T>
  >(true, { transform: filterOptionAttribute });

  /**
   * Which property of a suggestion the default filter matches against. `'label'` (the
   * default) uses the displayed text; any other key reads that property off the option
   * object, e.g. `'value'` or an extra field such as `'keywords'`.
   */
  readonly optionFilterProp = input('label');

  /**
   * The compound mode's original custom filter, given the raw item and the input's text.
   * Kept for compatibility; a `filterOption` function takes precedence over it.
   */
  readonly filterPredicate = input<AndesComboboxFilterPredicate<T> | undefined>(
    undefined,
  );

  /** Identifies which item (if any) is the current selection. Defaults to `===`. */
  readonly compareWith = input<AndesComboboxCompareWith<T>>(defaultCompareWith);

  /**
   * Highlights the first match as soon as the user types, and again on every list the
   * typed text produces (async results included), so Enter picks it straight away.
   *
   * Only typing triggers it, never opening: a popup opened by focus or a click shows no
   * highlighted option at all, so nothing looks hovered under a pointer that has not
   * moved and Enter cannot pick an option the user never pointed at or typed towards.
   * Off, nothing is highlighted until the pointer or a navigation key picks an option.
   */
  readonly autoHighlight = input(true, { transform: booleanAttribute });

  /**
   * When on, moving the highlight with the arrow keys previews that suggestion's label in
   * the input, without re-filtering the list. Enter or leaving the field commits the
   * previewed suggestion; Escape restores the text that was typed.
   */
  readonly backfill = input(false, { transform: booleanAttribute });

  /**
   * Leaving the field (Tab, a click elsewhere) commits the highlighted suggestion, as
   * Enter would. Off by default: a field that changes its value merely because the user
   * moved on is a surprise unless the form expects it. Single mode only.
   */
  readonly selectOnBlur = input(false, { transform: booleanAttribute });

  /**
   * Makes the typed text itself the value, for fields where the suggestions only help
   * the user write it (an e-mail address, a search phrase): every edit writes the text to
   * `value` and to a bound form control (`null` once the field is empty), and choosing a
   * suggestion writes that suggestion's `value` while the input shows its label. Meant
   * for `T = string`. Not combined with `multiple`, where `allowCreate` adds typed text.
   */
  readonly freeText = input(false, { transform: booleanAttribute });

  /**
   * Several values at once: chosen suggestions become chips in the field (a remove button
   * each, Backspace in the empty input removes the last one), the list stays open after
   * each choice so the next one is a click away, the typed filter is emptied, and choosing
   * a chosen suggestion again removes it. The selection is `values`.
   */
  readonly multiple = input(false, { transform: booleanAttribute });

  /**
   * At most this many values in the `multiple` mode: once reached, the suggestions not yet
   * chosen are shown disabled until a chip is removed.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });

  /**
   * Shows at most this many chips in the `multiple` mode, then one "+ N" chip for the
   * rest, whose tooltip lists them - so a long selection keeps the field one or two lines
   * tall. Unset, every chip shows.
   */
  readonly maxTagCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });

  /** Accessible name of a chip's remove button; `{label}` is replaced by the chip's text. */
  readonly removeTagLabel = input('Remove {label}');

  /**
   * Offers to create the typed text when no suggestion is labelled exactly that (compared
   * case-insensitively, trimmed): the list ends with a "Create ..." option, which Enter,
   * a click or the arrow keys reach like any other. Choosing it emits `(optionCreate)`
   * with the trimmed text and does not change the value by itself: the handler adds the
   * new option and selects it (sets `value`, or appends to `values`).
   */
  readonly allowCreate = input(false, { transform: booleanAttribute });

  /**
   * The "Create ..." option's text: a string in which `{query}` is replaced by the typed
   * text, or a template given that text as `$implicit`.
   */
  readonly createLabel = input<
    string | TemplateRef<AndesComboboxCreateContext>
  >('Create "{query}"');

  /** Shows a button that empties the input and the selection while there is text. */
  readonly allowClear = input(false, { transform: booleanAttribute });
  /** Replaces the clear button's default cross icon. */
  readonly clearIcon = input<TemplateRef<void> | undefined>(undefined);
  /** Accessible name of the clear button. */
  readonly clearLabel = input('Clear');

  /**
   * Content at the field's inline start: a short text (`"$"`) or a template, typically an
   * icon. Decorative - name the field with a label or `aria-label` as usual.
   */
  readonly prefix = input<string | TemplateRef<void> | undefined>(undefined);
  /** An icon at the field's inline end, after the spinner and the clear button. */
  readonly suffixIcon = input<TemplateRef<void> | undefined>(undefined);

  /** Placeholder of the input. Applied to a projected `andesComboboxInput` too. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Native `maxlength` of the input. Applied to a projected `andesComboboxInput` too. */
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Focuses the input once it first renders (which, as any focus does, opens the popup). */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  /**
   * `id` of the input - not of this host element - so a `<label for>` names the field and
   * focuses it on click. Applied to a projected `andesComboboxInput` too.
   */
  readonly id = input<string | undefined>(undefined);
  /** `id` of the rendered input in the `[options]` mode. Kept for compatibility; prefer `id`. */
  readonly inputId = input<string | undefined>(undefined);
  /**
   * Submits the value with a native `<form>`: a hidden input of this name carries it (one
   * per value in the `multiple` mode; objects as JSON). Reactive and template-driven forms
   * do not need it.
   */
  readonly name = input<string | undefined>(undefined);
  /**
   * Marks the field as required: `aria-required` on the input, and the native `required`
   * constraint too in the single mode (in the `multiple` mode the text input is empty by
   * design once chips are chosen, so only the ARIA state applies there).
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * Waits this many milliseconds after the last keystroke before emitting `(searchChange)`,
   * so a server search runs once per pause instead of once per key. The list itself
   * still filters on every keystroke. `0` (the default) emits at once; clearing the field
   * always emits at once.
   */
  readonly searchDebounce = input(0, { transform: numberAttribute });

  /** Control height and font size: 24px (`sm`), 32px (`md`) or 40px (`lg`). */
  readonly size = input<AndesComboboxSize | undefined>(undefined);
  /** Validation status. `'error'` also sets `aria-invalid` on the input. */
  readonly status = input<AndesComboboxStatus | undefined>(undefined);
  /** Visual treatment of the input box: `outlined` unless set, or the enclosing
   *  `andesForm`'s `variant`. */
  readonly variant = input<AndesComboboxVariant | undefined>(undefined);

  /**
   * Where the popup opens relative to the input. It flips to the other side when that
   * side has more room, and shrinks to the room there is (its options scrolling) when
   * neither side fits the whole list. `start`/`end` follow the field's own direction.
   */
  readonly placement = input<AndesComboboxPlacement>('bottom-start');

  /**
   * Popup width: `true` (the default) makes the popup exactly as wide as the field, its
   * edges level with the field's, `false` sizes it to its content, a number sets that
   * width in px.
   */
  readonly popupMatchSelectWidth = input<
    boolean | number,
    boolean | number | string
  >(true, { transform: matchWidthAttribute });

  /**
   * Extra classes for the popup element, e.g. to restyle it from page CSS: its base look
   * has no specificity of its own, so a single class selector overrides it.
   */
  readonly panelClass = input<AndesComboboxPanelClass | undefined>(undefined);

  /**
   * What the `[options]` mode's popup shows when nothing matches: a message (rendered with
   * the inbox illustration) or a template. `null` hides the popup while there are no
   * matches.
   */
  readonly notFoundContent = input<string | TemplateRef<void> | null>(
    'No results found.',
  );

  /**
   * Marks the suggestions as being fetched: shows a spinner in the input, sets `aria-busy`
   * on the popup, and - in the `[options]` mode - replaces the list with `loadingText`.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** The `[options]` mode's loading message. */
  readonly loadingText = input('Loading...');

  /** Custom rendering of each suggestion in the `[options]` mode. */
  readonly optionTemplate = input<
    TemplateRef<AndesComboboxOptionContext<T>> | undefined
  >(undefined);

  /**
   * Custom rendering of each group heading in the `[options]` mode, e.g. a heading with a
   * "see all" link. The heading stays out of keyboard navigation; a control inside it is
   * reachable by pointer only, and the popup keeps the input focused while it is pressed.
   */
  readonly groupLabelTemplate = input<
    TemplateRef<AndesComboboxGroupContext<T>> | undefined
  >(undefined);

  /**
   * Wraps the `[options]` mode's popup body with extra content - a header, a footer
   * action, a hint. The template receives the default body as `$implicit` and places it
   * with `*ngTemplateOutlet`. While set, the popup stays open even when nothing matches
   * and `notFoundContent` is `null`, so the extra content remains reachable.
   */
  readonly popupTemplate = input<
    TemplateRef<AndesComboboxPopupContext> | undefined
  >(undefined);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaInvalid = input(false, {
    alias: 'aria-invalid',
    transform: booleanAttribute,
  });
  /** Ids describing the input; merged with the enclosing field's hint and messages. */
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  /**
   * The input's text, on every edit (typing, or clearing) - after `searchDebounce`, when
   * set. Not named `search`, which is a native DOM event.
   */
  readonly searchChange = output<string>();
  /** A suggestion was chosen, even if it was already the value. */
  readonly optionSelect = output<AndesComboboxSelectEvent<T>>();
  /** A value was removed in the `multiple` mode: a chip's button, Backspace, or a re-pick. */
  readonly optionDeselect = output<AndesComboboxSelectEvent<T>>();
  /** The "Create ..." option of `allowCreate` was chosen, with the trimmed typed text. */
  readonly optionCreate = output<string>();
  /** The clear button (or Escape on a closed popup, with `allowClear`) emptied the field. */
  readonly clear = output<void>();
  /** Scroll events of the `[options]` mode's popup (e.g. for infinite loading). */
  readonly popupScroll = output<Event>();
  /** The input received focus. Not named `focus`, which is the imperative method. */
  readonly inputFocus = output<FocusEvent>();
  /** The input lost focus. Not named `blur`, which is the imperative method. */
  readonly inputBlur = output<FocusEvent>();
  /**
   * Same event as `inputFocus`, under the name every other field uses (AndesInput,
   * AndesTextarea, AndesSelect, AndesCheckbox), so a form can listen to them alike.
   */
  readonly focused = output<FocusEvent>();
  /** Same event as `inputBlur`, under the name every other field uses. */
  readonly blurred = output<FocusEvent>();
  /**
   * Every keydown on the input, after the list's own handling of it (arrows, Enter,
   * Escape) has run - e.g. for a shortcut that submits the surrounding form.
   */
  readonly inputKeydown = output<KeyboardEvent>();

  /** @internal */
  readonly overlay = inject(AndesOverlayPrimitive);
  /** @internal */
  readonly navigation = inject(AndesListNavigation);

  private readonly panel = viewChild<TemplateRef<unknown>>('panel');
  private readonly field = viewChild<ElementRef<HTMLElement>>('field');
  private readonly prefixElement =
    viewChild<ElementRef<HTMLElement>>('prefixSlot');

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly directionality = inject(Directionality, { optional: true });

  private readonly uid = `andes-combobox-${nextUniqueId++}`;
  private readonly _query = signal('');
  private readonly _backfill = signal<string | null>(null);
  private readonly formDisabled = signal(false);

  /** The enclosing form field and form: id, ARIA, status, size, variant and disabled. */
  private readonly fieldBinding = injectAndesFieldBinding();

  /** The size in effect: `size`, else the form's, else `md`. */
  readonly resolvedSize = computed<AndesComboboxSize>(
    () => this.size() ?? this.fieldBinding.size() ?? 'md',
  );

  /** The variant in effect: `variant`, else the form's, else `outlined`. */
  readonly resolvedVariant = computed<AndesComboboxVariant>(
    () => this.variant() ?? this.fieldBinding.variant() ?? 'outlined',
  );

  /** The status in effect: `status`, else the enclosing field's error or warning. */
  readonly resolvedStatus = computed<AndesComboboxStatus | undefined>(
    () => this.status() ?? this.fieldBinding.status(),
  );

  /** @internal `aria-labelledby`, else the field's label - unless an `aria-label` names it. */
  readonly labelledBy = computed(
    () =>
      this.ariaLabelledby() ??
      (this.ariaLabel() ? undefined : this.fieldBinding.labelledBy()),
  );

  /** @internal `aria-describedby` merged with the enclosing field's hint and message ids. */
  readonly describedBy = computed(() =>
    andesIdRefs(this.ariaDescribedby(), this.fieldBinding.describedBy()),
  );

  /** @internal `required`, or a required enclosing field. */
  readonly isRequired = computed(
    () => this.required() || this.fieldBinding.required(),
  );
  private readonly _inputElement = signal<HTMLElement | null>(null);
  private readonly _panelDirection = signal<'ltr' | 'rtl' | null>(null);
  private destroyed = false;

  /** @internal The text the user typed, which the list is filtered by. */
  readonly query = this._query.asReadonly();

  /** @internal The text shown in the input: a backfilled preview, or else the query. */
  readonly displayText = computed(() => this._backfill() ?? this._query());

  /** @internal The direction the field is laid out in, measured as the popup opens. */
  readonly panelDirection = this._panelDirection.asReadonly();

  /** Combines the `disabled` input with a disabled state set through the forms APIs. */
  readonly isDisabled = computed(
    () =>
      this.disabled() || this.formDisabled() || this.fieldBinding.disabled(),
  );

  /** @internal */
  readonly usesOptions = computed(() => this.options() !== undefined);

  /** @internal */
  readonly invalid = computed(
    () => this.ariaInvalid() || this.resolvedStatus() === 'error',
  );

  /** @internal The `id` the input carries: `inputId`, `id`, else the enclosing field's. */
  readonly fieldId = computed(
    () => this.inputId() ?? this.id() ?? this.fieldBinding.id(),
  );

  /** @internal Whether the field can be edited at all right now. */
  readonly editable = computed(() => !this.isDisabled() && !this.readOnly());

  /** @internal */
  readonly showClear = computed(
    () =>
      this.allowClear() &&
      this.editable() &&
      (this.displayText() !== '' ||
        (this.multiple() && this.values().length > 0)),
  );

  /** @internal How many affordances sit at the input's inline end, so it reserves room. */
  readonly suffixCount = computed(
    () =>
      Number(this.showClear()) +
      Number(this.loading()) +
      Number(this.suffixIcon() !== undefined),
  );

  /** @internal */
  readonly hasSuffix = computed(() => this.suffixCount() > 0);

  /** @internal */
  readonly prefixTemplate = computed(() => {
    const prefix = this.prefix();
    return prefix instanceof TemplateRef ? prefix : null;
  });

  /**
   * @internal Whether the text is still exactly the selected suggestion's label, untouched
   * since it was chosen. The list then shows every suggestion, not just that one: the user
   * reopening a filled field is looking for an alternative, and the selected option is
   * scrolled into view among the rest. The first edit filters again (and, unless
   * `freeText`, clears the stale selection).
   */
  readonly showsSelection = computed(() => {
    if (this.multiple() || this.freeText()) {
      return false;
    }
    const value = this.value();
    return value !== null && this._query() === this.labelOf(value);
  });

  /** @internal The `[options]` mode's rows: groups and options that match the query. */
  readonly renderedOptions = computed<readonly AndesComboboxRenderedEntry<T>[]>(
    () => {
      const entries = this.options() ?? [];
      const query = this._query();
      const filtering = this.isFiltering(query) && !this.showsSelection();
      const keep = (option: AndesComboboxOption<T>) =>
        !filtering || this.matches(option, query);

      const rendered: AndesComboboxRenderedEntry<T>[] = [];
      entries.forEach((entry, index) => {
        if (isGroup(entry)) {
          const options = entry.options.filter(keep);
          if (options.length > 0) {
            rendered.push({
              kind: 'group',
              key: `${this.uid}-group-${index}`,
              label: entry.label,
              group: entry,
              options,
            });
          }
        } else if (keep(entry)) {
          rendered.push({ kind: 'option', key: entry.value, option: entry });
        }
      });
      return rendered;
    },
  );

  /**
   * @internal Items matching the current input text - the compound mode's `[items]`, or
   * the `[options]` mode's values, flattened out of their groups.
   */
  readonly filteredItems = computed<readonly T[]>(() => {
    if (this.usesOptions()) {
      return this.renderedOptions().flatMap((entry) =>
        entry.kind === 'group'
          ? entry.options.map((option) => option.value)
          : [entry.option.value],
      );
    }

    const items = this.items();
    const query = this._query();
    if (!this.isFiltering(query) || this.showsSelection()) {
      return items;
    }

    const filter = this.filterOption();
    const predicate = this.filterPredicate();
    const toString = this.itemToStringValue();
    return items.filter((item) =>
      typeof filter !== 'function' && predicate
        ? predicate(item, query)
        : this.matches({ value: item, label: toString(item) }, query),
    );
  });

  /**
   * The text `allowCreate` would create from, or `null` when there is nothing to offer:
   * the option is off, nothing is typed, the suggestions are loading, or a suggestion (or,
   * in the `multiple` mode, a chosen value) is already labelled exactly that. A compound
   * list renders its own "Create" row from it: `<div andesComboboxItem create [value]="...">`.
   */
  readonly createCandidate = computed<string | null>(() => {
    if (!this.allowCreate() || this.loading()) {
      return null;
    }
    const text = this._query().trim();
    if (text === '') {
      return null;
    }
    const wanted = text.toLowerCase();
    const same = (label: string) => label.trim().toLowerCase() === wanted;
    const toString = this.itemToStringValue();
    const labels = this.usesOptions()
      ? this.allOptions().map((option) => this.optionLabel(option))
      : this.items().map((item) => toString(item));
    if (labels.some(same)) {
      return null;
    }
    if (
      this.multiple() &&
      this.values().some((value) => same(this.labelOf(value)))
    ) {
      return null;
    }
    return text;
  });

  /** @internal The "Create ..." option's text, when `createLabel` is a string. */
  readonly createText = computed(() => {
    const label = this.createLabel();
    const text = this.createCandidate() ?? '';
    return typeof label === 'string' ? label.split('{query}').join(text) : '';
  });

  /** @internal */
  readonly createTemplate = computed(() => {
    const label = this.createLabel();
    return label instanceof TemplateRef ? label : null;
  });

  /** @internal Whether the `[options]` popup has nothing to show and should hide itself. */
  readonly hidePopup = computed(
    () =>
      this.notFoundContent() === null &&
      this.popupTemplate() === undefined &&
      !this.loading() &&
      this.createCandidate() === null &&
      this.renderedOptions().length === 0,
  );

  /** @internal */
  readonly notFoundTemplate = computed(() => {
    const content = this.notFoundContent();
    return content instanceof TemplateRef ? content : null;
  });

  /** @internal Every chip of the `multiple` mode. */
  readonly tags = computed<readonly AndesComboboxTag<T>[]>(() =>
    this.multiple()
      ? this.values().map((value) => ({
          value,
          label: this.labelOf(value),
          removable: !this.findOption(value)?.disabled,
        }))
      : [],
  );

  /** @internal The chips shown, as `maxTagCount` allows. */
  readonly visibleTags = computed(() => {
    const max = this.maxTagCount();
    const tags = this.tags();
    return max === undefined ? tags : tags.slice(0, Math.max(0, max));
  });

  /** @internal The chips folded into the "+ N" chip. */
  readonly hiddenTags = computed(() =>
    this.tags().slice(this.visibleTags().length),
  );

  /** @internal The "+ N" chip's tooltip: every folded chip's text. */
  readonly hiddenTagsSummary = computed(() =>
    this.hiddenTags()
      .map((tag) => tag.label)
      .join(', '),
  );

  /** @internal Whether `maxCount` is reached, blocking the suggestions not yet chosen. */
  readonly atMaxCount = computed(() => {
    const max = this.maxCount();
    return this.multiple() && max !== undefined && this.values().length >= max;
  });

  /** @internal What the hidden `name` inputs submit, one entry per value. */
  readonly formValues = computed<readonly string[]>(() => {
    if (!this.name()) {
      return [];
    }
    const current = this.value();
    const list = this.multiple()
      ? this.values()
      : current === null
        ? []
        : [current];
    return list.map((value) =>
      typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value),
    );
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- replaced by registerOnChange before any real change can occur
  private onChange: (value: unknown) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- replaced by registerOnTouched before any real touch can occur
  private onTouched: () => void = () => {};

  /** What placed the active option - see {@link AndesComboboxCursorOrigin}. */
  private cursorOrigin: AndesComboboxCursorOrigin | null = null;
  /** Whether the query changed by typing since the cursor was last reconciled. */
  private typedSinceReconcile = false;
  /** Whether the user typed since the popup opened (for restoring after a hover). */
  private typedSinceOpen = false;
  /** A cursor to place once the rows exist: a navigation key opened the popup. */
  private pendingCursor: 'first' | 'last' | null = null;
  /** The value whose row keeps the keyboard cursor across a `multiple` toggle. */
  private keepCursorOn: { readonly value: T } | null = null;
  /** The selected option still has to be scrolled into view (set as the popup opens). */
  private revealSelectedPending = false;
  /**
   * Where the pointer last was, in screen coordinates: at the press that opened the
   * popup, then at every move over the options. A `pointermove` at the same spot is not a
   * move - browsers dispatch one when the list appears, re-filters or scrolls under a
   * stationary pointer - so it must not highlight the option that happens to be there.
   */
  private lastPointer: { readonly x: number; readonly y: number } | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private stopWatchingScroll: (() => void) | null = null;

  // Tracks what the cursor effect last acted on - see its guard, below.
  private lastCursorItems: readonly T[] | undefined;
  private lastCursorOpen: boolean | undefined;
  private lastCursorRegistered: readonly unknown[] | undefined;
  private lastCursorCreate: string | null | undefined;
  private lastCursorAutoHighlight: boolean | undefined;

  /**
   * The value this component itself last wrote to {@link value} (or received through
   * `writeValue`), so the effect that mirrors a parent's `[value]` binding into the input's
   * text can tell a parent's write apart from its own.
   */
  private syncedValue: T | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.searchTimer);
      this.unwatchScroll();
    });

    this.overlay.configure({
      ...andesOverlayPreset('popover'),
      role: 'listbox',
      // The input keeps real DOM focus for the popup's entire lifetime - see
      // AndesComboboxInput - so nothing here may move focus into the panel.
      trapFocus: false,
      autoFocus: 'none',
      restoreFocus: false,
      positioning: {
        kind: 'anchored',
        side: 'bottom',
        align: 'start',
        sideOffset: 4,
        matchAnchorWidth: true,
        // Above or below the input only (see the placement effect below).
        crossSideFallback: false,
        flexibleDimensions: true,
      },
      size: { minHeight: '0px' },
    });

    this.navigation.configure({
      orientation: 'vertical',
      focusMode: 'active-descendant',
      wrap: true,
      // Home/End and the page keys are handled by AndesComboboxInput: while the user is
      // typing they belong to the text caret, not the list.
      homeAndEnd: false,
      // Typed characters are handled entirely as filter text via (input) on the field -
      // CDK's own letter-matching typeahead would otherwise double-handle them.
      typeahead: false,
    });

    // Forces AndesListNavigation to construct its CDK key manager right now, outside any
    // reactive context: ListKeyManager's own constructor schedules an effect() of its own,
    // and creating one from inside the effect() below (on that effect's first run) would
    // trip Angular's "effect() cannot be called from within a reactive context" (NG0602).
    this.navigation.clearActive();

    // The [(open)] model follows the overlay however it opened or closed...
    this.overlay.opened.subscribe(() => {
      this.revealSelectedPending = true;
      this.watchScroll();
      if (!this.destroyed) {
        this.isOpen.set(true);
      }
    });
    this.overlay.closed.subscribe((reason) => {
      // A backfilled preview only outlives the popup when it was committed (Enter, blur);
      // any other way of closing discards it, restoring the text that was typed.
      this._backfill.set(null);
      this.lastPointer = null;
      this.pendingCursor = null;
      this.keepCursorOn = null;
      this.cursorOrigin = null;
      this.typedSinceOpen = false;
      this.unwatchScroll();
      // 'destroyed' is the overlay tearing down with this component, by which point the
      // model's own output is already destroyed and would throw on emit (NG0953).
      if (!this.destroyed && reason !== 'destroyed') {
        this.isOpen.set(false);
      }
    });

    // ...and the overlay follows the model when a parent writes [open].
    effect(() => {
      const wanted = this.isOpen();
      // Read (tracked) so that an initial [open]="true" waits for the template to exist.
      if (!this.panel()) {
        return;
      }
      untracked(() => {
        const actual = this.overlay.isOpen();
        if (wanted && !actual) {
          this.open();
          if (!this.overlay.isOpen()) {
            // Disabled or read-only: refuse, and say so through openChange.
            this.isOpen.set(false);
          }
        } else if (!wanted && actual) {
          this.close();
        }
      });
    });

    effect(() => {
      const [side, configuredAlign] = this.placement().split('-') as [
        AndesOverlaySide,
        AndesOverlayAlign,
      ];
      const match = this.popupMatchSelectWidth();
      // `start`/`end` are the field's own: the overlay resolves them against the page's
      // direction, so they are swapped for a field laid out the other way round.
      const fieldRtl = this._panelDirection() === 'rtl';
      const overlayRtl = this.directionality?.value === 'rtl';
      const align =
        this._panelDirection() === null || fieldRtl === overlayRtl
          ? configuredAlign
          : MIRRORED_ALIGN[configuredAlign];
      this.overlay.configure({
        positioning: {
          kind: 'anchored',
          side,
          align,
          sideOffset: 4,
          matchAnchorWidth: match === true,
          // A suggestion list belongs above or below its input: the perpendicular
          // fallbacks put it beside the field whenever it fitted neither way. Where
          // neither side has room for every row, it shrinks into the larger one and
          // scrolls instead of being pushed over the input.
          crossSideFallback: false,
          flexibleDimensions: true,
        },
        // CDK only shrinks a pane with a minimum height set; zero (a string, as CDK
        // reads a numeric 0 as "no minimum") lets the side with the most room win
        // without growing a short list's pane past its content.
        size: {
          minHeight: '0px',
          ...(typeof match === 'number' ? { width: match } : {}),
        },
      });
    });

    // The popup hangs from the whole chip box in the `multiple` mode, so it matches the
    // box's width rather than the text input's, which is only the box's last line.
    effect(() => {
      const box = this.multiple() ? this.field()?.nativeElement : null;
      const input = this._inputElement();
      untracked(() => this.overlay.registerAnchor(box ?? input));
    });

    // Chips wrapping onto another line change the box's height: the open popup moves
    // with its bottom edge.
    afterRenderEffect(() => {
      this.values();
      if (untracked(() => this.multiple() && this.overlay.isOpen())) {
        untracked(() => this.overlay.updatePosition());
      }
    });

    // The prefix's width, for the room the single-mode input reserves for it.
    afterRenderEffect(() => {
      // Re-measured when the content or the text size changes.
      this.prefix();
      this.resolvedSize();
      const prefix = this.prefixElement()?.nativeElement;
      const field = this.field()?.nativeElement;
      if (prefix && field) {
        field.style.setProperty(
          '--_combobox-prefix-width',
          `${prefix.getBoundingClientRect().width}px`,
        );
      }
    });

    // Mirrors a parent's [value] write into the input's text, the way writeValue does for
    // the forms APIs. Writes this component made itself are recognised and skipped - the
    // text they belong with is already in place.
    effect(() => {
      const value = this.value();
      untracked(() => {
        if (value === this.syncedValue || this.multiple()) {
          return;
        }
        this.syncedValue = value;
        this._backfill.set(null);
        this._query.set(value == null ? '' : this.labelOf(value));
      });
    });

    effect(() => {
      const items = this.filteredItems();
      const isOpen = this.overlay.isOpen();
      const autoHighlight = this.autoHighlight();
      const create = this.createCandidate();
      // The rows actually rendered for those items. They register a render *after*
      // filteredItems changes - so a list that arrives while the popup is already open
      // (async options, loading ending) has nothing to highlight on the first run, and
      // needs this to run again once the rows exist.
      const registered = this.navigation.items();

      // This effect exists to reconcile the cursor whenever the list or the open state
      // genuinely changes - not on every unrelated change-detection pass, which would
      // undo whatever ArrowDown/ArrowUp or the pointer just set as the active item.
      if (
        items === this.lastCursorItems &&
        isOpen === this.lastCursorOpen &&
        registered === this.lastCursorRegistered &&
        create === this.lastCursorCreate &&
        autoHighlight === this.lastCursorAutoHighlight
      ) {
        return;
      }
      this.lastCursorItems = items;
      this.lastCursorOpen = isOpen;
      this.lastCursorRegistered = registered;
      this.lastCursorCreate = create;
      this.lastCursorAutoHighlight = autoHighlight;

      untracked(() => this.reconcileCursor(isOpen, registered));
    });

    afterNextRender(() => {
      if (this.defaultOpen() && !this.overlay.isOpen()) {
        this.open();
      }
    });
  }

  /** Opens the suggestion popup. A no-op while disabled, read-only or already open. */
  open(): void {
    const panel = this.panel();
    if (!panel || !this.editable() || this.overlay.isOpen()) {
      return;
    }
    this._panelDirection.set(this.fieldDirection());
    this.overlay.open(panel);
  }

  /** Closes the suggestion popup. A no-op if already closed. */
  close(): void {
    this.overlay.close();
  }

  /** Moves focus to the input. */
  focus(options?: FocusOptions): void {
    this._inputElement()?.focus(options);
  }

  /** Removes focus from the input. */
  blur(): void {
    this._inputElement()?.blur();
  }

  /**
   * Empties the input and the selection (every chip, in the `multiple` mode), as the
   * `allowClear` button does.
   */
  clearValue(): void {
    clearTimeout(this.searchTimer);
    this._backfill.set(null);
    this._query.set('');
    this.searchChange.emit('');
    if (this.multiple()) {
      if (this.values().length > 0) {
        this.setValues([]);
      }
    } else if (this.value() !== null) {
      this.setValue(null);
    }
    this.clear.emit();
    this.focus();
  }

  /** @internal Called by `AndesComboboxInput` with its host element. */
  registerInput(element: HTMLElement): void {
    this._inputElement.set(element);
  }

  /** @internal Called by `AndesComboboxInput` on every keystroke. */
  setQuery(text: string): void {
    this._backfill.set(null);
    this._query.set(text);
    this.typedSinceReconcile = true;
    this.typedSinceOpen = true;
    this.emitSearch(text);

    if (this.multiple()) {
      return;
    }
    const current = this.value();
    if (this.freeText()) {
      const next = (text === '' ? null : text) as T | null;
      if (next !== current) {
        this.setValue(next);
      }
      return;
    }

    // Once the displayed text no longer matches the selected item's own label, the
    // selection itself is stale - clearing it keeps the form value honest instead of
    // silently keeping a value the user has since edited away from.
    if (current !== null && this.labelOf(current) !== text) {
      this.setValue(null);
    }
  }

  /** @internal Commits a suggestion: the click on a row, or Enter on the active one. */
  chooseItem(item: AndesComboboxItem<T>): void {
    if (item.isDisabled()) {
      return;
    }
    if (item.create()) {
      this.createOption();
      return;
    }
    this.selectValue(item.value());
  }

  /** @internal Selects a value - or, in the `multiple` mode, toggles it. */
  selectValue(value: T): void {
    if (this.multiple()) {
      this.toggleValue(value);
      return;
    }
    this._backfill.set(null);
    this._query.set(this.labelOf(value));
    this.setValue(value);
    this.onTouched();
    this.optionSelect.emit({ value, option: this.optionFor(value) });
    this.close();
  }

  /** @internal Removes one value of the `multiple` mode, e.g. from its chip's button. */
  removeValue(value: T): void {
    const compare = this.compareWith();
    const current = this.values();
    const next = current.filter((entry) => !compare(entry, value));
    if (next.length === current.length) {
      return;
    }
    this.setValues(next);
    this.optionDeselect.emit({ value, option: this.optionFor(value) });
  }

  /**
   * @internal Backspace in the empty input of the `multiple` mode: removes the last chip
   * that can be removed. Returns whether one was.
   */
  removeLastValue(): boolean {
    const last = [...this.tags()].reverse().find((tag) => tag.removable);
    if (!last) {
      return false;
    }
    this.removeValue(last.value);
    return true;
  }

  /**
   * @internal Commits whichever item is currently highlighted, e.g. on Enter. Returns
   * whether there was one to commit.
   */
  selectActiveItem(): boolean {
    if (!this.overlay.isOpen()) {
      return false;
    }
    const active = this.activeItem();
    if (!active || active.isDisabled()) {
      return false;
    }
    if (this.multiple() && this.cursorOrigin !== 'pointer') {
      this.keepCursorOn = { value: active.value() };
    }
    this.chooseItem(active);
    return true;
  }

  /**
   * @internal Called by `AndesComboboxInput` after an arrow key moved the highlight:
   * previews the highlighted suggestion's label in the input when `backfill` is on.
   */
  backfillActiveItem(): void {
    if (!this.backfill() || this.multiple()) {
      return;
    }
    const active = this.activeItem();
    if (active && !active.create()) {
      this._backfill.set(this.labelOf(active.value()));
    }
  }

  /**
   * @internal ArrowDown/ArrowUp from AndesComboboxInput. Opens a closed popup with the
   * cursor already placed (on the selected option, else the first/last one); in an open
   * one, the first press places the cursor the same way and later ones move it.
   */
  moveCursor(direction: 'next' | 'previous'): void {
    const edge = direction === 'next' ? 'first' : 'last';
    if (!this.overlay.isOpen()) {
      // Placed once the rows exist, by reconcileCursor.
      this.pendingCursor = edge;
      this.open();
      if (!this.overlay.isOpen()) {
        this.pendingCursor = null;
      }
      return;
    }
    if (!this.navigation.activeItem()) {
      this.placeCursor(edge);
    } else if (direction === 'next') {
      this.navigation.focusNext();
    } else {
      this.navigation.focusPrevious();
    }
    this.cursorOrigin = this.navigation.activeItem() ? 'keyboard' : null;
    this.backfillActiveItem();
  }

  /**
   * @internal Home/End from AndesComboboxInput: jumps to the first/last option while the
   * user is navigating the list. Returns `false` (leaving the key to the text caret) while
   * no option is highlighted.
   */
  moveCursorToEdge(edge: 'first' | 'last'): boolean {
    if (!this.overlay.isOpen() || !this.navigation.activeItem()) {
      return false;
    }
    if (edge === 'first') {
      this.navigation.focusFirst();
    } else {
      this.navigation.focusLast();
    }
    this.cursorOrigin = 'keyboard';
    this.backfillActiveItem();
    return true;
  }

  /**
   * @internal PageDown/PageUp from AndesComboboxInput: moves the cursor by one popup
   * height of options (ten while the list has no layout), stopping at the first or last
   * enabled one. Returns whether the popup was open to move in.
   */
  moveCursorByPage(direction: 1 | -1): boolean {
    if (!this.overlay.isOpen()) {
      return false;
    }
    const items = this.navigation.items();
    const enabled = items.filter((item) => !item.isDisabled());
    if (enabled.length === 0) {
      return true;
    }
    const active = this.navigation.activeItem();
    const viewport = this.overlay
      .panelElement()
      ?.querySelector<HTMLElement>('.andes-combobox-content');
    const rowHeight = (active ?? enabled[0]).element.offsetHeight;
    const pageSize =
      viewport && rowHeight > 0 && viewport.clientHeight > 0
        ? Math.max(1, Math.floor(viewport.clientHeight / rowHeight) - 1)
        : FALLBACK_PAGE_SIZE;
    const start = active
      ? items.indexOf(active)
      : direction > 0
        ? -1
        : items.length;
    const targetIndex = Math.min(
      items.length - 1,
      Math.max(0, start + direction * pageSize),
    );
    // The nearest enabled option at or before the target (after it, for PageUp), so a
    // page never jumps past the end, nor stops short on a disabled row.
    const ordered = direction > 0 ? [...enabled].reverse() : enabled;
    const target =
      ordered.find((item) =>
        direction > 0
          ? items.indexOf(item) <= targetIndex
          : items.indexOf(item) >= targetIndex,
      ) ?? ordered[ordered.length - 1];
    this.navigation.focusItem(target);
    this.cursorOrigin = 'keyboard';
    this.backfillActiveItem();
    return true;
  }

  /**
   * @internal The pointer moving over an option makes it the active one - so the keyboard
   * carries on from where the pointer is. Only a real move counts (see
   * {@link lastPointer}); touch input never hovers. Moving over a disabled option drops
   * the highlight, as the pointer is no longer over anything Enter could pick.
   */
  onItemPointerMove(item: AndesComboboxItem<T>, event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    const last = this.lastPointer;
    if (last && last.x === event.screenX && last.y === event.screenY) {
      return;
    }
    this.lastPointer = { x: event.screenX, y: event.screenY };

    if (item.isDisabled()) {
      if (this.navigation.activeItem()) {
        this.navigation.clearActive();
      }
      this.cursorOrigin = null;
      return;
    }
    if (this.navigation.activeItem() !== item) {
      // Silently: the pointer is already on the row - scrolling it "into view"
      // underneath a stationary mouse would yank the list.
      this.navigation.setActiveItemSilently(item);
    }
    this.cursorOrigin = 'pointer';
  }

  /**
   * @internal The pointer left the list: a hover highlight goes with it. What typing had
   * highlighted (`autoHighlight`) comes back, so Enter keeps meaning the first match.
   */
  onListPointerLeave(): void {
    if (this.cursorOrigin !== 'pointer') {
      return;
    }
    this.applyTypingCursor(this.typedSinceOpen);
  }

  /** @internal Records where a press on the field happened - see {@link lastPointer}. */
  onFieldPointerDown(event: PointerEvent): void {
    this.lastPointer = { x: event.screenX, y: event.screenY };
  }

  /** @internal Called by `AndesComboboxInput` on Escape: discards any preview, then closes. */
  dismiss(): void {
    this._backfill.set(null);
    this.close();
  }

  /** @internal Called by `AndesComboboxInput` on blur. */
  notifyBlur(): void {
    // Leaving the field with a backfilled preview showing keeps what the user sees.
    if (this._backfill() !== null && this.selectActiveItem()) {
      return;
    }
    if (
      this.selectOnBlur() &&
      !this.multiple() &&
      this.navigation.activeItem() &&
      this.selectActiveItem()
    ) {
      return;
    }
    this.onTouched();
    this.close();
  }

  /** @internal Whether `value` is the current selection, per `compareWith`. */
  isSelected(value: T): boolean {
    const compare = this.compareWith();
    if (this.multiple()) {
      return this.values().some((entry) => compare(entry, value));
    }
    const current = this.value();
    return current !== null && compare(current, value);
  }

  /** @internal Whether `maxCount` keeps `value` from being chosen right now. */
  isBlocked(value: T): boolean {
    return this.atMaxCount() && !this.isSelected(value);
  }

  /** @internal The text a value is shown as: its option's label, or `itemToStringValue`. */
  labelOf(value: T): string {
    const option = this.findOption(value);
    return option ? this.optionLabel(option) : this.itemToStringValue()(value);
  }

  /** @internal */
  optionLabel(option: AndesComboboxOption<T>): string {
    return option.label ?? this.itemToStringValue()(option.value);
  }

  /** @internal The accessible name of a chip's remove button. */
  removeLabelFor(label: string): string {
    return this.removeTagLabel().split('{label}').join(label);
  }

  /** @internal Relays the `[options]` popup's scroll events. */
  onPopupScroll(event: Event): void {
    this.popupScroll.emit(event);
  }

  /**
   * @internal A press on the `multiple` mode's chip box outside the text input (between
   * chips, on its padding) moves focus to the input, as a click on a text field would.
   */
  onFieldMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const input = this._inputElement();
    if (
      !this.multiple() ||
      !input ||
      !target ||
      target === input ||
      target.closest('button')
    ) {
      return;
    }
    event.preventDefault();
    if (this.document.activeElement === input) {
      this.open();
    } else {
      input.focus();
    }
  }

  writeValue(value: unknown): void {
    if (this.multiple()) {
      const list = Array.isArray(value)
        ? (value as readonly T[])
        : value == null
          ? []
          : [value as T];
      this.values.set(list);
      return;
    }
    const next = (value ?? null) as T | null;
    this.syncedValue = next;
    this.value.set(next);
    this._backfill.set(null);
    this._query.set(next === null ? '' : this.labelOf(next));
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  private setValue(value: T | null): void {
    this.syncedValue = value;
    this.value.set(value);
    this.onChange(value);
  }

  private setValues(values: readonly T[]): void {
    this.values.set(values);
    this.onChange(values);
  }

  private toggleValue(value: T): void {
    if (this.isSelected(value)) {
      this.removeValue(value);
    } else if (!this.isBlocked(value)) {
      this.setValues([...this.values(), value]);
      this.optionSelect.emit({ value, option: this.optionFor(value) });
    }
    this.onTouched();
    this.resetQueryAfterPick();
  }

  /** Emits `(optionCreate)`; the handler adds the option and selects it. */
  private createOption(): void {
    const text = this.createCandidate();
    if (text === null) {
      return;
    }
    this.optionCreate.emit(text);
    if (this.multiple()) {
      this.resetQueryAfterPick();
    } else {
      this.close();
    }
  }

  /** The `multiple` mode empties the typed filter after each pick, keeping the popup open. */
  private resetQueryAfterPick(): void {
    if (this._query() !== '') {
      clearTimeout(this.searchTimer);
      this._query.set('');
      this.searchChange.emit('');
    }
  }

  private emitSearch(text: string): void {
    clearTimeout(this.searchTimer);
    const delay = this.searchDebounce();
    if (delay > 0) {
      this.searchTimer = setTimeout(() => {
        if (!this.destroyed) {
          this.searchChange.emit(text);
        }
      }, delay);
    } else {
      this.searchChange.emit(text);
    }
  }

  /**
   * Settles the active option after the list or the open state changed. See the class
   * doc comment for the rules; in short: nothing on open, the first match after typing
   * (with `autoHighlight`), and a keyboard cursor kept while its row still exists.
   */
  private reconcileCursor(
    isOpen: boolean,
    registered: readonly AndesListNavigationItemRef[],
  ): void {
    if (!isOpen) {
      this.navigation.clearActive();
      this.typedSinceReconcile = false;
      this.revealSelectedPending = false;
      return;
    }
    if (registered.length === 0) {
      if (this.navigation.activeItem()) {
        this.navigation.clearActive();
      }
      // Loading in between keeps the typed text's claim on the first match of the results.
      if (this.cursorOrigin !== 'typing') {
        this.cursorOrigin = null;
      }
      return;
    }
    if (this.pendingCursor) {
      const edge = this.pendingCursor;
      this.pendingCursor = null;
      this.revealSelectedPending = false;
      this.typedSinceReconcile = false;
      this.placeCursor(edge);
      return;
    }
    const keep = this.keepCursorOn;
    this.keepCursorOn = null;
    if (keep && !this.typedSinceReconcile) {
      const row = this.rowFor(keep.value);
      if (row) {
        this.navigation.focusItem(row);
        this.cursorOrigin = 'keyboard';
        return;
      }
    }
    if (this.typedSinceReconcile) {
      this.typedSinceReconcile = false;
      this.revealSelectedPending = false;
      this.applyTypingCursor(true);
      return;
    }
    if (this.revealSelectedPending) {
      this.revealSelectedPending = false;
      this.navigation.clearActive();
      this.cursorOrigin = null;
      this.revealSelected();
      return;
    }
    if (this.cursorOrigin === 'typing') {
      // A new list for the same typed text (async results): its first match.
      this.applyTypingCursor(true);
      return;
    }
    const active = this.navigation.activeItem();
    if (active && !registered.includes(active)) {
      this.navigation.clearActive();
      this.cursorOrigin = null;
    }
  }

  /** The first match, when the user typed and `autoHighlight` is on; else nothing. */
  private applyTypingCursor(typed: boolean): void {
    if (typed && this.autoHighlight() && this._query().trim() !== '') {
      this.navigation.focusFirst();
      this.cursorOrigin = this.navigation.activeItem() ? 'typing' : null;
      return;
    }
    if (this.navigation.activeItem()) {
      this.navigation.clearActive();
    }
    this.cursorOrigin = null;
  }

  /** The keyboard's first stop: the selected option's row, else the first/last one. */
  private placeCursor(edge: 'first' | 'last'): void {
    const selected = this.multiple() ? undefined : this.selectedRow();
    if (selected && !selected.isDisabled()) {
      this.navigation.focusItem(selected);
    } else if (edge === 'first') {
      this.navigation.focusFirst();
    } else {
      this.navigation.focusLast();
    }
    this.cursorOrigin = this.navigation.activeItem() ? 'keyboard' : null;
    this.backfillActiveItem();
  }

  /** Scrolls the (first) selected option to the middle of the list, highlighting nothing. */
  private revealSelected(): void {
    afterNextRender(
      () => {
        const row = this.selectedRow();
        const list = row?.element.closest<HTMLElement>(
          '.andes-combobox-content',
        );
        if (!row || !list || list.clientHeight === 0) {
          return;
        }
        const rowBox = row.element.getBoundingClientRect();
        const listBox = list.getBoundingClientRect();
        list.scrollTop +=
          rowBox.top - listBox.top - (listBox.height - rowBox.height) / 2;
      },
      { injector: this.injector },
    );
  }

  private selectedRow(): AndesComboboxItem<T> | undefined {
    return (this.navigation.items() as readonly AndesComboboxItem<T>[]).find(
      (row) => !row.create() && this.isSelected(row.value()),
    );
  }

  private rowFor(value: T): AndesComboboxItem<T> | undefined {
    const compare = this.compareWith();
    return (this.navigation.items() as readonly AndesComboboxItem<T>[]).find(
      (row) => !row.create() && compare(row.value(), value),
    );
  }

  private activeItem(): AndesComboboxItem<T> | null {
    return this.navigation.activeItem() as AndesComboboxItem<T> | null;
  }

  /** The text direction the field is laid out in, whatever set it. */
  private fieldDirection(): 'ltr' | 'rtl' {
    const element = this._inputElement() ?? this.field()?.nativeElement;
    const direction = element
      ? this.document.defaultView?.getComputedStyle(element).direction
      : undefined;
    if (direction === 'rtl' || direction === 'ltr') {
      return direction;
    }
    return this.directionality?.value === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * While open, closes the popup once the field has scrolled completely out of sight -
   * off the viewport, or out of a scrolling container it sits in. Until then the popup
   * follows the field (the overlay repositions it as any ancestor scrolls, flipping above
   * or below as the room changes): a list left floating over the page after its field
   * has gone reads as belonging to nothing.
   */
  private watchScroll(): void {
    this.unwatchScroll();
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    const onScroll = (event: Event) => {
      const panel = this.overlay.panelElement();
      if (
        !this.overlay.isOpen() ||
        (event.target instanceof Node && panel?.contains(event.target))
      ) {
        return;
      }
      const box = this.overlay.anchor();
      if (box && andesComboboxScrolledOutOfView(box, view)) {
        this.close();
      }
    };
    const options: AddEventListenerOptions = { capture: true, passive: true };
    this.document.addEventListener('scroll', onScroll, options);
    this.stopWatchingScroll = () =>
      this.document.removeEventListener('scroll', onScroll, options);
  }

  private unwatchScroll(): void {
    this.stopWatchingScroll?.();
    this.stopWatchingScroll = null;
  }

  private isFiltering(query: string): boolean {
    return query.trim() !== '' && this.filterOption() !== false;
  }

  private matches(option: AndesComboboxOption<T>, query: string): boolean {
    const filter = this.filterOption();
    if (typeof filter === 'function') {
      return filter(query, option);
    }
    const prop = this.optionFilterProp();
    const target =
      prop === 'label'
        ? this.optionLabel(option)
        : (option as unknown as Record<string, unknown>)[prop];
    return String(target ?? '')
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  }

  private allOptions(): readonly AndesComboboxOption<T>[] {
    return (this.options() ?? []).flatMap((entry) =>
      isGroup(entry) ? entry.options : [entry],
    );
  }

  private findOption(value: T): AndesComboboxOption<T> | undefined {
    const entries = this.options();
    if (!entries) {
      return undefined;
    }
    const compare = this.compareWith();
    for (const entry of entries) {
      const found = isGroup(entry)
        ? entry.options.find((option) => compare(option.value, value))
        : compare(entry.value, value)
          ? entry
          : undefined;
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private optionFor(value: T): AndesComboboxOption<T> {
    return this.findOption(value) ?? { value, label: this.labelOf(value) };
  }
}
