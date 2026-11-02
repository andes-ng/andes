import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideUser } from '@ng-icons/lucide';
import { readFileSync } from 'node:fs';

import { declaredValue, expectLength } from '../../testing/computed-style';
import { AndesButton } from '../button/button';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await sleep();
  fixture.detectChanges();
  await fixture.whenStable();
}

const TRIGGER_CSS = readFileSync(
  'packages/ui/src/lib/dropdown-menu/dropdown-menu-trigger.css',
  'utf8',
);
const CHEVRON_RULE =
  "[andesDropdownMenuTrigger] ng-icon[slot='icon-end'][name*='hevron' i]";

@Component({
  imports: [AndesButton, NgIcon, AndesDropdownMenu, AndesDropdownMenuTrigger],
  providers: [provideIcons({ lucideChevronDown, lucideUser })],
  template: `
    <andes-dropdown-menu [items]="[]">
      <andes-button andesDropdownMenuTrigger variant="outline">
        Button
        <ng-icon id="chevron" slot="icon-end" name="lucideChevronDown" />
      </andes-button>
    </andes-dropdown-menu>
    <andes-dropdown-menu [items]="[]">
      <andes-button andesDropdownMenuTrigger variant="outline">
        User
        <ng-icon id="user" slot="icon-end" name="lucideUser" />
      </andes-button>
    </andes-dropdown-menu>
    <andes-button variant="outline">
      Plain
      <ng-icon id="plain" slot="icon-end" name="lucideChevronDown" />
    </andes-button>
  `,
})
class ChevronHost {}

describe('the trailing chevron of a dropdown trigger', () => {
  let fixture: ComponentFixture<ChevronHost>;
  const icon = (id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as Element;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ChevronHost);
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('is drawn at 20px, a 10px glyph, as the middle half of its box', () => {
    expect(icon('chevron').matches(CHEVRON_RULE)).toBe(true);
    expectLength(getComputedStyle(icon('chevron')).fontSize, '1.25rem');
    expect(declaredValue(TRIGGER_CSS, CHEVRON_RULE, 'font-size')).toBe(
      '1.25rem',
    );
  });

  it('pulls its box in by the 5px of empty space on each side of the glyph', () => {
    // 20px box x (24 - 12) / 2 / 24 units of padding either side of the `m6 9 6 6 6-6` glyph
    // `margin-inline` is a logical shorthand jsdom does not expand: assert the declaration.
    expect(declaredValue(TRIGGER_CSS, CHEVRON_RULE, 'margin-inline')).toBe(
      '-0.3125rem',
    );
  });

  it('leaves other icons, and chevrons outside a dropdown trigger, alone', () => {
    expect(icon('user').matches(CHEVRON_RULE)).toBe(false);
    expect(icon('plain').matches(CHEVRON_RULE)).toBe(false);
    expect(getComputedStyle(icon('plain')).fontSize).not.toBe('20px');
  });
});
