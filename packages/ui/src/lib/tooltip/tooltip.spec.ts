import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import { Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { By } from '@angular/platform-browser';

import { AndesButton } from '../button/button';
import {
  ANDES_TOOLTIP_HANDOFF_DURATION,
  ANDES_TOOLTIP_HUE_COLORS,
  AndesTooltip,
  type AndesTooltipOpenChange,
  type AndesTooltipVariant,
} from './tooltip';
import { provideAndesTooltipConfig } from './tooltip-config';
import { AndesTooltipContent } from './tooltip-content';
import { AndesTooltipGroup } from './tooltip-group';
import {
  ANDES_TOOLTIP_HOVERABLE_GRACE,
  ANDES_TOOLTIP_LONG_PRESS_DELAY,
  ANDES_TOOLTIP_TOUCH_HIDE_DELAY,
  type AndesTooltipTriggerAction,
} from './tooltip-hover-intent';
import {
  ANDES_TOOLTIP_ARROW_HEIGHT,
  ANDES_TOOLTIP_ARROW_INSET,
  ANDES_TOOLTIP_ARROW_INSET_VERTICAL,
  ANDES_TOOLTIP_ARROW_THICKNESS,
  ANDES_TOOLTIP_ARROW_WIDTH,
  ANDES_TOOLTIP_PLACEMENTS,
  andesTooltipArrowAttribute,
  andesTooltipArrowOffset,
  andesTooltipPlacementToSideAlign,
  andesTooltipPointAtCenterOffset,
  andesTooltipResolveSide,
  type AndesTooltipArrowInput,
  type AndesTooltipPlacement,
} from './tooltip-placement';
import { AndesTooltipProvider } from './tooltip-provider';
import {
  andesTooltipStyleObject,
  type AndesTooltipClassNamesInput,
  type AndesTooltipStylesInput,
} from './tooltip-semantic';
import { AndesTooltipTrigger } from './tooltip-trigger';
import { declaredValue, toPx } from '../../testing/computed-style';
import { atRule } from '../../testing/at-rule';

const TOOLTIP_CSS = 'packages/ui/src/lib/tooltip/tooltip.css';

/**
 * jsdom reports zero geometry for every element, which makes CDK's flexible
 * positioning strategy (and its viewport-collision math) unhappy. Real
 * pixels are not the point of these tests, so a nominal, non-zero size is
 * enough to let the overlay attach and position without throwing - the same
 * approach `overlay-primitive.spec.ts` uses.
 */
function withElementGeometry() {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );

  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });

  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger, AndesTooltipContent],
  template: `
    <andes-tooltip
      [content]="content()"
      [disabled]="disabled()"
      [openDelay]="openDelay()"
      [closeDelay]="closeDelay()"
      [instantReopenWindow]="instantReopenWindow()"
    >
      <button type="button" id="trigger" andesTooltipTrigger>Hover me</button>
      @if (useRichContent()) {
        <ng-template andesTooltipContent
          ><strong id="rich">Rich hint</strong></ng-template
        >
      }
    </andes-tooltip>
  `,
})
class HostComponent {
  readonly content = signal('Helpful hint');
  readonly disabled = signal(false);
  readonly openDelay = signal(600);
  readonly closeDelay = signal(0);
  readonly instantReopenWindow = signal(400);
  readonly useRichContent = signal(false);
}

