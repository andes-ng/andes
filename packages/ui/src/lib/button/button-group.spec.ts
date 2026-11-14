import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { declaredValue } from '../../testing/computed-style';
import { AndesButton, AndesButtonElevation } from './button';
import { AndesButtonGroup, AndesButtonGroupOrientation } from './button-group';

const css = readFileSync(
  resolve(process.cwd(), 'packages/ui/src/lib/button/button-group.css'),
  'utf8',
);

@Component({
  imports: [AndesButton, AndesButtonGroup],
  template: `<andes-button-group
    aria-label="Edit"
    [disabled]="disabled()"
    [elevation]="elevation()"
    [roving]="roving()"
    [orientation]="orientation()"
  >
    <andes-button>Copy</andes-button>
    <andes-button [disabled]="secondDisabled()">Cut</andes-button>
    <andes-button>Paste</andes-button>
  </andes-button-group>`,
})
class GroupHost {
  readonly disabled = signal(false);
  readonly elevation = signal<AndesButtonElevation>('none');
  readonly roving = signal(false);
  readonly orientation = signal<AndesButtonGroupOrientation>('horizontal');
  readonly secondDisabled = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(GroupHost);
  fixture.detectChanges();
  const group = fixture.nativeElement.querySelector(
    'andes-button-group',
  ) as HTMLElement;
  const buttons = Array.from(
    group.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const key = (target: HTMLElement, name: string) => {
    const event = new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, group, buttons, key };
}

describe('AndesButtonGroup disabled', () => {
  it('disables every button, whatever their own state', () => {
    const { fixture, buttons } = setup();
    expect(buttons.map((button) => button.disabled)).toEqual([
      false,
      false,
      false,
    ]);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(buttons.map((button) => button.disabled)).toEqual([
      true,
      true,
      true,
    ]);

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(buttons.map((button) => button.disabled)).toEqual([
      false,
      false,
      false,
    ]);
  });
});

describe('AndesButtonGroup elevation', () => {
  it.each([
    ['low', '--andes-shadow-sm'],
    ['medium', '--andes-shadow-md'],
    ['high', '--andes-shadow-lg'],
  ] as const)('%s lifts the whole group with the %s token', (level, token) => {
    const { fixture, group } = setup();
    expect(group.hasAttribute('data-elevation')).toBe(false);

    fixture.componentInstance.elevation.set(level);
    fixture.detectChanges();

    expect(group.getAttribute('data-elevation')).toBe(level);
    expect(
      declaredValue(
        css,
        `.andes-button-group[data-elevation='${level}']`,
        'box-shadow',
      ),
    ).toBe(`var(${token})`);
  });

  it('drops the shadow of a member, so the group is one surface', () => {
    expect(
      declaredValue(
        css,
        '.andes-button-group .andes-button.andes-button',
        'box-shadow',
      ),
    ).toBe('none');
  });

  it('lifts a pressed member above its neighbours like a hovered one', () => {
    expect(css).toContain('.andes-button-group .andes-button:active');
  });
});

describe('AndesButtonGroup roving focus', () => {
  it('leaves every button in the tab order by default', () => {
    const { buttons } = setup();

    expect(buttons.map((button) => button.hasAttribute('tabindex'))).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('makes the group one tab stop: the first enabled button', () => {
    const { fixture, buttons } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.detectChanges();

    expect(buttons.map((button) => button.getAttribute('tabindex'))).toEqual([
      null,
      '-1',
      '-1',
    ]);
  });

  it('moves focus along the horizontal axis, wraps, and skips a disabled button', () => {
    const { fixture, buttons, key } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.componentInstance.secondDisabled.set(true);
    fixture.detectChanges();
    buttons[0].focus();

    const arrow = key(buttons[0], 'ArrowRight');
    expect(arrow.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[2]);

    key(buttons[2], 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);

    key(buttons[0], 'ArrowLeft');
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('jumps to the ends with Home and End', () => {
    const { fixture, buttons, key } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.detectChanges();
    buttons[1].focus();

    key(buttons[1], 'End');
    expect(document.activeElement).toBe(buttons[2]);

    key(buttons[2], 'Home');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('follows the last focused button as the tab stop', () => {
    const { fixture, buttons, key } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.detectChanges();
    buttons[0].focus();

    key(buttons[0], 'ArrowRight');
    fixture.detectChanges();

    expect(buttons.map((button) => button.getAttribute('tabindex'))).toEqual([
      '-1',
      null,
      '-1',
    ]);
  });

  it('reads the arrows along the vertical axis in a vertical group', () => {
    const { fixture, buttons, key } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    buttons[0].focus();

    key(buttons[0], 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);

    key(buttons[0], 'ArrowDown');
    expect(document.activeElement).toBe(buttons[1]);

    key(buttons[1], 'ArrowUp');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('swaps the horizontal arrows in a right-to-left page', () => {
    const { fixture, group, buttons, key } = setup();
    fixture.componentInstance.roving.set(true);
    fixture.detectChanges();
    const wrapper = document.createElement('div');
    wrapper.setAttribute('dir', 'rtl');
    group.parentElement?.appendChild(wrapper);
    wrapper.appendChild(group);
    buttons[0].focus();

    key(buttons[0], 'ArrowLeft');

    expect(document.activeElement).toBe(buttons[1]);
    wrapper.remove();
  });

  it('does nothing when roving is off', () => {
    const { buttons, key } = setup();
    buttons[0].focus();

    const arrow = key(buttons[0], 'ArrowRight');

    expect(arrow.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(buttons[0]);
  });
});
