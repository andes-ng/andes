import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTimeline } from './timeline';
import { AndesTimelineItem } from './timeline-item';

/*
  The timeline draws lucide's loader circle through `<ng-icon>` and registers it itself: this
  test bed never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

@Component({
  imports: [AndesTimeline, AndesTimelineItem],
  template: `
    <andes-timeline aria-label="Order" [pending]="true">
      <andes-timeline-item>Created</andes-timeline-item>
    </andes-timeline>
  `,
})
class Host {}

describe('timeline icons', () => {
  it("spins lucide's loader circle on the pending marker", () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('ng-icon');

    expect(icons).toHaveLength(1);
    expect(icons[0].getAttribute('name')).toBe('lucideLoaderCircle');
    expect(icons[0].querySelector('svg')).not.toBeNull();
    expect(icons[0].classList).toContain('andes-timeline-item__spinner');
  });
});