describe('AndesTooltip', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '#trigger',
    ) as HTMLButtonElement;
    const panel = () =>
      document.querySelector('.andes-tooltip') as HTMLElement | null;
    return { fixture, trigger, panel };
  }

  function hover(trigger: HTMLElement) {
    trigger.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
  }

  /** Leaves the trigger and waits out the hoverable grace. */
  function unhover(trigger: HTMLElement) {
    trigger.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE);
  }

  function touchHover(trigger: HTMLElement) {
    trigger.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'touch' }),
    );
  }

  function pressEscape() {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render the tooltip panel until triggered', () => {
    const { panel } = createHost();

    expect(panel()).toBeNull();
  });

  it('opens after the hover delay elapses', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    fixture.detectChanges();
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(599);
    fixture.detectChanges();
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(panel()?.textContent?.trim()).toBe('Helpful hint');
  });

  describe('sizes (Ant Design, measured on its live Tooltip page)', () => {
    function openContainer() {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();
      hover(trigger);
      vi.advanceTimersByTime(600);
      fixture.detectChanges();
      const container = panel()?.querySelector(
        '.andes-tooltip__container',
      ) as HTMLElement;
      return { root: panel() as HTMLElement, container };
    }

    // A `var()` longhand reads back as authored, so `toPx` takes its fallback, which is the
    // token's value; the theme test below pins the tokens themselves.
    it('sets 14px text on 22px lines, in white on near-black', () => {
      const { root, container } = openContainer();

      const style = getComputedStyle(container);
      expect(toPx(style.fontSize)).toBe(14);
      expect(toPx(style.lineHeight)).toBe(22);
      expect(getComputedStyle(root).fontFamily).toContain('sans-serif');
      const css = readFileSync(TOOLTIP_CSS, 'utf8');
      expect(
        declaredValue(css, '.andes-tooltip', '--_andes-tooltip-surface'),
      ).toBe('light-dark(rgb(0 0 0 / 85%), #424242)');
      expect(declaredValue(css, '.andes-tooltip', '--_andes-tooltip-ink')).toBe(
        '#fff',
      );
    });

    // jsdom leaves the logical properties (`padding-block`, `min-block-size`) unresolved, so
    // those are read from the declaration; the tokens they point at are pinned further down.
    const container = (property: string) =>
      declaredValue(
        readFileSync(TOOLTIP_CSS, 'utf8'),
        '.andes-tooltip__container',
        property,
      );

    it('pads the box 6px by 8px and rounds it by 6px', () => {
      expect(toPx(container('padding-block') ?? '')).toBe(6);
      expect(container('padding-inline')).toBe('var(--andes-space-2)');
      expect(container('border-radius')).toBe('var(--andes-radius-md)');
    });

    it('is at least 32px tall and 28px wide, and at most 250px wide', () => {
      const { root } = openContainer();

      expect(toPx(container('min-block-size') ?? '')).toBe(32);
      expect(toPx(container('min-inline-size') ?? '')).toBe(28);
      // The cap is `min(<--andes-tooltip-max-width, 15.625rem>, viewport - 1rem)`.
      expect(getComputedStyle(root).maxWidth).toContain('15.625rem');
      expect(toPx('15.625rem')).toBe(250);
    });

    it('lifts the tooltip with three soft drop shadows, as Ant Design does', () => {
      const css = readFileSync(TOOLTIP_CSS, 'utf8');

      expect(declaredValue(css, '.andes-tooltip', 'filter')).toBe(
        'drop-shadow(0 6px 16px rgb(0 0 0 / 8%)) drop-shadow(0 3px 6px rgb(0 0 0 / 12%)) drop-shadow(0 9px 28px rgb(0 0 0 / 5%))',
      );
    });

    it('takes its text and line size from the 14px / 22px tokens', () => {
      const theme = readFileSync('packages/tokens/src/theme.css', 'utf8');

      expect(theme).toContain('--andes-font-size-sm: 0.875rem;');
      expect(theme).toContain('--andes-text-line-height: 1.375rem;');
      expect(theme).toContain('--andes-radius-md: 0.375rem;');
      expect(theme).toContain('--andes-space-2: 0.5rem;');
      expect(theme).toContain('--andes-z-index-tooltip: 1070;');
    });
  });

  describe('motion', () => {
    // Read from the stylesheet source: jsdom runs no animations, and keyframes
    // are not reflected in the computed style.
    const css = readFileSync(TOOLTIP_CSS, 'utf8');
    const keyframes = (name: string) => atRule(css, `@keyframes ${name}`);

    it('enters with a fade and a zoom from 80%, in the fast duration', () => {
      expect(declaredValue(css, '.andes-tooltip', 'animation')).toBe(
        'andes-tooltip-in var(--andes-duration-fast, 120ms) var(--andes-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
      expect(keyframes('andes-tooltip-in')).toMatch(
        /from \{\s*opacity: 0;\s*scale: 0\.8;\s*\}\s*to \{\s*opacity: 1;\s*scale: 1;/,
      );
    });

    it('zooms out of the arrow tip, 6px past the container edge', () => {
      expect(
        declaredValue(
          css,
          ".andes-tooltip[data-side='top']",
          'transform-origin',
        ),
      ).toBe('var(--andes-tooltip-arrow-offset, 50%) calc(100% + 6px)');
      expect(
        declaredValue(
          css,
          ".andes-tooltip[data-side='bottom']",
          'transform-origin',
        ),
      ).toBe('var(--andes-tooltip-arrow-offset, 50%) -6px');
      expect(
        declaredValue(
          css,
          ".andes-tooltip[data-side='left']",
          'transform-origin',
        ),
      ).toBe('calc(100% + 6px) var(--andes-tooltip-arrow-offset, 50%)');
      expect(
        declaredValue(
          css,
          ".andes-tooltip[data-side='right']",
          'transform-origin',
        ),
      ).toBe('-6px var(--andes-tooltip-arrow-offset, 50%)');
    });

    it('stops all motion under prefers-reduced-motion', () => {
      const reduced = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      );

      expect(reduced).toMatch(/\.andes-tooltip \{\s*animation: none;/);
      expect(reduced).toMatch(
        /\.andes-tooltip\[data-andes-closing\] \{\s*animation: none;/,
      );
    });
  });

  it('does not open before the delay if the pointer leaves first', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    fixture.detectChanges();
    unhover(trigger);
    fixture.detectChanges();

    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('closes on mouse-leave, after the hoverable grace', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE - 1);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('cancels a pending open when the trigger is pressed', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    trigger.dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }),
    );
    vi.advanceTimersByTime(600);
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('opens on keyboard focus and closes on blur', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    trigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('ignores touch pointer events - no hover-open on touch devices', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    touchHover(trigger);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('opens instantly, skipping the delay, right after another tooltip closed', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    unhover(trigger);
    fixture.detectChanges();
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(50);
    hover(trigger);
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  });

  it('pays the full delay again once the grouping window has elapsed', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    unhover(trigger);
    fixture.detectChanges();

    vi.advanceTimersByTime(500);
    hover(trigger);
    fixture.detectChanges();
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();
  });

  it('never opens while disabled', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('closes immediately if disabled flips true while open', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('is dismissed by Escape', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    pressEscape();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('renders projected rich content instead of the plain-text content input', () => {
    vi.useFakeTimers();
    const { fixture, trigger, panel } = createHost();
    fixture.componentInstance.useRichContent.set(true);
    fixture.detectChanges();

    hover(trigger);
    vi.advanceTimersByTime(600);
    fixture.detectChanges();

    expect(panel()?.querySelector('#rich')).toBeTruthy();
    expect(panel()?.textContent?.trim()).toBe('Rich hint');
  });

  describe('aria-describedby wiring', () => {
    it('has no aria-describedby while closed', () => {
      const { trigger } = createHost();

      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });

    it('points aria-describedby at the tooltip panel id once open', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();

      hover(trigger);
      vi.advanceTimersByTime(600);
      fixture.detectChanges();

      const describedBy = trigger.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(panel()?.id).toBe(describedBy);
    });

    it('uses role="tooltip" on the content, not aria-labelledby on the trigger', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();

      hover(trigger);
      vi.advanceTimersByTime(600);
      fixture.detectChanges();

      expect(panel()?.getAttribute('role')).toBe('tooltip');
      expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('clears aria-describedby again once closed', () => {
      vi.useFakeTimers();
      const { fixture, trigger } = createHost();

      hover(trigger);
      vi.advanceTimersByTime(600);
      fixture.detectChanges();
      unhover(trigger);
      fixture.detectChanges();

      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});

describe('tooltip placement helpers', () => {
  const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
  });

  it('maps all 12 named placements onto side/align', () => {
    expect(ANDES_TOOLTIP_PLACEMENTS).toHaveLength(12);
    const expected: Record<AndesTooltipPlacement, string> = {
      top: 'top/center',
      topLeft: 'top/start',
      topRight: 'top/end',
      bottom: 'bottom/center',
      bottomLeft: 'bottom/start',
      bottomRight: 'bottom/end',
      left: 'left/center',
      leftTop: 'left/start',
      leftBottom: 'left/end',
      right: 'right/center',
      rightTop: 'right/start',
      rightBottom: 'right/end',
    };
    for (const placement of ANDES_TOOLTIP_PLACEMENTS) {
      const { side, align } = andesTooltipPlacementToSideAlign(placement);
      expect(`${side}/${align}`).toBe(expected[placement]);
    }
  });

  it('normalizes the arrow input', () => {
    const cases: [AndesTooltipArrowInput, unknown][] = [
      [true, { pointAtCenter: false }],
      ['', { pointAtCenter: false }],
      ['true', { pointAtCenter: false }],
      [false, false],
      ['false', false],
      [null, false],
      [{ pointAtCenter: true }, { pointAtCenter: true }],
    ];
    for (const [input, output] of cases) {
      expect(andesTooltipArrowAttribute(input)).toEqual(output);
    }
  });

  it('reads back a flipped side from the rendered geometry', () => {
    const anchor = rect(100, 0, 80, 30);
    // Requested top, but rendered below the anchor (flipped).
    expect(andesTooltipResolveSide(anchor, rect(100, 40, 60, 20), 'top')).toBe(
      'bottom',
    );
    // Requested side honoured when it holds.
    expect(
      andesTooltipResolveSide(anchor, rect(100, 40, 60, 20), 'bottom'),
    ).toBe('bottom');
    // Rendered to the right (a perpendicular fallback).
    expect(andesTooltipResolveSide(anchor, rect(190, 0, 60, 20), 'top')).toBe(
      'right',
    );
    // An unmeasured panel falls back to the request.
    expect(andesTooltipResolveSide(anchor, rect(0, 0, 0, 0), 'left')).toBe(
      'left',
    );
  });

  it('points the arrow at the trigger center, following a viewport shift', () => {
    const anchor = rect(0, 100, 60, 30);
    // Centered tooltip pushed right to x=8 by the viewport margin.
    const panel = rect(8, 60, 120, 30);
    expect(andesTooltipArrowOffset('top', 'center', false, anchor, panel)).toBe(
      22,
    );
  });

  it('places an edge-aligned arrow just inside the aligned edge', () => {
    const anchor = rect(100, 100, 200, 30);
    const startPanel = rect(100, 60, 120, 30);
    expect(
      andesTooltipArrowOffset('top', 'start', false, anchor, startPanel),
    ).toBe(ANDES_TOOLTIP_ARROW_INSET);
    const endPanel = rect(180, 60, 120, 30);
    expect(andesTooltipArrowOffset('top', 'end', false, anchor, endPanel)).toBe(
      120 - ANDES_TOOLTIP_ARROW_INSET,
    );
  });

  it('clamps the arrow clear of the rounded corners', () => {
    const anchor = rect(0, 100, 10, 30);
    const panel = rect(200, 60, 120, 30);
    // Half the 16px arrow plus the 6px corner radius.
    expect(andesTooltipArrowOffset('top', 'center', false, anchor, panel)).toBe(
      14,
    );
  });

  it('computes the pointAtCenter shift for edge-aligned placements', () => {
    const size = { width: 100, height: 40 };
    expect(andesTooltipPointAtCenterOffset('top', 'start', size)).toBe(
      50 - ANDES_TOOLTIP_ARROW_INSET,
    );
    expect(andesTooltipPointAtCenterOffset('bottom', 'end', size)).toBe(
      -(50 - ANDES_TOOLTIP_ARROW_INSET),
    );
    expect(andesTooltipPointAtCenterOffset('left', 'start', size)).toBe(
      20 - ANDES_TOOLTIP_ARROW_INSET_VERTICAL,
    );
    expect(andesTooltipPointAtCenterOffset('top', 'center', size)).toBe(0);
  });
});

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger],
  template: `
    <andes-tooltip
      [content]="useTemplate() ? tpl : (contentFn() ?? content())"
      [classNames]="classNames()"
      [styles]="styles()"
      [disabled]="tooltipDisabled()"
      (openChangeDetail)="details.push($event)"
      [placement]="placement()"
      [arrow]="arrow()"
      [autoAdjustOverflow]="autoAdjustOverflow()"
      [trigger]="trigger()"
      [openDelay]="0"
      [(open)]="open"
      (openChange)="changes.push($event)"
      [color]="color()"
      [variant]="variant()"
      [maxWidth]="maxWidth()"
      [tooltipClass]="tooltipClass()"
      [zIndex]="zIndex()"
      [destroyOnHidden]="destroyOnHidden()"
      [fresh]="fresh()"
      [disableHoverablePopup]="disableHoverablePopup()"
      [closeOnClick]="closeOnClick()"
    >
      <button
        type="button"
        id="trigger"
        andesTooltipTrigger
        aria-describedby="own-hint"
        [disabled]="triggerDisabled()"
      >
        Trigger
      </button>
    </andes-tooltip>
    <ng-template #tpl><em id="tpl-content">Templated</em></ng-template>
  `,
})
class FeatureHostComponent {
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  readonly content = signal('Hint');
  readonly contentFn = signal<(() => string | null) | null>(null);
  readonly classNames = signal<AndesTooltipClassNamesInput | null>(null);
  readonly styles = signal<AndesTooltipStylesInput | null>(null);
  readonly details: AndesTooltipOpenChange[] = [];
  readonly tooltipDisabled = signal(false);
  readonly useTemplate = signal(false);
  readonly placement = signal<AndesTooltipPlacement | null>(null);
  readonly arrow = signal<AndesTooltipArrowInput>(true);
  readonly autoAdjustOverflow = signal(true);
  readonly trigger = signal<
    AndesTooltipTriggerAction | AndesTooltipTriggerAction[]
  >(['hover', 'focus']);
  readonly open = signal(false);
  readonly changes: boolean[] = [];
  readonly color = signal<string | null>(null);
  readonly variant = signal<AndesTooltipVariant>('default');
  readonly maxWidth = signal<number | string | null>(null);
  readonly tooltipClass = signal<string | null>(null);
  readonly zIndex = signal<number | null>(null);
  readonly destroyOnHidden = signal(false);
  readonly fresh = signal(false);
  readonly disableHoverablePopup = signal(false);
  readonly closeOnClick = signal(true);
  readonly triggerDisabled = signal(false);
}

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  template: `
    <andes-tooltip content="Save changes" [openDelay]="0">
      <andes-button andesTooltipTrigger [disabled]="disabled()">
        Save
      </andes-button>
    </andes-tooltip>
  `,
})
class AndesButtonHostComponent {
  readonly disabled = signal(false);
}

