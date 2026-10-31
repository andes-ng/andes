import { encapsulateStyle } from '@angular/compiler';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';

import { declaredValue } from '../../testing/computed-style';
import {
  AndesSwitch,
  AndesSwitchBlockedEvent,
  AndesSwitchChangeEvent,
} from './switch';

const css = () =>
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'switch.css'),
    'utf-8',
  );

/**
 * An empty shell whose template each test replaces (`TestBed.overrideComponent`), so a case
 * reads as one template line plus the props it binds instead of a host class of its own.
 */
@Component({
  imports: [AndesSwitch, FormsModule, ReactiveFormsModule],
  template: '',
})
class ScratchHost {}

/** Renders `template` in the scratch host, exposing `props` to it as host fields. */
function mount<T extends object>(template: string, props: T = {} as T) {
  TestBed.overrideComponent(ScratchHost, { set: { template } });
  const fixture = TestBed.createComponent(ScratchHost);
  Object.assign(fixture.componentInstance, props);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture: fixture as unknown as ComponentFixture<T>,
    host: fixture.componentInstance as unknown as T,
    root,
    button: () => root.querySelector('button') as HTMLButtonElement,
    field: () => root.querySelector('.andes-switch-field') as HTMLLabelElement,
    hidden: () =>
      root.querySelector('input[type=hidden]') as HTMLInputElement | null,
    // Lets a microtask-resolved guard settle, then re-renders.
    flush: async () => {
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
    },
  };
}

