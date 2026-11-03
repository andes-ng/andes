import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import clsx from 'clsx';

import { AndesSkeletonElementBase } from './skeleton-element-base';
import { rowWidths } from './skeleton-utils';

/**
 * Lines of text: the paragraph of `andes-skeleton` on its own, for the places where a full
 * skeleton is too much - a card body, a table cell, a comment. Like every element placeholder it
 * is decorative; the page's loading status belongs to whatever wraps it.
 *
 * Each line is 16px high, 16px apart (Ant Design's paragraph rhythm). A block of 3 lines or more
 * ends on a shorter line, like the composite's paragraph.
 */
@Component({
  selector: 'andes-skeleton-text',
  template: `@for (width of rows(); track $index) {
    <span
      data-slot="skeleton-text-line"
      [class]="lineClass()"
      [style]="contentStyle()"
      [style.width]="width"
    ></span>
  }`,
  styleUrls: ['./skeleton-fill.css', './skeleton-text.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'true',
    '[class.andes-skeleton-text--round]': 'round()',
  },
})
export class AndesSkeletonText extends AndesSkeletonElementBase {
  /** How many lines. */
  readonly lines = input(1, {
    transform: (value: unknown) => numberAttribute(value, 1),
  });
  /**
   * Line widths (numbers are pixels): an array sets each line in order, a single value sets only
   * the LAST line.
   */
  readonly width = input<string | number | (string | number)[] | undefined>(
    undefined,
  );
  /** Fully rounded lines. */
  readonly round = input(false, { transform: booleanAttribute });

  protected readonly extraProps = computed(() => ({
    lines: this.lines(),
    round: this.round(),
  }));

  protected readonly rows = computed(() =>
    rowWidths(this.lines(), this.width()),
  );

  protected readonly lineClass = computed(() =>
    clsx(
      'andes-skeleton-text__line',
      'andes-skeleton-fill',
      this.animationClass(),
      this.contentClass(),
    ),
  );
}
