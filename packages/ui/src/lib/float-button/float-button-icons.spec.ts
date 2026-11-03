import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesBackTop } from './back-top';
import { AndesFloatButton } from './float-button';
import { AndesFloatButtonGroup } from './float-button-group';

/*
  The back-to-top arrow and the group's plus and cross are lucide icons drawn through
  `<ng-icon>` and registered by the components themselves: no test bed here calls
  `provideIcons`, so an icon whose svg is rendered proves the registration is automatic.
*/

function drawn(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') !== null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

function blank(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') === null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

@Component({
  imports: [AndesBackTop, AndesFloatButtonGroup, AndesFloatButton],
  template: `
    <andes-back-top data-test="back-top" />
    <andes-float-button-group
      data-test="group"
      aria-label="Actions"
      trigger="click"
      [(open)]="open"
    >
      <andes-float-button aria-label="Chat" />
    </andes-float-button-group>
    <ng-template #custom><b id="custom-open">+</b></ng-template>
    <andes-float-button-group
      data-test="swap"
      aria-label="Swap"
      trigger="click"
      [triggerIcon]="custom"
      [(open)]="swapOpen"
    >
      <andes-float-button aria-label="Chat" />
    </andes-float-button-group>
  `,
})
class Host {
  readonly open = signal(false);
  readonly swapOpen = signal(false);
}

describe('float button lucide icons', () => {
  it('draws the back-to-top arrow, hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const icon = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-test="back-top"] ng-icon',
    );

    expect(icon?.getAttribute('name')).toBe('lucideArrowUp');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('svg')).not.toBeNull();
  });

  it('draws the group plus, which stays in the DOM and turns when open', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector(
      '[data-test="group"] .andes-float-button-group__trigger button',
    ) as HTMLButtonElement;
    const glyph = () =>
      el.querySelector('[data-test="group"] .andes-float-button-group__glyph');

    expect(glyph()?.getAttribute('name')).toBe('lucidePlus');
    expect(glyph()?.classList).not.toContain(
      'andes-float-button-group__glyph--open',
    );

    trigger.click();
    fixture.detectChanges();

    expect(glyph()?.getAttribute('name')).toBe('lucidePlus');
    expect(glyph()?.classList).toContain(
      'andes-float-button-group__glyph--open',
    );
  });

  it('swaps a custom open icon for the lucide cross when the group opens', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const swap = el.querySelector('[data-test="swap"]') as HTMLElement;

    expect(swap.querySelector('#custom-open')).not.toBeNull();
    expect(drawn(swap)).toEqual([]);

    fixture.componentInstance.swapOpen.set(true);
    fixture.detectChanges();

    expect(swap.querySelector('#custom-open')).toBeNull();
    expect(drawn(swap)).toEqual(['lucideX']);
    expect(blank(el)).toEqual([]);
  });
});
