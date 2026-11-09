import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideEllipsis, lucideX } from '@ng-icons/lucide';

import { AndesPopover } from '../popover/popover';
import { AndesPopoverTrigger } from '../popover/popover-trigger';
import { ANDES_STEPS, AndesStepStatus } from './steps-types';

/**
 * The marker `maxCount` puts in place of a run of folded steps. It opens a list of the steps it
 * stands for; in a clickable trail each entry selects its step. Created by `andes-steps`.
 */
@Component({
  selector: 'andes-steps-more',
  viewProviders: [provideIcons({ lucideCheck, lucideEllipsis, lucideX })],
  imports: [AndesPopover, AndesPopoverTrigger, NgIcon],
  templateUrl: './steps-more.html',
  styleUrls: ['./step.css', './step-chevron.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    'data-slot': 'steps-more',
    '[attr.data-status]': 'status()',
    '[attr.data-orientation]': 'parent.layoutOrientation()',
    '[attr.data-type]': 'parent.type()',
    '[attr.data-variant]': 'parent.variant()',
    '[attr.data-size]': 'parent.size()',
    '[attr.data-title-placement]': 'parent.layoutTitlePlacement()',
    '[attr.data-connector]': 'parent.connector()',
    '[attr.data-ready]': 'parent.ready() ? "" : null',
    '[style.order]': 'start() * 2',
  },
})
export class AndesStepsMore {
  protected readonly parent = inject(ANDES_STEPS);

  /** Zero-based index of the first folded step. */
  readonly start = input.required<number>();
  /** Zero-based index of the last folded step, inclusive. */
  readonly end = input.required<number>();

  protected readonly entries = computed(() => {
    const items: { index: number; title: string; status: AndesStepStatus }[] =
      [];
    for (let index = this.start(); index <= this.end(); index++) {
      items.push({
        index,
        title: this.parent.titleTextAt(index),
        status: this.parent.statusAt(index),
      });
    }
    return items;
  });

  /** The folded run reads as finished once the current step is past it, upcoming otherwise. */
  protected readonly status = computed<AndesStepStatus>(() =>
    this.end() < this.parent.current() ? 'finish' : 'wait',
  );

  protected readonly label = computed(() =>
    this.parent
      .resolvedLabels()
      .more.replace('{count}', String(this.end() - this.start() + 1)),
  );

  protected statusLabel(status: AndesStepStatus): string {
    return this.parent.resolvedLabels()[status];
  }

  protected pick(index: number, close: () => void): void {
    close();
    if (this.parent.clickable()) {
      this.parent.select(index);
    }
  }
}