describe('AndesSwitch features', () => {
  describe('default markup', () => {
    it('keeps the bare track footprint: no text, no hidden field, no new aria attributes', () => {
      const { button, field, hidden } = mount(`<andes-switch />`);

      expect(button().hasAttribute('aria-describedby')).toBe(false);
      expect(button().hasAttribute('aria-labelledby')).toBe(false);
      expect(button().hasAttribute('aria-invalid')).toBe(false);
      expect(button().hasAttribute('aria-busy')).toBe(false);
      expect(hidden()).toBeNull();
      expect(field().tagName).toBe('LABEL');
      expect(field().className).toBe(
        'andes-switch-field andes-switch-field--md',
      );
      expect(
        field().querySelector('.andes-switch-field__label')?.childNodes,
      ).toHaveLength(0);
      expect(declaredValue(css(), '.andes-switch-field__text', 'display')).toBe(
        'none',
      );
    });
  });

  describe('name and value (native form field)', () => {
    it('renders no hidden input without a name, even when on', () => {
      const { hidden } = mount(`<andes-switch [checked]="true" />`);

      expect(hidden()).toBeNull();
    });

    it('renders no hidden input for a named switch that is off (nothing is submitted)', () => {
      const { hidden } = mount(`<andes-switch name="alerts" />`);

      expect(hidden()).toBeNull();
    });

    it('renders a hidden input named after the switch, valued "on" by default, when on', () => {
      const { hidden } = mount(
        `<andes-switch name="alerts" [checked]="true" />`,
      );

      expect(hidden()?.type).toBe('hidden');
      expect(hidden()?.name).toBe('alerts');
      expect(hidden()?.value).toBe('on');
    });

    it('submits a custom value', () => {
      const { hidden } = mount(
        `<andes-switch name="plan" value="pro" [checked]="true" />`,
      );

      expect(hidden()?.value).toBe('pro');
    });

    it('adds and removes the field as the user toggles', () => {
      const { fixture, button, hidden } = mount(
        `<andes-switch name="alerts" />`,
      );

      button().click();
      fixture.detectChanges();
      expect(hidden()?.name).toBe('alerts');

      button().click();
      fixture.detectChanges();
      expect(hidden()).toBeNull();
    });

    it('posts through a native form: on contributes name=value, off contributes nothing', () => {
      const { fixture, root, button } = mount(
        `<form><andes-switch name="alerts" value="yes" /><andes-switch name="digest" [checked]="true" /></form>`,
      );
      const form = root.querySelector('form') as HTMLFormElement;

      const data = () => Array.from(new FormData(form).entries());
      expect(data()).toEqual([['digest', 'on']]);

      button().click();
      fixture.detectChanges();
      expect(data()).toEqual([
        ['alerts', 'yes'],
        ['digest', 'on'],
      ]);
    });

    it('is disabled with the switch, so a disabled switch posts nothing', () => {
      const { fixture, root, host, hidden } = mount(
        `<form><andes-switch name="alerts" [checked]="true" [disabled]="off()" /></form>`,
        { off: signal(false) },
      );
      const form = root.querySelector('form') as HTMLFormElement;
      expect(Array.from(new FormData(form).keys())).toEqual(['alerts']);

      host.off.set(true);
      fixture.detectChanges();

      expect(hidden()?.disabled).toBe(true);
      expect(Array.from(new FormData(form).keys())).toEqual([]);
    });

    it('is disabled when a form control disables the switch', () => {
      const control = new FormControl(true);
      const { fixture, hidden } = mount(
        `<andes-switch name="alerts" [formControl]="control" />`,
        { control },
      );
      expect(hidden()?.disabled).toBe(false);

      control.disable();
      fixture.detectChanges();

      expect(hidden()?.disabled).toBe(true);
    });

    it('still posts a read-only switch, like a native read-only field', () => {
      const { hidden } = mount(
        `<andes-switch name="alerts" readonly [checked]="true" />`,
      );

      expect(hidden()?.disabled).toBe(false);
    });
  });

  describe('label and description', () => {
    it('links the description with aria-describedby and the label text with aria-labelledby', () => {
      const { root, button } = mount(
        `<andes-switch>Notifications<span slot="description">Sent by email</span></andes-switch>`,
      );
      const describedby = button().getAttribute('aria-describedby');
      const labelledby = button().getAttribute('aria-labelledby');

      expect(describedby).toMatch(/^andes-switch-\d+-description$/);
      expect(labelledby).toMatch(/^andes-switch-\d+-label$/);
      expect(root.querySelector(`#${describedby}`)?.textContent?.trim()).toBe(
        'Sent by email',
      );
      // The name is the label alone: the description never leaks into it.
      expect(root.querySelector(`#${labelledby}`)?.textContent?.trim()).toBe(
        'Notifications',
      );
    });

    it('accepts the label in [slot=label] as well as in the default slot', () => {
      const { root, button } = mount(
        `<andes-switch><span slot="label">Notifications</span><span slot="description">Sent by email</span></andes-switch>`,
      );
      const labelledby = button().getAttribute('aria-labelledby');

      expect(root.querySelector(`#${labelledby}`)?.textContent?.trim()).toBe(
        'Notifications',
      );
    });

    it('adds no aria-describedby / aria-labelledby for a label without a description', () => {
      const { button, field } = mount(
        `<andes-switch>Notifications</andes-switch>`,
      );

      expect(button().hasAttribute('aria-describedby')).toBe(false);
      expect(button().hasAttribute('aria-labelledby')).toBe(false);
      // The wrapping <label> already names the button natively.
      expect(Array.from(button().labels ?? [])).toEqual([field()]);
    });

    it('keeps an explicit aria-label as the name and merges describedby ids', () => {
      const { button } = mount(
        `<andes-switch aria-label="Alerts" aria-describedby="extra">Alerts<span slot="description">Hint</span></andes-switch>`,
      );

      expect(button().hasAttribute('aria-labelledby')).toBe(false);
      expect(button().getAttribute('aria-describedby')).toMatch(
        /^extra andes-switch-\d+-description$/,
      );
    });

    it('lets an explicit aria-labelledby win over the generated one', () => {
      const { button } = mount(
        `<andes-switch aria-labelledby="mine">Alerts<span slot="description">Hint</span></andes-switch>`,
      );

      expect(button().getAttribute('aria-labelledby')).toBe('mine');
    });

    it('gives each switch its own ids', () => {
      const { root } = mount(
        `<andes-switch>A<span slot="description">a</span></andes-switch><andes-switch>B<span slot="description">b</span></andes-switch>`,
      );
      const ids = Array.from(root.querySelectorAll('[id]')).map((el) => el.id);

      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toHaveLength(4);
    });

    it('toggles when the label text or the description is clicked', () => {
      const { fixture, root, button } = mount(
        `<andes-switch>Notifications<span slot="description">Sent by email</span></andes-switch>`,
      );

      (root.querySelector('.andes-switch-field__label') as HTMLElement).click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('true');

      (
        root.querySelector('.andes-switch-field__description') as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('false');
    });

    it('does not toggle from the label when disabled', () => {
      const { fixture, root, button } = mount(
        `<andes-switch disabled>Notifications</andes-switch>`,
      );

      (root.querySelector('.andes-switch-field__label') as HTMLElement).click();
      fixture.detectChanges();

      expect(button().getAttribute('aria-checked')).toBe('false');
    });

    it('keeps the track first in the DOM for either label position (tab order, association)', () => {
      const { fixture, field, button } = mount(
        `<andes-switch [labelPosition]="position()">Notifications</andes-switch>`,
        { position: signal<'start' | 'end'>('end') },
      );

      expect(field().classList).not.toContain(
        'andes-switch-field--label-start',
      );
      expect(field().firstElementChild).toBe(button());

      fixture.componentInstance.position.set('start');
      fixture.detectChanges();

      expect(field().classList).toContain('andes-switch-field--label-start');
      expect(field().firstElementChild).toBe(button());
    });

    it('flips the label to the start with row-reverse, which follows the writing direction', () => {
      expect(
        declaredValue(
          css(),
          '.andes-switch-field--label-start',
          'flex-direction',
        ),
      ).toBe('row-reverse');
    });

    it('indents the description under the label text, in a column shared with it', () => {
      const sheet = css();

      // Label and description live in one block, so the description starts where the label does.
      expect(
        declaredValue(sheet, '.andes-switch-field__description', 'display'),
      ).toBe('block');
      expect(sheet).toContain(
        '.andes-switch-field:has(> .andes-switch-field__text > :not(:empty)) > .andes-switch-field__text {',
      );
      const { root } = mount(
        `<andes-switch>Label<span slot="description">Hint</span></andes-switch>`,
      );
      const text = root.querySelector(
        '.andes-switch-field__text',
      ) as HTMLElement;
      expect(Array.from(text.children).map((el) => el.className)).toEqual([
        'andes-switch-field__label',
        'andes-switch-field__description',
      ]);
    });
  });

  describe('variant="card"', () => {
    it('makes the label element the card and the host block-level', () => {
      const { root, field } = mount(
        `<andes-switch variant="card">Backups<span slot="description">Daily</span></andes-switch>`,
      );

      expect(field().tagName).toBe('LABEL');
      expect(field().classList).toContain('andes-switch-field--card');
      expect(
        (root.querySelector('andes-switch') as HTMLElement).classList,
      ).toContain('andes-switch-host--card');
      expect(
        declaredValue(css(), ':host(.andes-switch-host--card)', 'display'),
      ).toBe('flex');
    });

    it('does not mark the default variant as a card', () => {
      const { root, field } = mount(`<andes-switch>Backups</andes-switch>`);

      expect(field().classList).not.toContain('andes-switch-field--card');
      expect(
        (root.querySelector('andes-switch') as HTMLElement).classList,
      ).not.toContain('andes-switch-host--card');
    });

    it('toggles when any part of the card is clicked', () => {
      const { fixture, root, field, button } = mount(
        `<andes-switch variant="card">Backups<span slot="description">Daily</span></andes-switch>`,
      );

      (
        root.querySelector('.andes-switch-field__description') as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(field().classList).toContain('andes-switch-field--checked');

      button().click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('false');
      expect(field().classList).not.toContain('andes-switch-field--checked');
    });

    it('highlights the checked card, rings the card on keyboard focus and tints on hover', () => {
      const sheet = css();

      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card.andes-switch-field--checked',
          'border-color',
        ),
      ).toBe('var(--andes-color-primary)');
      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card.andes-switch-field--checked',
          'background-color',
        ),
      ).toBe('var(--andes-color-primary-subtle)');
      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card:has(.andes-switch:focus-visible)',
          'outline',
        ),
      ).toBe('2px solid var(--andes-color-focus-ring)');
      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card .andes-switch:focus-visible',
          'outline',
        ),
      ).toBe('none');
      expect(sheet).toContain(
        '.andes-switch-field--card:not(.andes-switch-field--disabled):not(.andes-switch-field--readonly):not(.andes-switch-field--loading):hover {',
      );
    });

    it('reflects disabled, read-only, invalid and warning on the card', () => {
      const { fixture, field } = mount(
        `<andes-switch variant="card" [disabled]="state() === 'disabled'" [readonly]="state() === 'readonly'" [status]="state() === 'error' ? 'error' : state() === 'warning' ? 'warning' : undefined">Backups</andes-switch>`,
        { state: signal('') },
      );
      const classOf = (state: string) => {
        fixture.componentInstance.state.set(state);
        fixture.detectChanges();
        return field().className;
      };

      expect(classOf('disabled')).toContain('andes-switch-field--disabled');
      expect(classOf('readonly')).toContain('andes-switch-field--readonly');
      expect(classOf('error')).toContain('andes-switch-field--invalid');
      expect(classOf('warning')).toContain('andes-switch-field--warning');
    });

    it('lets status win over the checked and hover borders', () => {
      const sheet = css();
      const invalid = sheet.indexOf(
        '.andes-switch-field--card.andes-switch-field--invalid,',
      );
      const warning = sheet.indexOf(
        '.andes-switch-field--card.andes-switch-field--warning,',
      );
      const checked = sheet.indexOf(
        '.andes-switch-field--card.andes-switch-field--checked {',
      );

      expect(invalid).toBeGreaterThan(checked);
      expect(warning).toBeGreaterThan(checked);
      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card.andes-switch-field--invalid',
          'border-color',
        ),
      ).toBe('var(--andes-color-danger)');
      expect(
        declaredValue(
          sheet,
          '.andes-switch-field--card.andes-switch-field--warning',
          'border-color',
        ),
      ).toBe('var(--andes-color-warning-hover)');
    });

    it('puts the text first and the track at the far end with labelPosition="start"', () => {
      const { field } = mount(
        `<andes-switch variant="card" labelPosition="start">Backups</andes-switch>`,
      );

      expect(field().classList).toContain('andes-switch-field--label-start');
      expect(
        declaredValue(
          css(),
          '.andes-switch-field--card > .andes-switch-field__text',
          'flex',
        ),
      ).toBe('1 1 auto');
    });
  });

  describe('status', () => {
    it('error sets aria-invalid and the invalid style', () => {
      const { button } = mount(`<andes-switch status="error" />`);

      expect(button().getAttribute('aria-invalid')).toBe('true');
      expect(button().classList).toContain('andes-switch--invalid');
    });

    it('warning only paints the warning style and is not announced as invalid', () => {
      const { button } = mount(`<andes-switch status="warning" />`);

      expect(button().hasAttribute('aria-invalid')).toBe(false);
      expect(button().classList).toContain('andes-switch--warning');
      expect(button().classList).not.toContain('andes-switch--invalid');
      expect(
        declaredValue(css(), '.andes-switch--warning', 'border-color'),
      ).toBe('var(--andes-color-warning-hover)');
    });

    it('keeps the existing aria-invalid input working', () => {
      const { button } = mount(`<andes-switch aria-invalid="true" />`);

      expect(button().getAttribute('aria-invalid')).toBe('true');
      expect(button().classList).toContain('andes-switch--invalid');
    });

    it('has no status styling by default', () => {
      const { button } = mount(`<andes-switch />`);

      expect(button().className).toBe('andes-switch andes-switch--md');
    });

    it('maps the system palette in forced-colors mode and keeps status colors', () => {
      const sheet = css();
      const forced = sheet.slice(
        sheet.indexOf('@media (forced-colors: active)'),
      );

      expect(forced).toContain('background-color: Highlight;');
      expect(forced).toContain('background-color: HighlightText;');
      expect(forced).toContain('border-color: GrayText;');
      expect(forced).toContain('border-color: var(--andes-color-danger);');
      expect(forced).toContain(
        'border-color: var(--andes-color-warning-hover);',
      );
    });
  });

  describe('track content and thumb icons', () => {
    it('renders a TemplateRef passed to checkedChildren / unCheckedChildren', () => {
      const { root } = mount(
        `<ng-template #on><b class="on-icon">ON</b></ng-template>
         <ng-template #off><i class="off-icon">OFF</i></ng-template>
         <andes-switch [checked]="true" [checkedChildren]="on" [unCheckedChildren]="off" />`,
      );
      const checked = root.querySelector(
        '.andes-switch__content--checked',
      ) as HTMLElement;
      const unchecked = root.querySelector(
        '.andes-switch__content--unchecked',
      ) as HTMLElement;

      expect(checked.querySelector('.on-icon')?.textContent).toBe('ON');
      expect(unchecked.querySelector('.off-icon')?.textContent).toBe('OFF');
      expect(checked.hasAttribute('data-active')).toBe(true);
      expect(unchecked.hasAttribute('data-active')).toBe(false);
    });

    it('keeps plain strings working, with no stray wrapper', () => {
      const { root } = mount(
        `<andes-switch checkedChildren="Yes" unCheckedChildren="No" />`,
      );

      expect(
        root
          .querySelector('.andes-switch__content--checked')
          ?.textContent?.trim(),
      ).toBe('Yes');
      expect(
        root
          .querySelector('.andes-switch__content--unchecked')
          ?.textContent?.trim(),
      ).toBe('No');
    });

    it('lets a projected slot win over a template for that state', () => {
      const { root } = mount(
        `<ng-template #on><b class="from-template">T</b></ng-template>
         <andes-switch [checkedChildren]="on"><span slot="checked" class="from-slot">S</span></andes-switch>`,
      );

      expect(root.querySelector('.from-slot')).not.toBeNull();
      expect(root.querySelector('.from-template')).toBeNull();
    });

    it('swaps a string for a template when the input changes', () => {
      const { fixture, root } = mount(
        `<ng-template #on><b class="icon">*</b></ng-template>
         <andes-switch [checkedChildren]="useTemplate() ? on : 'On'" />`,
        { useTemplate: signal(false) },
      );
      const checked = () =>
        root.querySelector('.andes-switch__content--checked') as HTMLElement;
      expect(checked().textContent?.trim()).toBe('On');

      fixture.componentInstance.useTemplate.set(true);
      fixture.detectChanges();

      expect(checked().querySelector('.icon')).not.toBeNull();
      expect(checked().textContent?.trim()).toBe('*');
    });

    it('draws checkedIcon in the thumb while on and uncheckedIcon while off', () => {
      const { fixture, root, button } = mount(
        `<ng-template #on><svg class="check"></svg></ng-template>
         <ng-template #off><svg class="cross"></svg></ng-template>
         <andes-switch [checkedIcon]="on" [uncheckedIcon]="off" />`,
      );
      const thumb = () =>
        root.querySelector('.andes-switch__thumb') as HTMLElement;

      expect(thumb().querySelector('.cross')).not.toBeNull();
      expect(thumb().querySelector('.check')).toBeNull();

      button().click();
      fixture.detectChanges();

      expect(thumb().querySelector('.check')).not.toBeNull();
      expect(thumb().querySelector('.cross')).toBeNull();
    });

    it('hides thumb icons from assistive tech and draws none when no icon is given', () => {
      const { root } = mount(
        `<ng-template #off><svg class="cross"></svg></ng-template>
         <andes-switch [uncheckedIcon]="off" /><andes-switch />`,
      );
      const icons = root.querySelectorAll('.andes-switch__thumb-icon');

      expect(icons).toHaveLength(1);
      expect(icons[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('sizes the thumb icon from the thumb and centers it', () => {
      const sheet = css();

      expect(
        declaredValue(sheet, '.andes-switch__thumb-icon', 'font-size'),
      ).toBe('calc(var(--andes-switch-resolved-thumb-size) * 0.65)');
      expect(
        declaredValue(sheet, '.andes-switch__thumb-icon', 'justify-content'),
      ).toBe('center');
      expect(
        declaredValue(
          sheet,
          '.andes-switch__thumb-icon ::ng-deep svg',
          'width',
        ),
      ).toBe('1em');
    });

    it('hides the thumb icon while loading and brings it back after', () => {
      const { fixture, root } = mount(
        `<ng-template #off><svg class="cross"></svg></ng-template>
         <andes-switch [uncheckedIcon]="off" [loading]="busy()" />`,
        { busy: signal(true) },
      );
      const thumb = root.querySelector('.andes-switch__thumb') as HTMLElement;

      expect(thumb.querySelector('.cross')).toBeNull();
      expect(thumb.querySelector('.andes-switch__spinner')).not.toBeNull();

      fixture.componentInstance.busy.set(false);
      fixture.detectChanges();

      expect(thumb.querySelector('.cross')).not.toBeNull();
      expect(thumb.querySelector('.andes-switch__spinner')).toBeNull();
    });
  });

  describe('size lg', () => {
    it('adds the lg classes on the track and the field', () => {
      const { button, field } = mount(
        `<andes-switch size="lg">Label</andes-switch>`,
      );

      expect(button().classList).toContain('andes-switch--lg');
      expect(button().getAttribute('data-size')).toBe('lg');
      expect(field().classList).toContain('andes-switch-field--lg');
    });

    it('is 56 x 28px with a 24px thumb, and leaves sm and md as they were', () => {
      const sheet = css();
      const value = (selector: string, property: string) =>
        declaredValue(sheet, selector, property);

      expect(
        value('.andes-switch--lg', '--andes-switch-default-track-height'),
      ).toBe('1.75rem');
      expect(
        value('.andes-switch--lg', '--andes-switch-default-track-width'),
      ).toBe('3.5rem');
      expect(
        value('.andes-switch--lg', '--andes-switch-default-thumb-size'),
      ).toBe('1.5rem');
      expect(
        value('.andes-switch--sm', '--andes-switch-default-track-height'),
      ).toBe('1rem');
      expect(
        value('.andes-switch--sm', '--andes-switch-default-thumb-size'),
      ).toBe('0.75rem');
      expect(
        value('.andes-switch', '--andes-switch-default-track-height'),
      ).toBe('1.375rem');
      expect(value('.andes-switch', '--andes-switch-default-thumb-size')).toBe(
        '1.125rem',
      );
    });

    it('uses the lg text step (16px / 24px) for the label, like the Input', () => {
      const sheet = css();

      expect(declaredValue(sheet, '.andes-switch-field--lg', 'font-size')).toBe(
        'var(--andes-control-font-size-lg, 1rem)',
      );
      expect(
        declaredValue(sheet, '.andes-switch-field--lg', 'line-height'),
      ).toBe('1.5rem');
    });
  });

  describe('beforeChange', () => {
    @Component({
      imports: [AndesSwitch],
      template: `<andes-switch
        [(checked)]="value"
        [beforeChange]="guard()"
        (changed)="changes.push($event)"
        (clicked)="clicks.push($event)"
        (changeBlocked)="blocked.push($event)"
      />`,
    })
    class GuardHost {
      readonly value = signal(false);
      readonly guard = signal<
        | ((next: boolean) => boolean | Promise<boolean> | Observable<boolean>)
        | undefined
      >(undefined);
      readonly changes: AndesSwitchChangeEvent[] = [];
      readonly clicks: AndesSwitchChangeEvent[] = [];
      readonly blocked: AndesSwitchBlockedEvent[] = [];
    }

    function setup(
      guard: (
        next: boolean,
      ) => boolean | Promise<boolean> | Observable<boolean>,
    ) {
      const fixture = TestBed.createComponent(GuardHost);
      fixture.componentInstance.guard.set(guard);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      const host = fixture.componentInstance;
      const settle = async () => {
        await Promise.resolve();
        await Promise.resolve();
        fixture.detectChanges();
      };
      return { fixture, host, button, settle };
    }

    it('lets the change through on a synchronous true and passes the next state', () => {
      const guard = vi.fn(() => true);
      const { fixture, host, button } = setup(guard);

      button.click();
      fixture.detectChanges();

      expect(guard).toHaveBeenCalledWith(true);
      expect(host.value()).toBe(true);
      expect(host.changes.map((e) => e.checked)).toEqual([true]);
      expect(host.blocked).toEqual([]);
      expect(button.getAttribute('aria-checked')).toBe('true');

      button.click();
      expect(guard).toHaveBeenLastCalledWith(false);
    });

    it('blocks on a synchronous false: no change, changeBlocked fires, clicked reports the unchanged state', () => {
      const { fixture, host, button } = setup(() => false);

      button.click();
      fixture.detectChanges();

      expect(host.value()).toBe(false);
      expect(button.getAttribute('aria-checked')).toBe('false');
      expect(host.changes).toEqual([]);
      expect(host.blocked).toHaveLength(1);
      expect(host.blocked[0]).toMatchObject({
        attempted: true,
        reason: 'refused',
      });
      expect(host.blocked[0].event.type).toBe('click');
      expect(host.clicks.map((e) => e.checked)).toEqual([false]);
    });

    it('only an answer of exactly true lets the change through', async () => {
      const { fixture, host, button, settle } = setup(
        () => undefined as unknown as boolean,
      );

      button.click();
      fixture.detectChanges();
      await settle();

      expect(host.value()).toBe(false);
      expect(host.blocked[0].reason).toBe('refused');
    });

    it('treats a throwing guard as blocked', () => {
      const { fixture, host, button } = setup(() => {
        throw new Error('nope');
      });

      button.click();
      fixture.detectChanges();

      expect(host.value()).toBe(false);
      expect(host.blocked[0]).toMatchObject({
        attempted: true,
        reason: 'error',
      });
    });

    it('shows loading and aria-busy while a Promise is pending, then applies true', async () => {
      let resolve!: (value: boolean) => void;
      const { fixture, host, button, settle } = setup(
        () => new Promise<boolean>((r) => (resolve = r)),
      );

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.hasAttribute('data-loading')).toBe(true);
      expect(button.querySelector('.andes-switch__spinner')).not.toBeNull();
      expect(button.getAttribute('aria-checked')).toBe('false');
      expect(button.disabled).toBe(false);

      resolve(true);
      await settle();

      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(button.querySelector('.andes-switch__spinner')).toBeNull();
      expect(button.getAttribute('aria-checked')).toBe('true');
      expect(host.value()).toBe(true);
      expect(host.changes).toHaveLength(1);
    });

    it('keeps the switch unchanged when a Promise resolves false', async () => {
      const { fixture, host, button, settle } = setup(() =>
        Promise.resolve(false),
      );

      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-busy')).toBe('true');
      await settle();

      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(button.getAttribute('aria-checked')).toBe('false');
      expect(host.blocked).toHaveLength(1);
      expect(host.blocked[0].reason).toBe('refused');
      expect(host.changes).toEqual([]);
    });

    it('counts a rejection as blocked and clears the busy state', async () => {
      const { fixture, host, button, settle } = setup(() =>
        Promise.reject(new Error('server said no')),
      );

      button.click();
      fixture.detectChanges();
      await settle();

      expect(host.blocked[0]).toMatchObject({
        attempted: true,
        reason: 'error',
      });
      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(host.value()).toBe(false);
    });

    it('ignores further clicks while a Promise is pending (the guard runs once)', async () => {
      let resolve!: (value: boolean) => void;
      const guard = vi.fn(() => new Promise<boolean>((r) => (resolve = r)));
      const { fixture, host, button, settle } = setup(guard);

      button.click();
      fixture.detectChanges();
      button.click();
      button.click();
      fixture.detectChanges();

      expect(guard).toHaveBeenCalledTimes(1);
      expect(host.clicks).toEqual([]);

      resolve(true);
      await settle();

      expect(host.changes).toHaveLength(1);
      expect(host.value()).toBe(true);

      // Free again once settled.
      button.click();
      fixture.detectChanges();
      expect(guard).toHaveBeenCalledTimes(2);
    });

    it('applies an Observable that answers synchronously without a loading flash', () => {
      const { fixture, host, button } = setup(() => of(true));

      button.click();

      expect(button.hasAttribute('aria-busy')).toBe(false);
      fixture.detectChanges();
      expect(host.value()).toBe(true);
    });

    it('waits on a pending Observable and uses only its first value', () => {
      const answer = new Subject<boolean>();
      const { fixture, host, button } = setup(() => answer);

      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-busy')).toBe('true');

      answer.next(true);
      answer.next(false);
      fixture.detectChanges();

      expect(host.value()).toBe(true);
      expect(host.changes).toHaveLength(1);
      expect(host.blocked).toEqual([]);
      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(answer.observed).toBe(false);
    });

    it('blocks on an Observable that answers false, errors or completes empty', () => {
      for (const [source, reason] of [
        [of(false), 'refused'],
        [throwError(() => new Error('x')), 'error'],
        [EMPTY, 'refused'],
      ] as const) {
        const { fixture, host, button } = setup(() => source);

        button.click();
        fixture.detectChanges();

        expect(host.value()).toBe(false);
        expect(host.blocked[0].reason).toBe(reason);
        expect(button.hasAttribute('aria-busy')).toBe(false);
      }
    });

    it('drops an answer that arrives after the component was destroyed', async () => {
      let resolve!: (value: boolean) => void;
      const { fixture, host, settle } = setup(
        () => new Promise<boolean>((r) => (resolve = r)),
      );
      (
        fixture.nativeElement.querySelector('button') as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      fixture.destroy();
      resolve(true);
      await settle().catch(() => undefined);

      expect(host.changes).toEqual([]);
    });

    it('unsubscribes a pending Observable when the component is destroyed', () => {
      const answer = new Subject<boolean>();
      const { fixture, button } = setup(() => answer);
      button.click();
      expect(answer.observed).toBe(true);

      fixture.destroy();

      expect(answer.observed).toBe(false);
    });

    it('drops a stale answer when the state moved meanwhile (a form write, a parent binding)', async () => {
      let resolve!: (value: boolean) => void;
      const { fixture, host, button, settle } = setup(
        () => new Promise<boolean>((r) => (resolve = r)),
      );
      button.click();
      fixture.detectChanges();

      host.value.set(true);
      fixture.detectChanges();
      resolve(true);
      await settle();

      expect(host.changes).toEqual([]);
      expect(host.blocked).toEqual([]);
      expect(host.value()).toBe(true);
      expect(button.hasAttribute('aria-busy')).toBe(false);
    });

    it('is not consulted when read-only or disabled', () => {
      const guard = vi.fn(() => true);
      const { fixture, button } = mount(
        `<andes-switch [beforeChange]="guard" readonly /><andes-switch [beforeChange]="guard" disabled />`,
        { guard },
      );

      for (const element of Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[]) {
        element.click();
      }

      expect(guard).not.toHaveBeenCalled();
      expect(button()).toBeTruthy();
    });

    it('guards keyboard activation too (Space / Enter reach the button as a click)', () => {
      const guard = vi.fn(() => false);
      const { fixture, host, button } = setup(guard);

      // A native button turns Space and Enter into a click, which is the only path in; jsdom
      // does not synthesize it, so the activation is dispatched the way a browser delivers it.
      button.focus();
      for (const key of [' ', 'Enter']) {
        button.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        );
        button.dispatchEvent(
          new MouseEvent('click', { bubbles: true, detail: 0 }),
        );
      }
      fixture.detectChanges();

      expect(guard).toHaveBeenCalledTimes(2);
      expect(host.blocked).toHaveLength(2);
      expect(host.value()).toBe(false);
    });

    it('does not guard writeValue or a bound [checked]: only user interaction is guarded', () => {
      const guard = vi.fn(() => false);
      const control = new FormControl(false);
      const { fixture, button } = mount(
        `<andes-switch [formControl]="control" [beforeChange]="guard" />`,
        { control, guard },
      );

      control.setValue(true);
      fixture.detectChanges();

      expect(guard).not.toHaveBeenCalled();
      expect(button().getAttribute('aria-checked')).toBe('true');
    });

    it('keeps a form control untouched when the guard refuses and updates it when it allows', async () => {
      const control = new FormControl(false);
      const allow = signal(false);
      const { fixture, button, flush } = mount(
        `<andes-switch [formControl]="control" [beforeChange]="guard" />`,
        { control, guard: () => Promise.resolve(allow()) },
      );

      button().click();
      await flush();
      expect(control.value).toBe(false);
      expect(button().getAttribute('aria-checked')).toBe('false');

      allow.set(true);
      button().click();
      await flush();
      expect(control.value).toBe(true);
      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(fixture).toBeTruthy();
    });

    it('releases a label click blocked by the guard: the label is not stuck busy', async () => {
      const { fixture, root, flush } = mount(
        `<andes-switch [beforeChange]="guard">Alerts</andes-switch>`,
        { guard: () => Promise.resolve(false) },
      );

      (root.querySelector('.andes-switch-field__label') as HTMLElement).click();
      fixture.detectChanges();
      expect(root.querySelector('button')?.getAttribute('aria-busy')).toBe(
        'true',
      );
      await flush();

      expect(root.querySelector('button')?.hasAttribute('aria-busy')).toBe(
        false,
      );
    });
  });

  describe('focus API', () => {
    it('focus() and blur() drive the button and fire focused / blurred', () => {
      const events: string[] = [];
      const { fixture, button } = mount(
        `<andes-switch #sw (focused)="log('focused', $event)" (blurred)="log('blurred', $event)" />`,
        {
          log: (name: string, event: FocusEvent) =>
            events.push(`${name}:${event.type}`),
        },
      );

      const component = fixture.debugElement.children[0]
        .componentInstance as AndesSwitch;
      component.focus();
      expect(document.activeElement).toBe(button());
      expect(events).toEqual(['focused:focus']);

      component.blur();
      expect(document.activeElement).not.toBe(button());
      expect(events).toEqual(['focused:focus', 'blurred:blur']);
    });

    it('emits focused / blurred for real focus movement, not only the methods', () => {
      const events: string[] = [];
      const { button } = mount(
        `<andes-switch (focused)="log('f')" (blurred)="log('b')" />`,
        { log: (name: string) => events.push(name) },
      );

      button().focus();
      button().blur();

      expect(events).toEqual(['f', 'b']);
    });

    it('still marks a form control touched on blur', () => {
      const control = new FormControl(false);
      const { button } = mount(`<andes-switch [formControl]="control" />`, {
        control,
      });

      expect(control.touched).toBe(false);
      button().focus();
      button().blur();

      expect(control.touched).toBe(true);
    });
  });

  describe('click ripple hook', () => {
    /** Waits past the post-render tick that arms the motion hook. */
    const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    /** An `animationend` as the browser fires it: the framework scopes the keyframes name. */
    const animationEnd = (target: HTMLElement, animationName: string) =>
      target.dispatchEvent(
        Object.assign(new Event('animationend', { bubbles: true }), {
          animationName,
        }),
      );

    it('adds no data-motion to the default markup', () => {
      const { button } = mount('<andes-switch />');

      expect(button().hasAttribute('data-motion')).toBe(false);
    });

    it('does not ripple for the initial checked state', async () => {
      const { fixture, button } = mount('<andes-switch [checked]="true" />');
      await settle();
      fixture.detectChanges();

      expect(button().hasAttribute('data-motion')).toBe(false);
    });

    it('ignores a change made before the hook is armed', () => {
      const { fixture, button } = mount('<andes-switch />');
      button().click();
      fixture.detectChanges();

      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(button().hasAttribute('data-motion')).toBe(false);
    });

    it('is set on every later change: check and uncheck', async () => {
      const { fixture, button } = mount('<andes-switch />');
      await settle();

      button().click();
      fixture.detectChanges();
      expect(button().getAttribute('data-motion')).toBe('change');

      animationEnd(button(), 'scope_andes-switch-ripple');
      fixture.detectChanges();
      expect(button().hasAttribute('data-motion')).toBe(false);

      button().click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('false');
      expect(button().getAttribute('data-motion')).toBe('change');
    });

    it('is also set by a binding or form write, whatever caused the change', async () => {
      const { fixture, host, button } = mount(
        '<andes-switch [checked]="on()" />',
        { on: signal(false) },
      );
      await settle();

      host.on.set(true);
      fixture.detectChanges();

      expect(button().getAttribute('data-motion')).toBe('change');
    });

    it('is kept until the ripple itself ends, and ignores any other animation', async () => {
      const { fixture, button } = mount('<andes-switch />');
      await settle();
      button().click();
      fixture.detectChanges();

      animationEnd(button(), 'scope_andes-switch-spin');
      fixture.detectChanges();
      expect(button().getAttribute('data-motion')).toBe('change');

      // The ripple name coming from a descendant (a bubbled event) is not the track's ripple.
      animationEnd(
        button().querySelector('.andes-switch__thumb') as HTMLElement,
        'scope_andes-switch-ripple',
      );
      fixture.detectChanges();
      expect(button().getAttribute('data-motion')).toBe('change');

      animationEnd(button(), 'scope_andes-switch-ripple');
      fixture.detectChanges();
      expect(button().hasAttribute('data-motion')).toBe(false);
    });
  });

  describe('hover lift', () => {
    const NOT_BUSY_TRACK =
      ':not(:disabled):not([data-disabled]):not([data-readonly]):not([data-loading])';
    const flat = () =>
      css()
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ');

    it('defines one private lift: the on color mixed 82% toward white', () => {
      expect(flat()).toContain(
        '--_andes-switch-lift: color-mix( in srgb, var(--andes-switch-track-checked-color, var(--andes-color-primary)) 82%, white );',
      );
    });

    it('lightens an on track on hover instead of darkening it', () => {
      const sheet = flat();

      expect(sheet).toContain(
        `.andes-switch[data-checked]:hover${NOT_BUSY_TRACK} { background-color: var(--andes-switch-track-checked-hover-color, var(--_andes-switch-lift)); }`,
      );
      expect(sheet).not.toContain('primary-hover');
    });

    it('never lightens a disabled, read-only or loading track', () => {
      // The rule above only exists with the whole exclusion chain.
      expect(flat()).toContain(
        `.andes-switch[data-checked]:hover${NOT_BUSY_TRACK}`,
      );
      expect(flat()).not.toContain('.andes-switch[data-checked]:hover {');
    });

    it('leaves forced-colors mode to the system palette', () => {
      const sheet = flat();
      const lift = sheet.indexOf(
        `.andes-switch[data-checked]:hover${NOT_BUSY_TRACK}`,
      );

      expect(
        sheet.lastIndexOf('@media (forced-colors: none) {', lift),
      ).toBeGreaterThan(sheet.lastIndexOf('}', lift - 1) - 400);
      expect(sheet.lastIndexOf('@media', lift)).toBe(
        sheet.lastIndexOf('@media (forced-colors: none) {', lift),
      );
    });

    it('keeps the unchecked hover tint toward the foreground', () => {
      expect(flat()).toContain(
        `.andes-switch:hover${NOT_BUSY_TRACK} { background-color: var(--andes-switch-track-hover-color, color-mix(in srgb, var(--andes-switch-track-color, var(--andes-color-input)), var(--andes-color-foreground) 12%)); }`,
      );
    });
  });

  describe('motion stylesheet contract', () => {
    const MOTION_MEDIA =
      '@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {';
    const NOT_BUSY_FIELD =
      ':not(.andes-switch-field--disabled):not(.andes-switch-field--readonly):not(.andes-switch-field--loading)';
    const NOT_BUSY_TRACK =
      ':not(:disabled):not([data-disabled]):not([data-readonly]):not([data-loading])';

    /** The stylesheet with whitespace runs collapsed, so a wrapped value reads on one line. */
    const flat = () =>
      css()
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ');

    /** Everything from the motion media query on (it is the last block of the file). */
    const motionBlock = () => {
      const sheet = flat();
      return sheet.slice(sheet.indexOf(MOTION_MEDIA));
    };
    const beforeMotionBlock = () => {
      const sheet = flat();
      return sheet.slice(0, sheet.indexOf(MOTION_MEDIA));
    };

    it('moves the track color and the thumb on the same 200ms ease', () => {
      const sheet = css();
      const track = declaredValue(sheet, '.andes-switch', 'transition');
      const thumb = declaredValue(sheet, '.andes-switch__thumb', 'transition');

      expect(track).toContain(
        'background-color var(--andes-motion-duration-slow, 0.2s)',
      );
      expect(track).toContain(
        'border-color var(--andes-motion-duration-slow, 0.2s)',
      );
      expect(thumb).toContain(
        'inset-inline-start var(--andes-motion-duration-slow, 0.2s)',
      );
      expect(thumb).toContain('width var(--andes-motion-duration-slow, 0.2s)');
      expect(thumb).toContain('var(--andes-motion-ease-in-out');
      expect(
        declaredValue(sheet, '.andes-switch__content', 'transition'),
      ).toContain('inset-inline-start var(--andes-motion-duration-slow, 0.2s)');
    });

    it('rests the track text at an explicit 0 offset, because an auto offset cannot transition', () => {
      expect(
        declaredValue(css(), '.andes-switch__content', 'inset-inline-start'),
      ).toBe('0');
      expect(declaredValue(css(), '.andes-switch__content', 'position')).toBe(
        'relative',
      );
    });

    it('defines the ripple as a track-colored ring, 0 to 6px, 35% to 0%', () => {
      const sheet = flat();
      const keyframes = sheet.slice(
        sheet.indexOf('@keyframes andes-switch-ripple'),
        sheet.indexOf(MOTION_MEDIA),
      );

      expect(keyframes).toContain(
        'from { box-shadow: 0 0 0 0 color-mix(in srgb, var(--_andes-switch-ripple-color) 35%, transparent); }',
      );
      expect(keyframes).toContain(
        'to { box-shadow: 0 0 0 6px color-mix(in srgb, var(--_andes-switch-ripple-color) 0%, transparent); }',
      );
    });

    it('colors the ring with primary, or the status color', () => {
      const sheet = css();

      expect(
        declaredValue(sheet, '.andes-switch', '--_andes-switch-ripple-color'),
      ).toBe(
        'var( --andes-switch-track-checked-color, var(--andes-color-primary) )',
      );
      expect(
        declaredValue(
          sheet,
          '.andes-switch--invalid',
          '--_andes-switch-ripple-color',
        ),
      ).toBe('var(--andes-color-danger)');
      expect(
        declaredValue(
          sheet,
          '.andes-switch--warning',
          '--_andes-switch-ripple-color',
        ),
      ).toBe('var(--andes-color-warning-hover)');
    });

    it('plays the ripple for 0.4s on the hook, never on a disabled, read-only or loading switch', () => {
      const motion = motionBlock();

      expect(motion).toContain(
        `.andes-switch[data-motion]${NOT_BUSY_TRACK} { animation: andes-switch-ripple 0.4s cubic-bezier(0.08, 0.82, 0.17, 1); }`,
      );
      expect(motion.match(/animation:/g)).toHaveLength(1);
    });

    it('stretches the thumb 30% on press, and only for a switch that can change', () => {
      const motion = motionBlock();
      const press = `.andes-switch-field:active${NOT_BUSY_FIELD} > .andes-switch`;

      expect(motion).toContain(
        `${press} .andes-switch__thumb { --_andes-switch-thumb-width: min( calc(var(--andes-switch-resolved-thumb-size) * 1.3),`,
      );
      // Capped at the room inside the track, so the thumb never leaves it.
      expect(motion).toContain(
        'calc(100% - 2 * var(--andes-switch-resolved-track-padding) + 2px) );',
      );
    });

    it('grows the thumb toward the travel side: width and offset read one variable', () => {
      const sheet = css();

      expect(declaredValue(sheet, '.andes-switch__thumb', 'width')).toBe(
        'var(--_andes-switch-thumb-width)',
      );
      expect(
        declaredValue(
          sheet,
          '.andes-switch__thumb',
          '--_andes-switch-thumb-width',
        ),
      ).toBe('var(--andes-switch-resolved-thumb-size)');
      // Checked, the offset is measured from the far edge using the SAME width, so the outer
      // edge stays anchored at the track edge while the stretch grows toward the start.
      expect(
        declaredValue(
          sheet,
          '.andes-switch[data-checked] .andes-switch__thumb',
          'inset-inline-start',
        ),
      ).toBe(
        'calc( 100% - var(--_andes-switch-thumb-width) - var(--andes-switch-resolved-track-padding) + 1px )',
      );
    });

    it('slides the track text 2x the padding away from the thumb while pressed', () => {
      const motion = motionBlock();
      const press = `.andes-switch-field:active${NOT_BUSY_FIELD} > .andes-switch`;

      expect(motion).toContain(
        `${press}:not([data-checked]) .andes-switch__content--unchecked { inset-inline-start: calc(2 * var(--andes-switch-resolved-track-padding)); }`,
      );
      expect(motion).toContain(
        `${press}[data-checked] .andes-switch__content--checked { inset-inline-start: calc(-2 * var(--andes-switch-resolved-track-padding)); }`,
      );
    });

    it('keeps every press and ripple rule inside the motion media query', () => {
      const before = beforeMotionBlock();

      expect(before).not.toContain(':active');
      expect(before).not.toContain('[data-motion]');
      expect(before).not.toContain('animation: andes-switch-ripple');
      expect(before).not.toContain('* 1.3');
    });

    it('never gives the card its own press rule: the field carries the press for the inner switch', () => {
      const motion = motionBlock();

      expect(motion).not.toContain('.andes-switch-field--card:active');
      expect(motion).toContain('.andes-switch-field:active');
    });

    it('leaves reduced motion with instant changes: transitions none, no stretch, no ripple', () => {
      const sheet = flat();
      const start = sheet.indexOf('@media (prefers-reduced-motion: reduce) {');
      const reduced = sheet.slice(start, sheet.indexOf('@keyframes', start));

      expect(reduced).toContain(
        '.andes-switch, .andes-switch__thumb, .andes-switch__content, .andes-switch-field--card { transition: none; }',
      );
      // The only rules that stretch or ring live in the media query that excludes reduced
      // motion (and forced colors), so nothing else needs undoing.
      expect(reduced).not.toContain('animation: andes-switch-ripple');
      expect(motionBlock().startsWith(MOTION_MEDIA)).toBe(true);
    });
  });

  describe('RTL and stylesheet contract', () => {
    it('uses logical properties only: no physical left / right anywhere', () => {
      const withoutComments = css().replace(/\/\*[\s\S]*?\*\//g, '');
      const physical = [
        'margin-left',
        'margin-right',
        'padding-left',
        'padding-right',
        'border-left:',
        'border-right:',
        'border-left-width',
        'border-right-width',
        'text-align: left',
        'text-align: right',
        'float:',
      ];

      for (const property of physical) {
        expect(withoutComments, property).not.toContain(property);
      }
      expect(withoutComments).not.toMatch(/(^|[\s{;])(left|right)\s*:/);
    });

    it('keeps DOM order and aria wiring the same under dir="rtl"', () => {
      const { field, button } = mount(
        `<div dir="rtl"><andes-switch labelPosition="start">تسمية<span slot="description">وصف</span></andes-switch></div>`,
      );

      expect(field().firstElementChild).toBe(button());
      expect(button().hasAttribute('aria-describedby')).toBe(true);
      expect(button().hasAttribute('aria-labelledby')).toBe(true);
    });

    it('never leaves a scoping attribute as a compound of its own once scoped at runtime', () => {
      // Angular's runtime scoping treats a newline inside a selector as a part boundary; the
      // stylesheet keeps every combinator selector on one line, so no `[_ngcontent-x]` may
      // end up as an orphaned extra descendant step.
      const scope = 'andes-test-scope';
      const attr = `[_ngcontent-${scope}]`;
      const scoped = encapsulateStyle(css()).split('%COMP%').join(scope);
      const boundaries = ' \t>~+(,';

      const offenders = scoped.split('\n').filter((line) => {
        let index = line.indexOf(attr);
        while (index >= 0) {
          if (index === 0 || boundaries.includes(line[index - 1])) {
            return true;
          }
          index = line.indexOf(attr, index + attr.length);
        }
        return false;
      });

      expect(offenders).toEqual([]);
      expect(scoped).toContain(
        `.andes-switch-field${attr}:has(> .andes-switch-field__text`,
      );
      expect(scoped).toContain(`> .andes-switch${attr} {`);
      expect(scoped).toContain(`.andes-switch-host--card[_nghost-${scope}] {`);
    });

    it('drops card transitions under prefers-reduced-motion', () => {
      const sheet = css();
      const reduced = sheet.slice(
        sheet.indexOf('@media (prefers-reduced-motion: reduce)'),
      );

      expect(reduced).toContain('.andes-switch-field--card');
      expect(reduced).toContain('transition: none');
    });
  });
});
