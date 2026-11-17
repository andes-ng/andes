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
import { rowWidths, staggerAttribute, staggerStep } from './skeleton-utils';

/**
 * Lines of text: the paragraph of `andes-skeleton` on its own, for the places where a full
 * skeleton is too much - a card body, a table cell, a comment. Like every element placeholder it
 * is decorative; the page's loading status belongs to whatever wraps it.
 *
 * Each line is 16px high, 16px apart (the paragraph rhythm of `andes-skeleton`). A block of 3 lines or more
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
      [style.--andes-skeleton-index]="lineIndex($index)"
      [style.--andes-skeleton-stagger]="step()"
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
  /**
   * Starts each line's animation a little after the one above it, so the lines ripple from the
   * top down. A number is the milliseconds between two lines, a bare attribute is 100.
   */
  readonly stagger = input(0, { transform: staggerAttribute });

  protected readonly step = computed(() => staggerStep(this.stagger()));

  /**
   * The step count a line starts at: `index`, plus the line's place in the block when staggered.
   * `undefined` (not null, which would wipe a value from `styles`) when it is 0.
   */
  protected lineIndex(line: number): number | undefined {
    const index = this.index() + (this.stagger() > 0 ? line : 0);

    return index > 0 ? index : undefined;
  }

  protected readonly extraProps = computed(() => ({
    lines: this.lines(),
    round: this.round(),
    stagger: this.stagger(),
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
