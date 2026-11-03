import { TestBed } from '@angular/core/testing';

import { AndesProgress } from './progress';

/*
  The progress draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(AndesProgress);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('progress icons', () => {
  it.each([
    ['line', 'success', 'lucideCheck'],
    ['line', 'exception', 'lucideX'],
    ['circle', 'success', 'lucideCheck'],
    ['circle', 'exception', 'lucideX'],
  ] as const)('draws the %s %s icon as %s', (type, status, name) => {
    const root = render({ type, status, percent: 100, showInfo: true });
    const icon = root.querySelector('ng-icon');

    expect(icon?.getAttribute('name')).toBe(name);
    expect(icon?.querySelector('svg')).not.toBeNull();
  });
});
