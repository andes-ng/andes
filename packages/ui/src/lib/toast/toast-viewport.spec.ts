import { readFileSync } from 'node:fs';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { declaredValue } from '../../testing/computed-style';

import { AndesMessageService } from './message.service';
import { provideAndesToastConfig } from './toast.config';
import { AndesToastService } from './toast.service';
import type {
  AndesToastPosition,
  AndesToastTemplateContext,
} from './toast.types';
import { AndesToastViewport } from './toast-viewport';

@Component({
  imports: [AndesToastViewport],
  template: `<andes-toast-viewport [position]="position()" />`,
})
class HostComponent {
  readonly position = signal<AndesToastPosition>('bottom-right');
}

@Component({
  imports: [AndesToastViewport],
  template: `
    <button class="outside">outside</button>
    <andes-toast-viewport [hotkey]="hotkey()" [container]="container()" />
    <ng-template #customIcon let-toast
      ><b class="custom-icon">{{ toast.severity }}</b></ng-template
    >
    <ng-template #customClose><i class="custom-close">x</i></ng-template>
    <ng-template #actionsBlock let-close="close"
      ><a class="custom-actions" href="#" (click)="close()"
        >Got it</a
      ></ng-template
    >
    <ng-template #headlessBlock let-toast let-close="close"
      ><div class="headless-body">
        {{ toast.message }}
        <button class="headless-close" (click)="close()">x</button>
      </div></ng-template
    >
    <ng-template #richTitle let-toast
      ><em class="rich-title">{{ toast.title }}!</em></ng-template
    >
    <ng-template #richBody let-toast
      ><a class="rich-body" href="#">{{ toast.message }} (link)</a></ng-template
    >
  `,
})
class TemplateHostComponent {
  readonly hotkey = signal<string | false>('Alt+T');
  readonly container = signal<HTMLElement | string | null>(null);
  readonly actionsBlock =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('actionsBlock');
  readonly headlessBlock =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('headlessBlock');
  readonly richTitle =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('richTitle');
  readonly richBody =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('richBody');
  readonly customIcon =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('customIcon');
  readonly customClose =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('customClose');
}