/** A tooltip that is open from the first render, on an `<andes-button>` trigger. */
@Component({
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  template: `
    <andes-tooltip content="Save changes" [open]="true">
      <andes-button andesTooltipTrigger>Save</andes-button>
    </andes-tooltip>
  `,
})
class OpenAndesButtonHostComponent {}

/**
 * The wrapper pattern for a disabled control: a disabled control cannot take focus,
 * so a focusable wrapper is the trigger instead and keyboard users still reach the
 * hint.
 */
@Component({
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  template: `
    <andes-tooltip content="You need edit rights to save" [openDelay]="0">
      <span id="wrapper" tabindex="0" andesTooltipTrigger>
        <andes-button disabled>Save</andes-button>
      </span>
    </andes-tooltip>
  `,
})
class DisabledWrapperHostComponent {}

/** Parses `--andes-color-*` hex values out of one theme block of theme.css. */
function themeColors(block: string): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const [, name, hex] of block.matchAll(
    /(--andes-color-[a-z-]+):\s*(#[0-9a-f]{6});/gi,
  )) {
    colors[name] = hex;
  }
  return colors;
}

function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/**
 * Resolves the small subset of CSS the preset rules use: `var(--token)` and
 * `color-mix(in srgb, var(--token) N%, #hex)`.
 */
