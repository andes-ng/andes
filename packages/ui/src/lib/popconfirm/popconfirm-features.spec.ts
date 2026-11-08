import {
  Component,
  ErrorHandler,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';

import type { AndesPopoverContentInput } from '../popover/popover-types';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import {
  AndesPopconfirm,
  type AndesPopconfirmButtonProps,
  type AndesPopconfirmHandler,
  type AndesPopconfirmInitialFocus,
} from './popconfirm';
import type { AndesButtonVariant } from '../button/button';

/** jsdom has no layout, which makes CDK treat every element as untabbable (see popover.spec.ts). */
function withElementGeometry() {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );
  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });
  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

@Component({
  imports: [AndesPopconfirm, AndesPopconfirmTrigger],
  providers: [provideIcons({ lucideTrash2 })],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popconfirm
      [title]="title()"
      [description]="description()"
      [icon]="icon()"
      [okType]="okType()"
      [cancelType]="cancelType()"
      [okButtonProps]="okButtonProps()"
      [cancelButtonProps]="cancelButtonProps()"
      [initialFocus]="initialFocus()"
      [showCancel]="showCancel()"
      [onConfirm]="onConfirm()"
      [onCancel]="onCancel()"
      [closeOnOutsideClick]="closeOnOutsideClick()"
      [defaultOpen]="defaultOpen()"
      [classNames]="{
        root: 'my-root',
        icon: 'my-icon',
        title: 'my-title',
        body: 'my-body',
        footer: 'my-footer',
      }"
      [styles]="{ footer: { gap: 20 } }"
      (confirm)="events.push('confirm')"
      (cancelled)="events.push('cancel')"
      (openChangeDetail)="details.push(detail($event))"
    >
      <button type="button" id="trigger" andesPopconfirmTrigger>Delete</button>
    </andes-popconfirm>
    <ng-template #customIcon><span id="custom-icon">!</span></ng-template>
  `,
})
class FeatureHost {
  readonly title = signal<AndesPopoverContentInput>('Delete the task');
  readonly description = signal<AndesPopoverContentInput>('Are you sure?');
  readonly icon = signal<TemplateRef<unknown> | string | null | undefined>(
    undefined,
  );
  readonly okType = signal<AndesButtonVariant>('primary');
  readonly cancelType = signal<AndesButtonVariant>('outline');
  readonly okButtonProps = signal<AndesPopconfirmButtonProps | null>(null);
  readonly cancelButtonProps = signal<AndesPopconfirmButtonProps | null>(null);
  readonly initialFocus = signal<AndesPopconfirmInitialFocus>('cancel');
  readonly showCancel = signal(true);
  readonly onConfirm = signal<AndesPopconfirmHandler | undefined>(undefined);
  readonly onCancel = signal<AndesPopconfirmHandler | undefined>(undefined);
  readonly closeOnOutsideClick = signal(true);
  readonly defaultOpen = signal(false);
  readonly events: string[] = [];
  readonly details: string[] = [];
  readonly customIcon = viewChild.required<TemplateRef<unknown>>('customIcon');
  detail(change: { open: boolean; source: string }): string {
    return `${change.open ? 'open' : 'close'}:${change.source}`;
  }
}

describe('AndesPopconfirm - added features', () => {
  withElementGeometry();

  function setup(configure: (host: FeatureHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(FeatureHost);
    configure(fixture.componentInstance);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const panel = () =>
      document.querySelector('.andes-popover-content') as HTMLElement | null;
    const button = (which: 'ok' | 'cancel') =>
      panel()?.querySelector(
        `.andes-popconfirm-${which} button`,
      ) as HTMLButtonElement | null;
    const update = () => fixture.detectChanges();
    const trigger = () => document.getElementById('trigger') as HTMLElement;
    const openIt = async () => {
      trigger().focus();
      trigger().click();
      update();
      await fixture.whenStable();
    };
    return { fixture, host, panel, button, update, trigger, openIt };
  }

  function pressEscape() {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  afterEach(() => vi.restoreAllMocks());

  describe('button props', () => {
    it('takes variant, size and aria-label from okButtonProps over okType', async () => {
      const { openIt, button } = setup((h) => {
        h.okType.set('danger');
        h.okButtonProps.set({
          variant: 'secondary',
          size: 'xs',
          ariaLabel: 'Delete the task now',
        });
      });
      await openIt();

      const ok = button('ok') as HTMLButtonElement;
      expect(ok.getAttribute('aria-label')).toBe('Delete the task now');
      expect(ok.getAttribute('data-variant')).toBe('secondary');
      expect(ok.className).toContain('andes-button--xs');
    });

    it('keeps the dedicated inputs and the small size when no props are given', async () => {
      const { openIt, button } = setup((h) => {
        h.okType.set('danger');
        h.cancelType.set('ghost');
      });
      await openIt();

      expect(button('ok')?.getAttribute('data-variant')).toBe('danger');
      expect(button('ok')?.className).toContain('andes-button--sm');
      expect(button('cancel')?.getAttribute('data-variant')).toBe('ghost');
    });

    it('disables a button through its props', async () => {
      const { openIt, button } = setup((h) => {
        h.okButtonProps.set({ disabled: true });
        h.cancelButtonProps.set({ disabled: true });
      });
      await openIt();

      expect(button('ok')?.disabled).toBe(true);
      expect(button('cancel')?.disabled).toBe(true);
    });

    it('adds classes from the props to the button', async () => {
      const { openIt, button } = setup((h) =>
        h.okButtonProps.set({ class: ['one', 'two'] }),
      );
      await openIt();

      const host = button('ok')?.closest('andes-button') as HTMLElement;
      expect(host.classList).toContain('one');
      expect(host.classList).toContain('two');
      expect(host.classList).toContain('andes-popconfirm-ok');
    });
  });

  describe('initialFocus', () => {
    it('focuses Cancel by default and OK when asked', async () => {
      const first = setup();
      await first.openIt();
      expect(document.activeElement).toBe(first.button('cancel'));
      first.fixture.destroy();

      const second = setup((h) => h.initialFocus.set('ok'));
      await second.openIt();
      expect(document.activeElement).toBe(second.button('ok'));
    });
  });

  describe('onCancel', () => {
    it('runs for Cancel and closes', async () => {
      let calls = 0;
      const { host, update, openIt, button, panel } = setup((h) =>
        h.onCancel.set(() => void calls++),
      );
      await openIt();

      button('cancel')?.click();
      update();

      expect(calls).toBe(1);
      expect(host.events).toEqual(['cancel']);
      expect(panel()).toBeNull();
      expect(host.details).toEqual(['open:click', 'close:cancel']);
    });

    it('keeps both buttons busy until a promise settles, then closes', async () => {
      let resolve!: () => void;
      const { update, openIt, button, panel } = setup((h) =>
        h.onCancel.set(() => new Promise<void>((done) => (resolve = done))),
      );
      await openIt();

      button('cancel')?.click();
      update();
      expect(button('cancel')?.disabled).toBe(true);
      expect(panel()).not.toBeNull();

      resolve();
      await Promise.resolve();
      await Promise.resolve();
      update();
      expect(panel()).toBeNull();
    });

    it('stays open when the promise rejects', async () => {
      vi.spyOn(TestBed.inject(ErrorHandler), 'handleError').mockImplementation(
        () => undefined,
      );
      let reject!: (error: Error) => void;
      const { update, openIt, button, panel } = setup((h) =>
        h.onCancel.set(() => new Promise<void>((_, fail) => (reject = fail))),
      );
      await openIt();

      button('cancel')?.click();
      update();
      reject(new Error('no'));
      await Promise.resolve();
      await Promise.resolve();
      update();

      expect(panel()).not.toBeNull();
      expect(button('cancel')?.disabled).toBe(false);
    });

    it('runs for Escape too', async () => {
      let calls = 0;
      const { host, update, openIt } = setup((h) =>
        h.onCancel.set(() => void calls++),
      );
      await openIt();

      pressEscape();
      update();

      expect(calls).toBe(1);
      expect(host.events).toEqual(['cancel']);
      expect(host.details).toEqual(['open:click', 'close:escape-key']);
    });
  });

  describe('openChangeDetail', () => {
    it('reports confirm as the reason when OK closes the panel', async () => {
      const { host, update, openIt, button } = setup();
      await openIt();

      button('ok')?.click();
      update();

      expect(host.details).toEqual(['open:click', 'close:confirm']);
    });
  });

  describe('icon', () => {
    it('draws a lucide icon given by name', async () => {
      const { openIt, panel } = setup((h) => h.icon.set('lucideTrash2'));
      await openIt();

      expect(
        panel()?.querySelector('.andes-popconfirm-icon-custom'),
      ).not.toBeNull();
      expect(
        panel()?.querySelector('.andes-popconfirm-icon-default'),
      ).toBeNull();
    });

    it('still takes a template, and null for none', async () => {
      const first = setup();
      first.host.icon.set(first.host.customIcon());
      first.update();
      await first.openIt();
      expect(first.panel()?.querySelector('#custom-icon')).not.toBeNull();
      first.fixture.destroy();

      const second = setup((h) => h.icon.set(null));
      await second.openIt();
      expect(
        second.panel()?.querySelector('.andes-popconfirm-icon'),
      ).toBeNull();
    });
  });

  describe('content', () => {
    it('takes functions for the title and the description', async () => {
      const { openIt, panel } = setup((h) => {
        h.title.set(() => 'From a function');
        h.description.set(() => 'Also from a function');
      });
      await openIt();

      expect(
        panel()?.querySelector('.andes-popconfirm-title')?.textContent,
      ).toContain('From a function');
      expect(
        panel()?.querySelector('.andes-popconfirm-description')?.textContent,
      ).toContain('Also from a function');
    });
  });

  describe('parts', () => {
    it('adds classes and styles to the parts', async () => {
      const { openIt, panel } = setup();
      await openIt();

      const surface = panel() as HTMLElement;
      expect(surface.classList).toContain('my-root');
      expect(
        surface.querySelector('.andes-popconfirm-icon')?.classList,
      ).toContain('my-icon');
      expect(
        surface.querySelector('.andes-popconfirm-title')?.classList,
      ).toContain('my-title');
      expect(
        surface.querySelector('.andes-popconfirm-description')?.classList,
      ).toContain('my-body');
      const footer = surface.querySelector(
        '.andes-popconfirm-buttons',
      ) as HTMLElement;
      expect(footer.classList).toContain('my-footer');
      expect(footer.style.gap).toBe('20px');
    });
  });

  describe('dismissal and default open', () => {
    it('keeps the popconfirm open on an outside press when closeOnOutsideClick is off', async () => {
      const { openIt, panel, update } = setup((h) =>
        h.closeOnOutsideClick.set(false),
      );
      await openIt();
      const outside = document.getElementById('outside') as HTMLElement;
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      outside.click();
      update();

      expect(panel()).not.toBeNull();
    });

    it('opens on its own with defaultOpen', async () => {
      const { fixture, panel } = setup((h) => h.defaultOpen.set(true));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel()).not.toBeNull();
    });
  });
});
