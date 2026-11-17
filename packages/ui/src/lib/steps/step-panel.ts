import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

import { ANDES_STEPS } from './steps-types';

/**
 * The content that belongs to one step of an `andes-steps` trail, shown while that step is the
 * current one. Put one per step inside the trail, in the same order as the steps (or pick the
 * step with `step`). A hidden panel stays in the DOM, so a form inside it keeps its state.
 */
@Component({
  selector: 'andes-step-panel',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'data-slot': 'step-panel',
    '[attr.hidden]': 'active() ? null : ""',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
  styles: `
    :host {
      display: block;
    }

    /* Wins over a display set by the page, so a hidden panel is never drawn. */
    :host([hidden]) {
      display: none !important;
    }
  `,
})
export class AndesStepPanel {
  private readonly parent = inject(ANDES_STEPS);

  /** Zero-based step this panel belongs to. Defaults to the panel's own position. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === ''
        ? undefined
        : numberAttribute(value),
  });

  readonly position = computed(
    () => this.step() ?? this.parent.panelIndexOf(this),
  );
  readonly active = computed(() => this.position() === this.parent.current());
  protected readonly labelledBy = computed(() =>
    this.parent.titleIdAt(this.position()),
  );
}
