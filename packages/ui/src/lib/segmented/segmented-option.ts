import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  TemplateRef,
} from '@angular/core';

import { ANDES_SEGMENTED } from './segmented-types';

let nextOptionId = 0;

/**
 * One choice of an `AndesSegmented`. Projected children are the label; an icon goes in a
 * `[slot=icon]` element or the `icon` template input.
 *
 * ```html
 * <andes-segmented-option value="map"><svg slot="icon" ... /> Map</andes-segmented-option>
 * ```
 *
 * `description` adds a muted second line, linked to the radio with `aria-describedby`; when any
 * option of the group has one, every segment grows to fit it.
 *
 * The rendered `<button role="radio">` is the only focusable part. The host itself is
 * presentational (`role="none"`) so the radiogroup owns its radios directly.
 */
@Component({
  selector: 'andes-segmented-option',
  imports: [NgTemplateOutlet],
  templateUrl: './segmented-option.html',
  styleUrl: './segmented-option.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'none',
    'data-slot': 'segmented-option',
    '[attr.data-state]': "checked() ? 'checked' : 'unchecked'",
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-size]': 'group.resolvedSize()',
    '[attr.data-readonly]': "group.readOnly() ? '' : null",
    '[attr.data-described]': "group.hasDescription() ? '' : null",
  },
})
export class AndesSegmentedOption<T = unknown> {
  protected readonly group = inject(ANDES_SEGMENTED);
  protected readonly descriptionId = `andes-segmented-option-${++nextOptionId}-description`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The option's value. Required; typed optional only because a group can read an option
   *  before Angular has bound its inputs. */
  readonly value = input<T | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Rendered before the label (an alternative to a projected `[slot=icon]`). */
  readonly icon = input<TemplateRef<unknown> | undefined>(undefined);
  /** Optional second line under the label (muted, and linked with `aria-describedby`). */
  readonly description = input<string | undefined>(undefined);
  /** Native tooltip (`title`). */
  readonly tooltip = input<string | undefined>(undefined);
  /** Accessible name; required for an icon-only option. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });

  readonly checked = computed(() => this.group.isChecked(this.value()));
  readonly isDisabled = computed(
    () => this.disabled() || this.group.isDisabled(),
  );
  protected readonly tabIndex = computed(() =>
    this.group.tabbable() === this ? 0 : -1,
  );

  /** The element that takes focus. */
  get button(): HTMLButtonElement {
    return this.host.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  /** The host element, used to place the sliding thumb. */
  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.button?.focus(options);
  }

  protected onClick(event: Event): void {
    if (!this.isDisabled()) {
      this.group.select(this.value(), event);
    }
  }
}
