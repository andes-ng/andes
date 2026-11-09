import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';

import { AndesStep } from './step';
import { AndesStepPanel } from './step-panel';
import { AndesStepsMore } from './steps-more';
import { hiddenRanges, isFolded } from './steps-overflow';
import {
  ANDES_STEPS,
  ANDES_STEPS_DEFAULT_LABELS,
  AndesStepIconContext,
  AndesStepStatus,
  AndesStepsClassNames,
  AndesStepsClassNamesInput,
  AndesStepsConnector,
  AndesStepsContext,
  AndesStepsLabels,
  AndesStepsOrientation,
  AndesStepsPartInfo,
  AndesStepsSize,
  AndesStepsStatusIcons,
  AndesStepsStyles,
  AndesStepsStylesInput,
  AndesStepsTitlePlacement,
  AndesStepsType,
  AndesStepsVariant,
} from './steps-types';

/** Appended to repeat an identical announcement, which a live region would otherwise skip. */
const NBSP = String.fromCharCode(160);

/**
 * A progress trail for multi-stage flows such as wizards, onboarding or order tracking.
 *
 * Compose it with `andes-step` children. Every step derives its status from `current` (earlier
 * steps are finished, the current one is in progress, later ones are upcoming) unless the step
 * sets `status` itself. With `clickable`, steps become buttons: clicking one updates `current`
 * and emits `changed`. `andes-step-panel` children show the content of the step in progress.
 *
 * @example
 * <andes-steps [(current)]="index" clickable>
 *   <andes-step title="Account" description="Create your login" />
 *   <andes-step title="Billing" />
 *   <andes-step title="Review" />
 * </andes-steps>
 */
@Component({
  selector: 'andes-steps',
  imports: [AndesStepsMore],
  templateUrl: './steps.html',
  styleUrl: './steps.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ANDES_STEPS, useExisting: forwardRef(() => AndesSteps) },
  ],
  host: {
    'data-slot': 'steps',
    '[attr.data-orientation]': 'layoutOrientation()',
    '[attr.data-type]': 'type()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-title-placement]': 'layoutTitlePlacement()',
    '[attr.data-connector]': 'connector()',
    '[attr.data-clickable]': 'clickable() ? "" : null',
    '[attr.data-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-ready]': 'ready() ? "" : null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[class]': 'rootClasses()',
    '[style]': 'rootStyles()',
    '[style.--andes-steps-offset]': 'offset()',
    '[style.--andes-steps-count]': 'count()',
  },
})
export class AndesSteps implements AndesStepsContext {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Zero-based index of the step in progress. Two-way bindable. */
  readonly current = model(0);
  /** Layout axis. Horizontal collapses to vertical in a narrow container (see `responsive`). */
  readonly orientation = input<AndesStepsOrientation>('horizontal');
  /** What the trail looks like: numbered, dots, a segmented panel, navigation or inline. */
  readonly type = input<AndesStepsType>('default');
  /** How the numbered marker is filled. */
  readonly variant = input<AndesStepsVariant>('soft');
  readonly size = input<AndesStepsSize>('default');
  /** Title beside (`horizontal`) or below (`vertical`) the marker. The `dot` type is always below. */
  readonly titlePlacement = input<AndesStepsTitlePlacement>('horizontal');
  /** How the line between two steps is drawn. */
  readonly connector = input<AndesStepsConnector>('solid');
  /** Turns every step into a button that selects it. */
  readonly clickable = input(false, { transform: booleanAttribute });
  /** Status of the current step, e.g. `error` when its validation failed. */
  readonly status = input<AndesStepStatus>('process');
  /** 0-100. Draws a progress ring around the current step's marker. */
  readonly percent = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** The number shown on the first step; the rest count up from it. `current` stays zero-based. */
  readonly initial = input(1, { transform: numberAttribute });
  /**
   * At most this many steps are drawn; the rest fold into overflow markers that list them.
   * The first, the last and the current step always stay. Values under 3 turn it off.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /**
   * Empty slots to leave before the first step of an `inline` trail, so rows with fewer steps
   * line up with longer ones in the same list.
   */
  readonly offset = input(0, { transform: numberAttribute });
  /** Icons that replace the marker of every step in a status. */
  readonly statusIcons = input<AndesStepsStatusIcons | undefined>(undefined);
  /** Draws every dot of the `dot` type from a template instead of the plain dot. */
  readonly dotTemplate = input<TemplateRef<AndesStepIconContext> | undefined>(
    undefined,
  );
  /** Extra classes per part, as an object or as a function of the trail and step state. */
  readonly classNames = input<AndesStepsClassNamesInput | undefined>(undefined);
  /** Inline styles per part, as an object or as a function of the trail and step state. */
  readonly styles = input<AndesStepsStylesInput | undefined>(undefined);
  /** Switch a horizontal trail to vertical when the container is narrower than `breakpoint` (not the compact `inline` type). */
  readonly responsive = input(true, { transform: booleanAttribute });
  /** Container width in px below which the responsive collapse applies. */
  readonly breakpoint = input(480, { transform: numberAttribute });
  /** Override the visually hidden status words and the announcement template. */
  readonly labels = input<AndesStepsLabels | undefined>(undefined);
  /** Announce the new step politely when `current` changes after the first render. */
  readonly announce = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /**
   * Asked before the user's click or Enter/Space moves to another step: return `false` (or a
   * promise of it) to stay where you are, e.g. while the current step is not valid.
   */
  readonly beforeChange = input<
    ((to: number, from: number) => boolean | Promise<boolean>) | undefined
  >(undefined);

