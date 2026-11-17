import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import clsx from 'clsx';

import { AndesSkeletonElementBase } from './skeleton-element-base';
import { AndesSkeletonSize, toCssSize } from './skeleton-utils';

@Component({
  selector: 'andes-skeleton-input',
  template: `<span
    data-slot="skeleton-input"
    [class]="classes()"
    [style]="contentStyle()"
    [style.width]="widthStyle()"
    [style.min-width]="widthStyle()"
  ></span>`,
  styleUrls: ['./skeleton-fill.css', './skeleton-element.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'true',
    '[class.andes-skeleton-element--block]': 'block()',
  },
})
export class AndesSkeletonInput extends AndesSkeletonElementBase {
  readonly size = input<AndesSkeletonSize>('md');
  /** Stretches the placeholder to its parent's width. */
  readonly block = input(false, { transform: booleanAttribute });
  /**
   * A custom width (numbers are pixels) for a placeholder that stands in for a control wider or
   * narrower than the default. Ignored while `block` is set - the full-width stretch wins.
   */
  readonly width = input<string | number | undefined>(undefined);

  protected readonly extraProps = computed(() => ({
    size: this.size(),
    block: this.block(),
  }));

  protected readonly widthStyle = computed(() =>
    this.block() ? undefined : toCssSize(this.width()),
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-skeleton-element',
      'andes-skeleton-input',
      'andes-skeleton-fill',
      `andes-skeleton-element--${this.size()}`,
      this.block() && 'andes-skeleton-element--block',
      this.animationClass(),
      this.contentClass(),
    ),
  );
}
