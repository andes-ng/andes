import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  numberAttribute,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideTriangleAlert, lucideX } from '@ng-icons/lucide';

import {
  ANDES_STEPS,
  AndesStepContent,
  AndesStepIcon,
  AndesStepIconContext,
  AndesStepsIndicator,
  AndesStepStatus,
} from './steps-types';

let nextStepId = 0;

/** What the marker shows. */
type StepMarker =
  | 'template'
  | 'icon'
  | 'number'
  | 'check'
  | 'cross'
  | 'warning'
  | 'ring'
  | 'spinner'
  | 'dot'
  | 'dot-template'
  | 'none';

/**
 * One stage of an `andes-steps` trail. The status comes from the parent's `current` unless
 * `status` is set. Anything projected into the step renders below its description.
 */
@Component({
  selector: 'andes-step',
  viewProviders: [provideIcons({ lucideCheck, lucideTriangleAlert, lucideX })],
  imports: [NgIcon, NgTemplateOutlet],
  templateUrl: './step.html',
  styleUrls: ['./step.css', './step-chevron.css', './step-segments.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    'data-slot': 'step',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-orientation]': 'parent.layoutOrientation()',
    '[attr.data-type]': 'parent.type()',
    '[attr.data-variant]': 'parent.variant()',
    '[attr.data-size]': 'parent.size()',
    '[attr.data-density]': 'parent.density()',
    '[attr.data-compact]': 'parent.compact()',
    '[attr.aria-busy]': 'resolvedStatus() === "loading" ? "true" : null',
    '[attr.data-title-placement]': 'parent.layoutTitlePlacement()',
    '[attr.data-connector]': 'parent.connector()',
    '[attr.data-ready]': 'parent.ready() ? "" : null',
    '[attr.data-folded]': 'folded() ? "" : null',
    '[attr.data-optional]': 'optional() !== false ? "" : null',
    '[attr.data-clickable]': 'asButton() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-current]': 'isCurrent() ? "" : null',
    '[attr.data-first]': 'index() === 0 ? "" : null',
    '[attr.data-last]': 'isLast() ? "" : null',
    '[attr.aria-current]': 'isCurrent() ? "step" : null',
    // A static `title="..."` would otherwise stay on the host and show a native tooltip that
    // repeats the visible title.
    '[attr.title]': 'null',
    '[class]': 'classes().item',
    '[style]': 'styles().item',
    '[style.order]': 'order()',
    '[style.--_percent]': 'panelPercent()',
  },
})
export class AndesStep {
  protected readonly parent = inject(ANDES_STEPS);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly title = input<AndesStepContent | undefined>(undefined);
  /** Secondary text beside the title. */
  readonly subtitle = input<AndesStepContent | undefined>(undefined);
  readonly description = input<AndesStepContent | undefined>(undefined);
  /** Trailing content at the end of the title row: a duration, a badge, an action. */
  readonly endContent = input<AndesStepContent | undefined>(undefined);
  /** Overrides the trail's `indicator` for this step. */
  readonly indicator = input<AndesStepsIndicator | undefined>(undefined);
  /**
   * Replaces the numbered marker: a lucide icon name (registered with `provideIcons`) or a
   * template. Ignored by the `dot`, `navigation` and `inline` types.
   */
  readonly icon = input<AndesStepIcon | undefined>(undefined);
  /**
   * Marks the step as skippable and shows "Optional" after its title. A string replaces the
   * word.
   */
  readonly optional = input<boolean | string, unknown>(false, {
    transform: (value: unknown) =>
      typeof value === 'string' && value !== ''
        ? value
        : booleanAttribute(value),
  });
  /** Overrides the status derived from the parent's `current`. */
  readonly status = input<AndesStepStatus | undefined>(undefined);
  /** A disabled step cannot be selected even when the trail is `clickable`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** 0-100 ring around this step's marker; defaults to the trail's `percent` for the current step. */
  readonly percent = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      const parsed = numberAttribute(value, NaN);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
  });

  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly titleElement =
    viewChild<ElementRef<HTMLElement>>('titleText');

  private readonly uid = `andes-step-${nextStepId++}`;
  protected readonly descriptionId = `${this.uid}-description`;
  readonly titleId = `${this.uid}-title`;

  readonly index = computed(() => this.parent.indexOf(this));
  readonly isCurrent = computed(() => this.index() === this.parent.current());
  protected readonly isLast = computed(
    () => this.index() === this.parent.count() - 1,
  );

  readonly resolvedStatus = computed<AndesStepStatus>(() => {
    const explicit = this.status();
    if (explicit) {
      return explicit;
    }
    const index = this.index();
    const current = this.parent.current();
    if (index < current) {
      return 'finish';
    }
    return index === current ? this.parent.status() : 'wait';
  });

  /**
   * Whether the step is drawn as a button. A collapsed `segments` trail moves navigation to
   * its summary row, so its bars are plain.
   */
  protected readonly asButton = computed(
    () => this.parent.clickable() && this.parent.compact() === null,
  );

  /** Whether the step is rendered as a button the user can activate. */
  readonly isInteractive = computed(() => this.asButton() && !this.disabled());

  /** The tail is the bar of a `segments` step, so the last step draws one too. */
  protected readonly showTail = computed(
    () => !this.isLast() || this.parent.type() === 'segments',
  );

  protected readonly titleTemplate = computed(() => asTemplate(this.title()));
  protected readonly titleString = computed(() => asText(this.title()));
  protected readonly subtitleTemplate = computed(() =>
    asTemplate(this.subtitle()),
  );
  protected readonly subtitleString = computed(() => asText(this.subtitle()));
  protected readonly descriptionTemplate = computed(() =>
    asTemplate(this.description()),
  );
  protected readonly descriptionString = computed(() =>
    asText(this.description()),
  );
  protected readonly endTemplate = computed(() =>
    asTemplate(this.endContent()),
  );
  protected readonly endString = computed(() => asText(this.endContent()));

  protected readonly statusLabel = computed(
    () => this.parent.resolvedLabels()[this.resolvedStatus()],
  );

  protected readonly folded = computed(() =>
    this.parent.isHidden(this.index()),
  );

  /** Flex order, only when `maxCount` folds steps, so the overflow marker can sit between them. */
  protected readonly order = computed(() =>
    this.parent.hiddenRanges().length > 0 ? this.index() * 2 : null,
  );

  protected readonly classes = computed(() =>
    this.parent.classNamesFor(this.index(), this.resolvedStatus()),
  );
  protected readonly styles = computed(() =>
    this.parent.stylesFor(this.index(), this.resolvedStatus()),
  );

  protected readonly tabindex = computed(() =>
    this.parent.tabStop() === this.index() ? 0 : -1,
  );

  /** The number the marker shows: the trail's `initial` plus the position. */
  protected readonly displayNumber = computed(
    () => this.parent.initial() + this.index(),
  );

  protected readonly optionalLabel = computed(() => {
    const value = this.optional();
    if (value === false) {
      return '';
    }
    return typeof value === 'string'
      ? value
      : this.parent.resolvedLabels().optional;
  });

  /** The icon that replaces the marker: the step's own, else the trail's for this status. */
  private readonly resolvedIcon = computed<AndesStepIcon | null>(
    () =>
      this.icon() ?? this.parent.statusIcons()?.[this.resolvedStatus()] ?? null,
  );
  protected readonly iconName = computed(() => {
    const icon = this.resolvedIcon();
    return typeof icon === 'string' ? icon : null;
  });
  protected readonly iconTemplate = computed(() => {
    const icon = this.resolvedIcon();
    return icon instanceof TemplateRef ? icon : null;
  });

  private readonly indicatorMode = computed<AndesStepsIndicator>(
    () => this.indicator() ?? this.parent.indicator(),
  );

  /** The panel draws a marker only for an icon; the numbers and checks are left to the colours. */
  protected readonly showMarker = computed(() => {
    const type = this.parent.type();
    if (type === 'panel') {
      return this.resolvedIcon() !== null;
    }
    if (type === 'default' || type === 'segments') {
      return this.indicatorMode() !== 'none';
    }
    return type === 'dot';
  });

  protected readonly marker = computed<StepMarker>(() => {
    const type = this.parent.type();
    if (type === 'dot') {
      return this.parent.dotTemplate() ? 'dot-template' : 'dot';
    }
    if (type !== 'default' && type !== 'panel' && type !== 'segments') {
      return 'none';
    }
    if (this.iconName()) {
      return 'icon';
    }
    if (this.iconTemplate()) {
      return 'template';
    }
    const status = this.resolvedStatus();
    if (status === 'loading') {
      return 'spinner';
    }
    if (this.indicatorMode() === 'number') {
      return 'number';
    }
    switch (status) {
      case 'finish':
        return 'check';
      case 'error':
        return 'cross';
      case 'warning':
        return 'warning';
      case 'process':
        return type === 'segments' ? 'ring' : 'number';
      default:
        return 'number';
    }
  });

  protected readonly iconContext = computed<AndesStepIconContext>(() => ({
    $implicit: this.resolvedStatus(),
    status: this.resolvedStatus(),
    index: this.index(),
    current: this.isCurrent(),
  }));

  /** The progress of an in-progress step, 0-100, from the step or (for the current one) the trail. */
  protected readonly percentValue = computed<number | null>(() => {
    const type = this.parent.type();
    if (
      (type !== 'default' && type !== 'panel' && type !== 'segments') ||
      this.resolvedStatus() !== 'process'
    ) {
      return null;
    }
    const value =
      this.percent() ?? (this.isCurrent() ? this.parent.percent() : undefined);
    return value === undefined ? null : Math.min(100, Math.max(0, value));
  });

  /** Ring progress, drawn around the marker of the numbered types. */
  protected readonly ringPercent = computed<number | null>(() =>
    this.parent.type() === 'segments' ? null : this.percentValue(),
  );

  /** How far the bar or segment of the `panel` and `segments` types is filled. */
  protected readonly panelPercent = computed(() => {
    const type = this.parent.type();
    const value = this.percentValue();
    return (type === 'panel' || type === 'segments') && value !== null
      ? `${value}%`
      : null;
  });

  /** Plain-text title, for announcements and tests. */
  titleText(): string {
    const text = this.titleString();
    if (text) {
      return text;
    }
    return this.titleElement()?.nativeElement.textContent?.trim() ?? '';
  }

  /** Plain-text description, for the collapsed summary and tests. */
  descriptionText(): string {
    return this.descriptionString();
  }

  focus(): void {
    this.trigger()?.nativeElement.focus();
  }

  protected onFocus(): void {
    this.parent.noteFocus(this.index());
  }

  protected onBlur(): void {
    this.parent.noteBlur(this.index());
  }

  protected activate(): void {
    if (this.isInteractive()) {
      this.parent.select(this.index());
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const rtl =
      getComputedStyle(this.elementRef.nativeElement).direction === 'rtl';
    let move: 'next' | 'previous' | 'first' | 'last' | null = null;
    switch (event.key) {
      case 'ArrowDown':
        move = 'next';
        break;
      case 'ArrowUp':
        move = 'previous';
        break;
      case 'ArrowRight':
        move = rtl ? 'previous' : 'next';
        break;
      case 'ArrowLeft':
        move = rtl ? 'next' : 'previous';
        break;
      case 'Home':
        move = 'first';
        break;
      case 'End':
        move = 'last';
        break;
    }
    if (move) {
      event.preventDefault();
      this.parent.moveFocus(this, move);
    }
  }
}

function asTemplate(
  content: AndesStepContent | undefined,
): TemplateRef<unknown> | null {
  return content instanceof TemplateRef ? content : null;
}

function asText(content: AndesStepContent | undefined): string {
  return typeof content === 'string' ? content : '';
}
