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

export type AndesSkeletonButtonShape =
  'default' | 'round' | 'circle' | 'square';

@Component({
  selector: 'andes-skeleton-button',
  template: `<span
    data-slot="skeleton-button"
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
export class AndesSkeletonButton extends AndesSkeletonElementBase {
  readonly size = input<AndesSkeletonSize>('md');
  /**
   * `square` is as wide as it is high (the 24/32/40px control scale), like an icon-only button.
   * Ant Design draws its `square` the same size as `default` (twice as wide as high); the
   * placeholder here stands in for AndesButton, whose square is square.
   */
  readonly shape = input<AndesSkeletonButtonShape>('default');
  /** Stretches the placeholder to its parent's width, like a full-width button. */
  readonly block = input(false, { transform: booleanAttribute });
  /**
   * A custom width (numbers are pixels) for a placeholder that stands in for a control wider or
   * narrower than the default. Ignored while `block` is set - the full-width stretch wins.
   */
  readonly width = input<string | number | undefined>(undefined);

  protected readonly extraProps = computed(() => ({
    size: this.size(),
    shape: this.shape(),
    block: this.block(),
  }));

  protected readonly widthStyle = computed(() =>
    this.block() ? undefined : toCssSize(this.width()),
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-skeleton-element',
      'andes-skeleton-button',
      'andes-skeleton-fill',
      `andes-skeleton-element--${this.size()}`,
      this.shape() !== 'default' && `andes-skeleton-button--${this.shape()}`,
      this.block() && 'andes-skeleton-element--block',
      this.animationClass(),
      this.contentClass(),
    ),
  );
}