describe('AndesToastViewport', () => {
  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    const service = TestBed.inject(AndesToastService);
    fixture.detectChanges();
    return { fixture, service };
  }

  function items(
    fixture: ReturnType<typeof createHost>['fixture'],
  ): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('andes-toast-item'),
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one andes-toast-item per visible toast', () => {
    const { fixture, service } = createHost();

    service.show({ message: 'first' });
    service.show({ message: 'second' });
    fixture.detectChanges();

    expect(items(fixture)).toHaveLength(2);
  });

  it('stacks toasts in the DOM in the order they were created', () => {
    const { fixture, service } = createHost();

    service.show({ message: 'first' });
    service.show({ message: 'second' });
    service.show({ message: 'third' });
    fixture.detectChanges();

    const texts = items(fixture).map((item) =>
      item.querySelector('.andes-toast__message')?.textContent?.trim(),
    );
    expect(texts).toEqual(['first', 'second', 'third']);
  });

  it.each(['neutral', 'success', 'warning', 'info', 'error'] as const)(
    'renders no role/aria-live/aria-atomic on the visible toast for %s severity (announcement is LiveAnnouncer-only, see AndesToastService)',
    (severity) => {
      const { fixture, service } = createHost();

      service.show({ message: 'msg', severity });
      fixture.detectChanges();

      const item = items(fixture)[0];
      expect(item.getAttribute('role')).toBeNull();
      expect(item.getAttribute('aria-live')).toBeNull();
      expect(item.getAttribute('aria-atomic')).toBeNull();
    },
  );

  it('announces each toast exactly once via LiveAnnouncer - the visible node has no live-region attributes of its own, so nothing double-announces (regression)', () => {
    const announceSpy = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
      ],
    });

    const { fixture, service } = createHost();
    service.show({ title: 'Saved', message: 'Your changes were saved.' });
    fixture.detectChanges();

    // The one and only announcement mechanism: LiveAnnouncer, fired exactly once.
    expect(announceSpy).toHaveBeenCalledTimes(1);

    // The visible toast itself must carry no role/aria-live/aria-atomic - if it did, a
    // screen reader would pick up both that and the LiveAnnouncer announcement above,
    // reading the toast's text twice.
    const item = items(fixture)[0];
    expect(item.getAttribute('role')).toBeNull();
    expect(item.getAttribute('aria-live')).toBeNull();
    expect(item.getAttribute('aria-atomic')).toBeNull();
  });

  it('the close button dismisses that toast only', () => {
    const { fixture, service } = createHost();

    const first = service.show({ message: 'first' }).id;
    service.show({ message: 'second' });
    fixture.detectChanges();

    const closeButton = items(fixture)[0].querySelector<HTMLButtonElement>(
      '.andes-toast__close',
    );
    closeButton?.click();
    fixture.detectChanges();

    expect(service.toasts().map((t) => t.id)).not.toContain(first);
    expect(items(fixture)).toHaveLength(1);
  });

  it('the action button invokes onClick and then dismisses the toast', () => {
    const { fixture, service } = createHost();
    const onClick = vi.fn();

    const id = service.show({
      message: 'Item deleted',
      action: { label: 'Undo', onClick },
    }).id;
    fixture.detectChanges();

    const actionButton = items(fixture)[0].querySelector<HTMLButtonElement>(
      '.andes-toast__action',
    );
    expect(actionButton?.textContent?.trim()).toBe('Undo');
    actionButton?.click();
    fixture.detectChanges();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(service.toasts().map((t) => t.id)).not.toContain(id);
  });

  it('does not render a close button when dismissible is false', () => {
    const { fixture, service } = createHost();

    service.show({ message: 'Persistent', dismissible: false });
    fixture.detectChanges();

    expect(items(fixture)[0].querySelector('.andes-toast__close')).toBeNull();
  });

  it('draws the default close icon as an SVG, not a text glyph', () => {
    const { fixture, service } = createHost();

    service.show({ message: 'Closable' });
    fixture.detectChanges();

    const close = items(fixture)[0].querySelector('.andes-toast__close');
    expect(close?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(close?.textContent?.trim()).toBe('');
  });

  it('loads the visually-hidden rule the live announcer node relies on', () => {
    const { fixture, service } = createHost();

    service.show({ message: 'Announced' });
    fixture.detectChanges();

    const styles = [...document.querySelectorAll('style')].map(
      (style) => style.textContent ?? '',
    );
    expect(styles.some((css) => css.includes('.cdk-visually-hidden'))).toBe(
      true,
    );
  });

  it('hovering a toast pauses its auto-dismiss and mouseleave resumes it', () => {
    vi.useFakeTimers();
    const { fixture, service } = createHost();

    const id = service.show({ message: 'Hoverable', duration: 2000 }).id;
    fixture.detectChanges();

    const item = items(fixture)[0];
    item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(service.toasts().map((t) => t.id)).toContain(id);

    item.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(service.toasts().map((t) => t.id)).not.toContain(id);
  });

  it('focusing an actionable toast (e.g. Tab-ing to its action button) pauses auto-dismiss, and focusout resumes it (regression: keyboard users were unreachable once the timer fired)', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const { fixture, service } = createHost();

    const id = service.show({
      message: 'Item deleted',
      duration: 2000,
      action: { label: 'Undo', onClick },
    }).id;
    fixture.detectChanges();

    const item = items(fixture)[0];
    const actionButton = item.querySelector<HTMLButtonElement>(
      '.andes-toast__action',
    );
    expect(actionButton).not.toBeNull();

    // A keyboard user tabs onto the action button - focusin bubbles up to the toast root,
    // same as mouseenter does for a pointer user.
    actionButton?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();

    // Well past the normal 2000ms duration - must NOT have auto-dismissed while the action
    // button holds focus, or a keyboard user mid-decision loses the control out from under
    // them.
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(service.toasts().map((t) => t.id)).toContain(id);

    // Focus moves elsewhere - focusout bubbles up and resumes the countdown with whatever
    // time remained (the full 2000ms, since it never started counting down while paused).
    actionButton?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(1999);
    fixture.detectChanges();
    expect(service.toasts().map((t) => t.id)).toContain(id);

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(service.toasts().map((t) => t.id)).not.toContain(id);
  });

  it('reflects the position input as a data attribute for CSS placement', () => {
    const { fixture } = createHost();
    fixture.componentInstance.position.set('top-left');
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector(
      'andes-toast-viewport',
    );
    expect(viewport.getAttribute('data-position')).toBe('top-left');
  });

  describe('extended features', () => {
    function createTemplateHost(
      providers: Parameters<
        typeof TestBed.configureTestingModule
      >[0]['providers'] = [],
    ) {
      TestBed.configureTestingModule({ providers });
      const fixture = TestBed.createComponent(TemplateHostComponent);
      fixture.detectChanges();
      return {
        fixture,
        host: fixture.componentInstance,
        toasts: TestBed.inject(AndesToastService),
        messages: TestBed.inject(AndesMessageService),
      };
    }

    describe('close button placement', () => {
      const css = readFileSync(
        'packages/ui/src/lib/toast/toast-item.css',
        'utf8',
      );

      it('is pinned to the top-end corner inside the padding, 22px square', () => {
        const { fixture, toasts } = createTemplateHost();
        toasts.show({ message: 'Saved', title: 'Done' });
        fixture.detectChanges();
        const root = fixture.nativeElement.querySelector('andes-toast-item');
        const close = root?.querySelector(
          ':scope > .andes-toast__row > .andes-toast__close',
        );
        expect(close).toBeTruthy();
        expect(declaredValue(css, '.andes-toast__close', 'position')).toBe(
          'absolute',
        );
        expect(declaredValue(css, '.andes-toast__close', 'top')).toBe(
          'var(--_toast-pad-block)',
        );
        expect(
          declaredValue(css, '.andes-toast__close', 'inset-inline-end'),
        ).toBe('var(--_toast-pad-inline)');
        expect(declaredValue(css, '.andes-toast__close', 'width')).toBe(
          '1.375rem',
        );
        expect(declaredValue(css, '.andes-toast__close', 'height')).toBe(
          '1.375rem',
        );
      });

      it('marks a closable toast so its first line keeps clear of the button', () => {
        const { fixture, toasts } = createTemplateHost();
        toasts.show({ message: 'Closable', title: 'Done' });
        toasts.show({ message: 'Sticky', dismissible: false });
        toasts.show({
          message: 'Buttons',
          action: { label: 'Undo', onClick: () => undefined },
        });
        fixture.detectChanges();
        const [closable, sticky, buttons] = Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ) as HTMLElement[];
        expect(closable.hasAttribute('data-closable')).toBe(true);
        expect(closable.hasAttribute('data-inline-buttons')).toBe(false);
        expect(sticky.hasAttribute('data-closable')).toBe(false);
        expect(buttons.hasAttribute('data-inline-buttons')).toBe(true);
        expect(
          declaredValue(
            css,
            ":host([data-closable]:not([data-inline-buttons], [data-flavor='message'])) .andes-toast__title",
            'padding-inline-end',
          ),
        ).toBe('1.5rem');
      });
    });

    describe('metrics shared with Ant Design', () => {
      const item = readFileSync(
        'packages/ui/src/lib/toast/toast-item.css',
        'utf8',
      );
      const region = readFileSync(
        'packages/ui/src/lib/toast/toast-region.css',
        'utf8',
      );

      it('sizes a notification at 384px with 20px/24px padding, an 8px radius and a 24px icon', () => {
        expect(declaredValue(region, ':host', 'width')).toBe(
          'var(--andes-toast-width, 24rem)',
        );
        expect(declaredValue(item, ':host', '--_toast-pad-block')).toBe(
          'calc(1.25rem - 1px)',
        );
        expect(declaredValue(item, ':host', '--_toast-pad-inline')).toBe(
          'calc(1.5rem - 1px)',
        );
        expect(declaredValue(item, ':host', 'border-radius')).toBe(
          'var(--andes-toast-radius, 0.5rem)',
        );
        expect(declaredValue(item, '.andes-toast__icon', 'width')).toBe(
          '1.5rem',
        );
        expect(declaredValue(item, '.andes-toast__row', 'gap')).toBe('0.75rem');
        expect(declaredValue(item, '.andes-toast__content', 'gap')).toBe(
          '0.5rem',
        );
      });

      it('sets a 16px/24px title over a 14px/22px description, both regular weight', () => {
        expect(declaredValue(item, '.andes-toast__title', 'font-size')).toBe(
          '1rem',
        );
        expect(declaredValue(item, '.andes-toast__title', 'line-height')).toBe(
          '1.5rem',
        );
        expect(declaredValue(item, '.andes-toast__message', 'font-size')).toBe(
          '0.875rem',
        );
        expect(
          declaredValue(item, '.andes-toast__message', 'line-height'),
        ).toBe('1.375rem');
        expect(declaredValue(item, '.andes-toast__title', 'font-weight')).toBe(
          '400',
        );
      });

      it('sizes a message with 9px/12px padding, a 16px icon and an 8px gap', () => {
        const message = ":host([data-flavor='message'])";
        expect(declaredValue(item, message, '--_toast-pad-block')).toBe(
          'calc(0.5625rem - 1px)',
        );
        expect(declaredValue(item, message, '--_toast-pad-inline')).toBe(
          'calc(0.75rem - 1px)',
        );
        expect(
          declaredValue(item, `${message} .andes-toast__icon`, 'width'),
        ).toBe('1rem');
        expect(declaredValue(item, `${message} .andes-toast__row`, 'gap')).toBe(
          'var(--andes-space-2)',
        );
      });

      it('moves in 200ms on an ease-in-out curve, sliding 64px in from the side edge', () => {
        expect(declaredValue(region, ':host', '--_toast-duration')).toBe(
          'var(--andes-toast-duration, 200ms)',
        );
        expect(declaredValue(region, ':host', '--_toast-ease')).toBe(
          'cubic-bezier(0.645, 0.045, 0.355, 1)',
        );
        expect(declaredValue(region, ':host', '--_toast-slide')).toBe('4rem');
        expect(
          declaredValue(
            region,
            ":host([data-placement$='right'])",
            '--_toast-enter-x',
          ),
        ).toBe('var(--_toast-slide)');
        expect(
          declaredValue(
            region,
            ":host([data-placement$='left'])",
            '--_toast-enter-x',
          ),
        ).toBe('calc(var(--_toast-slide) * -1)');
        expect(
          declaredValue(
            region,
            ":host([data-placement$='center'])",
            '--_toast-enter-y',
          ),
        ).toBe('calc(var(--_toast-lift) * var(--_toast-slide) * -1)');
        expect(region).toMatch(
          /@keyframes andes-toast-enter \{\s*from \{\s*opacity: 0;\s*translate: var\(--_toast-enter-x, 0\) var\(--_toast-enter-y, 0\);/,
        );
      });

      it('drops the slide, scale and resize under reduced motion, keeping a 150ms fade', () => {
        const block =
          /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/.exec(
            region,
          )?.[1] ?? '';
        expect(block).toContain('transition: opacity 150ms ease');
        expect(block).toContain('animation: andes-toast-fade 150ms ease');
        expect(block).toContain(
          'animation: andes-toast-fade-out 150ms ease forwards',
        );
        expect(block).not.toContain('translate');
        expect(block).not.toContain('scale');
      });

      it('collapses a deck by scaling 6% per card and peeking out the --_toast-peek, from the anchored edge', () => {
        const stacked = ':host([data-stacked]) andes-toast-item';
        expect(declaredValue(region, stacked, '--_toast-scale')).toBe(
          'max(0.5, calc(1 - var(--_toast-depth, 0) * 0.06))',
        );
        expect(declaredValue(region, stacked, '--_toast-y')).toBe(
          'calc( var(--_toast-lift) * var(--_toast-depth, 0) * var(--_toast-peek) )',
        );
        expect(
          declaredValue(
            region,
            ":host([data-placement^='top'])",
            '--_toast-origin',
          ),
        ).toBe('center bottom');
        expect(
          declaredValue(
            region,
            ":host([data-placement^='bottom'])",
            '--_toast-origin',
          ),
        ).toBe('center top');
      });
    });

    function regions(root: HTMLElement): HTMLElement[] {
      return Array.from(root.querySelectorAll('andes-toast-region'));
    }

    it('renders a built-in status icon per severity, none for neutral, and none with icon: null', () => {
      const { fixture, service } = createHost();

      service.success('ok');
      service.loading('wait');
      service.show({ message: 'plain' });
      service.error('no icon', { icon: null });
      fixture.detectChanges();

      const [success, loading, neutral, hidden] = items(fixture);
      expect(success.querySelector('.andes-toast__icon svg')).not.toBeNull();
      expect(
        success
          .querySelector('.andes-toast__icon')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(loading.querySelector('.andes-toast__spinner')).not.toBeNull();
      expect(neutral.querySelector('.andes-toast__icon')).toBeNull();
      expect(hidden.querySelector('.andes-toast__icon')).toBeNull();
    });

    it('renders a custom icon template with the toast as context', () => {
      const { fixture, host, toasts } = createTemplateHost();

      toasts.warning('custom', { icon: host.customIcon() });
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(
        '.andes-toast__icon .custom-icon',
      );
      expect(icon?.textContent).toBe('warning');
    });

    it('renders a custom closeIcon while keeping the accessible name', () => {
      const { fixture, host, toasts } = createTemplateHost();

      toasts.info('custom close', { closeIcon: host.customClose() });
      fixture.detectChanges();

      const close = fixture.nativeElement.querySelector(
        '.andes-toast__close',
      ) as HTMLButtonElement;
      expect(close.querySelector('.custom-close')).not.toBeNull();
      expect(close.getAttribute('aria-label')).toBe('Dismiss notification');
    });

    it('the close button closes with reason close-button', async () => {
      const { fixture, service } = createHost();

      const ref = service.show({ message: 'x' });
      fixture.detectChanges();
      items(fixture)[0]
        .querySelector<HTMLButtonElement>('.andes-toast__close')
        ?.click();

      await expect(ref.afterClosed).resolves.toBe('close-button');
    });

    it('renders an actions group; clicking one runs it and closes (unless dismissOnClick: false)', async () => {
      const { fixture, service } = createHost();
      const confirm = vi.fn();
      const later = vi.fn();

      const ref = service.show({
        title: 'Update available',
        message: 'Restart now?',
        actions: [
          { label: 'Later', onClick: later, dismissOnClick: false },
          { label: 'Restart', onClick: confirm, variant: 'primary' },
        ],
      });
      fixture.detectChanges();

      const buttons = Array.from(
        items(fixture)[0].querySelectorAll<HTMLButtonElement>(
          '.andes-toast__actions button',
        ),
      );
      expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        'Later',
        'Restart',
      ]);

      buttons[0].click();
      expect(later).toHaveBeenCalledTimes(1);
      expect(service.toasts()).toHaveLength(1);

      buttons[1].click();
      expect(confirm).toHaveBeenCalledTimes(1);
      await expect(ref.afterClosed).resolves.toBe('action');
    });

    it('onClick fires with the ref on a body click, but not on its buttons', () => {
      const { fixture, service } = createHost();
      const onClick = vi.fn();

      const ref = service.show({ message: 'Open details', onClick });
      fixture.detectChanges();

      const item = items(fixture)[0];
      expect(item.hasAttribute('data-clickable')).toBe(true);
      item.querySelector<HTMLElement>('.andes-toast__message')?.click();
      expect(onClick).toHaveBeenCalledWith(ref);

      item.querySelector<HTMLButtonElement>('.andes-toast__close')?.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('pauseOnHover: false keeps counting down while hovered (focus still pauses)', () => {
      vi.useFakeTimers();
      const { fixture, service } = createHost();

      service.show({
        message: 'no hover pause',
        duration: 1000,
        pauseOnHover: false,
      });
      fixture.detectChanges();
      const item = items(fixture)[0];
      expect(item.hasAttribute('data-pause-on-hover')).toBe(false);

      item.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(1000);
      expect(service.toasts()).toHaveLength(0);

      const id = service.show({
        message: 'focus pause',
        duration: 1000,
        pauseOnHover: false,
      }).id;
      fixture.detectChanges();
      items(fixture)[0].dispatchEvent(new FocusEvent('focusin'));
      vi.advanceTimersByTime(5000);
      expect(service.toasts().map((t) => t.id)).toContain(id);
    });

    it('renders one fixed region per placement in use; toasts without placement use the position input', () => {
      const { fixture, service } = createHost();

      service.show({ message: 'default' });
      service.show({ message: 'tl', placement: 'top-left' });
      service.show({ message: 'tl2', placement: 'top-left' });
      fixture.detectChanges();

      const rendered = regions(fixture.nativeElement);
      expect(rendered.map((r) => r.getAttribute('data-placement'))).toEqual([
        'top-left',
        'bottom-right',
      ]);
      expect(rendered[0].querySelectorAll('andes-toast-item')).toHaveLength(2);
      // Notifications collapse into a deck by default.
      expect(rendered[0].hasAttribute('data-stack-enabled')).toBe(true);
      expect(rendered[0].hasAttribute('data-stacked')).toBe(true);
    });

    it('keeps a used region mounted (empty) after its last toast closes, so that toast can animate out', () => {
      const { fixture, toasts, messages } = createTemplateHost();

      toasts.info('only one');
      messages.info('msg');
      fixture.detectChanges();
      toasts.destroy();
      messages.destroy();
      fixture.detectChanges();

      const rendered = regions(fixture.nativeElement);
      expect(rendered.map((r) => r.getAttribute('data-flavor'))).toEqual([
        'notification',
        'message',
      ]);
      expect(
        fixture.nativeElement.querySelectorAll('andes-toast-item'),
      ).toHaveLength(0);
    });

    it('falls back to the global placement when the viewport has no position input', () => {
      const { fixture, toasts } = createTemplateHost([
        provideAndesToastConfig({ placement: 'top-right', top: 64 }),
      ]);

      toasts.info('hello');
      fixture.detectChanges();

      const [region] = regions(fixture.nativeElement);
      expect(region.getAttribute('data-placement')).toBe('top-right');
      expect(region.style.top).toBe('64px');
      expect(
        fixture.nativeElement
          .querySelector('andes-toast-viewport')
          .getAttribute('data-position'),
      ).toBe('top-right');
    });

    it('renders messages in their own top-center region, compact and without a close button', () => {
      const { fixture, messages, toasts } = createTemplateHost();

      messages.success('Copied');
      toasts.info('A notification');
      fixture.detectChanges();

      const messageRegion = fixture.nativeElement.querySelector(
        'andes-toast-region[data-flavor="message"]',
      ) as HTMLElement;
      expect(messageRegion.getAttribute('data-placement')).toBe('top-center');
      const item = messageRegion.querySelector(
        'andes-toast-item',
      ) as HTMLElement;
      expect(item.getAttribute('data-flavor')).toBe('message');
      expect(item.classList).toContain('andes-toast--message');
      expect(item.querySelector('.andes-toast__close')).toBeNull();
      expect(item.getAttribute('role')).toBeNull();
      expect(regions(fixture.nativeElement)).toHaveLength(2);
    });

    it('a dismissible message gets a "Dismiss message" close button', () => {
      const { fixture, messages } = createTemplateHost();

      messages.info('Closable', { dismissible: true });
      fixture.detectChanges();

      expect(
        fixture.nativeElement
          .querySelector('.andes-toast__close')
          ?.getAttribute('aria-label'),
      ).toBe('Dismiss message');
    });

    it('stack: collapses beyond the threshold and expands while hovered or focused', () => {
      const { fixture, toasts } = createTemplateHost();
      toasts.config({ stack: { threshold: 2 } });

      toasts.info('1');
      toasts.info('2');
      fixture.detectChanges();
      const [region] = regions(fixture.nativeElement);
      expect(region.hasAttribute('data-stacked')).toBe(false);
      // Stacking on => newest-against-the-edge ordering even while expanded.
      expect(region.hasAttribute('data-stack-enabled')).toBe(true);

      toasts.info('3');
      toasts.info('4');
      toasts.info('5');
      fixture.detectChanges();
      expect(region.hasAttribute('data-stacked')).toBe(true);

      const stackItems = Array.from(
        region.querySelectorAll<HTMLElement>('andes-toast-item'),
      );
      // Newest (last) is in front; the others only peek out behind it.
      expect(
        stackItems.map((i) => i.hasAttribute('data-stack-behind')),
      ).toEqual([true, true, true, true, false]);
      expect(
        stackItems.map((i) => i.hasAttribute('data-stack-overflow')),
      ).toEqual([true, true, false, false, false]);
      expect(stackItems[4].style.getPropertyValue('--_toast-depth')).toBe('0');
      expect(stackItems[4].hasAttribute('data-front')).toBe(true);

      region.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(region.hasAttribute('data-stacked')).toBe(false);

      region.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      expect(region.hasAttribute('data-stacked')).toBe(true);

      region.dispatchEvent(new FocusEvent('focusin'));
      fixture.detectChanges();
      expect(region.hasAttribute('data-stacked')).toBe(false);
    });

    it('titleTemplate/messageTemplate render rich content, while the plain text stays the announcement', () => {
      const announceSpy = vi.fn().mockResolvedValue(undefined);
      const { fixture, host, toasts } = createTemplateHost([
        { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
      ]);

      toasts.show({
        title: 'Export ready',
        titleTemplate: host.richTitle(),
        message: 'report.xlsx',
        messageTemplate: host.richBody(),
      });
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;
      expect(
        item.querySelector('.andes-toast__title .rich-title')?.textContent,
      ).toBe('Export ready!');
      expect(
        item.querySelector('.andes-toast__message .rich-body')?.textContent,
      ).toBe('report.xlsx (link)');
      expect(announceSpy).toHaveBeenCalledWith(
        'Export ready. report.xlsx',
        'polite',
      );
    });

    it('a message renders its contentTemplate in place of the content text', () => {
      const { fixture, host, messages } = createTemplateHost();

      messages.open({ content: 'Copied', contentTemplate: host.richBody() });
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector(
        'andes-toast-item[data-flavor="message"]',
      ) as HTMLElement;
      expect(message.querySelector('.rich-body')?.textContent).toBe(
        'Copied (link)',
      );
    });

    it('applies style and attributes to the toast root, dropping stale attributes on update', () => {
      const { fixture, toasts } = createTemplateHost();

      const ref = toasts.show({
        message: 'x',
        style: { width: '30rem' },
        attributes: {
          'data-testid': 'save-toast',
          'aria-describedby': 'help',
          class: 'ignored',
        },
      });
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;
      expect(item.style.width).toBe('30rem');
      expect(item.getAttribute('data-testid')).toBe('save-toast');
      expect(item.getAttribute('aria-describedby')).toBe('help');
      expect(item.classList).not.toContain('ignored');
      expect(item.classList).toContain('andes-toast');

      ref.update({ attributes: { 'data-testid': 'saved-toast' } });
      fixture.detectChanges();
      expect(item.getAttribute('data-testid')).toBe('saved-toast');
      expect(item.hasAttribute('aria-describedby')).toBe(false);
    });

    it('closeIcon: null hides the close button', () => {
      const { fixture, toasts } = createTemplateHost();

      toasts.show({ message: 'no close', closeIcon: null });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.andes-toast__close')).toBe(
        null,
      );
    });

    it('rtl lays each toast out right-to-left, per flavor', () => {
      const { fixture, toasts, messages } = createTemplateHost([
        provideAndesToastConfig({ rtl: true }),
      ]);

      toasts.info('notification');
      messages.info('message');
      fixture.detectChanges();

      const notification = fixture.nativeElement.querySelector(
        'andes-toast-item[data-flavor="notification"]',
      ) as HTMLElement;
      const message = fixture.nativeElement.querySelector(
        'andes-toast-item[data-flavor="message"]',
      ) as HTMLElement;
      expect(notification.getAttribute('dir')).toBe('rtl');
      expect(message.hasAttribute('dir')).toBe(false);

      messages.config({ rtl: true });
      fixture.detectChanges();
      expect(message.getAttribute('dir')).toBe('rtl');
    });

    function pointer(
      type: string,
      clientX: number,
      clientY: number,
    ): MouseEvent {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX,
        clientY,
      });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      return event;
    }

    function drag(item: HTMLElement, dx: number, dy: number): void {
      item.dispatchEvent(pointer('pointerdown', 100, 100));
      item.dispatchEvent(pointer('pointermove', 100 + dx / 2, 100 + dy / 2));
      item.dispatchEvent(pointer('pointermove', 100 + dx, 100 + dy));
      item.dispatchEvent(pointer('pointerup', 100 + dx, 100 + dy));
    }

    it('collapses notifications into a deck from two on by default; messages stay a list', () => {
      const { fixture, toasts, messages } = createTemplateHost();

      toasts.info('1');
      messages.info('a');
      messages.info('b');
      fixture.detectChanges();
      const [notificationRegion, messageRegion] = regions(
        fixture.nativeElement,
      );
      expect(notificationRegion.hasAttribute('data-stacked')).toBe(false);

      toasts.info('2');
      fixture.detectChanges();
      expect(notificationRegion.hasAttribute('data-stacked')).toBe(true);
      expect(messageRegion.hasAttribute('data-stack-enabled')).toBe(false);
    });

    it('visibleToasts sets how many cards of a collapsed deck stay visible', () => {
      const { fixture, toasts } = createTemplateHost([
        provideAndesToastConfig({ visibleToasts: 2 }),
      ]);

      toasts.info('1');
      toasts.info('2');
      toasts.info('3');
      fixture.detectChanges();

      const stackItems = Array.from(
        regions(fixture.nativeElement)[0].querySelectorAll<HTMLElement>(
          'andes-toast-item',
        ),
      );
      expect(
        stackItems.map((i) => i.hasAttribute('data-stack-overflow')),
      ).toEqual([true, false, false]);
    });

    it('lays expanded toasts out from their measured heights, from the anchoring edge', () => {
      const { fixture, toasts } = createTemplateHost([
        provideAndesToastConfig({ stack: false, gap: 10 }),
      ]);

      toasts.info('oldest');
      toasts.info('middle');
      toasts.info('newest');
      fixture.detectChanges();

      const debugItems = fixture.debugElement.queryAll(
        By.css('andes-toast-item'),
      );
      debugItems[0].triggerEventHandler('heightChange', 80);
      debugItems[1].triggerEventHandler('heightChange', 60);
      debugItems[2].triggerEventHandler('heightChange', 54);
      fixture.detectChanges();

      const offsets = debugItems.map((d) =>
        (d.nativeElement as HTMLElement).style.getPropertyValue(
          '--_toast-offset',
        ),
      );
      // Without stacking the oldest sits against the edge, newer ones after it:
      // oldest: 0; middle: 80 + 10; newest: 80 + 10 + 60 + 10.
      expect(offsets).toEqual(['0px', '90px', '160px']);
      expect(
        (debugItems[0].nativeElement as HTMLElement).style.getPropertyValue(
          '--_toast-height',
        ),
      ).toBe('80px');
      expect(
        regions(fixture.nativeElement)[0].style.getPropertyValue(
          '--_toast-front-height',
        ),
      ).toBe('54px');
    });

    it('numbers slots from the anchoring edge: newest first with stacking, oldest first without', () => {
      const { fixture, toasts } = createTemplateHost();

      toasts.info('1');
      toasts.info('2');
      toasts.info('3');
      fixture.detectChanges();
      const depths = () =>
        Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ).map((i) =>
          (i as HTMLElement).style.getPropertyValue('--_toast-depth'),
        );
      const fronts = () =>
        Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ).map((i) => (i as HTMLElement).hasAttribute('data-front'));
      expect(depths()).toEqual(['2', '1', '0']);
      expect(fronts()).toEqual([false, false, true]);

      toasts.config({ stack: false });
      fixture.detectChanges();
      expect(depths()).toEqual(['0', '1', '2']);
      expect(fronts()).toEqual([true, false, false]);
    });

    it('turns measured heights into slot offsets and pins cards behind the front to its height', async () => {
      // jsdom has no layout: give each toast row a height its item can report.
      const offsetHeight = vi
        .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.classList.contains('andes-toast__row') ? 40 : 0;
        });
      try {
        const { fixture, toasts } = createTemplateHost();
        toasts.info('older');
        toasts.info('newer');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const [region] = regions(fixture.nativeElement);
        const [older, newer] = Array.from(
          region.querySelectorAll<HTMLElement>('andes-toast-item'),
        );
        const height = parseFloat(
          newer.style.getPropertyValue('--_toast-height'),
        );
        expect(height).toBeGreaterThanOrEqual(40);
        expect(newer.style.getPropertyValue('--_toast-offset')).toBe('0px');
        expect(older.style.getPropertyValue('--_toast-offset')).toBe(
          `${height + 16}px`,
        );
        expect(region.style.getPropertyValue('--_toast-front-height')).toBe(
          `${height}px`,
        );
      } finally {
        offsetHeight.mockRestore();
      }
    });

    it('hovering the stack pauses every toast in it, including ones that arrive meanwhile', () => {
      vi.useFakeTimers();
      const { fixture, toasts } = createTemplateHost();

      toasts.info('first', { duration: 1000 });
      fixture.detectChanges();
      const [region] = regions(fixture.nativeElement);
      region.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      toasts.info('second', { duration: 1000 });
      toasts.info('keeps counting', { duration: 1000, pauseOnHover: false });
      fixture.detectChanges();

      vi.advanceTimersByTime(5000);
      expect(toasts.toasts().map((t) => t.message)).toEqual([
        'first',
        'second',
      ]);

      region.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);
      expect(toasts.toasts()).toHaveLength(0);
    });

    it('without stacking, hovering one toast pauses only that toast', () => {
      vi.useFakeTimers();
      const { fixture, toasts } = createTemplateHost();
      toasts.config({ stack: false });

      toasts.info('hovered', { duration: 1000 });
      toasts.info('other', { duration: 1000 });
      fixture.detectChanges();
      const [first] = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('andes-toast-item'),
      );
      first.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      vi.advanceTimersByTime(1000);
      expect(toasts.toasts().map((t) => t.message)).toEqual(['hovered']);

      first.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.advanceTimersByTime(1000);
      expect(toasts.toasts()).toHaveLength(0);
    });

    it('renders cancel before action; each runs its callback and closes with reason action', async () => {
      const { fixture, toasts } = createTemplateHost();
      const onCancel = vi.fn();
      const onConfirm = vi.fn();

      const ref = toasts.show({
        message: 'Discard draft?',
        cancel: { label: 'Cancel', onClick: onCancel },
        action: { label: 'Discard', onClick: onConfirm },
      });
      fixture.detectChanges();

      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll(
          '.andes-toast__row > button',
        ) as NodeListOf<HTMLButtonElement>,
      );
      // The close button closes the row, after the cancel and action buttons.
      expect(buttons.map((b) => b.className)).toEqual([
        'andes-toast__cancel',
        'andes-toast__action',
        'andes-toast__close',
      ]);
      buttons[0].click();
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
      await expect(ref.afterClosed).resolves.toBe('action');
    });

    it('richColors marks the toast for the tinted style, globally or per toast', () => {
      const { fixture, toasts, messages } = createTemplateHost();

      toasts.success('plain');
      toasts.success('rich', { richColors: true });
      messages.config({ richColors: true });
      messages.error('rich message');
      fixture.detectChanges();

      const rendered = Array.from(
        fixture.nativeElement.querySelectorAll('andes-toast-item'),
      ) as HTMLElement[];
      expect(rendered.map((i) => i.hasAttribute('data-rich-colors'))).toEqual([
        false,
        true,
        true,
      ]);
    });

    it('offset moves the stack off the edges; top/bottom still win for their edge', () => {
      const { fixture, toasts } = createTemplateHost([
        provideAndesToastConfig({ offset: 40, bottom: '5rem' }),
      ]);

      toasts.info('bottom right');
      toasts.info('top left', { placement: 'top-left' });
      fixture.detectChanges();

      const [topLeft, bottomRight] = regions(fixture.nativeElement);
      expect(topLeft.style.top).toBe('40px');
      expect(topLeft.style.getPropertyValue('--_toast-offset-x')).toBe('40px');
      expect(bottomRight.style.bottom).toBe('5rem');
    });

    it('dragging a toast past the threshold towards its edge dismisses it with reason swipe', async () => {
      const { fixture, toasts } = createTemplateHost();

      const ref = toasts.info('swipe me');
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;
      expect(item.hasAttribute('data-swipeable')).toBe(true);

      // bottom-right: dragging up (away from the edge) only stretches, then snaps back.
      drag(item, 0, -80);
      fixture.detectChanges();
      expect(toasts.toasts()).toHaveLength(1);
      expect(item.style.getPropertyValue('--_toast-swipe-y')).toBe('');

      drag(item, 60, 0);
      fixture.detectChanges();
      expect(item.getAttribute('data-swipe-out')).toBe('right');
      await expect(ref.afterClosed).resolves.toBe('swipe');
    });

    it('a short, slow drag snaps back; a drag away from the edge is dampened and never dismisses', () => {
      vi.useFakeTimers();
      const { fixture, toasts } = createTemplateHost();
      toasts.info('swipe me');
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;

      item.dispatchEvent(pointer('pointerdown', 100, 100));
      item.dispatchEvent(pointer('pointermove', 110, 100));
      vi.advanceTimersByTime(500);
      item.dispatchEvent(pointer('pointerup', 110, 100));
      expect(toasts.toasts()).toHaveLength(1);
      expect(item.hasAttribute('data-swiping')).toBe(false);
      expect(item.style.getPropertyValue('--_toast-swipe-x')).toBe('');

      // bottom-right: dragging left is away from the edge.
      item.dispatchEvent(pointer('pointerdown', 100, 100));
      item.dispatchEvent(pointer('pointermove', 0, 100));
      const dampened = parseFloat(
        item.style.getPropertyValue('--_toast-swipe-x'),
      );
      expect(dampened).toBeLessThan(0);
      expect(dampened).toBeGreaterThan(-45);
      item.dispatchEvent(pointer('pointerup', 0, 100));
      expect(toasts.toasts()).toHaveLength(1);
    });

    it('swipeToDismiss: false turns swiping off, even for a dismissible toast', () => {
      const { fixture, toasts } = createTemplateHost();
      toasts.info('stays put', { swipeToDismiss: false });
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;

      expect(item.hasAttribute('data-swipeable')).toBe(false);
      drag(item, 120, 0);
      expect(toasts.toasts()).toHaveLength(1);
    });

    it('a drag is not a body click, and buttons never start a drag', () => {
      const { fixture, toasts } = createTemplateHost();
      const onClick = vi.fn();

      toasts.show({
        message: 'drag but not click',
        onClick,
        swipeDirections: ['left'],
      });
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector(
        'andes-toast-item',
      ) as HTMLElement;

      drag(item, 20, 0);
      item.click();
      expect(onClick).not.toHaveBeenCalled();

      const close = item.querySelector('.andes-toast__close') as HTMLElement;
      close.dispatchEvent(pointer('pointerdown', 0, 0));
      close.dispatchEvent(pointer('pointermove', -90, 0));
      close.dispatchEvent(pointer('pointerup', -90, 0));
      expect(item.hasAttribute('data-swipe-out')).toBe(false);
    });

    it('toasts that cannot be dismissed are not swipeable unless they opt in', () => {
      const { fixture, toasts, messages } = createTemplateHost();

      toasts.loading('Saving', { dismissible: false });
      messages.info('plain message');
      messages.info('swipeable message', { swipeDirections: ['top'] });
      fixture.detectChanges();

      const rendered = Array.from(
        fixture.nativeElement.querySelectorAll('andes-toast-item'),
      ) as HTMLElement[];
      expect(rendered.map((i) => i.hasAttribute('data-swipeable'))).toEqual([
        false,
        false,
        true,
      ]);
    });

    describe('countdown progress bar', () => {
      it('showProgress renders a bar that drains over the duration, only for timed toasts', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.show({ message: 'timed', duration: 4000, showProgress: true });
        toasts.show({ message: 'sticky', duration: false, showProgress: true });
        toasts.show({ message: 'off', duration: 4000 });
        fixture.detectChanges();

        const [timed, sticky, off] = Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ) as HTMLElement[];
        const bar = timed.querySelector<HTMLElement>('.andes-toast__progress');
        expect(bar?.style.animationDuration).toBe('4000ms');
        expect(bar?.closest('[aria-hidden="true"]')).not.toBeNull();
        expect(sticky.querySelector('.andes-toast__progress')).toBeNull();
        expect(off.querySelector('.andes-toast__progress')).toBeNull();
      });

      it('showProgress can be turned on for every toast in the global config', () => {
        const { fixture, toasts } = createTemplateHost([
          provideAndesToastConfig({ showProgress: true }),
        ]);

        toasts.info('a');
        toasts.info('b', { showProgress: false });
        fixture.detectChanges();

        const [a, b] = Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ) as HTMLElement[];
        expect(a.querySelector('.andes-toast__progress')).not.toBeNull();
        expect(b.querySelector('.andes-toast__progress')).toBeNull();
      });

      it('a key-based update restarts the bar', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.info('a', { key: 'k', showProgress: true });
        fixture.detectChanges();
        const before = fixture.nativeElement.querySelector(
          '.andes-toast__progress',
        );

        toasts.info('b', { key: 'k', showProgress: true });
        fixture.detectChanges();
        const after = fixture.nativeElement.querySelector(
          '.andes-toast__progress',
        );

        expect(after).not.toBeNull();
        expect(after).not.toBe(before);
      });

      it('marks the toast paused while it is hovered, in step with its countdown', () => {
        vi.useFakeTimers();
        const { fixture, toasts } = createTemplateHost();

        toasts.info('a', { showProgress: true, duration: 3000 });
        toasts.info('b', {
          showProgress: true,
          duration: 3000,
          pauseOnHover: false,
        });
        toasts.config({ stack: false });
        fixture.detectChanges();
        const [a, b] = Array.from(
          fixture.nativeElement.querySelectorAll('andes-toast-item'),
        ) as HTMLElement[];
        expect(a.hasAttribute('data-paused')).toBe(false);

        a.dispatchEvent(new MouseEvent('mouseenter'));
        b.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        expect(a.hasAttribute('data-paused')).toBe(true);
        expect(b.hasAttribute('data-paused')).toBe(false);

        a.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        expect(a.hasAttribute('data-paused')).toBe(false);
      });

      it('holds the bar of every toast in a hovered deck', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.info('a', { showProgress: true });
        toasts.info('b', { showProgress: true });
        fixture.detectChanges();
        const [region] = regions(fixture.nativeElement);
        const rendered = Array.from(
          region.querySelectorAll<HTMLElement>('andes-toast-item'),
        );

        region.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        expect(rendered.every((i) => i.hasAttribute('data-paused'))).toBe(true);

        region.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        expect(rendered.some((i) => i.hasAttribute('data-paused'))).toBe(false);
      });

      it('draws the bar as a flat 2px line on the card edge, clipped by the card corners', () => {
        const css = readFileSync(
          'packages/ui/src/lib/toast/toast-item.css',
          'utf8',
        );
        const bar = '.andes-toast__progress';
        expect(declaredValue(css, bar, 'position')).toBe('absolute');
        expect(declaredValue(css, bar, 'inset-inline')).toBe('0');
        expect(declaredValue(css, bar, 'bottom')).toBe('0');
        expect(declaredValue(css, bar, 'block-size')).toBe('2px');
        // Square ends, no track, no glow: nothing but a flat fill.
        for (const property of [
          'border-radius',
          'box-shadow',
          'filter',
          'inline-size',
        ]) {
          expect(declaredValue(css, bar, property)).toBeUndefined();
        }
        expect(declaredValue(css, bar, 'background')).not.toContain('gradient');
        expect(declaredValue(css, bar, 'background')).toContain(
          '--andes-toast-progress-bg',
        );

        // The clip is the card's border box with the card's own radius.
        const clip = '.andes-toast__progress-clip';
        expect(declaredValue(css, clip, 'inset')).toBe('-1px');
        expect(declaredValue(css, clip, 'border-radius')).toBe('inherit');
        expect(declaredValue(css, clip, 'overflow')).toBe('hidden');
      });

      it('shrinks the bar with a linear scaleX towards the inline start', () => {
        const css = readFileSync(
          'packages/ui/src/lib/toast/toast-item.css',
          'utf8',
        );
        const bar = '.andes-toast__progress';
        expect(declaredValue(css, bar, 'transform-origin')).toBe('0 50%');
        expect(
          declaredValue(
            css,
            ':host(:dir(rtl)) .andes-toast__progress',
            'transform-origin',
          ),
        ).toBe('100% 50%');
        expect(declaredValue(css, bar, 'animation')).toBe(
          'andes-toast-progress linear forwards',
        );
        expect(css).toMatch(
          /@keyframes andes-toast-progress \{\s*from \{\s*transform: scaleX\(1\);\s*\}\s*to \{\s*transform: scaleX\(0\);\s*\}\s*\}/,
        );
      });

      it('colours the bar with the severity tone at 70%, or the card ink at 30% when plain', () => {
        const css = readFileSync(
          'packages/ui/src/lib/toast/toast-item.css',
          'utf8',
        );
        // Prettier wraps long values, which leaves spaces inside the brackets.
        const tight = (value: string | undefined) =>
          value?.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
        for (const [severity, tone] of [
          ['success', 'success'],
          ['error', 'danger'],
          ['warning', 'warning'],
          ['info', 'info'],
        ]) {
          expect(
            tight(
              declaredValue(
                css,
                `:host([data-severity='${severity}'])`,
                '--_toast-progress',
              ),
            ),
          ).toBe(
            `color-mix(in srgb, var(--_toast-line-${tone}) 70%, transparent)`,
          );
        }
        // Dark card: the -text tints, which stay legible there.
        expect(
          declaredValue(
            css,
            ":host-context([data-andes-theme='dark'])",
            '--_toast-line-danger',
          ),
        ).toBe('var(--andes-color-danger-text)');
        // The override wins, then the severity tone, then the neutral ink.
        expect(
          tight(declaredValue(css, '.andes-toast__progress', 'background')),
        ).toBe(
          'var(--andes-toast-progress-bg, var(--_toast-progress, color-mix(in srgb, var(--andes-color-card-foreground) 30%, transparent)))',
        );
      });

      it('hides the bar under reduced motion instead of showing a static one', () => {
        const css = readFileSync(
          'packages/ui/src/lib/toast/toast-item.css',
          'utf8',
        );
        const block =
          /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/.exec(
            css,
          )?.[1] ?? '';
        expect(block).toMatch(
          /\.andes-toast__progress-clip \{\s*display: none;\s*\}/,
        );
      });

      it('renders the bar inside the clip, which is hidden from assistive tech', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.warning('x', { showProgress: true });
        fixture.detectChanges();

        const clip = fixture.nativeElement.querySelector(
          '.andes-toast__progress-clip',
        ) as HTMLElement;
        expect(clip.getAttribute('aria-hidden')).toBe('true');
        expect(clip.querySelector('.andes-toast__progress')).not.toBeNull();
      });

      it('pauses the bar while focus is inside the toast and while the page is hidden', () => {
        const css = readFileSync(
          'packages/ui/src/lib/toast/toast-item.css',
          'utf8',
        );
        for (const selector of [
          ':host([data-paused]) .andes-toast__progress',
          ':host([data-pause-on-hover]:hover) .andes-toast__progress',
          ':host(:focus-within) .andes-toast__progress',
        ]) {
          expect(declaredValue(css, selector, 'animation-play-state')).toBe(
            'paused',
          );
        }

        const { fixture, toasts } = createTemplateHost();
        toasts.info('a', { showProgress: true });
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector(
          'andes-toast-item',
        ) as HTMLElement;
        const hidden = vi
          .spyOn(document, 'hidden', 'get')
          .mockReturnValue(true);
        try {
          document.dispatchEvent(new Event('visibilitychange'));
          fixture.detectChanges();
          expect(item.hasAttribute('data-paused')).toBe(true);
        } finally {
          hidden.mockReturnValue(false);
          document.dispatchEvent(new Event('visibilitychange'));
          hidden.mockRestore();
        }
        fixture.detectChanges();
        expect(item.hasAttribute('data-paused')).toBe(false);
      });
    });

    describe('semantic parts', () => {
      it('classNames and styles reach each part of a notification', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.success('Body text', {
          title: 'Heading',
          duration: false,
          showProgress: true,
          actions: [{ label: 'Open', onClick: () => undefined }],
          className: 'legacy-root',
          classNames: {
            root: 'p-root',
            wrapper: 'p-wrapper',
            icon: 'p-icon',
            content: 'p-content',
            title: 'p-title',
            description: 'p-description',
            actions: 'p-actions',
            close: 'p-close',
          },
          styles: {
            root: { borderRadius: '16px' },
            icon: { color: 'rgb(1, 2, 3)' },
            title: { fontWeight: '600' },
            description: { color: 'rgb(4, 5, 6)' },
            close: { opacity: '0.5' },
          },
        });
        fixture.detectChanges();

        const root = fixture.nativeElement.querySelector(
          'andes-toast-item',
        ) as HTMLElement;
        const part = (selector: string) =>
          root.querySelector(selector) as HTMLElement;
        expect(root.classList).toContain('p-root');
        expect(root.classList).toContain('legacy-root');
        expect(root.style.borderRadius).toBe('16px');
        expect(part('.andes-toast__row').classList).toContain('p-wrapper');
        expect(part('.andes-toast__icon').classList).toContain('p-icon');
        expect(part('.andes-toast__icon').style.color).toBe('rgb(1, 2, 3)');
        expect(part('.andes-toast__content').classList).toContain('p-content');
        expect(part('.andes-toast__title').classList).toContain('p-title');
        expect(part('.andes-toast__title').style.fontWeight).toBe('600');
        expect(part('.andes-toast__message').classList).toContain(
          'p-description',
        );
        expect(part('.andes-toast__message').style.color).toBe('rgb(4, 5, 6)');
        expect(part('.andes-toast__actions').classList).toContain('p-actions');
        expect(part('.andes-toast__close').classList).toContain('p-close');
        expect(part('.andes-toast__close').style.opacity).toBe('0.5');
        // The parts keep their own classes.
        expect(part('.andes-toast__icon').classList).toContain(
          'andes-toast__icon',
        );
      });

      it('styles the progress bar next to its duration', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.info('x', {
          showProgress: true,
          classNames: { progress: 'p-bar' },
          styles: { progress: { height: '4px' } },
        });
        fixture.detectChanges();

        const bar = fixture.nativeElement.querySelector(
          '.andes-toast__progress',
        ) as HTMLElement;
        expect(bar.classList).toContain('p-bar');
        expect(bar.style.height).toBe('4px');
        expect(bar.style.animationDuration).toBe('5000ms');
      });

      it('a message takes classNames.title and styles.title for its text', () => {
        const { fixture, messages } = createTemplateHost();

        messages.open({
          type: 'success',
          content: 'Saved',
          classNames: { root: 'm-root', icon: 'm-icon', title: 'm-title' },
          styles: { title: { color: 'rgb(7, 8, 9)' } },
        });
        fixture.detectChanges();

        const root = fixture.nativeElement.querySelector(
          'andes-toast-item',
        ) as HTMLElement;
        const text = root.querySelector('.andes-toast__message') as HTMLElement;
        expect(root.classList).toContain('m-root');
        expect(root.querySelector('.andes-toast__icon')?.classList).toContain(
          'm-icon',
        );
        expect(text.classList).toContain('m-title');
        expect(text.style.color).toBe('rgb(7, 8, 9)');
      });
    });

    describe('custom content', () => {
      it('actionsTemplate renders in place of the actions group, and its close() dismisses the toast', async () => {
        const { fixture, host, toasts } = createTemplateHost();

        const ref = toasts.info('Pick one', {
          actions: [{ label: 'ignored', onClick: () => undefined }],
          actionsTemplate: host.actionsBlock(),
          duration: false,
        });
        fixture.detectChanges();

        const actions = fixture.nativeElement.querySelector(
          '.andes-toast__actions',
        ) as HTMLElement;
        expect(actions.querySelector('andes-button')).toBeNull();
        const custom = actions.querySelector<HTMLElement>('.custom-actions');
        expect(custom?.textContent).toBe('Got it');

        custom?.click();
        fixture.detectChanges();
        await expect(ref.afterClosed).resolves.toBe('close-button');
      });

      it('the actions group buttons are the small (24px) size', () => {
        const { fixture, toasts } = createTemplateHost();

        toasts.info('x', {
          actions: [
            { label: 'a', onClick: () => undefined },
            { label: 'b', onClick: () => undefined },
          ],
        });
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll(
          '.andes-toast__actions .andes-button--sm',
        );
        expect(buttons).toHaveLength(2);
      });

      it('headless replaces the whole content but keeps the announcement and the card', () => {
        const announceSpy = vi.fn().mockResolvedValue(undefined);
        const { fixture, host, toasts } = createTemplateHost([
          { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
        ]);

        const ref = toasts.success('Custom body', {
          title: 'Hidden title',
          headless: host.headlessBlock(),
          action: { label: 'Undo', onClick: () => undefined },
        });
        fixture.detectChanges();

        const root = fixture.nativeElement.querySelector(
          'andes-toast-item',
        ) as HTMLElement;
        expect(root.hasAttribute('data-headless')).toBe(true);
        expect(root.querySelector('.headless-body')?.textContent).toContain(
          'Custom body',
        );
        for (const part of [
          '.andes-toast__icon',
          '.andes-toast__title',
          '.andes-toast__message',
          '.andes-toast__action',
          '.andes-toast__close',
        ]) {
          expect(root.querySelector(part)).toBeNull();
        }
        expect(announceSpy).toHaveBeenCalledWith(
          'Hidden title. Custom body',
          'polite',
        );

        root.querySelector<HTMLElement>('.headless-close')?.click();
        fixture.detectChanges();
        expect(toasts.toasts()).toHaveLength(0);
        expect(ref.id).toBeTruthy();
      });
    });

    describe('keyboard and screen readers', () => {
      function press(init: KeyboardEventInit): KeyboardEvent {
        const event = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          ...init,
        });
        document.dispatchEvent(event);
        return event;
      }

      it('a region holding toasts is a labelled landmark advertising the hotkey', () => {
        const { fixture, toasts, messages } = createTemplateHost();

        toasts.info('a');
        messages.info('b');
        fixture.detectChanges();

        const [notifications, messageRegion] = regions(fixture.nativeElement);
        expect(notifications.getAttribute('role')).toBe('region');
        expect(notifications.getAttribute('aria-label')).toBe('Notifications');
        expect(notifications.getAttribute('aria-keyshortcuts')).toBe('Alt+T');
        expect(messageRegion.getAttribute('aria-label')).toBe('Messages');

        toasts.destroy();
        fixture.detectChanges();
        expect(notifications.getAttribute('role')).toBeNull();
        expect(notifications.getAttribute('aria-label')).toBeNull();
        expect(notifications.getAttribute('aria-keyshortcuts')).toBeNull();
      });

      it('Alt+T focuses the newest toast, which expands the deck and holds its countdown', () => {
        vi.useFakeTimers();
        const { fixture, toasts } = createTemplateHost();
        toasts.info('older', { duration: 2000 });
        toasts.info('newer', { duration: 2000 });
        fixture.detectChanges();
        const [region] = regions(fixture.nativeElement);
        const front = region.querySelector(
          'andes-toast-item[data-front]',
        ) as HTMLElement;
        expect(region.hasAttribute('data-stacked')).toBe(true);

        const event = press({ altKey: true, code: 'KeyT', key: '†' });
        fixture.detectChanges();

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(front);
        expect(front.getAttribute('tabindex')).toBe('-1');
        expect(region.hasAttribute('data-stacked')).toBe(false);
        vi.advanceTimersByTime(10_000);
        expect(toasts.toasts().map((t) => t.message)).toContain('newer');
      });

      it('ignores other chords, a missing modifier, and a disabled hotkey', () => {
        const { fixture, host, toasts } = createTemplateHost();
        toasts.info('a');
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('andes-toast-item');

        press({ code: 'KeyT', key: 't' });
        press({ altKey: true, shiftKey: true, code: 'KeyT', key: 'T' });
        press({ altKey: true, code: 'KeyN', key: 'n' });
        expect(document.activeElement).not.toBe(item);

        host.hotkey.set(false);
        fixture.detectChanges();
        press({ altKey: true, code: 'KeyT', key: 't' });
        expect(document.activeElement).not.toBe(item);
        expect(
          regions(fixture.nativeElement)[0].getAttribute('aria-keyshortcuts'),
        ).toBeNull();
      });

      it('accepts any chord, e.g. Ctrl+Shift+N, and falls back to the key when there is no code', () => {
        const { fixture, host, toasts } = createTemplateHost();
        host.hotkey.set('Ctrl+Shift+N');
        toasts.info('a');
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('andes-toast-item');

        press({ ctrlKey: true, shiftKey: true, key: 'N' });

        expect(document.activeElement).toBe(item);
      });

      it('Escape dismisses the focused toast and returns focus to where it was', async () => {
        const { fixture, toasts } = createTemplateHost();
        const outside = fixture.nativeElement.querySelector(
          '.outside',
        ) as HTMLElement;
        outside.focus();
        const ref = toasts.info('a', { duration: false });
        fixture.detectChanges();

        press({ altKey: true, code: 'KeyT', key: 't' });
        const item = fixture.nativeElement.querySelector(
          'andes-toast-item',
        ) as HTMLElement;
        expect(document.activeElement).toBe(item);

        item.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
        fixture.detectChanges();

        await expect(ref.afterClosed).resolves.toBe('dismissed');
        expect(document.activeElement).toBe(outside);
      });

      it('Escape on a button inside the toast dismisses it too', async () => {
        const { fixture, toasts } = createTemplateHost();
        const ref = toasts.info('a', { duration: false });
        fixture.detectChanges();

        fixture.nativeElement
          .querySelector('.andes-toast__close')
          .dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
          );
        fixture.detectChanges();

        await expect(ref.afterClosed).resolves.toBe('dismissed');
      });
    });

    describe('container', () => {
      it('moves the viewport into the element, or the element a selector finds', () => {
        const { fixture, host } = createTemplateHost();
        const mount = document.createElement('div');
        mount.id = 'toast-mount';
        document.body.appendChild(mount);
        try {
          const viewport = fixture.nativeElement.querySelector(
            'andes-toast-viewport',
          ) as HTMLElement;
          expect(viewport.parentElement).toBe(fixture.nativeElement);

          host.container.set(mount);
          fixture.detectChanges();
          expect(viewport.parentElement).toBe(mount);

          host.container.set(null);
          host.container.set('#toast-mount');
          fixture.detectChanges();
          expect(viewport.parentElement).toBe(mount);

          host.container.set('#missing');
          fixture.detectChanges();
          expect(viewport.parentElement).toBe(mount);
        } finally {
          fixture.destroy();
          mount.remove();
        }
      });

      it('still renders its toasts after the move', () => {
        const { fixture, host, toasts } = createTemplateHost();
        const mount = document.createElement('div');
        document.body.appendChild(mount);
        try {
          host.container.set(mount);
          fixture.detectChanges();
          toasts.info('moved');
          fixture.detectChanges();
          expect(mount.querySelectorAll('andes-toast-item')).toHaveLength(1);
        } finally {
          fixture.destroy();
          mount.remove();
        }
      });
    });

    describe('message defaults', () => {
      it('shows only the newest message of a collapsed message deck, 16px apart when expanded', () => {
        const { fixture, messages } = createTemplateHost();
        messages.config({ stack: { threshold: 2 } });

        messages.info('1');
        messages.info('2');
        messages.info('3');
        fixture.detectChanges();

        const [region] = regions(fixture.nativeElement);
        const rendered = Array.from(
          region.querySelectorAll<HTMLElement>('andes-toast-item'),
        );
        expect(region.hasAttribute('data-stacked')).toBe(true);
        expect(
          rendered.map((i) => i.hasAttribute('data-stack-overflow')),
        ).toEqual([true, true, false]);
        expect(region.style.getPropertyValue('--_toast-gap')).toBe('16px');
        expect(region.style.getPropertyValue('--_toast-peek')).toBe('8px');
      });
    });

    it('applies className to the toast root', () => {
      const { fixture, service } = createHost();

      service.show({ message: 'x', className: 'my-toast' });
      fixture.detectChanges();

      expect(items(fixture)[0].classList).toContain('my-toast');
      expect(items(fixture)[0].classList).toContain('andes-toast');
    });
  });
});
