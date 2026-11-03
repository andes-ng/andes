import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesResult } from './result';

/*
  The result draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

@Component({
  imports: [AndesResult],
  template: `<andes-result [status]="status()" title="Title" />`,
})
class Host {
  readonly status = signal<
    'success' | 'error' | 'info' | 'warning' | 'processing'
  >('success');
}

describe('result icons', () => {
  it.each([
    ['success', 'lucideCheck'],
    ['error', 'lucideX'],
    ['info', 'lucideInfo'],
    ['warning', 'lucideTriangleAlert'],
    ['processing', 'lucideLoaderCircle'],
  ] as const)('draws %s as %s', (status, name) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.status.set(status);
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('ng-icon');

    expect(icons).toHaveLength(1);
    expect(icons[0].getAttribute('name')).toBe(name);
    expect(icons[0].querySelector('svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('svg')).toHaveLength(1);
  });
});
