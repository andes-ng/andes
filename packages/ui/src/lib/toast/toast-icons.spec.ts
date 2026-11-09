import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesToastService } from './toast.service';
import { AndesToastViewport } from './toast-viewport';

/*
  A toast draws lucide icons through `<ng-icon>` and registers them itself: this test bed never
  calls `provideIcons`, so an icon whose svg is drawn proves the registration is automatic.
*/

@Component({
  imports: [AndesToastViewport],
  template: `<andes-toast-viewport />`,
})
class Host {}

describe('toast icons', () => {
  it('draws a lucide icon for every severity and for the close button', () => {
    const fixture = TestBed.createComponent(Host);
    const service = TestBed.inject(AndesToastService);
    fixture.detectChanges();

    service.success('saved');
    service.error('failed');
    service.warning('careful');
    service.info('fyi');
    service.loading('wait');
    fixture.detectChanges();

    const items = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('andes-toast-item'),
    );
    const status = (item: HTMLElement) =>
      item.querySelector('.andes-toast__icon ng-icon');

    expect(
      items.map((item) => status(item)?.getAttribute('name') ?? null),
    ).toEqual([
      'lucideCircleCheck',
      'lucideCircleX',
      'lucideTriangleAlert',
      'lucideInfo',
      'lucideLoaderCircle',
    ]);
    for (const item of items) {
      for (const icon of Array.from(item.querySelectorAll('ng-icon'))) {
        expect(icon.querySelector('svg')).not.toBeNull();
      }
    }
    const closeIcons = items.map((item) =>
      item.querySelector('.andes-toast__close ng-icon')?.getAttribute('name'),
    );
    expect(closeIcons).toContain('lucideX');
    expect(
      fixture.nativeElement.querySelectorAll('svg:not(ng-icon svg)'),
    ).toHaveLength(0);
  });
});
