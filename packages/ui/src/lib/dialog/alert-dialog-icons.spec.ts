import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideInfo,
  lucideX,
} from '@ng-icons/lucide';

import { lucideName } from '../../testing/lucide';

import { AndesDialogService } from './dialog.service';

/** Which lucide icon an `ng-icon` bound with `[name]` drew (the input is not an attribute). */
const iconName = (icon: Element | null | undefined) =>
  lucideName(icon, {
    lucideCircleAlert,
    lucideCircleCheck,
    lucideCircleX,
    lucideInfo,
    lucideX,
  });

/*
  The alert dialog draws lucide icons through `<ng-icon>` and registers them itself: this
  test bed never calls `provideIcons`, so an icon whose svg is drawn proves the registration
  is automatic, inside the overlay panel the service renders in.
*/

describe('alert dialog icons', () => {
  beforeAll(() => {
    for (const prop of ['offsetWidth', 'offsetHeight'] as const) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });

  afterAll(() => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
      'offsetWidth'
    ];
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
      'offsetHeight'
    ];
  });

  it.each([
    ['confirm', 'lucideCircleAlert'],
    ['warning', 'lucideCircleAlert'],
    ['error', 'lucideCircleX'],
    ['info', 'lucideInfo'],
    ['success', 'lucideCircleCheck'],
  ] as const)(
    'draws the %s dialog as %s, with the close cross',
    async (kind, name) => {
      const service = TestBed.inject(AndesDialogService);
      service[kind]({ title: 'Title', closable: true });
      await TestBed.inject(ApplicationRef).whenStable();

      const icons = Array.from(document.querySelectorAll('ng-icon'));
      const names = icons.map((icon) => iconName(icon));

      expect(names).toEqual(expect.arrayContaining([name, 'lucideX']));
      for (const icon of icons) {
        expect(icon.querySelector('svg')).not.toBeNull();
      }
      expect(document.querySelectorAll('svg:not(ng-icon svg)')).toHaveLength(0);

      service.destroyAll();
    },
  );
});