function resolveColor(
  expression: string,
  colors: Record<string, string>,
): [number, number, number] {
  const value = expression.replace(/\s+/g, ' ').trim();
  const mix =
    /^color-mix\( ?in srgb, var\((--[a-z-]+)\) (\d+)%, (#[0-9a-f]+) ?\)$/i.exec(
      value,
    );
  if (mix) {
    const base = rgb(colors[mix[1]]);
    const other = rgb(mix[3]);
    const share = Number(mix[2]) / 100;
    return base.map((channel, i) =>
      Math.round(channel * share + other[i] * (1 - share)),
    ) as [number, number, number];
  }
  const token = /^var\((--[a-z-]+)\)$/.exec(value);
  if (token) {
    return rgb(colors[token[1]]);
  }
  throw new Error(`Unresolvable preset colour: ${value}`);
}

function contrast(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const luminance = (color: [number, number, number]) => {
    const [r, g, b] = color.map((channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

describe('AndesTooltip colour contrast', () => {
  const css = readFileSync('packages/ui/src/lib/tooltip/tooltip.css', 'utf8');
  const theme = readFileSync('packages/tokens/src/theme.css', 'utf8');
  const darkStart = theme.indexOf("[data-andes-theme='dark']");
  const light = themeColors(theme.slice(0, darkStart));
  const dark = { ...light, ...themeColors(theme.slice(darkStart)) };

  function presetRule(preset: string) {
    const body = ruleBody(css, `.andes-tooltip--${preset}`);
    const read = (prop: string) => {
      const at = body.indexOf(`--andes-tooltip-${prop}:`);
      if (at < 0) {
        return '';
      }
      const start = body.indexOf(':', at) + 1;
      return body.slice(start, body.indexOf(';', start)).trim();
    };
    return { background: read('background'), foreground: read('foreground') };
  }

  // 12px caption text: the normal-text AA threshold applies.
  it.each(['primary', 'secondary', 'success', 'warning', 'danger', 'info'])(
    'gives the %s preset at least 4.5:1 in both themes',
    (preset) => {
      const rule = presetRule(preset);
      for (const colors of [light, dark]) {
        const ratio = contrast(
          resolveColor(rule.background, colors),
          resolveColor(rule.foreground, colors),
        );
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('keeps the inverse variant dark, with light text, in both themes', () => {
    const body = /\.andes-tooltip--inverse \{([^}]*)\}/.exec(css)?.[1] ?? '';
    const background = /--andes-tooltip-background:\s*([^;]+);/
      .exec(body)?.[1]
      ?.replace(/\s+/g, ' ');
    expect(background).toBe(
      'color-mix( in srgb, var(--andes-color-foreground) 15%, #1e293b )',
    );
    expect(body).toContain('--andes-tooltip-foreground: #f8fafc;');
    for (const colors of [light, dark]) {
      const fill = resolveColor(background ?? '', colors);
      expect(contrast(fill, rgb('#f8fafc'))).toBeGreaterThanOrEqual(7);
      // A dark surface: well below mid-grey in either theme.
      expect(Math.max(...fill)).toBeLessThan(0x60);
    }
  });

  it('leaves with the entry in reverse, accelerating away', () => {
    const rule =
      /\.andes-tooltip\[data-andes-closing\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(
      /animation: andes-tooltip-out var\(--andes-duration-fast, 120ms\)\s+var\(--andes-ease-in, [^)]+\)\) forwards;/,
    );
    const keyframes =
      /@keyframes andes-tooltip-out\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(keyframes).toMatch(/to \{\s*opacity: 0;\s*scale: 0\.8;/);
  });
});

describe('AndesTooltip (extended options)', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(FeatureHostComponent);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector(
      '#trigger',
    ) as HTMLButtonElement;
    const tooltipHost = fixture.nativeElement.querySelector(
      'andes-tooltip',
    ) as HTMLElement;
    const overlay = fixture.debugElement
      .query(By.directive(AndesTooltip))
      .injector.get(AndesOverlayPrimitive);
    const panel = () =>
      document.querySelector('.andes-tooltip') as HTMLElement | null;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, host, trigger, tooltipHost, overlay, panel, settle };
  }

  function pointer(
    element: HTMLElement,
    type: string,
    pointerType = 'mouse',
  ): PointerEvent {
    const event = new PointerEvent(type, {
      pointerType,
      bubbles: type !== 'pointerenter' && type !== 'pointerleave',
      cancelable: true,
    });
    element.dispatchEvent(event);
    return event;
  }

  /** Pointer-leave, then the hoverable grace. Needs fake timers. */
  function leave(element: HTMLElement): void {
    pointer(element, 'pointerleave');
    vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('placement', () => {
    it('resolves a named placement into the overlay positioning', () => {
      const { fixture, host, overlay } = createHost();
      host.placement.set('rightBottom');
      fixture.detectChanges();

      const positioning = overlay.config().positioning;
      expect(positioning).toMatchObject({
        kind: 'anchored',
        side: 'right',
        align: 'end',
        flip: true,
        shift: true,
        // It flips to the opposite side and moves along the trigger, as Ant Design's does,
        // and never to a perpendicular side.
        crossSideFallback: false,
      });
    });

    it('marks the rendered side on the tooltip', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.placement.set('bottomLeft');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.getAttribute('data-side')).toBe('bottom');
    });

    it('turns flip and shift off with autoAdjustOverflow=false', () => {
      const { fixture, host, overlay } = createHost();
      host.autoAdjustOverflow.set(false);
      fixture.detectChanges();

      expect(overlay.config().positioning).toMatchObject({
        flip: false,
        shift: false,
      });
    });
  });

  describe('arrow', () => {
    it('renders an arrow by default and leaves room for it', () => {
      const { fixture, trigger, overlay, panel } = createHost();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.querySelector('.andes-tooltip__arrow')).toBeTruthy();
      expect(overlay.config().positioning).toMatchObject({
        sideOffset: 6 + ANDES_TOOLTIP_ARROW_HEIGHT,
      });
    });

    it('omits the arrow with arrow=false', () => {
      const { fixture, host, trigger, overlay, panel } = createHost();
      host.arrow.set(false);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.querySelector('.andes-tooltip__arrow')).toBeNull();
      expect(overlay.config().positioning).toMatchObject({ sideOffset: 6 });
    });

    it('shifts an edge-aligned tooltip so the arrow points at the trigger center', () => {
      const { fixture, host, trigger, overlay } = createHost();
      host.placement.set('topLeft');
      host.arrow.set({ pointAtCenter: true });
      fixture.detectChanges();
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 100, 32),
      );

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(overlay.config().positioning).toMatchObject({
        align: 'start',
        alignOffset: 50 - ANDES_TOOLTIP_ARROW_INSET,
      });
    });
  });

  describe('trigger', () => {
    it('toggles on click, with no delay, when trigger is "click"', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.trigger.set('click');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()).toBeNull();

      trigger.click();
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      trigger.click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('closes on an outside click only when opened by click', () => {
      const { fixture, host, trigger, panel } = createHost();
      const outsideClick = () => {
        pointer(document.body, 'pointerdown');
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
      };

      // Hover/focus tooltip opened programmatically: a page click leaves it.
      host.open.set(true);
      fixture.detectChanges();
      outsideClick();
      expect(panel()).toBeTruthy();
      host.open.set(false);
      fixture.detectChanges();

      host.trigger.set('click');
      fixture.detectChanges();
      trigger.click();
      fixture.detectChanges();
      expect(panel()).toBeTruthy();
      outsideClick();
      expect(panel()).toBeNull();
      expect(host.open()).toBe(false);
    });

    it('opens on right-click and suppresses the native menu for "contextMenu"', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.trigger.set('contextMenu');
      fixture.detectChanges();

      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      trigger.dispatchEvent(event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
      expect(panel()).toBeTruthy();
    });

    it('ignores hover when only "focus" is a trigger', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.trigger.set(['focus']);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()).toBeNull();

      trigger.focus();
      fixture.detectChanges();
      expect(panel()).toBeTruthy();
    });

    it('opens on a touch long-press and hides a while after the finger lifts', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();

      pointer(trigger, 'pointerdown', 'touch');
      vi.advanceTimersByTime(ANDES_TOOLTIP_LONG_PRESS_DELAY - 1);
      fixture.detectChanges();
      expect(panel()).toBeNull();

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      pointer(trigger, 'pointerup', 'touch');
      vi.advanceTimersByTime(ANDES_TOOLTIP_TOUCH_HIDE_DELAY - 1);
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('ignores the focus a tap causes, so the long-press hide still applies', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();

      pointer(trigger, 'pointerdown', 'touch');
      vi.advanceTimersByTime(ANDES_TOOLTIP_LONG_PRESS_DELAY);
      pointer(trigger, 'pointerup', 'touch');
      trigger.focus();
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      vi.advanceTimersByTime(ANDES_TOOLTIP_TOUCH_HIDE_DELAY);
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('does not open on a short tap, even though the tap focuses the trigger', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();

      pointer(trigger, 'pointerdown', 'touch');
      vi.advanceTimersByTime(100);
      pointer(trigger, 'pointerup', 'touch');
      trigger.focus();
      vi.advanceTimersByTime(ANDES_TOOLTIP_LONG_PRESS_DELAY);
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  describe('hoverable tooltip', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    /** The open tooltip element. */
    function tooltipOf(panel: () => HTMLElement | null): HTMLElement {
      const element = panel();
      if (!element) {
        throw new Error('Expected the tooltip to be open');
      }
      return element;
    }

    function openByHover() {
      const created = createHost();
      pointer(created.trigger, 'pointerenter');
      created.fixture.detectChanges();
      expect(created.panel()).toBeTruthy();
      return created;
    }

    it('stays open while the pointer moves from the trigger onto the tooltip', () => {
      const { fixture, trigger, panel } = openByHover();

      pointer(trigger, 'pointerleave');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE - 1);
      pointer(tooltipOf(panel), 'pointerenter');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE * 10);
      fixture.detectChanges();

      expect(panel()).toBeTruthy();
      expect(tooltipOf(panel).hasAttribute('data-hoverable')).toBe(true);
    });

    it('closes after the grace once the pointer leaves the tooltip', () => {
      const { fixture, host, trigger, panel } = openByHover();
      pointer(trigger, 'pointerleave');
      const tooltip = tooltipOf(panel);
      pointer(tooltip, 'pointerenter');

      pointer(tooltip, 'pointerleave');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE - 1);
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.changes).toEqual([true, false]);
    });

    it('stays open when the pointer goes back from the tooltip to the trigger', () => {
      const { fixture, trigger, panel } = openByHover();
      pointer(trigger, 'pointerleave');
      pointer(tooltipOf(panel), 'pointerenter');

      pointer(tooltipOf(panel), 'pointerleave');
      pointer(trigger, 'pointerenter');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE * 10);
      fixture.detectChanges();

      expect(panel()).toBeTruthy();
    });

    it('is still dismissed by Escape while the pointer is on the tooltip', () => {
      const { fixture, trigger, panel } = openByHover();
      pointer(trigger, 'pointerleave');
      pointer(tooltipOf(panel), 'pointerenter');

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });

    it('closes on leave and ignores the pointer with disableHoverablePopup', () => {
      const { fixture, host, trigger, overlay, panel } = createHost();
      host.disableHoverablePopup.set(true);
      fixture.detectChanges();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(tooltipOf(panel).hasAttribute('data-hoverable')).toBe(false);
      expect(overlay.panelElement()?.style.pointerEvents).toBe('none');

      pointer(trigger, 'pointerleave');
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  describe('closeOnClick', () => {
    it('closes a hover/focus tooltip when the trigger is pressed', () => {
      const { fixture, host, trigger, panel } = createHost();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      pointer(trigger, 'pointerdown');
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(host.open()).toBe(false);
    });

    it('stays closed through the focus the press causes until the pointer leaves', () => {
      vi.useFakeTimers();
      const { fixture, trigger, panel } = createHost();
      pointer(trigger, 'pointerenter');
      pointer(trigger, 'pointerdown');
      trigger.focus();
      pointer(trigger, 'pointerup');
      trigger.click();
      fixture.detectChanges();
      expect(panel()).toBeNull();

      leave(trigger);
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()).toBeTruthy();
    });

    it('ignores a press with closeOnClick=false', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.closeOnClick.set(false);
      fixture.detectChanges();
      pointer(trigger, 'pointerenter');

      pointer(trigger, 'pointerdown');
      fixture.detectChanges();

      expect(panel()).toBeTruthy();
    });

    it('leaves the toggle to a "click" trigger', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.trigger.set(['hover', 'click']);
      fixture.detectChanges();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      pointer(trigger, 'pointerdown');
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      trigger.click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });
  });

  describe('open / openChange', () => {
    it('opens and closes programmatically', () => {
      const { fixture, host, panel } = createHost();

      host.open.set(true);
      fixture.detectChanges();
      expect(panel()).toBeTruthy();

      host.open.set(false);
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.changes).toEqual([]);
    });

    it('reports user-driven changes through openChange and the two-way binding', () => {
      vi.useFakeTimers();
      const { fixture, host, trigger } = createHost();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(host.open()).toBe(true);

      leave(trigger);
      fixture.detectChanges();
      expect(host.open()).toBe(false);
      expect(host.changes).toEqual([true, false]);
    });

    it('reports an Escape dismissal', () => {
      const { fixture, host, panel } = createHost();
      host.open.set(true);
      fixture.detectChanges();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(host.open()).toBe(false);
      expect(host.changes).toEqual([false]);
    });
  });

  describe('layout changes', () => {
    class FakeResizeObserver {
      static instances: FakeResizeObserver[] = [];
      readonly observed: Element[] = [];
      disconnected = false;
      constructor(readonly callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this);
      }
      observe(target: Element): void {
        this.observed.push(target);
      }
      unobserve(): void {
        // Not used by the tooltip.
      }
      disconnect(): void {
        this.disconnected = true;
      }
      fire(): void {
        this.callback([], this as unknown as ResizeObserver);
      }
    }

    beforeEach(() => {
      FakeResizeObserver.instances = [];
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('repositions while open when the trigger or the tooltip resizes', () => {
      const { fixture, host, trigger, overlay } = createHost();
      host.open.set(true);
      fixture.detectChanges();

      const observer = FakeResizeObserver.instances.at(-1);
      expect(observer?.observed).toContain(trigger);
      expect(observer?.observed).toContain(overlay.contentElement());

      const update = vi.spyOn(overlay, 'updatePosition');
      observer?.fire();
      expect(update).toHaveBeenCalledTimes(1);

      host.open.set(false);
      fixture.detectChanges();
      expect(observer?.disconnected).toBe(true);
    });

    it('exposes updatePosition() for layout shifts that resize nothing', () => {
      const { fixture, host, overlay } = createHost();
      const tooltip = fixture.debugElement
        .query(By.directive(AndesTooltip))
        .injector.get(AndesTooltip);
      const update = vi.spyOn(overlay, 'updatePosition');

      tooltip.updatePosition();
      expect(update).not.toHaveBeenCalled();

      host.open.set(true);
      fixture.detectChanges();
      tooltip.updatePosition();
      expect(update).toHaveBeenCalledTimes(1);
    });
  });

  describe('content', () => {
    it('accepts a TemplateRef as content', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.useTemplate.set(true);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.querySelector('#tpl-content')?.textContent).toBe(
        'Templated',
      );
    });

    it('never opens with empty content', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.content.set('  ');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  describe('styling', () => {
    it('applies a semantic color preset as a modifier class', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.color.set('danger');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.classList).toContain('andes-tooltip--danger');
      expect(
        panel()?.style.getPropertyValue('--andes-tooltip-background'),
      ).toBe('');
    });

    it('applies an arbitrary color through the background custom property', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.color.set('#7c3aed');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.classList).toContain('andes-tooltip--custom-color');
      expect(
        panel()?.style.getPropertyValue('--andes-tooltip-background'),
      ).toBe('#7c3aed');
    });

    it('renders the inverse surface only when asked', () => {
      const { fixture, host, trigger, panel } = createHost();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()?.classList).not.toContain('andes-tooltip--inverse');

      pointer(trigger, 'pointerleave');
      host.variant.set('inverse');
      fixture.detectChanges();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()?.classList).toContain('andes-tooltip--inverse');
    });

    it('sets maxWidth and tooltipClass on the tooltip element', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.maxWidth.set(180);
      host.tooltipClass.set('my-tooltip');
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()?.style.getPropertyValue('--andes-tooltip-max-width')).toBe(
        '180px',
      );
      expect(panel()?.classList).toContain('my-tooltip');
      expect(panel()?.classList).toContain('andes-tooltip');
    });

    it('overrides the overlay z-index with zIndex', () => {
      const { fixture, host, trigger, overlay } = createHost();
      host.zIndex.set(4242);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(overlay.panelElement()?.parentElement?.style.zIndex).toBe('4242');
    });
  });

  describe('destroyOnHidden / fresh', () => {
    function openAndGetBody(
      fixture: ReturnType<typeof createHost>['fixture'],
      trigger: HTMLElement,
    ) {
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      return document.querySelector('.andes-tooltip__container') as HTMLElement;
    }

    function close(
      fixture: ReturnType<typeof createHost>['fixture'],
      trigger: HTMLElement,
    ) {
      leave(trigger);
      fixture.detectChanges();
    }

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('keeps the rendered content across openings by default', () => {
      const { fixture, trigger } = createHost();

      const first = openAndGetBody(fixture, trigger);
      close(fixture, trigger);
      const second = openAndGetBody(fixture, trigger);

      expect(second).toBe(first);
    });

    it('re-renders the content on each opening with destroyOnHidden', () => {
      const { fixture, host, trigger } = createHost();
      host.destroyOnHidden.set(true);
      fixture.detectChanges();

      const first = openAndGetBody(fixture, trigger);
      close(fixture, trigger);
      const second = openAndGetBody(fixture, trigger);

      expect(second).not.toBe(first);
      expect(first.isConnected).toBe(false);
    });

    it('pauses hidden content until reopened, unless fresh', () => {
      const { fixture, host, trigger } = createHost();

      const body = openAndGetBody(fixture, trigger);
      close(fixture, trigger);
      host.content.set('Updated');
      fixture.detectChanges();
      expect(body.textContent?.trim()).toBe('Hint');

      openAndGetBody(fixture, trigger);
      expect(body.textContent?.trim()).toBe('Updated');
    });

    it('keeps hidden content updating with fresh', () => {
      const { fixture, host, trigger } = createHost();
      host.fresh.set(true);
      fixture.detectChanges();

      const body = openAndGetBody(fixture, trigger);
      close(fixture, trigger);
      host.content.set('Updated');
      fixture.detectChanges();

      expect(body.textContent?.trim()).toBe('Updated');
    });
  });

  describe('accessibility', () => {
    it("adds its id to the trigger's own aria-describedby and removes only it", () => {
      vi.useFakeTimers();
      const { fixture, trigger, overlay } = createHost();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe(
        `own-hint ${overlay.contentId}`,
      );

      leave(trigger);
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe('own-hint');
    });
  });

  describe('disabled trigger', () => {
    it('hands hover over to the wrapper while the trigger is disabled', async () => {
      const { fixture, host, trigger, tooltipHost, overlay, panel, settle } =
        createHost();
      host.triggerDisabled.set(true);
      await settle();

      expect(trigger.style.pointerEvents).toBe('none');
      expect(tooltipHost.hasAttribute('data-disabled-trigger')).toBe(true);

      // The trigger's own events are ignored (browsers may not send them)...
      pointer(trigger, 'pointerenter');
      await settle();
      expect(panel()).toBeNull();

      // ...and the wrapper's are handled, anchored to the wrapper.
      pointer(tooltipHost, 'pointerenter');
      await settle();
      expect(panel()).toBeTruthy();
      expect(overlay.anchor()).toBe(tooltipHost);

      vi.useFakeTimers();
      leave(tooltipHost);
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('restores the trigger once re-enabled', async () => {
      const { host, trigger, tooltipHost, settle } = createHost();
      host.triggerDisabled.set(true);
      await settle();
      host.triggerDisabled.set(false);
      await settle();

      expect(trigger.style.pointerEvents).toBe('');
      expect(tooltipHost.hasAttribute('data-disabled-trigger')).toBe(false);
    });
  });

  describe('focusable wrapper around a disabled control', () => {
    it('opens on keyboard focus of the wrapper and describes it', () => {
      const fixture = TestBed.createComponent(DisabledWrapperHostComponent);
      fixture.detectChanges();
      const wrapper = fixture.nativeElement.querySelector(
        '#wrapper',
      ) as HTMLElement;
      const overlay = fixture.debugElement
        .query(By.directive(AndesTooltip))
        .injector.get(AndesOverlayPrimitive);

      wrapper.focus();
      fixture.detectChanges();

      expect(document.activeElement).toBe(wrapper);
      expect(overlay.isOpen()).toBe(true);
      expect(wrapper.getAttribute('aria-describedby')).toBe(overlay.contentId);
      // The wrapper is not itself disabled, so it keeps its own pointer events.
      expect(
        fixture.nativeElement
          .querySelector('andes-tooltip')
          .hasAttribute('data-disabled-trigger'),
      ).toBe(false);
    });
  });

  describe('custom-element trigger (andes-button)', () => {
    function createButtonHost() {
      const fixture = TestBed.createComponent(AndesButtonHostComponent);
      fixture.detectChanges();
      const inner = fixture.nativeElement.querySelector(
        'andes-button button',
      ) as HTMLButtonElement;
      const overlay = fixture.debugElement
        .query(By.directive(AndesTooltip))
        .injector.get(AndesOverlayPrimitive);
      return { fixture, inner, overlay };
    }

    it('opens on focus of the inner button and describes it', () => {
      const { fixture, inner, overlay } = createButtonHost();

      inner.focus();
      fixture.detectChanges();

      expect(overlay.isOpen()).toBe(true);
      expect(inner.getAttribute('aria-describedby')).toBe(overlay.contentId);
      expect(overlay.anchor()).toBe(inner);
      expect(
        fixture.nativeElement
          .querySelector('andes-button')
          .hasAttribute('aria-describedby'),
      ).toBe(false);
    });

    it('describes the inner button of a tooltip that is open from the first render', async () => {
      const fixture = TestBed.createComponent(OpenAndesButtonHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector(
        'andes-button',
      ) as HTMLElement;
      const inner = host.querySelector('button') as HTMLButtonElement;
      const overlay = fixture.debugElement
        .query(By.directive(AndesTooltip))
        .injector.get(AndesOverlayPrimitive);

      expect(overlay.isOpen()).toBe(true);
      expect(inner.getAttribute('aria-describedby')).toBe(overlay.contentId);
      expect(host.hasAttribute('aria-describedby')).toBe(false);
    });

    it('treats a disabled andes-button as a disabled trigger', async () => {
      const { fixture, inner } = createButtonHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(inner.style.pointerEvents).toBe('none');
      expect(
        fixture.nativeElement
          .querySelector('andes-tooltip')
          .hasAttribute('data-disabled-trigger'),
      ).toBe(true);
    });
  });
});

/** OKLab lightness of a `#rrggbb` color, as CSS `oklch()` reports it. */
function oklabLightness(hex: string): number {
  const [r, g, b] = rgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

describe('AndesTooltip look', () => {
  const css = readFileSync(TOOLTIP_CSS, 'utf8');

  describe('arrow', () => {
    const arrow = (side: string) =>
      `.andes-tooltip[data-side='${side}'] > .andes-tooltip__arrow`;

    it('is a 16 x 8 badge, 8 thick, kept clear of the corner by half its width and the radius', () => {
      expect(ANDES_TOOLTIP_ARROW_WIDTH).toBe(16);
      expect(ANDES_TOOLTIP_ARROW_THICKNESS).toBe(8);
      for (const side of ['top', 'bottom']) {
        expect(declaredValue(css, arrow(side), 'width')).toBe('16px');
        expect(declaredValue(css, arrow(side), 'height')).toBe('8px');
      }
      for (const side of ['left', 'right']) {
        expect(declaredValue(css, arrow(side), 'width')).toBe('8px');
        expect(declaredValue(css, arrow(side), 'height')).toBe('16px');
      }
    });

    it('sits on the edge that faces the trigger, centered on its offset', () => {
      expect(declaredValue(css, arrow('top'), 'top')).toBe('100%');
      expect(declaredValue(css, arrow('bottom'), 'bottom')).toBe('100%');
      expect(declaredValue(css, arrow('left'), 'left')).toBe('100%');
      expect(declaredValue(css, arrow('right'), 'right')).toBe('100%');
      expect(declaredValue(css, arrow('top'), 'left')).toBe(
        'var(--andes-tooltip-arrow-offset, 50%)',
      );
      expect(declaredValue(css, arrow('left'), 'top')).toBe(
        'var(--andes-tooltip-arrow-offset, 50%)',
      );
    });

    it("rounds its tip with Ant Design's path, rotated for each side", () => {
      // The upward arrow (`bottom` side) is Ant Design's own path.
      expect(declaredValue(css, arrow('bottom'), 'clip-path')).toBe(
        "path( 'M 0 8 A 4 4 0 0 0 2.828 6.828 L 6.586 3.071 A 2 2 0 0 1 9.414 3.071 L 13.172 6.828 A 4 4 0 0 0 16 8 Z' )",
      );
      for (const side of ['top', 'left', 'right']) {
        expect(declaredValue(css, arrow(side), 'clip-path')).toMatch(
          /^path\( 'M [\d. ]+ A 4 4 0 0 0 [\d. ]+ L [\d. ]+ A 2 2 0 0 1 [\d. ]+ L [\d. ]+ A 4 4 0 0 0 [\d. ]+ Z' \)$/,
        );
      }
    });

    it('leaves the arrow 6px of the 12px gap to the trigger, and aims at the center or the edge', () => {
      expect(ANDES_TOOLTIP_ARROW_HEIGHT + 6).toBe(12);
      // Ant Design: 12px from the edge to the arrow's box, plus half of it.
      expect(ANDES_TOOLTIP_ARROW_INSET).toBe(12 + 8);
      expect(ANDES_TOOLTIP_ARROW_INSET_VERTICAL).toBe(8 + 8);
    });
  });

  describe('surfaces', () => {
    it('draws the arrow in the container color', () => {
      const surface =
        'var( --andes-tooltip-background, var(--_andes-tooltip-surface) )';
      expect(
        declaredValue(css, '.andes-tooltip__arrow', 'background-color'),
      ).toBe(surface);
      expect(
        declaredValue(css, '.andes-tooltip__container', 'background-color'),
      ).toBe(surface);
    });

    it('follows the popover surface, with a hairline, for variant="light"', () => {
      expect(
        declaredValue(css, '.andes-tooltip--light', '--_andes-tooltip-surface'),
      ).toBe('var(--andes-color-popover)');
      expect(
        declaredValue(css, '.andes-tooltip--light', '--_andes-tooltip-ink'),
      ).toBe('var(--andes-color-popover-foreground)');
      expect(declaredValue(css, '.andes-tooltip--light', 'filter')).toContain(
        'drop-shadow(1px 0 0 var(--_andes-tooltip-edge))',
      );
    });

    it("fills each hue preset with Ant Design's step-6 colour", () => {
      const ant: Record<string, string> = {
        pink: '#eb2f96',
        red: '#f5222d',
        yellow: '#fadb14',
        orange: '#fa8c16',
        cyan: '#13c2c2',
        green: '#52c41a',
        blue: '#1677ff',
        purple: '#722ed1',
        geekblue: '#2f54eb',
        magenta: '#eb2f96',
        volcano: '#fa541c',
        gold: '#faad14',
        lime: '#a0d911',
      };
      expect([...ANDES_TOOLTIP_HUE_COLORS].sort()).toEqual(
        Object.keys(ant).sort(),
      );
      for (const [hue, fill] of Object.entries(ant)) {
        expect(
          declaredValue(
            css,
            `.andes-tooltip--${hue}`,
            '--andes-tooltip-background',
          ),
        ).toBe(fill);
      }
    });

    it('picks black or white text for a custom color and a hue like Ant Design does', () => {
      expect(
        declaredValue(
          css,
          '.andes-tooltip--custom-color > .andes-tooltip__container',
          'color',
        ),
      ).toBe(
        'oklch( from var(--andes-tooltip-background) clamp(0, (0.7 - l) * 1000, 1) 0 0 )',
      );
      // White up to a lightness of 0.7, black above it.
      const text = (hex: string) =>
        oklabLightness(hex) < 0.7 ? 'white' : 'black';
      expect(text('#f50')).toBe('white');
      expect(text('#2db7f5')).toBe('black');
      expect(text('#87d068')).toBe('black');
      expect(text('#108ee9')).toBe('white');
    });
  });
});

describe('AndesTooltip semantic styling helpers', () => {
  it('normalizes a style object for [style]', () => {
    expect(
      andesTooltipStyleObject({
        borderRadius: 12,
        'box-shadow': 'inset 0 0 8px #ccc',
        opacity: 0.5,
        zIndex: 3,
        padding: 0,
        '--my-var': 4,
        color: null,
        width: '',
      }),
    ).toEqual({
      'border-radius': '12px',
      'box-shadow': 'inset 0 0 8px #ccc',
      opacity: '0.5',
      'z-index': '3',
      padding: '0',
      '--my-var': '4px',
    });
    expect(andesTooltipStyleObject(undefined)).toBeNull();
    expect(andesTooltipStyleObject({ color: null })).toBeNull();
  });
});

describe('AndesTooltip (semantic parts, content, sources)', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(FeatureHostComponent);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector(
      '#trigger',
    ) as HTMLButtonElement;
    const panel = () =>
      document.querySelector('.andes-tooltip') as HTMLElement | null;
    const container = () =>
      document.querySelector('.andes-tooltip__container') as HTMLElement | null;
    const arrowPart = () =>
      document.querySelector('.andes-tooltip__arrow') as HTMLElement | null;
    return { fixture, host, trigger, panel, container, arrowPart };
  }

  function pointer(
    element: HTMLElement,
    type: string,
    pointerType = 'mouse',
    init: PointerEventInit = {},
  ): void {
    element.dispatchEvent(
      new PointerEvent(type, {
        pointerType,
        bubbles: type !== 'pointerenter' && type !== 'pointerleave',
        cancelable: true,
        ...init,
      }),
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('content as a function', () => {
    it('shows what the function returns and follows the signals it reads', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.contentFn.set(() => `Hello ${host.content()}`);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()?.textContent?.trim()).toBe('Hello Hint');

      host.content.set('again');
      fixture.detectChanges();
      expect(panel()?.textContent?.trim()).toBe('Hello again');
    });

    it('does not open when the function returns nothing', () => {
      const { fixture, host, trigger, panel } = createHost();
      host.contentFn.set(() => null);
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  describe('classNames and styles', () => {
    it('add classes and styles to the root, the container and the arrow', () => {
      const { fixture, host, trigger, panel, container, arrowPart } =
        createHost();
      host.tooltipClass.set('from-tooltip-class');
      host.classNames.set({
        root: 'r1',
        container: ['c1', 'c2'],
        arrow: 'a1',
      });
      host.styles.set({
        root: { opacity: 0.9 },
        container: { borderRadius: 12, '--my-var': 'x' },
        arrow: { 'background-color': 'red' },
      });
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();

      expect([...(panel()?.classList ?? [])]).toEqual(
        expect.arrayContaining(['andes-tooltip', 'from-tooltip-class', 'r1']),
      );
      expect(panel()?.style.opacity).toBe('0.9');
      expect(container()?.classList).toContain('andes-tooltip__container');
      expect(container()?.classList).toContain('c1');
      expect(container()?.classList).toContain('c2');
      expect(container()?.style.borderRadius).toBe('12px');
      expect(container()?.style.getPropertyValue('--my-var')).toBe('x');
      expect(arrowPart()?.classList).toContain('andes-tooltip__arrow');
      expect(arrowPart()?.classList).toContain('a1');
      expect(arrowPart()?.style.backgroundColor).toBe('red');
    });

    it('take a function of the tooltip props', () => {
      const { fixture, host, trigger, container } = createHost();
      const seen: unknown[] = [];
      host.placement.set('bottomLeft');
      host.color.set('danger');
      host.classNames.set(({ props }) => {
        seen.push(props);
        return { container: props.arrow ? 'with-arrow' : 'plain' };
      });
      host.styles.set(({ props }) =>
        props.arrow ? {} : { container: { padding: 12 } },
      );
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(container()?.classList).toContain('with-arrow');
      expect(container()?.style.padding).toBe('');
      expect(seen.at(-1)).toMatchObject({
        placement: 'bottomLeft',
        side: 'bottom',
        align: 'start',
        arrow: true,
        pointAtCenter: false,
        color: 'danger',
        variant: 'default',
        open: true,
      });

      host.arrow.set(false);
      fixture.detectChanges();
      expect(container()?.classList).toContain('plain');
      expect(container()?.classList).not.toContain('with-arrow');
      expect(container()?.style.padding).toBe('12px');
    });
  });

  describe('colors and variants', () => {
    it.each(ANDES_TOOLTIP_HUE_COLORS)(
      'marks the %s hue preset with its own class',
      (hue) => {
        const { fixture, host, trigger, panel } = createHost();
        host.color.set(hue);
        fixture.detectChanges();

        pointer(trigger, 'pointerenter');
        fixture.detectChanges();

        expect(panel()?.classList).toContain(`andes-tooltip--${hue}`);
        expect(panel()?.classList).toContain('andes-tooltip--hue');
        expect(panel()?.classList).not.toContain('andes-tooltip--custom-color');
        expect(
          panel()?.style.getPropertyValue('--andes-tooltip-background'),
        ).toBe('');
      },
    );

    it('renders the light surface only when asked', () => {
      const { fixture, host, trigger, panel } = createHost();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()?.classList).not.toContain('andes-tooltip--light');

      pointer(trigger, 'pointerleave');
      host.variant.set('light');
      fixture.detectChanges();
      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      expect(panel()?.classList).toContain('andes-tooltip--light');
    });
  });

  describe('openChangeDetail', () => {
    it('reports hover as the source of an open and of the close that follows', () => {
      vi.useFakeTimers();
      const { fixture, host, trigger } = createHost();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      pointer(trigger, 'pointerleave');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE);
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'hover' },
        { open: false, source: 'hover' },
      ]);
    });

    it('reports focus and blur', () => {
      const { fixture, host, trigger } = createHost();

      trigger.focus();
      fixture.detectChanges();
      trigger.blur();
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'focus' },
        { open: false, source: 'focus' },
      ]);
    });

    it('reports click and an outside click', () => {
      const { fixture, host, trigger } = createHost();
      host.trigger.set('click');
      fixture.detectChanges();

      trigger.click();
      fixture.detectChanges();
      trigger.click();
      fixture.detectChanges();
      trigger.click();
      fixture.detectChanges();
      pointer(document.body, 'pointerdown');
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'click' },
        { open: false, source: 'click' },
        { open: true, source: 'click' },
        { open: false, source: 'outside-click' },
      ]);
    });

    it('reports a context menu open, a press that dismisses and the Escape key', () => {
      vi.useFakeTimers();
      const { fixture, host, trigger } = createHost();
      const escape = () =>
        document.body.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true,
            cancelable: true,
          }),
        );

      host.trigger.set(['contextMenu', 'hover']);
      fixture.detectChanges();
      trigger.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
      escape();
      fixture.detectChanges();

      pointer(trigger, 'pointerenter');
      fixture.detectChanges();
      pointer(trigger, 'pointerdown');
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'contextMenu' },
        { open: false, source: 'escape-key' },
        { open: true, source: 'hover' },
        { open: false, source: 'press' },
      ]);
    });

    it('reports a touch long-press and the timer that hides it', () => {
      vi.useFakeTimers();
      const { fixture, host, trigger } = createHost();

      pointer(trigger, 'pointerdown', 'touch');
      vi.advanceTimersByTime(ANDES_TOOLTIP_LONG_PRESS_DELAY);
      fixture.detectChanges();
      pointer(trigger, 'pointerup', 'touch');
      vi.advanceTimersByTime(ANDES_TOOLTIP_TOUCH_HIDE_DELAY);
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'touch' },
        { open: false, source: 'touch' },
      ]);
    });

    it('says nothing about a change made through open', () => {
      const { fixture, host } = createHost();

      host.open.set(true);
      fixture.detectChanges();
      host.open.set(false);
      fixture.detectChanges();

      expect(host.details).toEqual([]);
    });

    it('reports a tooltip disabled while open as closed by "disabled"', () => {
      const { fixture, host, trigger } = createHost();
      trigger.focus();
      fixture.detectChanges();

      host.tooltipDisabled.set(true);
      fixture.detectChanges();

      expect(host.details).toEqual([
        { open: true, source: 'focus' },
        { open: false, source: 'disabled' },
      ]);
    });
  });
});

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger],
  template: `
    <andes-tooltip content="Open from the start" defaultOpen>
      <button type="button" id="trigger" andesTooltipTrigger>Trigger</button>
    </andes-tooltip>
  `,
})
class DefaultOpenHostComponent {}

