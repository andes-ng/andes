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
import { lucideCheck, lucideX } from '@ng-icons/lucide';

import {
  ANDES_STEPS,
  AndesStepContent,
  AndesStepIcon,
  AndesStepIconContext,
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
  | 'dot'
  | 'dot-template'
  | 'none';

/**
 * One stage of an `andes-steps` trail. The status comes from the parent's `current` unless
 * `status` is set. Anything projected into the step renders below its description.
 */
@Component({
  selector: 'andes-step',
  viewProviders: [provideIcons({ lucideCheck, lucideX })],
  imports: [NgIcon, NgTemplateOutlet],
  templateUrl: './step.html',
  styleUrls: ['./step.css', './step-chevron.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    'data-slot': 'step',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-orientation]': 'parent.layoutOrientation()',
    '[attr.data-type]': 'parent.type()',
    '[attr.data-variant]': 'parent.variant()',
    '[attr.data-size]': 'parent.size()',
    '[attr.data-title-placement]': 'parent.layoutTitlePlacement()',
    '[attr.data-connector]': 'parent.connector()',
    '[attr.data-ready]': 'parent.ready() ? "" : null',
    '[attr.data-folded]': 'folded() ? "" : null',
    '[attr.data-optional]': 'optional() !== false ? "" : null',
    '[attr.data-clickable]': 'parent.clickable() ? "" : null',
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

  /** Whether the step is rendered as a button the user can activate. */
  readonly isInteractive = computed(
    () => this.parent.clickable() && !this.disabled(),
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

  /** The panel draws a marker only for an icon; the numbers and checks are left to the colours. */
  protected readonly showMarker = computed(() => {
    const type = this.parent.type();
    if (type === 'panel') {
      return this.resolvedIcon() !== null;
    }
    return type === 'default' || type === 'dot';
  });

  protected readonly marker = computed<StepMarker>(() => {
    const type = this.parent.type();
    if (type === 'dot') {
      return this.parent.dotTemplate() ? 'dot-template' : 'dot';
    }
    if (type !== 'default' && type !== 'panel') {
      return 'none';
    }
    if (this.iconName()) {
      return 'icon';
    }
    if (this.iconTemplate()) {
      return 'template';
    }
    switch (this.resolvedStatus()) {
      case 'finish':
        return 'check';
      case 'error':
        return 'cross';
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

  /** Ring progress, only on an in-progress step of the numbered variant. */
  protected readonly ringPercent = computed<number | null>(() => {
    const type = this.parent.type();
    if (
      (type !== 'default' && type !== 'panel') ||
      this.resolvedStatus() !== 'process'
    ) {
      return null;
    }
    const value =
      this.percent() ?? (this.isCurrent() ? this.parent.percent() : undefined);
    return value === undefined ? null : Math.min(100, Math.max(0, value));
  });

  /** How far the segment of the panel type is filled, as a CSS percentage. */
  protected readonly panelPercent = computed(() => {
    const value = this.ringPercent();
    return this.parent.type() === 'panel' && value !== null
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
