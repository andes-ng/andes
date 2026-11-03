import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AndesColor } from './color';
import type { AndesColorFormat } from './color-math';
import {
  AndesColorPicker,
  ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY,
  ANDES_COLOR_PICKER_HOVER_OPEN_DELAY,
} from './color-picker';
import type {
  AndesColorChangeEvent,
  AndesColorPickerMode,
  AndesColorPickerPlacement,
  AndesColorPickerTriggerAction,
  AndesColorPickerValue,
  AndesColorPreset,
} from './color-picker-types';
import { AndesGradient } from './gradient';

const read = (file: string) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

/** jsdom has no clipboard: give `navigator` one for a test (`undefined` for none). */
function mockClipboard(clipboard: Partial<Clipboard> | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    get: () => clipboard,
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let current: ComponentFixture<unknown> | null = null;

function press(
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, 'keyCode', {
    get: () => ({ Escape: 27, Enter: 13 })[key] ?? 0,
  });
  target.dispatchEvent(event);
  current?.detectChanges();
  return event;
}

function pointer(
  target: Element,
  type: string,
  init: { x?: number; touch?: boolean; bubbles?: boolean } = {},
): void {
  const event = new MouseEvent(type, {
    bubbles: init.bubbles ?? true,
    cancelable: true,
    button: 0,
    clientX: init.x ?? 0,
    clientY: 0,
  });
  Object.defineProperty(event, 'pointerType', {
    get: () => (init.touch ? 'touch' : 'mouse'),
  });
  Object.defineProperty(event, 'pointerId', { get: () => 1 });
  target.dispatchEvent(event);
  current?.detectChanges();
}

function rect(left: number, top: number, width: number, height: number) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

@Component({
  imports: [AndesColorPicker],
  template: `<andes-color-picker
    aria-label="Brand"
    [(value)]="value"
    [(open)]="open"
    [(recent)]="recent"
    [mode]="mode()"
    [trigger]="trigger()"
    [arrow]="arrow()"
    [placement]="placement()"
    [readOnly]="readOnly()"
    [disabled]="disabled()"
    [allowClear]="allowClear()"
    [showText]="showText()"
    [showCopy]="showCopy()"
    [confirm]="confirm()"
    [name]="name()"
    [contrastWith]="contrastWith()"
    [recentColors]="recentColors()"
    [recentColorsMax]="recentColorsMax()"
    [recentColorsStorageKey]="storageKey()"
    [defaultFormat]="defaultFormat()"
    [presets]="presets()"
    [eyeDropper]="false"
    [labels]="labels()"
    (colorChange)="changes.push($event)"
    (colorChangeComplete)="completes.push($event)"
    (applied)="applied.push($event)"
    (cancelled)="cancelled = cancelled + 1"
    (copied)="copied.push($event)"
    (clear)="clears = clears + 1"
  >
    <strong slot="panel-header" class="my-header">Header</strong>
    <button slot="panel-footer" type="button" class="my-footer">Reset</button>
  </andes-color-picker>`,
})
class FeatureHost {
  readonly value = signal<AndesColorPickerValue | null>('#1677ff');
  readonly open = signal(false);
  readonly recent = signal<readonly string[]>([]);
  readonly mode = signal<AndesColorPickerMode>('single');
  readonly trigger = signal<AndesColorPickerTriggerAction>('click');
  readonly arrow = signal(false);
  readonly placement = signal<AndesColorPickerPlacement>('bottomLeft');
  readonly readOnly = signal(false);
  readonly disabled = signal(false);
  readonly allowClear = signal(false);
  readonly showText = signal(false);
  readonly showCopy = signal(true);
  readonly confirm = signal(false);
  readonly name = signal<string | null>(null);
  readonly contrastWith = signal<string | null>(null);
  readonly recentColors = signal(false);
  readonly recentColorsMax = signal(8);
  readonly storageKey = signal<string | null>(null);
  readonly defaultFormat = signal<AndesColorFormat>('hex');
  readonly presets = signal<readonly AndesColorPreset[]>([]);
  readonly labels = signal<Record<string, string>>({});
  readonly changes: AndesColorChangeEvent[] = [];
  readonly completes: AndesColorChangeEvent[] = [];
  readonly applied: (AndesColorPickerValue | null)[] = [];
  readonly copied: string[] = [];
  cancelled = 0;
  clears = 0;
}