describe('AndesTooltip defaultOpen', () => {
  withElementGeometry();

  it('starts open, and the user can close it', () => {
    const fixture = TestBed.createComponent(DefaultOpenHostComponent);
    fixture.detectChanges();
    const panel = () => document.querySelector('.andes-tooltip');

    expect(panel()?.textContent?.trim()).toBe('Open from the start');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});

describe('AndesTooltipGroup', () => {
  const member = () => ({ dismiss: vi.fn() });
  const rect = (left: number) => new DOMRect(left, 0, 10, 10);

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dismisses the showing tooltip and hands its position to the next one', () => {
    const group = new AndesTooltipGroup();
    const first = member();
    const second = member();

    expect(group.claim(first, 400)).toBeNull();
    group.update(first, rect(5));
    expect(group.hasOpen()).toBe(true);

    expect(group.claim(second, 400)).toEqual(rect(5));
    expect(first.dismiss).toHaveBeenCalledTimes(1);
    expect(second.dismiss).not.toHaveBeenCalled();
  });

  it('hands over the last position for a while after the tooltip closed', () => {
    vi.useFakeTimers();
    const group = new AndesTooltipGroup();
    const first = member();
    group.claim(first, 400);
    group.update(first, rect(7));
    group.release(first);
    group.notifyClosed();

    expect(group.hasOpen()).toBe(false);
    vi.advanceTimersByTime(399);
    expect(group.claim(member(), 400)).toEqual(rect(7));
  });

  it('has nothing to hand over once the window has passed', () => {
    vi.useFakeTimers();
    const group = new AndesTooltipGroup();
    const first = member();
    group.claim(first, 400);
    group.update(first, rect(7));
    group.release(first);
    group.notifyClosed();

    vi.advanceTimersByTime(401);
    expect(group.claim(member(), 400)).toBeNull();
  });

  it('ignores a release by a tooltip that was already replaced', () => {
    const group = new AndesTooltipGroup();
    const first = member();
    const second = member();
    group.claim(first, 400);
    group.claim(second, 400);

    group.release(first);

    expect(group.hasOpen()).toBe(true);
  });
});

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger, AndesTooltipProvider],
  template: `
    <div
      andesTooltipProvider
      [unique]="unique()"
      [openDelay]="openDelay()"
      [closeDelay]="closeDelay()"
    >
      <andes-tooltip content="First" [openDelay]="firstOpenDelay()">
        <button type="button" id="first" andesTooltipTrigger>First</button>
      </andes-tooltip>
      <andes-tooltip content="Second">
        <button type="button" id="second" andesTooltipTrigger>Second</button>
      </andes-tooltip>
    </div>
    <andes-tooltip content="Outside" [openDelay]="0">
      <button type="button" id="outside" andesTooltipTrigger>Outside</button>
    </andes-tooltip>
  `,
})
class ProviderHostComponent {
  readonly unique = signal(false);
  readonly openDelay = signal<number | undefined>(undefined);
  readonly closeDelay = signal<number | undefined>(undefined);
  readonly firstOpenDelay = signal<number | undefined>(undefined);
}