  /** Emits the zero-based index of a step the user selected (click or Enter/Space). */
  readonly changed = output<number>();

  private readonly steps = contentChildren(AndesStep);
  private readonly panels = contentChildren(AndesStepPanel);
  private readonly narrow = signal(false);
  private readonly focused = signal<number | null>(null);
  protected readonly liveMessage = signal('');
  readonly ready = signal(false);

  readonly count = computed(() => this.steps().length);
  readonly resolvedLabels = computed(() => ({
    ...ANDES_STEPS_DEFAULT_LABELS,
    ...this.labels(),
  }));
  protected readonly collapsed = computed(
    () =>
      this.orientation() === 'horizontal' &&
      this.type() !== 'inline' &&
      this.responsive() &&
      this.narrow(),
  );
  readonly layoutOrientation = computed<AndesStepsOrientation>(() =>
    this.collapsed() ? 'vertical' : this.orientation(),
  );
  readonly layoutTitlePlacement = computed<AndesStepsTitlePlacement>(() =>
    this.type() === 'dot' ? 'vertical' : this.titlePlacement(),
  );
  readonly hiddenRanges = computed(() =>
    hiddenRanges(this.count(), this.maxCount(), this.current()),
  );

  /** Status of every step, in order; what each step shows and what the overflow lists. */
  private readonly statuses = computed<AndesStepStatus[]>(() =>
    this.steps().map((step) => step.resolvedStatus()),
  );

  /** The step that holds the single tab stop: the focused one, else the current, else the first. */
  readonly tabStop = computed(() => {
    const steps = this.steps();
    const usable = (index: number) =>
      !!steps[index]?.isInteractive() && !this.isHidden(index);
    const focused = this.focused();
    if (focused !== null && usable(focused)) {
      return focused;
    }
    const current = this.current();
    if (usable(current)) {
      return current;
    }
    return steps.findIndex((_, index) => usable(index));
  });

  protected readonly rootClasses = computed(
    () => this.classNamesFor(-1, this.status()).root ?? null,
  );
  protected readonly rootStyles = computed(
    () => this.stylesFor(-1, this.status()).root ?? null,
  );

  private lastAnnounced: number | null = null;

