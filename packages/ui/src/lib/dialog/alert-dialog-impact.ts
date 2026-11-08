import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
  signal,
} from '@angular/core';

import { AndesButton } from '../button/button';

let nextImpactId = 0;

/** One line of an impact summary: what is affected, and how many of it. */
export interface AndesAlertDialogImpactItem {
  /** What is affected ("Files", "Team members"). */
  readonly label: string;
  /** How many of it; shown at the end of the row. */
  readonly count?: number;
  /** A secondary line under the label. */
  readonly detail?: string;
}

/**
 * A list of what the action will touch ("3 files, 2 folders"), so the user confirms a
 * concrete scope rather than a vague warning. Past `maxVisible` rows the rest collapse
 * behind a "Show more" control.
 *
 * ```html
 * <andes-alert-dialog-impact
 *   heading="This will permanently delete:"
 *   [items]="[{ label: 'Files', count: 128 }, { label: 'Deployments', count: 12 }]"
 * />
 * ```
 */
@Component({
  selector: 'andes-alert-dialog-impact',
  imports: [AndesButton],
  templateUrl: './alert-dialog-impact.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__impact',
    '[attr.data-slot]': '"alert-dialog-impact"',
  },
})
export class AndesAlertDialogImpact {
  /** What the action affects. */
  readonly items = input.required<readonly AndesAlertDialogImpactItem[]>();
  /** A line introducing the list. */
  readonly heading = input<string | null>(null);
  /** Rows shown before the rest collapse. */
  readonly maxVisible = input(4, { transform: numberAttribute });
  /** Start with every row visible. */
  readonly expanded = input(false, { transform: booleanAttribute });
  /** Label of the control that reveals the hidden rows. `{count}` is how many. */
  readonly showMoreLabel = input('Show {count} more');
  /** Label of the control that collapses them again. */
  readonly showLessLabel = input('Show less');

  protected readonly headingId = `andes-alert-dialog-impact-${nextImpactId++}`;
  private readonly toggled = signal<boolean | null>(null);

  protected readonly isExpanded = computed(
    () => this.toggled() ?? this.expanded(),
  );

  protected readonly collapsible = computed(
    () => this.items().length > this.maxVisible(),
  );

  protected readonly visible = computed(() =>
    this.collapsible() && !this.isExpanded()
      ? this.items().slice(0, this.maxVisible())
      : this.items(),
  );

  protected readonly toggleLabel = computed(() =>
    this.isExpanded()
      ? this.showLessLabel()
      : this.showMoreLabel().replace(
          '{count}',
          String(this.items().length - this.maxVisible()),
        ),
  );

  protected toggle(): void {
    this.toggled.set(!this.isExpanded());
  }
}