describe('andesTooltipProvider', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(ProviderHostComponent);
    fixture.detectChanges();
    const query = (id: string) =>
      fixture.nativeElement.querySelector(`#${id}`) as HTMLButtonElement;
    const panels = () =>
      [...document.querySelectorAll('.andes-tooltip')].map((el) =>
        el.textContent?.trim(),
      );
    return {
      fixture,
      host: fixture.componentInstance,
      first: query('first'),
      second: query('second'),
      outside: query('outside'),
      panels,
    };
  }

  const enter = (element: HTMLElement) =>
    element.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
  const leave = (element: HTMLElement) =>
    element.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives the tooltips inside its open delay', () => {
    vi.useFakeTimers();
    const { fixture, host, first, panels } = createHost();
    host.openDelay.set(250);
    fixture.detectChanges();

    enter(first);
    vi.advanceTimersByTime(249);
    expect(panels()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(panels()).toEqual(['First']);
  });

  it('gives the tooltips inside its close delay', () => {
    vi.useFakeTimers();
    const { fixture, host, first, panels } = createHost();
    host.openDelay.set(0);
    host.closeDelay.set(500);
    fixture.detectChanges();

    enter(first);
    leave(first);
    vi.advanceTimersByTime(499);
    expect(panels()).toEqual(['First']);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(panels()).toEqual([]);
  });

  it("keeps a tooltip's own open delay over the provider's", () => {
    vi.useFakeTimers();
    const { fixture, host, first, panels } = createHost();
    host.openDelay.set(250);
    host.firstOpenDelay.set(50);
    fixture.detectChanges();

    enter(first);
    vi.advanceTimersByTime(50);

    expect(panels()).toEqual(['First']);
  });

  it('keeps the default delay outside it', () => {
    vi.useFakeTimers();
    const { fixture, host, outside, panels } = createHost();
    host.openDelay.set(1000);
    fixture.detectChanges();

    enter(outside);

    // The outside tooltip sets `[openDelay]="0"` itself, so it opens at once.
    expect(panels()).toEqual(['Outside']);
  });

  it('opens a second tooltip only after its delay when the group is not unique', () => {
    vi.useFakeTimers();
    const { fixture, host, first, second, panels } = createHost();
    host.openDelay.set(300);
    fixture.detectChanges();

    enter(first);
    vi.advanceTimersByTime(300);
    leave(first);
    enter(second);
    fixture.detectChanges();

    // The first one is still within its hoverable grace and the second one is waiting.
    expect(panels()).toEqual(['First']);
  });

  it('shows one tooltip at a time and opens the next at once when unique', () => {
    vi.useFakeTimers();
    const { fixture, host, first, second, panels } = createHost();
    host.unique.set(true);
    host.openDelay.set(300);
    fixture.detectChanges();

    enter(first);
    vi.advanceTimersByTime(300);
    expect(panels()).toEqual(['First']);

    leave(first);
    enter(second);
    fixture.detectChanges();

    expect(panels()).toEqual(['Second']);
  });

  it('does not take over a tooltip of another group', () => {
    vi.useFakeTimers();
    const { fixture, host, first, outside, panels } = createHost();
    host.unique.set(true);
    host.openDelay.set(0);
    fixture.detectChanges();

    enter(first);
    enter(outside);

    expect(panels().sort()).toEqual(['First', 'Outside']);
  });
});

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger],
  providers: [provideAndesTooltipConfig({ unique: true, openDelay: 250 })],
  template: `
    <andes-tooltip content="First">
      <button type="button" id="first" andesTooltipTrigger>First</button>
    </andes-tooltip>
    <andes-tooltip content="Second">
      <button type="button" id="second" andesTooltipTrigger>Second</button>
    </andes-tooltip>
  `,
})
class ConfigHostComponent {}

