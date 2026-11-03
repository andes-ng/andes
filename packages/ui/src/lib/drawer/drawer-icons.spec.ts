import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesSheet } from '../sheet/sheet';
import { AndesDrawer } from './drawer';

/*
  The drawer and the sheet draw their close "x" as a lucide icon through `<ng-icon>` and register
  it themselves: this test bed never calls `provideIcons`, so an icon whose svg is rendered, in
  the overlay panel, proves the registration is automatic.
*/

@Component({
  imports: [AndesDrawer, AndesSheet],
  template: `
    <andes-drawer [open]="true"><p>Drawer</p></andes-drawer>
    <andes-sheet [open]="true"><p>Sheet</p></andes-sheet>
  `,
})
class Host {}

describe('drawer and sheet icons', () => {
  afterEach(() => {
    document.querySelector('.cdk-overlay-container')?.replaceChildren();
  });

  it('draws the lucide "x" in the close button of each panel', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    for (const panel of ['drawer', 'sheet']) {
      const icon = document.querySelector(`.andes-${panel}__close ng-icon`);
      expect(icon, panel).not.toBeNull();
      expect(icon?.getAttribute('name')).toBe('lucideX');
      expect(icon?.querySelector('svg')).not.toBeNull();
    }
    expect(
      Array.from(document.querySelectorAll('ng-icon')).filter(
        (icon) => icon.querySelector('svg') === null,
      ),
    ).toEqual([]);
  });
});