describe('AndesColorPicker features', () => {
  afterEach(() => {
    current = null;
    vi.restoreAllMocks();
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  });

  function setup(configure?: (host: FeatureHost) => void) {
    const fixture = TestBed.createComponent(FeatureHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    current = fixture;
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;
    const trigger = () =>
      root.querySelector<HTMLButtonElement>(
        '[data-slot="color-picker-trigger"]',
      ) as HTMLButtonElement;
    const panel = () =>
      document.querySelector<HTMLElement>('[data-slot="color-picker-panel"]');
    const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
      panel()?.querySelector<T>(selector) ?? null;
    const all = <T extends HTMLElement = HTMLElement>(selector: string) =>
      Array.from(panel()?.querySelectorAll<T>(selector) ?? []);
    const detect = () => fixture.detectChanges();
    const open = async () => {
      trigger().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const field = (label: string) =>
      q<HTMLInputElement>(`input[aria-label="${label}"]`) as HTMLInputElement;
    const type = (input: HTMLInputElement, text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    };
    // The number and text fields commit when they lose focus.
    const commit = (input: HTMLInputElement) => {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };
    const stops = () =>
      all('[data-slot="color-picker-gradient-stop"]') as HTMLElement[];
    return {
      fixture,
      root,
      host,
      trigger,
      panel,
      q,
      all,
      detect,
      open,
      field,
      type,
      commit,
      stops,
    };
  }

  // ----- trigger="hover" -------------------------------------------------------------

  describe('hover trigger', () => {
    it('opens after the delay without taking focus, and closes after leaving', async () => {
      const { trigger, panel, fixture, host } = setup((h) =>
        h.trigger.set('hover'),
      );
      trigger().focus();
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY / 2);
      fixture.detectChanges();
      expect(panel()).toBeNull();

      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).not.toBeNull();
      expect(host.open()).toBe(true);
      expect(document.activeElement).toBe(trigger());
      expect(panel()?.getAttribute('data-trigger')).toBe('hover');

      pointer(trigger(), 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 40);
      fixture.detectChanges();
      expect(panel()).toBeNull();
      // Leaving does not pull focus anywhere.
      expect(document.activeElement).toBe(trigger());
    });

    it('stays open while the pointer travels into the panel and closes once it leaves', async () => {
      const { trigger, panel, fixture } = setup((h) => h.trigger.set('hover'));
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      const surface = panel() as HTMLElement;

      pointer(trigger(), 'pointerleave', { bubbles: false });
      // Within the grace period the pointer arrives on the panel.
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY / 2);
      pointer(surface, 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 40);
      fixture.detectChanges();
      expect(panel()).not.toBeNull();

      pointer(surface, 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 40);
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('does not open when the pointer leaves before the delay', async () => {
      const { trigger, panel, fixture } = setup((h) => h.trigger.set('hover'));
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(40);
      pointer(trigger(), 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('is pinned by a press inside the panel or a click on the trigger', async () => {
      const { trigger, panel, fixture, q } = setup((h) =>
        h.trigger.set('hover'),
      );
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      pointer(q('andes-color-area') as HTMLElement, 'pointerdown');
      pointer(q('andes-color-area') as HTMLElement, 'pointerup');
      pointer(panel() as HTMLElement, 'pointerleave', { bubbles: false });
      pointer(trigger(), 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 40);
      fixture.detectChanges();
      expect(panel()).not.toBeNull();

      // A click on the trigger of a pinned panel closes it.
      trigger().click();
      fixture.detectChanges();
      expect(panel()).toBeNull();

      // Hover-opened, then clicked: pinned, with focus moved into the panel.
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      trigger().click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(q('andes-color-area'));
      pointer(trigger(), 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 40);
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
    });

    it('ignores touch hover; a tap opens it like a click', async () => {
      const { trigger, panel, fixture, q } = setup((h) =>
        h.trigger.set('hover'),
      );
      pointer(trigger(), 'pointerdown', { touch: true });
      pointer(trigger(), 'pointerenter', { touch: true, bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      expect(panel()).toBeNull();

      trigger().click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).not.toBeNull();
      expect(document.activeElement).toBe(q('andes-color-area'));
    });

    it('opens from the keyboard with ArrowDown and Escape returns focus', async () => {
      const { trigger, panel, fixture, q } = setup((h) =>
        h.trigger.set('hover'),
      );
      trigger().focus();
      const event = press(trigger(), 'ArrowDown');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(event.defaultPrevented).toBe(true);
      expect(panel()).not.toBeNull();
      expect(document.activeElement).toBe(q('andes-color-area'));

      press(document.activeElement as Element, 'Escape');
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('leaves the click trigger alone: no hover opening, no ArrowDown', async () => {
      const { trigger, panel, fixture } = setup();
      pointer(trigger(), 'pointerenter', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_OPEN_DELAY + 30);
      fixture.detectChanges();
      expect(panel()).toBeNull();
      const event = press(trigger(), 'ArrowDown');
      expect(event.defaultPrevented).toBe(false);
      expect(panel()).toBeNull();
      expect(trigger().hasAttribute('data-trigger')).toBe(false);
    });

    it('bridges the gap with invisible pseudo-elements on both sides', () => {
      const css = read('color-picker.css');
      expect(css).toMatch(
        /\.andes-color-picker__panel\[data-trigger='hover'\]::before \{ bottom: 100%; \}/,
      );
      expect(css).toMatch(
        /\.andes-color-picker__panel\[data-trigger='hover'\]::after \{ top: 100%; \}/,
      );
      expect(css).toMatch(/height: var\(--_bridge\)/);
    });
  });

  // ----- arrow -----------------------------------------------------------------------

  describe('arrow', () => {
    function placeElements(pane: DOMRect, anchor: DOMRect) {
      const original = HTMLElement.prototype.getBoundingClientRect;
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect',
      ).mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains('cdk-overlay-pane')) {
          return pane;
        }
        if (this.matches('[data-slot="color-picker-trigger"]')) {
          return anchor;
        }
        return original.call(this);
      });
    }

    it('is absent by default and drawn on the panel with arrow', async () => {
      const off = setup();
      await off.open();
      expect(off.q('[data-slot="color-picker-arrow"]')).toBeNull();
      expect(off.panel()?.hasAttribute('data-arrow')).toBe(false);
      off.trigger().click();
      off.detect();

      const on = setup((h) => h.arrow.set(true));
      await on.open();
      const arrow = on.q('[data-slot="color-picker-arrow"]');
      expect(arrow?.getAttribute('aria-hidden')).toBe('true');
      expect(arrow?.getAttribute('data-side')).toBe('bottom');
      expect(on.panel()?.hasAttribute('data-arrow')).toBe(true);
    });

    it('points at the trigger, 16px in from the aligned edge', async () => {
      placeElements(rect(100, 60, 282, 300), rect(100, 20, 32, 32));
      const { open, q } = setup((h) => h.arrow.set(true));
      await open();
      expect(q('[data-slot="color-picker-arrow"]')?.style.left).toBe('16px');
    });

    it('follows a panel aligned to the end, shifted, or flipped above', async () => {
      placeElements(rect(400, 60, 282, 300), rect(620, 20, 62, 32));
      const end = setup((h) => {
        h.arrow.set(true);
        h.placement.set('bottomRight');
      });
      await end.open();
      expect(end.q('[data-slot="color-picker-arrow"]')?.style.left).toBe(
        '266px',
      );
      end.trigger().click();
      end.detect();
      vi.restoreAllMocks();

      // Shifted into the window: at the trigger's centre.
      placeElements(rect(0, 60, 282, 300), rect(40, 20, 32, 32));
      const shifted = setup((h) => h.arrow.set(true));
      await shifted.open();
      expect(shifted.q('[data-slot="color-picker-arrow"]')?.style.left).toBe(
        '56px',
      );
      shifted.trigger().click();
      shifted.detect();
      vi.restoreAllMocks();

      // No room below: the overlay put it above, and the arrow follows.
      placeElements(rect(100, 0, 282, 300), rect(100, 320, 32, 32));
      const flipped = setup((h) => h.arrow.set(true));
      await flipped.open();
      expect(
        flipped
          .q('[data-slot="color-picker-arrow"]')
          ?.getAttribute('data-side'),
      ).toBe('top');
      expect(flipped.panel()?.getAttribute('data-side')).toBe('top');
    });

    it('is drawn for both sides in the panel colour, clipped to its outer half', () => {
      const css = read('color-picker.css');
      expect(css).toMatch(
        /\.andes-color-picker__arrow \{[^}]*background-color: var\(--andes-color-popover/,
      );
      expect(css).toMatch(
        /\.andes-color-picker__arrow\[data-side='bottom'\] \{[^}]*top: -0\.3125rem;[^}]*clip-path/,
      );
      expect(css).toMatch(
        /\.andes-color-picker__arrow\[data-side='top'\] \{[^}]*bottom: -0\.3125rem;[^}]*clip-path/,
      );
      expect(css).toMatch(
        /forced-colors: active[^}]*__arrow \{ border-color: CanvasText/,
      );
    });
  });

  describe('direction', () => {
    it('copies the picker direction onto the popup, which lives outside its container', async () => {
      const ltr = setup();
      await ltr.open();
      expect(ltr.panel()?.getAttribute('dir')).toBe('ltr');
      ltr.trigger().click();
      ltr.detect();

      const rtl = setup();
      rtl.root.setAttribute('dir', 'rtl');
      rtl.root.style.direction = 'rtl';
      await rtl.open();
      expect(rtl.panel()?.getAttribute('dir')).toBe('rtl');
    });
  });

  // ----- name, readOnly ----------------------------------------------------------------

  describe('name', () => {
    const hidden = (root: HTMLElement) =>
      root.querySelector<HTMLInputElement>('input[type="hidden"]');

    it('renders nothing by default', () => {
      expect(hidden(setup().root)).toBeNull();
    });

    it('carries the value text for native form posts', () => {
      const { root, host, detect } = setup((h) => h.name.set('brand'));
      const input = hidden(root) as HTMLInputElement;
      expect(input.name).toBe('brand');
      expect(input.value).toBe('#1677ff');
      // Inside the host, so a surrounding <form> includes it.
      expect(input.closest('andes-color-picker')).not.toBeNull();

      host.value.set(AndesColor.parse('rgb(255, 0, 0)'));
      host.defaultFormat.set('rgb');
      detect();
      expect(input.value).toBe('rgb(255, 0, 0)');

      host.value.set(null);
      detect();
      expect(input.value).toBe('');

      host.disabled.set(true);
      detect();
      expect(input.disabled).toBe(true);
    });

    it('carries the CSS gradient in gradient mode', () => {
      const { root } = setup((h) => {
        h.name.set('background');
        h.mode.set('gradient');
        h.value.set('linear-gradient(red, blue)');
      });
      expect(hidden(root)?.value).toBe(
        'linear-gradient(180deg, #ff0000 0%, #0000ff 100%)',
      );
    });
  });

  describe('readOnly', () => {
    async function readOnlySetup() {
      const helpers = setup((h) => {
        h.readOnly.set(true);
        h.allowClear.set(true);
        h.presets.set([{ label: 'Warm', colors: ['#ff0000'] }]);
      });
      await helpers.open();
      return helpers;
    }

    it('announces itself on the trigger but still opens', async () => {
      const { trigger, panel } = await readOnlySetup();
      expect(trigger().getAttribute('aria-label')).toBe(
        'Brand, #1677ff, read-only',
      );
      expect(trigger().hasAttribute('data-readonly')).toBe(true);
      expect(trigger().disabled).toBe(false);
      expect(panel()).not.toBeNull();
    });

    it('keeps every control focusable but changes nothing', async () => {
      const { q, host, field, all } = await readOnlySetup();
      const area = q('andes-color-area') as HTMLElement;
      expect(area.getAttribute('aria-readonly')).toBe('true');
      expect(area.getAttribute('tabindex')).toBe('0');
      press(area, 'ArrowLeft');
      pointer(area, 'pointerdown');
      const hue = q('andes-color-slider[data-type="hue"]') as HTMLElement;
      expect(hue.getAttribute('aria-readonly')).toBe('true');
      press(hue, 'ArrowRight');

      expect(field('Hex color').readOnly).toBe(true);
      expect(field('Opacity').readOnly).toBe(true);
      expect(
        (
          q(
            '[data-slot="color-picker-format"] [role="combobox"]',
          ) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (q('[data-slot="color-picker-clear"]') as HTMLButtonElement).disabled,
      ).toBe(true);
      const preset = all('[data-slot="color-picker-preset"]')[0];
      expect(preset.getAttribute('aria-disabled')).toBe('true');
      preset.click();

      expect(host.value()).toBe('#1677ff');
      expect(host.changes).toEqual([]);
    });

    it('still copies', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      mockClipboard({ writeText });
      const { q, fixture } = await readOnlySetup();
      const copy = q<HTMLButtonElement>(
        '[data-slot="color-picker-copy"] button',
      );
      expect(copy?.disabled).toBe(false);
      copy?.click();
      await fixture.whenStable();
      expect(writeText).toHaveBeenCalledWith('#1677ff');
    });
  });

  // ----- format select, a list inside the popup ----------------------------------------

  describe('format select', () => {
    async function openedList(configure?: (host: FeatureHost) => void) {
      const ctx = setup(configure);
      await ctx.open();
      const combobox = ctx.q<HTMLButtonElement>(
        '[data-slot="color-picker-format"] [role="combobox"]',
      ) as HTMLButtonElement;
      combobox.focus();
      combobox.click();
      ctx.detect();
      await ctx.fixture.whenStable();
      ctx.detect();
      const list = () =>
        document.querySelector<HTMLElement>('[data-slot="select-content"]');
      const options = () =>
        Array.from(
          list()?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
        );
      return { ...ctx, combobox, list, options };
    }

    // The layer token of the overlay a node sits in (the nearest ancestor that carries one).
    function layerOf(node: HTMLElement | null): string | null {
      for (let el = node; el; el = el.parentElement) {
        const match = /--andes-z-index-(\w+)/.exec(
          el.getAttribute('style') ?? '',
        );
        if (match) {
          return match[1];
        }
      }
      return null;
    }

    it('opens its list above the popup', async () => {
      const { list, panel, options } = await openedList();
      expect(list()).not.toBeNull();
      expect(options().map((o) => o.textContent?.trim())).toEqual([
        'HEX',
        'RGB',
        'HSB',
        'HSL',
        'OKLCH',
      ]);
      expect(layerOf(panel())).toBe('popover');
      expect(layerOf(list())).toBe('tooltip');
    });

    it('does not close the picker when its list is clicked or an option is chosen', async () => {
      const { list, panel, options, host, detect, fixture, field, trigger } =
        await openedList();
      // A press on the list itself is inside the picker, not outside it.
      const pane = list() as HTMLElement;
      pane.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      pane.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      detect();
      expect(host.open()).toBe(true);
      expect(list()).not.toBeNull();

      for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click']) {
        options()[1].dispatchEvent(new MouseEvent(type, { bubbles: true }));
      }
      detect();
      await fixture.whenStable();
      detect();
      expect(list()).toBeNull();
      expect(host.open()).toBe(true);
      expect(panel()).not.toBeNull();
      expect(field('Red')).not.toBeNull();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });

    it('closes only the list on Escape and hands focus back to the select trigger', async () => {
      const { list, panel, options, host, detect, fixture, combobox } =
        await openedList();
      press(options()[0] ?? combobox, 'Escape');
      await fixture.whenStable();
      detect();
      expect(list()).toBeNull();
      expect(host.open()).toBe(true);
      expect(panel()).not.toBeNull();
      expect(document.activeElement).toBe(combobox);

      // The next Escape closes the picker.
      press(combobox, 'Escape');
      await fixture.whenStable();
      detect();
      expect(host.open()).toBe(false);
    });

    it('closes both when the press lands outside the picker', async () => {
      const { list, host, detect, fixture } = await openedList();
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      detect();
      outside.remove();
      expect(list()).toBeNull();
      expect(host.open()).toBe(false);
    });

    it('keeps a hover-opened picker open while its list is up', async () => {
      const { combobox, trigger, host, detect, fixture } = await openedList(
        (h) => h.trigger.set('hover'),
      );
      expect(combobox.getAttribute('aria-expanded')).toBe('true');
      pointer(trigger(), 'pointerleave', { bubbles: false });
      await wait(ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY + 60);
      detect();
      await fixture.whenStable();
      expect(host.open()).toBe(true);
    });
  });

  // ----- copy --------------------------------------------------------------------------

  describe('copy', () => {
    it('copies the value in the current format, confirms and announces it', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      mockClipboard({ writeText });
      const { q, open, host, fixture, detect } = setup((h) =>
        h.defaultFormat.set('rgb'),
      );
      await open();
      const copy = q<HTMLButtonElement>(
        '[data-slot="color-picker-copy"] button',
      ) as HTMLButtonElement;
      expect(copy.getAttribute('aria-label')).toBe('Copy color value');
      const status = q('[data-slot="color-picker-copy-status"]') as HTMLElement;
      expect(status.getAttribute('aria-live')).toBe('polite');
      expect(status.textContent?.trim()).toBe('');

      copy.click();
      await fixture.whenStable();
      detect();
      expect(writeText).toHaveBeenCalledWith('rgb(22, 119, 255)');
      expect(host.copied).toEqual(['rgb(22, 119, 255)']);
      const copyHost = copy.closest(
        '[data-slot="color-picker-copy"]',
      ) as HTMLElement;
      expect(copyHost.hasAttribute('data-copied')).toBe(true);
      expect(copyHost.getAttribute('title')).toBe('Copied');
      expect(status.textContent?.trim()).toBe('Copied');
    });

    it('falls back to execCommand without the clipboard API', async () => {
      mockClipboard(undefined);
      const execCommand = vi.fn().mockReturnValue(true);
      (document as unknown as { execCommand: unknown }).execCommand =
        execCommand;
      const { q, open, host, fixture } = setup();
      await open();
      q<HTMLButtonElement>('[data-slot="color-picker-copy"] button')?.click();
      await fixture.whenStable();
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(host.copied).toEqual(['#1677ff']);
      // The helper text area is gone again.
      expect(document.querySelector('body > textarea')).toBeNull();
    });

    it('reports nothing when copying fails, and is localizable or hidden', async () => {
      mockClipboard({
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      });
      (document as unknown as { execCommand: unknown }).execCommand = vi
        .fn()
        .mockReturnValue(false);
      const { q, open, host, fixture } = setup((h) =>
        h.labels.set({ copy: 'Copiar', copied: 'Copiado' }),
      );
      await open();
      const copy = q<HTMLButtonElement>(
        '[data-slot="color-picker-copy"] button',
      ) as HTMLButtonElement;
      expect(copy.getAttribute('aria-label')).toBe('Copiar');
      copy.click();
      await fixture.whenStable();
      expect(host.copied).toEqual([]);
      expect(copy.hasAttribute('data-copied')).toBe(false);

      const hiddenCopy = setup((h) => h.showCopy.set(false));
      await hiddenCopy.open();
      expect(hiddenCopy.q('[data-slot="color-picker-copy"] button')).toBeNull();
    });
  });

  // ----- formats -----------------------------------------------------------------------

  describe('HSL and OKLCH formats', () => {
    it('edits HSL channels and writes hsl() text', async () => {
      const { open, field, type, commit, host } = setup((h) => {
        h.defaultFormat.set('hsl');
        h.value.set('hsl(210 50% 40%)');
      });
      await open();
      expect(field('Hue').value).toBe('210');
      expect(field('Saturation').value).toBe('50');
      expect(field('Lightness').value).toBe('40');

      type(field('Lightness'), '60');
      commit(field('Lightness'));
      expect(host.value()).toBe('hsl(210, 50%, 60%)');
      type(field('Saturation'), '0');
      commit(field('Saturation'));
      // A grey keeps the hue it was edited with.
      expect(field('Hue').value).toBe('210');
    });

    it('edits OKLCH lightness, chroma and hue and writes oklch() text', async () => {
      const { open, field, type, commit, host } = setup((h) => {
        h.defaultFormat.set('oklch');
        h.value.set('#ff0000');
      });
      await open();
      expect(field('Lightness').value).toBe('62.8');
      expect(field('Chroma').value).toBe('0.258');
      expect(field('Hue').value).toBe('29');
      expect(field('Chroma').getAttribute('aria-valuemax')).toBe('0.4');
      expect(field('Chroma').getAttribute('aria-valuemin')).toBe('0');
      expect(field('Chroma').getAttribute('inputmode')).toBe('decimal');
      expect(field('Lightness').getAttribute('aria-valuemax')).toBe('100');
      // The arrow keys step by the field's own step: 0.001 for chroma, 0.1 for lightness.
      press(field('Chroma'), 'ArrowUp');
      expect(field('Chroma').value).toBe('0.259');
      press(field('Lightness'), 'ArrowDown');
      expect(field('Lightness').value).toBe('62.7');

      // In the sRGB gamut the colour takes the numbers as they are...
      type(field('Chroma'), '0.1');
      commit(field('Chroma'));
      type(field('Lightness'), '50');
      commit(field('Lightness'));
      expect(host.value()).toMatch(/^oklch\(50% 0\.1 29\.2\d\)$/);
      // ...outside it, the clip moves them (here the lightness) to the nearest sRGB colour.
      type(field('Chroma'), '0.4');
      commit(field('Chroma'));
      expect(field('Lightness').value).not.toBe('50');
      type(field('Chroma'), '0');
      commit(field('Chroma'));
      type(field('Lightness'), '50');
      commit(field('Lightness'));
      expect(host.value()).toBe('oklch(50% 0 0)');
      // Typing is never rewritten while the field is being edited, even where the colour
      // cannot follow (out of gamut); committing shows what the colour really is.
      type(field('Chroma'), '0.39');
      expect(field('Chroma').value).toBe('0.39');
      commit(field('Chroma'));
      expect(field('Chroma').value).not.toBe('0.39');
    });

    it('lays the number fields on a row of equal columns under the format switch', () => {
      const css = read('color-picker-panel.css').replace(/\s+/g, ' ');
      expect(css).toMatch(
        /\.andes-color-picker__values \{[^}]*display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
      );
      expect(css).toMatch(
        /\.andes-color-picker__fields-head \{[^}]*flex-wrap: wrap/,
      );
    });
  });

  // ----- contrast ----------------------------------------------------------------------

  describe('contrast', () => {
    it('is hidden without contrastWith', async () => {
      const { open, q } = setup();
      await open();
      expect(q('[data-slot="color-picker-contrast"]')).toBeNull();
    });

    it('shows the WCAG ratio and the AA / AAA badges', async () => {
      const { open, q, all, host, detect } = setup((h) => {
        h.value.set('#767676');
        h.contrastWith.set('#ffffff');
      });
      await open();
      const block = q('[data-slot="color-picker-contrast"]') as HTMLElement;
      expect(block.getAttribute('role')).toBe('group');
      expect(block.textContent).toContain('Contrast with #ffffff');
      expect(
        q('[data-slot="color-picker-contrast-ratio"]')?.textContent?.trim(),
      ).toBe('4.54:1');
      const badges = () =>
        Object.fromEntries(
          all('[data-slot="color-picker-contrast-badge"]').map((badge) => [
            badge.getAttribute('data-level'),
            badge.hasAttribute('data-pass'),
          ]),
        );
      expect(badges()).toEqual({
        'aa-normal': true,
        'aaa-normal': false,
        'aa-large': true,
        'aaa-large': true,
      });
      expect(
        all('[data-slot="color-picker-contrast-badge"]')[1].textContent,
      ).toContain('fail');

      host.value.set('#777777');
      detect();
      expect(
        q('[data-slot="color-picker-contrast-ratio"]')?.textContent?.trim(),
      ).toBe('4.47:1');
      expect(badges()['aa-normal']).toBe(false);

      host.value.set('#000000');
      detect();
      expect(
        q('[data-slot="color-picker-contrast-ratio"]')?.textContent?.trim(),
      ).toBe('21:1');
    });

    it('announces the result politely when a gesture ends', async () => {
      const { open, q } = setup((h) => {
        h.value.set('#000000');
        h.contrastWith.set('#ffffff');
      });
      await open();
      const status = q('[data-slot="color-picker-contrast-status"]');
      expect(status?.getAttribute('aria-live')).toBe('polite');
      expect(status?.textContent?.trim()).toBe('');
      press(q('andes-color-area') as HTMLElement, 'ArrowUp');
      expect(status?.textContent?.trim()).toBe(
        'Contrast 20.67 to 1. Normal text: AAA. Large text: AAA.',
      );
    });

    it('composites a translucent colour onto the background', async () => {
      const { open, q } = setup((h) => {
        h.value.set('rgba(0, 0, 0, 0.5)');
        h.contrastWith.set('#ffffff');
      });
      await open();
      expect(
        q('[data-slot="color-picker-contrast-ratio"]')?.textContent?.trim(),
      ).toBe('3.97:1');
    });
  });

  // ----- recent colours ----------------------------------------------------------------

  describe('recent colours', () => {
    afterEach(() => localStorage.clear());

    const recentLabels = (all: (s: string) => HTMLElement[]) =>
      all('[data-group="recent"] [data-slot="color-picker-preset"]').map((b) =>
        b.getAttribute('aria-label'),
      );

    it('records nothing unless asked', async () => {
      const { open, q, host } = setup();
      await open();
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft');
      expect(host.recent()).toEqual([]);
      expect(q('[data-group="recent"]')).toBeNull();
    });

    it('records committed colours, newest first, without duplicates, up to the max', async () => {
      const { open, q, all, host, field, type, commit } = setup((h) => {
        h.recentColors.set(true);
        h.recentColorsMax.set(2);
      });
      await open();
      // A drag step is not a commit; its end is.
      type(field('Hex color'), 'ff0000');
      expect(host.recent()).toEqual([]);
      commit(field('Hex color'));
      field('Hex color').dispatchEvent(new Event('blur'));
      expect(host.recent()).toEqual(['#ff0000']);

      type(field('Hex color'), '00ff00');
      field('Hex color').dispatchEvent(new Event('blur'));
      type(field('Hex color'), '0000ff');
      field('Hex color').dispatchEvent(new Event('blur'));
      expect(host.recent()).toEqual(['#0000ff', '#00ff00']);
      current?.detectChanges();
      expect(recentLabels(all)).toEqual(['#0000ff', '#00ff00']);
      const toggle = q(
        '[data-group="recent"] .andes-color-picker__group-toggle',
      );
      expect(toggle?.textContent?.trim()).toBe('Recent');

      // Picking a recent colour moves it to the front.
      all('[data-group="recent"] [data-slot="color-picker-preset"]')[1].click();
      expect(host.recent()).toEqual(['#00ff00', '#0000ff']);
    });

    it('saves to and restores from localStorage under the key', async () => {
      localStorage.setItem(
        'brand-recent',
        JSON.stringify(['#123456', 'nonsense', 42, '#abcdef']),
      );
      const { open, host, field, type } = setup((h) => {
        h.recentColors.set(true);
        h.storageKey.set('brand-recent');
      });
      expect(host.recent()).toEqual(['#123456', '#abcdef']);
      await open();
      type(field('Hex color'), 'ff0000');
      field('Hex color').dispatchEvent(new Event('blur'));
      expect(JSON.parse(localStorage.getItem('brand-recent') ?? '[]')).toEqual([
        '#ff0000',
        '#123456',
        '#abcdef',
      ]);
    });

    it('survives storage that throws or holds garbage', async () => {
      localStorage.setItem('broken', '{not json');
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const { open, host, field, type } = setup((h) => {
        h.recentColors.set(true);
        h.storageKey.set('broken');
      });
      expect(host.recent()).toEqual([]);
      await open();
      type(field('Hex color'), 'ff0000');
      field('Hex color').dispatchEvent(new Event('blur'));
      expect(host.recent()).toEqual(['#ff0000']);
    });

    it('takes a recent list from the app through [(recent)]', async () => {
      const { open, all } = setup((h) => {
        h.recentColors.set(true);
        h.recent.set(['#fa8c16', 'bad']);
      });
      await open();
      expect(recentLabels(all)).toEqual(['#fa8c16']);
    });
  });

  // ----- presets -----------------------------------------------------------------------

  describe('preset groups', () => {
    it('keeps a non-collapsible group open behind a plain heading', async () => {
      const { open, q, all } = setup((h) =>
        h.presets.set([
          {
            label: 'Fixed',
            collapsible: false,
            defaultOpen: false,
            colors: ['#ff0000'],
          },
          { label: 'Folding', colors: ['#00ff00'] },
        ]),
      );
      await open();
      const fixed = q('[data-group="preset-0"]') as HTMLElement;
      expect(
        fixed.querySelector('button.andes-color-picker__group-toggle'),
      ).toBeNull();
      expect(
        fixed
          .querySelector('.andes-color-picker__group-label')
          ?.textContent?.trim(),
      ).toBe('Fixed');
      expect(
        fixed.querySelector('[role="listbox"]')?.getAttribute('aria-label'),
      ).toBe('Fixed');
      expect(all('[data-slot="color-picker-preset"]').length).toBe(2);
    });

    it('hides gradient presets outside gradient mode, and empty groups', async () => {
      const { open, q, all } = setup((h) =>
        h.presets.set([
          {
            label: 'Only gradients',
            gradients: ['linear-gradient(red, blue)'],
          },
          { label: 'Colours', colors: ['#ff0000'] },
        ]),
      );
      await open();
      expect(q('[data-slot="color-picker-gradient-preset"]')).toBeNull();
      expect(all('.andes-color-picker__group').length).toBe(1);
    });
  });

  // ----- confirm and slots -------------------------------------------------------------

  describe('confirm', () => {
    it('stages edits until Apply, which commits, reports and closes', async () => {
      const { open, q, host, trigger, panel, detect } = setup((h) =>
        h.confirm.set(true),
      );
      await open();
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft', {
        shiftKey: true,
      });
      expect(host.value()).toBe('#1677ff');
      expect(host.changes.length).toBe(1);
      expect(host.completes.length).toBe(0);
      expect(trigger().getAttribute('aria-label')).toBe('Brand, #1677ff');

      const apply = q<HTMLButtonElement>(
        '[data-slot="color-picker-apply"] button',
      ) as HTMLButtonElement;
      expect(apply.textContent?.trim()).toBe('Apply');
      apply.click();
      detect();
      expect(host.value()).toBe('#3086ff');
      expect(host.completes.map((event) => event.value)).toEqual(['#3086ff']);
      expect(host.applied).toEqual(['#3086ff']);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('throws the edits away on Cancel, Escape and outside clicks', async () => {
      const { open, q, host, panel, detect, fixture } = setup((h) =>
        h.confirm.set(true),
      );
      await open();
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft');
      q<HTMLButtonElement>('[data-slot="color-picker-cancel"] button')?.click();
      detect();
      expect(panel()).toBeNull();
      expect(host.value()).toBe('#1677ff');
      expect(host.cancelled).toBe(1);

      await open();
      // Reopened on the value, not on the discarded edit.
      expect(q('andes-color-area')?.getAttribute('aria-valuetext')).toBe(
        'Saturation 91%, brightness 100%',
      );
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft');
      press(document.activeElement as Element, 'Escape');
      expect(host.cancelled).toBe(2);
      expect(host.value()).toBe('#1677ff');

      await open();
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft');
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(host.cancelled).toBe(3);
      expect(host.completes).toEqual([]);
    });

    it('stages a clear, applied as a clear', async () => {
      const { open, q, host, detect } = setup((h) => {
        h.confirm.set(true);
        h.allowClear.set(true);
      });
      await open();
      q<HTMLButtonElement>('[data-slot="color-picker-clear"]')?.click();
      detect();
      expect(host.value()).toBe('#1677ff');
      expect(host.clears).toBe(0);
      q<HTMLButtonElement>('[data-slot="color-picker-apply"] button')?.click();
      detect();
      expect(host.value()).toBeNull();
      expect(host.clears).toBe(1);
      expect(host.applied).toEqual([null]);
    });

    it('records recent colours on Apply only', async () => {
      const { open, q, host, detect } = setup((h) => {
        h.confirm.set(true);
        h.recentColors.set(true);
      });
      await open();
      press(q('andes-color-area') as HTMLElement, 'ArrowLeft');
      expect(host.recent()).toEqual([]);
      q<HTMLButtonElement>('[data-slot="color-picker-apply"] button')?.click();
      detect();
      expect(host.recent()).toEqual([host.value()]);
    });

    it('translates its buttons', async () => {
      const { open, q } = setup((h) => {
        h.confirm.set(true);
        h.labels.set({ apply: 'Aplicar', cancel: 'Cancelar' });
      });
      await open();
      expect(
        q('[data-slot="color-picker-apply"] button')?.textContent?.trim(),
      ).toBe('Aplicar');
      expect(
        q('[data-slot="color-picker-cancel"] button')?.textContent?.trim(),
      ).toBe('Cancelar');
    });
  });

  describe('slots', () => {
    it('projects the header and footer into the popup panel', async () => {
      const { open, q } = setup((h) => h.confirm.set(true));
      await open();
      const body = q('andes-color-picker-panel') as HTMLElement;
      expect(body.firstElementChild?.classList.contains('my-header')).toBe(
        true,
      );
      const footer = q('[data-slot="color-picker-footer"]') as HTMLElement;
      expect(footer.querySelector('.my-footer')).not.toBeNull();
      expect(
        footer.querySelector('[data-slot="color-picker-apply"] button'),
      ).not.toBeNull();
    });

    it('hides an empty footer', () => {
      expect(read('color-picker-panel.css')).toMatch(
        /\.andes-color-picker__footer:empty \{ display: none; \}/,
      );
    });
  });

  // ----- gradient ----------------------------------------------------------------------

  describe('gradient mode', () => {
    async function gradientSetup(
      value: AndesColorPickerValue | null = 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)',
      configure?: (host: FeatureHost) => void,
    ) {
      const helpers = setup((h) => {
        h.mode.set('gradient');
        h.value.set(value);
        configure?.(h);
      });
      await helpers.open();
      return helpers;
    }

    it('paints the gradient in the swatch and summarises it', () => {
      const { root, trigger } = setup((h) => {
        h.mode.set('gradient');
        h.showText.set(true);
        h.value.set('linear-gradient(45deg, red, blue 80%, lime)');
      });
      const fill = root.querySelector(
        '.andes-color-picker__swatch-fill',
      ) as HTMLElement;
      expect(fill.style.backgroundImage).toContain('linear-gradient(45deg');
      expect(fill.style.backgroundColor).toBe('');
      expect(
        root.querySelector('.andes-color-picker__text')?.textContent?.trim(),
      ).toBe('Linear gradient, 45°, 3 stops');
      expect(trigger().getAttribute('aria-label')).toBe(
        'Brand, Linear gradient, 45°, 3 stops',
      );
    });

    it('keeps the single-mode swatch exactly as it was', () => {
      const { root } = setup();
      const fill = root.querySelector(
        '.andes-color-picker__swatch-fill',
      ) as HTMLElement;
      expect(fill.getAttribute('style')).toBe(
        'background-color: rgb(22, 119, 255);',
      );
    });

    it('exposes the stops as labelled sliders in a group', async () => {
      const { q, stops } = await gradientSetup();
      const group = q('[data-slot="color-picker-gradient-bar"] [role="group"]');
      expect(group?.getAttribute('aria-label')).toBe('Gradient stops');
      expect(
        q('[data-slot="color-picker-gradient"]')?.getAttribute('aria-label'),
      ).toBe('Gradient');
      expect(stops().map((stop) => stop.getAttribute('role'))).toEqual([
        'slider',
        'slider',
      ]);
      expect(stops()[0].getAttribute('aria-valuenow')).toBe('0');
      expect(stops()[0].getAttribute('aria-valuemax')).toBe('100');
      expect(stops()[1].getAttribute('aria-valuetext')).toBe(
        'Stop 2 of 2, #0000ff at 100%',
      );
      expect(stops()[0].hasAttribute('data-active')).toBe(true);
    });

    it('moves a stop with the keyboard and reports the gradient', async () => {
      const { stops, host } = await gradientSetup();
      press(stops()[0], 'ArrowRight');
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 1%, #0000ff 100%)',
      );
      press(stops()[0], 'ArrowRight', { shiftKey: true });
      press(stops()[0], 'PageUp');
      expect(stops()[0].getAttribute('aria-valuenow')).toBe('21');
      press(stops()[0], 'End');
      press(stops()[0], 'Home');
      press(stops()[0], 'ArrowLeft');
      expect(stops()[0].getAttribute('aria-valuenow')).toBe('0');

      const event = host.completes[0];
      expect(event.color.toHex()).toBe('#ff0000');
      expect(event.value).toBe('#ff0000');
      expect(event.gradient?.stop).toBe(0);
      expect(event.gradient?.value).toBe(
        'linear-gradient(90deg, #ff0000 1%, #0000ff 100%)',
      );
      expect(event.gradient?.gradient).toBeInstanceOf(AndesGradient);
    });

    it('selects a stop on focus and edits its colour with the panel controls', async () => {
      const { stops, field, type, commit, host, fixture } =
        await gradientSetup();
      stops()[1].focus();
      fixture.detectChanges();
      expect(stops()[1].hasAttribute('data-active')).toBe(true);
      expect(field('Hex color').value).toBe('0000FF');
      type(field('Hex color'), '00ff00');
      commit(field('Hex color'));
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 0%, #00ff00 100%)',
      );
    });

    it('drags a stop with the pointer, without jumping to where it was grabbed', async () => {
      const { q, stops, host } = await gradientSetup();
      const bar = q('andes-color-gradient-bar') as HTMLElement;
      bar.getBoundingClientRect = () => rect(0, 0, 216, 20);
      stops()[0].getBoundingClientRect = () => rect(0, 2, 16, 16);
      // Grabbed 4px right of its centre.
      pointer(stops()[0], 'pointerdown', { x: 12 });
      expect(host.changes.length).toBe(0);
      pointer(stops()[0], 'pointermove', { x: 112 });
      expect(stops()[0].getAttribute('aria-valuenow')).toBe('50');
      pointer(stops()[0], 'pointerup', { x: 112 });
      expect(host.completes.length).toBe(1);
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 50%, #0000ff 100%)',
      );
    });

    it('adds a stop on double click with the colour the gradient has there', async () => {
      const { q, stops, host } = await gradientSetup();
      const bar = q('andes-color-gradient-bar') as HTMLElement;
      bar.getBoundingClientRect = () => rect(0, 0, 216, 20);
      const rail = q('.andes-color-gradient__rail') as HTMLElement;
      pointer(rail, 'dblclick', { x: 108 });
      expect(stops().length).toBe(3);
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 0%, #800080 50%, #0000ff 100%)',
      );
      expect(stops()[2].hasAttribute('data-active')).toBe(true);
      expect(host.completes.length).toBe(1);
    });

    it('adds with + in the widest gap and removes with - or Delete, keeping two', async () => {
      const { q, stops, host, detect } = await gradientSetup();
      const remove = q<HTMLButtonElement>(
        '[data-slot="color-picker-remove-stop"] button',
      ) as HTMLButtonElement;
      expect(remove.disabled).toBe(true);
      expect(remove.getAttribute('aria-label')).toBe('Remove stop');
      press(stops()[0], 'Delete');
      expect(stops().length).toBe(2);

      q<HTMLButtonElement>(
        '[data-slot="color-picker-add-stop"] button',
      )?.click();
      detect();
      expect(stops().length).toBe(3);
      expect(stops()[2].getAttribute('aria-valuenow')).toBe('50');
      expect(remove.disabled).toBe(false);

      remove.click();
      detect();
      expect(stops().length).toBe(2);
      press(stops()[1], 'Backspace');
      expect(stops().length).toBe(2);
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)',
      );
    });

    it('sets the angle with the dial and the field', async () => {
      const { q, host, field, type, commit } = await gradientSetup();
      const dial = q('andes-color-angle') as HTMLElement;
      expect(dial.getAttribute('role')).toBe('slider');
      expect(dial.getAttribute('aria-label')).toBe('Angle');
      expect(dial.getAttribute('aria-valuetext')).toBe('90°');
      press(dial, 'ArrowRight');
      press(dial, 'ArrowUp', { shiftKey: true });
      expect(dial.getAttribute('aria-valuenow')).toBe('106');
      press(dial, 'Home');
      press(dial, 'ArrowLeft');
      expect(dial.getAttribute('aria-valuenow')).toBe('359');
      press(dial, 'End');
      expect(dial.getAttribute('aria-valuenow')).toBe('360');
      press(dial, 'PageDown');
      expect(dial.getAttribute('aria-valuenow')).toBe('345');

      type(field('Angle'), '45');
      commit(field('Angle'));
      expect(host.value()).toBe(
        'linear-gradient(45deg, #ff0000 0%, #0000ff 100%)',
      );
      type(field('Angle'), '400');
      commit(field('Angle'));
      expect(field('Angle').value).toBe('360');

      // The arrow keys step the field by one degree, a held Shift by ten.
      press(field('Angle'), 'ArrowDown');
      expect(field('Angle').value).toBe('359');
      press(field('Angle'), 'ArrowDown', { shiftKey: true });
      expect(field('Angle').value).toBe('349');
      expect(dial.getAttribute('aria-valuenow')).toBe('349');
    });

    it('places the selected stop with its own number field', async () => {
      const { host, field, type, commit } = await gradientSetup();
      expect(field('Stop position').value).toBe('0');
      press(field('Stop position'), 'ArrowUp');
      expect(field('Stop position').value).toBe('1');
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 1%, #0000ff 100%)',
      );
      type(field('Stop position'), '40');
      commit(field('Stop position'));
      expect(host.value()).toBe(
        'linear-gradient(90deg, #ff0000 40%, #0000ff 100%)',
      );
      type(field('Stop position'), '250');
      commit(field('Stop position'));
      expect(field('Stop position').value).toBe('100');
    });

    it('points the dial at the pointer, snapping to 15 degrees with Shift', async () => {
      const { q } = await gradientSetup();
      const dial = q('andes-color-angle') as HTMLElement;
      dial.getBoundingClientRect = () => rect(0, 0, 24, 24);
      const at = (x: number, y: number, shiftKey = false) => {
        for (const type of ['pointerdown', 'pointerup']) {
          const event = new MouseEvent(type, {
            bubbles: true,
            button: 0,
            clientX: x,
            clientY: y,
            shiftKey,
          });
          dial.dispatchEvent(event);
        }
        current?.detectChanges();
        return dial.getAttribute('aria-valuenow');
      };
      expect(at(12, 24)).toBe('180');
      expect(at(0, 12)).toBe('270');
      expect(at(20, 0, true)).toBe('30');
    });

    it('applies gradient presets whole and colour presets to the selected stop', async () => {
      const { all, host, stops, fixture } = await gradientSetup(
        undefined,
        (h) =>
          h.presets.set([
            {
              label: 'Mixed',
              gradients: [
                'linear-gradient(0deg, #000000, #ffffff)',
                { angle: 30, stops: [{ color: '#00ff00', position: 0 }] },
              ],
              colors: ['#ffff00'],
            },
          ]),
      );
      const gradients = all('[data-slot="color-picker-gradient-preset"]');
      expect(gradients.length).toBe(2);
      expect(
        gradients[0].style.getPropertyValue(
          '--andes-color-picker-preset-gradient',
        ),
      ).toContain('linear-gradient(0deg');
      gradients[0].click();
      fixture.detectChanges();
      expect(host.value()).toBe(
        'linear-gradient(0deg, #000000 0%, #ffffff 100%)',
      );
      expect(gradients[0].getAttribute('aria-selected')).toBe('true');

      stops()[1].focus();
      fixture.detectChanges();
      all('[data-slot="color-picker-preset"]')[0].click();
      fixture.detectChanges();
      expect(host.value()).toBe(
        'linear-gradient(0deg, #000000 0%, #ffff00 100%)',
      );
    });

    it('emits AndesGradient objects for object values', async () => {
      const { stops, host } = await gradientSetup({
        angle: 90,
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 },
        ],
      });
      press(stops()[1], 'ArrowLeft');
      const value = host.value() as AndesGradient;
      expect(value).toBeInstanceOf(AndesGradient);
      expect(value.stops[1].position).toBe(99);
      expect(host.completes[0].value).toBeInstanceOf(AndesColor);
      expect(host.completes[0].gradient?.value).toBe(value);
    });

    it('reads a plain colour as a flat gradient, and a gradient in single mode as its first stop', async () => {
      const flat = await gradientSetup('#123456');
      expect(
        flat.stops().map((stop) => stop.getAttribute('aria-valuetext')),
      ).toEqual(['Stop 1 of 2, #123456 at 0%', 'Stop 2 of 2, #123456 at 100%']);
      flat.trigger().click();
      flat.detect();

      const single = setup((h) =>
        h.value.set('linear-gradient(90deg, #ff0000, #0000ff)'),
      );
      expect(single.trigger().getAttribute('aria-label')).toBe(
        'Brand, #ff0000',
      );
      await single.open();
      expect(single.q('[data-slot="color-picker-gradient"]')).toBeNull();
    });

    it('starts an empty gradient from a default and leaves read-only stops alone', async () => {
      const empty = await gradientSetup(null);
      press(empty.stops()[0], 'ArrowRight');
      expect(empty.host.value()).toMatch(
        /^linear-gradient\(90deg, #[0-9a-f]{6} 1%/,
      );
      empty.trigger().click();
      empty.detect();

      const locked = await gradientSetup(undefined, (h) =>
        h.readOnly.set(true),
      );
      press(locked.stops()[0], 'ArrowRight');
      press(locked.stops()[0], 'Delete');
      expect(locked.stops()[0].getAttribute('aria-readonly')).toBe('true');
      expect(
        locked.q<HTMLButtonElement>(
          '[data-slot="color-picker-add-stop"] button',
        )?.disabled,
      ).toBe(true);
      expect(locked.host.changes).toEqual([]);
    });
  });
});