describe('provideAndesTooltipConfig', () => {
  withElementGeometry();

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shares its defaults, and its unique group, with the tooltips below it', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ConfigHostComponent);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('#first') as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '#second',
    ) as HTMLElement;
    const panels = () =>
      [...document.querySelectorAll('.andes-tooltip')].map((el) =>
        el.textContent?.trim(),
      );

    first.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    vi.advanceTimersByTime(249);
    expect(panels()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(panels()).toEqual(['First']);

    first.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    second.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    expect(panels()).toEqual(['Second']);
  });
});

describe('AndesTooltip smooth transition', () => {
  withElementGeometry();

  /** Where the pane of the tooltip being measured stands. */
  let paneRect = new DOMRect(100, 50, 80, 34);
  const animate = vi.fn();
  let finish: (() => void) | undefined;

  beforeEach(() => {
    paneRect = new DOMRect(100, 50, 80, 34);
    animate.mockReset();
    finish = undefined;
    animate.mockImplementation(() => ({
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'finish') {
          finish = listener;
        }
      },
    }));
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      writable: true,
      value: animate,
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        return this.classList.contains('cdk-overlay-pane')
          ? paneRect
          : new DOMRect(0, 0, 0, 0);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (Element.prototype as unknown as Record<string, unknown>)['animate'];
    vi.useRealTimers();
  });

  function setup() {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ProviderHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.unique.set(true);
    fixture.componentInstance.openDelay.set(0);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('#first') as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '#second',
    ) as HTMLElement;
    const enter = (element: HTMLElement) =>
      element.dispatchEvent(
        new PointerEvent('pointerenter', { pointerType: 'mouse' }),
      );
    const leave = (element: HTMLElement) =>
      element.dispatchEvent(
        new PointerEvent('pointerleave', { pointerType: 'mouse' }),
      );
    return { fixture, first, second, enter, leave };
  }

  it('glides the next tooltip in from where the previous one stood', () => {
    const { fixture, first, second, enter, leave } = setup();

    enter(first);
    fixture.detectChanges();
    leave(first);
    paneRect = new DOMRect(300, 50, 80, 34);
    enter(second);
    fixture.detectChanges();

    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, options] = animate.mock.calls[0];
    expect(keyframes).toEqual([
      { translate: '-200px 0px' },
      { translate: '0 0' },
    ]);
    expect(options).toMatchObject({ duration: ANDES_TOOLTIP_HANDOFF_DURATION });
    const root = document.querySelector('.andes-tooltip') as HTMLElement;
    expect(root.textContent?.trim()).toBe('Second');
    expect(root.hasAttribute('data-handoff')).toBe(true);

    finish?.();
    expect(root.hasAttribute('data-handoff')).toBe(false);
  });

  it('does not glide a tooltip that opens with nothing before it', () => {
    const { fixture, first, enter } = setup();

    enter(first);
    fixture.detectChanges();

    expect(animate).not.toHaveBeenCalled();
    expect(
      document.querySelector('.andes-tooltip')?.hasAttribute('data-handoff'),
    ).toBe(false);
  });

  it('does not glide when the two tooltips stand in the same place', () => {
    const { fixture, first, second, enter, leave } = setup();

    enter(first);
    fixture.detectChanges();
    leave(first);
    enter(second);
    fixture.detectChanges();

    expect(animate).not.toHaveBeenCalled();
  });

  it('does not glide under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
    }));
    const { fixture, first, second, enter, leave } = setup();

    enter(first);
    fixture.detectChanges();
    leave(first);
    paneRect = new DOMRect(300, 50, 80, 34);
    enter(second);
    fixture.detectChanges();

    expect(animate).not.toHaveBeenCalled();
    expect(document.querySelector('.andes-tooltip')?.textContent?.trim()).toBe(
      'Second',
    );
  });

  it('does not glide in a group that is not unique', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ProviderHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.openDelay.set(0);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('#first') as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '#second',
    ) as HTMLElement;

    first.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    fixture.detectChanges();
    first.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE);
    paneRect = new DOMRect(300, 50, 80, 34);
    second.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    fixture.detectChanges();

    expect(animate).not.toHaveBeenCalled();
  });
});

/** The declarations between the braces of the rule whose selector is exactly `selector`. */
function ruleBody(css: string, selector: string): string {
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at < 0) {
      return '';
    }
    const end = at + selector.length;
    const open = css.indexOf('{', end);
    if (open >= 0 && css.slice(end, open).trim() === '') {
      return css.slice(open + 1, css.indexOf('}', open));
    }
    from = at + 1;
  }
}
