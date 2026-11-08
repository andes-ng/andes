import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesAlert, type AndesAlertSeverity } from './alert';

/*
  The alert draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

@Component({
  imports: [AndesAlert],
  template: `
    <andes-alert [severity]="severity()" [closable]="true" title="Heads up" />
  `,
})
class Host {
  readonly severity = signal<AndesAlertSeverity>('info');
}

function render(severity: AndesAlertSeverity) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.severity.set(severity);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AndesAlert icons', () => {
  it.each([
    ['success', 'lucideCircleCheck'],
    ['info', 'lucideInfo'],
    ['warning', 'lucideCircleAlert'],
    ['danger', 'lucideCircleX'],
  ] as const)(
    'draws the %s disc as %s and the close as lucideX',
    (severity, name) => {
      const root = render(severity);
      const status = root.querySelector('.andes-alert__icon ng-icon');
      const close = root.querySelector('.andes-alert__close ng-icon');

      expect(status?.getAttribute('name')).toBe(name);
      expect(status?.querySelector('svg')).not.toBeNull();
      expect(close?.getAttribute('name')).toBe('lucideX');
      expect(close?.querySelector('svg')).not.toBeNull();
      expect(root.querySelectorAll('svg')).toHaveLength(2);
    },
  );
});
