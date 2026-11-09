import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesStep } from './step';
import { AndesSteps } from './steps';

/*
  The steps draw lucide icons through `<ng-icon>` and register them themselves: this test bed
  never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

@Component({
  imports: [AndesSteps, AndesStep],
  template: `
    <andes-steps [current]="1">
      <andes-step title="Done" status="finish" />
      <andes-step title="Failed" status="error" />
      <andes-step title="Next" status="wait" />
    </andes-steps>
  `,
})
class Host {}

describe('steps icons', () => {
  it('draws the finish check and the error cross with lucide', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const icons = Array.from<Element>(
      fixture.nativeElement.querySelectorAll('ng-icon'),
    );

    expect(icons.map((icon) => icon.getAttribute('name'))).toEqual([
      'lucideCheck',
      'lucideX',
    ]);
    for (const icon of icons) {
      expect(icon.querySelector('svg')).not.toBeNull();
    }
  });
});
