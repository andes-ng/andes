import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import clsx from 'clsx';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideImage } from '@ng-icons/lucide';

import { AndesSkeletonElementBase } from './skeleton-element-base';
import { toCssSize } from './skeleton-utils';

@Component({
  selector: 'andes-skeleton-image',
  viewProviders: [provideIcons({ lucideImage })],
  imports: [NgIcon],
  template: `<span
    data-slot="skeleton-image"
    [class]="classes()"
    [style]="contentStyle()"
    [style.width]="widthStyle()"
    [style.height]="heightStyle()"
  >
    <!-- The picture mark of the image placeholder: lucide's image glyph. -->
    <ng-icon class="andes-skeleton-image__icon" name="lucideImage" />
  </span>`,
  styleUrls: ['./skeleton-fill.css', './skeleton-element.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'true',
  },
})
export class AndesSkeletonImage extends AndesSkeletonElementBase {
  /** Numbers are pixels. Defaults to a 6rem square. */
  readonly width = input<string | number | undefined>(undefined);
  readonly height = input<string | number | undefined>(undefined);

  protected readonly extraProps = computed(() => ({}));

  protected readonly widthStyle = computed(() => toCssSize(this.width()));
  protected readonly heightStyle = computed(() => toCssSize(this.height()));

  protected readonly classes = computed(() =>
    clsx(
      'andes-skeleton-element',
      'andes-skeleton-image',
      'andes-skeleton-fill',
      this.animationClass(),
      this.contentClass(),
    ),
  );
}