  constructor() {
    afterNextRender(() => {
      this.ready.set(true);
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const element = this.host.nativeElement;
      const measure = () =>
        this.narrow.set(
          element.getBoundingClientRect().width < this.breakpoint(),
        );
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    effect(() => {
      const current = this.current();
      const steps = this.steps();
      untracked(() => {
        if (this.lastAnnounced === null) {
          this.lastAnnounced = current;
          return;
        }
        if (current === this.lastAnnounced) {
          return;
        }
        this.lastAnnounced = current;
        const step = steps[current];
        if (!this.announce() || !step) {
          return;
        }
        // The same text twice in a row would not re-announce, so toggle a trailing space.
        const message = this.resolvedLabels()
          .stepOf.replace('{index}', String(current + 1))
          .replace('{count}', String(steps.length))
          .replace('{title}', step.titleText());
        this.liveMessage.update((previous) =>
          previous === message ? `${message}${NBSP}` : message,
        );
      });
    });
  }

  indexOf(step: unknown): number {
    return this.steps().indexOf(step as AndesStep);
  }

  panelIndexOf(panel: unknown): number {
    return this.panels().indexOf(panel as AndesStepPanel);
  }

  isHidden(index: number): boolean {
    return isFolded(this.hiddenRanges(), index);
  }

  titleTextAt(index: number): string {
    return this.steps()[index]?.titleText() ?? '';
  }

  titleIdAt(index: number): string | null {
    return this.steps()[index]?.titleId ?? null;
  }

  statusAt(index: number): AndesStepStatus {
    return this.statuses()[index] ?? 'wait';
  }

  /**
   * Selects a step as if the user had: asks `beforeChange` first, then updates `current` and
   * emits `changed`.
   */
  select(index: number): void {
    const from = this.current();
    if (index === from) {
      return;
    }
    const guard = this.beforeChange();
    const verdict = guard ? guard(index, from) : true;
    if (verdict instanceof Promise) {
      void verdict.then((allowed) => allowed && this.commit(index));
    } else if (verdict) {
      this.commit(index);
    }
  }

  private commit(index: number): void {
    if (index === this.current()) {
      return;
    }
    this.current.set(index);
    this.changed.emit(index);
  }

  /** Moves to the next step. Updates `current` without emitting `changed`. */
  next(): void {
    this.current.set(Math.min(this.current() + 1, this.count() - 1));
  }

  /** Moves to the previous step. Updates `current` without emitting `changed`. */
  previous(): void {
    this.current.set(Math.max(this.current() - 1, 0));
  }

  noteFocus(index: number): void {
    this.focused.set(index);
  }

  noteBlur(index: number): void {
    if (this.focused() === index) {
      this.focused.set(null);
    }
  }

  classNamesFor(
    index: number,
    stepStatus: AndesStepStatus,
  ): AndesStepsClassNames {
    const value = this.classNames();
    if (!value) {
      return NO_PARTS;
    }
    return typeof value === 'function'
      ? value(this.partInfo(index, stepStatus))
      : value;
  }

  stylesFor(index: number, stepStatus: AndesStepStatus): AndesStepsStyles {
    const value = this.styles();
    if (!value) {
      return NO_PARTS;
    }
    return typeof value === 'function'
      ? value(this.partInfo(index, stepStatus))
      : value;
  }

  private partInfo(
    index: number,
    stepStatus: AndesStepStatus,
  ): AndesStepsPartInfo {
    return {
      type: this.type(),
      variant: this.variant(),
      orientation: this.layoutOrientation(),
      size: this.size(),
      current: this.current(),
      status: this.status(),
      index,
      stepStatus,
    };
  }

  moveFocus(step: unknown, key: 'next' | 'previous' | 'first' | 'last'): void {
    const steps = this.steps();
    const enabled = steps.filter(
      (candidate, index) => candidate.isInteractive() && !this.isHidden(index),
    );
    if (enabled.length === 0) {
      return;
    }
    const position = enabled.indexOf(step as AndesStep);
    let target: AndesStep | undefined;
    switch (key) {
      case 'first':
        target = enabled[0];
        break;
      case 'last':
        target = enabled[enabled.length - 1];
        break;
      case 'next':
        target = enabled[Math.min(position + 1, enabled.length - 1)];
        break;
      case 'previous':
        target = enabled[Math.max(position - 1, 0)];
        break;
    }
    target?.focus();
  }
}

const NO_PARTS: Record<string, never> = {};

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = numberAttribute(value, NaN);
  return Number.isNaN(parsed) ? undefined : parsed;
}
