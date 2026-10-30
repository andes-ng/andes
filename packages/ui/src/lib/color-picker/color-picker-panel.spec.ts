import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { AndesColor } from './color';
import { AndesColorPicker } from './color-picker';
import { AndesColorPickerPanel } from './color-picker-panel';
import type {
  AndesColorChangeEvent,
  AndesColorPickerMode,
  AndesColorPickerSize,
  AndesColorPickerValue,
} from './color-picker-types';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'color-picker-panel.css'),
  'utf-8',
)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ');

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
  // The overlay reads the legacy key code.
  Object.defineProperty(event, 'keyCode', {
    get: () => ({ Escape: 27, Enter: 13 })[key] ?? 0,
  });
  target.dispatchEvent(event);
  current?.detectChanges();
  return event;
}

@Component({
  imports: [AndesColorPickerPanel],
  template: `<andes-color-picker-panel
    [aria-label]="label()"
    [(value)]="value"
    [mode]="mode()"
    [size]="size()"
    [confirm]="confirm()"
    [disabled]="disabled()"
    [name]="name()"
    [eyeDropper]="false"
    (colorChange)="changes.push($event)"
    (colorChangeComplete)="completes.push($event)"
    (applied)="applied.push($event)"
    (cancelled)="cancelled = cancelled + 1"
  >
    <span slot="panel-header" class="inline-header">Header</span>
    <span slot="panel-footer" class="inline-footer">Footer</span>
  </andes-color-picker-panel>`,
})
class PanelHost {
  readonly label = signal<string | undefined>(undefined);
  readonly value = signal<AndesColorPickerValue | null>('#1677ff');
  readonly mode = signal<AndesColorPickerMode>('single');
  readonly size = signal<AndesColorPickerSize>('md');
  readonly confirm = signal(false);
  readonly disabled = signal(false);
  readonly name = signal<string | null>(null);
  readonly changes: AndesColorChangeEvent[] = [];
  readonly completes: AndesColorChangeEvent[] = [];
  readonly applied: (AndesColorPickerValue | null)[] = [];
  cancelled = 0;
}

@Component({
  imports: [AndesColorPickerPanel, ReactiveFormsModule],
  template: `<andes-color-picker-panel
      aria-label="Accent"
      [formControl]="control"
      [confirm]="confirm()"
    /><button type="button" class="outside">Outside</button>`,
})
class PanelFormHost {
  readonly control = new FormControl<AndesColorPickerValue | null>('#ff0000');
  readonly confirm = signal(false);
}

