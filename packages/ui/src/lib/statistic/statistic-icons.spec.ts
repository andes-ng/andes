import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { lucideArrowDown, lucideArrowUp } from '@ng-icons/lucide';

import { lucideName } from '../../testing/lucide';
import { AndesStatistic, type AndesStatisticTrend } from './statistic';

/*
  The statistic draws its trend arrow with lucide through `<ng-icon>` and registers it itself:
  this test bed never calls `provideIcons`, so an icon whose svg is drawn proves the
  registration is automatic.
*/

@Component({
  imports: [AndesStatistic],
  template: `<andes-statistic
    title="Revenue"
    [value]="1200"
    [trend]="trend()"
  />`,
})
class Host {
  readonly trend = signal<AndesStatisticTrend | null>('up');
}

describe('statistic icons', () => {
  it.each([
    ['up', 'lucideArrowUp'],
    ['down', 'lucideArrowDown'],
  ] as const)('draws the %s trend as %s', (trend, name) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.trend.set(trend);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('ng-icon');

    expect(icon.querySelector('svg')).not.toBeNull();
    expect(lucideName(icon, { lucideArrowUp, lucideArrowDown })).toBe(name);
  });

  it('draws no icon without a trend', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.trend.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ng-icon')).toBeNull();
  });
});
