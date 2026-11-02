import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  TemplateRef,
} from '@angular/core';

import { AndesTag } from './tag';
import {
  AndesCheckableTagGroupClassNames,
  AndesCheckableTagGroupSemantic,
  AndesCheckableTagGroupStyles,
  AndesStyleMap,
  resolveSemantic,
  toStyleMap,
} from './tag-semantic';

export type AndesCheckableTagValue = string | number;

export interface AndesCheckableTagOption {
  readonly value: AndesCheckableTagValue;
  readonly label: string;
  readonly disabled?: boolean;
  /** Leading icon, passed through to the tag's `icon` input. */
  readonly icon?: TemplateRef<unknown>;
  /** Extra class(es) for this option's `andes-tag` host - a per-option styling hook. */
  readonly className?: string;
  /** Inline styles for this option's tag (the visible element); numbers get `px`. */
  readonly style?: AndesStyleMap;
}

/**
 * Single selection holds one value (or `null`); `multiple` holds an array.
 */
export type AndesCheckableTagGroupValue =
  AndesCheckableTagValue | readonly AndesCheckableTagValue[] | null;

/**
 * A group of checkable tags: renders one checkable `andes-tag` per option and manages the
 * selection as a single `[(value)]`. Each tag stays a native toggle `<button aria-pressed>`
 * (Tab moves between them, Enter/Space toggles), grouped under `role="group"` - name it with
 * `aria-label`.
 *
 * Single mode deliberately does not behave like a radio group: clicking the selected tag
 * clears the selection back to `null`, so it can be emptied without a separate reset control.
 */
@Component({
  selector: 'andes-checkable-tag-group',
  imports: [AndesTag],
  templateUrl: './checkable-tag-group.html',
  styleUrl: './checkable-tag-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[class]': 'semanticClasses().root ?? ""',
    '[style]': 'rootStyle()',
  },
})
export class AndesCheckableTagGroup {
  /** Options as `{ value, label, disabled? }` objects, or bare values used as their own label. */
  readonly options = input<
    readonly (AndesCheckableTagOption | AndesCheckableTagValue)[]
  >([]);
  /** Allow several tags to be checked at once; `value` is then an array. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Disables every tag in the group. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<AndesCheckableTagGroupValue>(null);
  /** Classes for the group (`root`) and for each option's tag (`item`), as an object or a function. */
  readonly classNames =
    input<AndesCheckableTagGroupSemantic<AndesCheckableTagGroupClassNames>>();
  /** Inline styles for the same parts as `classNames`; numbers get `px`. */
  readonly styles =
    input<AndesCheckableTagGroupSemantic<AndesCheckableTagGroupStyles>>();

  private readonly semanticInfo = computed(() => ({
    props: { multiple: this.multiple(), disabled: this.disabled() },
  }));

  protected readonly semanticClasses = computed(
    () => resolveSemantic(this.classNames(), this.semanticInfo()) ?? {},
  );

  private readonly semanticStyles = computed(
    () => resolveSemantic(this.styles(), this.semanticInfo()) ?? {},
  );

  protected readonly rootStyle = computed(() =>
    toStyleMap(this.semanticStyles().root),
  );

  protected readonly normalizedOptions = computed(() =>
    this.options().map((option): AndesCheckableTagOption =>
      typeof option === 'object'
        ? option
        : { value: option, label: String(option) },
    ),
  );

  /** The tag-level classes shared by every option (`item`). */
  protected readonly itemClassNames = computed(() => ({
    root: this.semanticClasses().item,
  }));

  /** Each option with the styles of its tag, merged from `item` and the option's own `style`. */
  protected readonly items = computed(() =>
    this.normalizedOptions().map((option) => ({
      option,
      styles: { root: { ...this.semanticStyles().item, ...option.style } },
    })),
  );

  private readonly selected = computed(() => {
    const value = this.value();
    if (value === null || value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value as AndesCheckableTagValue];
  });

  protected isSelected(value: AndesCheckableTagValue): boolean {
    return this.selected().includes(value);
  }

  protected toggle(value: AndesCheckableTagValue, checked: boolean): void {
    if (this.multiple()) {
      const rest = this.selected().filter((v) => v !== value);
      // Keep the options' own order rather than click order, so the array is stable.
      const next = checked ? [...rest, value] : rest;
      const order = this.normalizedOptions().map((o) => o.value);
      this.value.set(
        [...next].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
      );
    } else {
      this.value.set(checked ? value : null);
    }
  }
}