describe('AndesColorPickerPanel', () => {
  afterEach(() => {
    current = null;
  });

  function setup(configure?: (host: PanelHost) => void) {
    const fixture = TestBed.createComponent(PanelHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    current = fixture;
    const root = fixture.nativeElement as HTMLElement;
    const panel = root.querySelector('andes-color-picker-panel') as HTMLElement;
    const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
      panel.querySelector<T>(selector);
    return {
      fixture,
      host: fixture.componentInstance,
      panel,
      q,
      area: () => q('andes-color-area') as HTMLElement,
      detect: () => fixture.detectChanges(),
    };
  }

  it('renders inline as a named group, without a trigger or a popup', () => {
    const { panel, root, host, detect } = {
      ...setup(),
      root: document.body,
    };
    expect(panel.getAttribute('role')).toBe('group');
    expect(panel.getAttribute('aria-label')).toBe('Color picker');
    expect(panel.hasAttribute('data-embedded')).toBe(false);
    expect(panel.getAttribute('data-size')).toBe('md');
    expect(root.querySelector('[data-slot="color-picker-trigger"]')).toBeNull();
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
    expect(panel.querySelector('andes-color-area')).not.toBeNull();

    host.label.set('Brand color');
    detect();
    expect(panel.getAttribute('aria-label')).toBe('Brand color');
  });

  it('edits the value two-way and reports changes', () => {
    const { area, host } = setup();
    press(area(), 'ArrowLeft', { shiftKey: true });
    expect(host.value()).toBe('#3086ff');
    expect(host.changes.length).toBe(1);
    expect(host.completes.map((event) => event.value)).toEqual(['#3086ff']);
  });

  it('keeps AndesColor values as objects', () => {
    const { area, host } = setup((h) =>
      h.value.set(AndesColor.parse('#ff0000')),
    );
    press(area(), 'ArrowDown');
    expect(host.value()).toBeInstanceOf(AndesColor);
  });

  it('projects the header first and the footer last', () => {
    const { panel, q } = setup();
    expect(panel.firstElementChild?.classList.contains('inline-header')).toBe(
      true,
    );
    expect(
      q('[data-slot="color-picker-footer"]')?.querySelector('.inline-footer'),
    ).not.toBeNull();
  });

  it('sizes itself 14 / 16 / 20rem and draws its own surface', () => {
    const { panel, host, detect } = setup();
    host.size.set('lg');
    detect();
    expect(panel.getAttribute('data-size')).toBe('lg');
    expect(css).toMatch(/:host\(\[data-size='sm'\]\) \{ width: 14rem; \}/);
    expect(css).toMatch(/:host\(\[data-size='lg'\]\) \{ width: 20rem; \}/);
    expect(css).toMatch(/:host \{[^}]*width: 16rem;/);
    expect(css).toMatch(
      /:host\(:not\(\[data-embedded\]\)\) \{[^}]*border: 1px solid var\(--andes-color-border/,
    );
    expect(css).toMatch(/:host\(\[data-embedded\]\) \{[^}]*overflow-y: auto/);
  });

  it('edits a gradient inline', () => {
    const { q, host } = setup((h) => {
      h.mode.set('gradient');
      h.value.set('linear-gradient(90deg, red, blue)');
    });
    expect(q('andes-color-gradient-bar')).not.toBeNull();
    press(
      q('[data-slot="color-picker-gradient-stop"]') as HTMLElement,
      'ArrowRight',
    );
    expect(host.value()).toBe(
      'linear-gradient(90deg, #ff0000 1%, #0000ff 100%)',
    );
  });

  it('renders a hidden input with name', () => {
    const { q, host, detect } = setup();
    expect(q('input[type="hidden"]')).toBeNull();
    host.name.set('accent');
    detect();
    const input = q<HTMLInputElement>('input[type="hidden"]');
    expect(input?.name).toBe('accent');
    expect(input?.value).toBe('#1677ff');
  });

  it('disables every control', () => {
    const { q, host, detect, area } = setup();
    host.disabled.set(true);
    detect();
    expect(area().hasAttribute('tabindex')).toBe(false);
    expect(q<HTMLInputElement>('input[aria-label="Hex color"]')?.disabled).toBe(
      true,
    );
    expect(
      q<HTMLButtonElement>('[data-slot="color-picker-copy"] button')?.disabled,
    ).toBe(true);
    press(area(), 'ArrowLeft');
    expect(host.value()).toBe('#1677ff');
  });

  describe('confirm', () => {
    it('stages edits until Apply and reports applied', () => {
      const { q, area, host, detect } = setup((h) => h.confirm.set(true));
      press(area(), 'ArrowLeft', { shiftKey: true });
      expect(host.value()).toBe('#1677ff');
      expect(host.changes.length).toBe(1);
      expect(host.completes).toEqual([]);

      q<HTMLButtonElement>('[data-slot="color-picker-apply"] button')?.click();
      detect();
      expect(host.value()).toBe('#3086ff');
      expect(host.completes.map((event) => event.value)).toEqual(['#3086ff']);
      expect(host.applied).toEqual(['#3086ff']);
    });

    it('goes back to the value on Cancel and on Escape, reporting cancelled', () => {
      const { q, area, host, detect } = setup((h) => h.confirm.set(true));
      press(area(), 'ArrowLeft');
      q<HTMLButtonElement>('[data-slot="color-picker-cancel"] button')?.click();
      detect();
      expect(host.cancelled).toBe(1);
      expect(area().getAttribute('aria-valuetext')).toBe(
        'Saturation 91%, brightness 100%',
      );

      press(area(), 'ArrowLeft');
      const event = press(area(), 'Escape');
      expect(event.defaultPrevented).toBe(true);
      expect(host.cancelled).toBe(2);
      expect(host.value()).toBe('#1677ff');

      // Nothing staged: Escape is left alone.
      expect(press(area(), 'Escape').defaultPrevented).toBe(false);
      expect(host.cancelled).toBe(2);
    });

    it('shows no buttons without confirm', () => {
      const { q } = setup();
      expect(q('[data-slot="color-picker-apply"] button')).toBeNull();
    });
  });

  describe('format select', () => {
    const list = () =>
      document.querySelector<HTMLElement>('[data-slot="select-content"]');
    const options = () =>
      Array.from(
        list()?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
      );

    it('switches the fields through our select, not a native one', async () => {
      const { q, fixture, detect } = setup();
      expect(q('select')).toBeNull();
      const combobox = q<HTMLButtonElement>(
        '[data-slot="color-picker-format"] [role="combobox"]',
      ) as HTMLButtonElement;
      expect(combobox.getAttribute('aria-label')).toBe('Color format');
      combobox.click();
      detect();
      await fixture.whenStable();
      options()[1].click();
      detect();
      expect(q('input[aria-label="Red"]')).not.toBeNull();
      expect(q('input[aria-label="Hex color"]')).toBeNull();
      expect(combobox.textContent?.trim()).toBe('RGB');
    });

    it('closes only its list on Escape, keeping the staged edits, then the edits on the next one', async () => {
      const { q, area, host, fixture, detect } = setup((h) =>
        h.confirm.set(true),
      );
      press(area(), 'ArrowLeft', { shiftKey: true });
      const combobox = q<HTMLButtonElement>(
        '[data-slot="color-picker-format"] [role="combobox"]',
      ) as HTMLButtonElement;
      combobox.focus();
      combobox.click();
      detect();
      await fixture.whenStable();
      expect(list()).not.toBeNull();

      press(combobox, 'Escape');
      await fixture.whenStable();
      detect();
      expect(list()).toBeNull();
      expect(host.cancelled).toBe(0);
      expect(document.activeElement).toBe(combobox);

      press(combobox, 'Escape');
      expect(host.cancelled).toBe(1);
    });
  });

  describe('forms', () => {
    function setupForm(confirm = false) {
      const fixture = TestBed.createComponent(PanelFormHost);
      fixture.componentInstance.confirm.set(confirm);
      fixture.detectChanges();
      current = fixture;
      const root = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        control: fixture.componentInstance.control,
        area: () => root.querySelector('andes-color-area') as HTMLElement,
        root,
      };
    }

    it('writes, reports and marks the control dirty', () => {
      const { fixture, control, area } = setupForm();
      expect(area().getAttribute('aria-valuetext')).toBe(
        'Saturation 100%, brightness 100%',
      );
      press(area(), 'ArrowLeft', { shiftKey: true });
      expect(control.value).toBe('#ff1a1a');
      expect(control.dirty).toBe(true);

      control.setValue('#00ff00');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('input[aria-label="Hex color"]')
          .value,
      ).toBe('00FF00');
    });

    it('marks the control touched when focus leaves the panel', () => {
      const { control, area, root } = setupForm();
      area().focus();
      area().dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: root.querySelector('andes-color-slider'),
        }),
      );
      expect(control.touched).toBe(false);
      area().dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: root.querySelector('.outside'),
        }),
      );
      expect(control.touched).toBe(true);
    });

    it('disables from the control', () => {
      const { fixture, control, area } = setupForm();
      control.disable();
      fixture.detectChanges();
      expect(area().getAttribute('aria-disabled')).toBe('true');
      control.enable();
      fixture.detectChanges();
      expect(area().hasAttribute('aria-disabled')).toBe(false);
    });

    it('updates the control only on Apply in confirm mode', () => {
      const { fixture, control, area, root } = setupForm(true);
      press(area(), 'ArrowLeft', { shiftKey: true });
      expect(control.value).toBe('#ff0000');
      expect(control.dirty).toBe(false);
      (
        root.querySelector(
          '[data-slot="color-picker-apply"] button',
        ) as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(control.value).toBe('#ff1a1a');
      expect(control.dirty).toBe(true);
    });
  });

  describe('inside the picker', () => {
    it('is driven by the picker and leaves the dialog semantics to the popup', async () => {
      const fixture = TestBed.createComponent(AndesColorPicker);
      fixture.componentRef.setInput('value', '#00ff00');
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('button') as HTMLElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const body = document.querySelector(
        '[data-slot="color-picker-panel"] andes-color-picker-panel',
      ) as HTMLElement;
      expect(body.hasAttribute('data-embedded')).toBe(true);
      expect(body.hasAttribute('role')).toBe(false);
      expect(body.hasAttribute('aria-label')).toBe(false);
      expect(body.hasAttribute('data-size')).toBe(false);
      expect(
        body.querySelector<HTMLInputElement>('input[aria-label="Hex color"]')
          ?.value,
      ).toBe('00FF00');
    });

    it('keeps the expanded groups across openings of the popup', async () => {
      const fixture = TestBed.createComponent(AndesColorPicker);
      fixture.componentRef.setInput('presets', [
        { label: 'Warm', colors: ['#ff0000'] },
      ]);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLElement;
      const toggle = () =>
        document.querySelector(
          '.andes-color-picker__group-toggle',
        ) as HTMLElement;
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      toggle().click();
      fixture.detectChanges();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      button.click();
      fixture.detectChanges();
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });
  });
});
