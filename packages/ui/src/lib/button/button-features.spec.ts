import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Component, ErrorHandler, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { atRule, collapsed } from '../../testing/at-rule';
import { declaredValue } from '../../testing/computed-style';
import {
  AndesButton,
  AndesButtonClickAction,
  AndesButtonElevation,
} from './button';

const css = readFileSync(
  resolve(process.cwd(), 'packages/ui/src/lib/button/button.css'),
  'utf8',
);

/** A promise settled by hand, so a spec decides when an action ends. */
function deferred() {
  let resolvePromise!: () => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<void>((resolveFn, rejectFn) => {
    resolvePromise = resolveFn;
    rejectPromise = rejectFn;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

describe('AndesButton press feedback', () => {
  const motion = collapsed(
    atRule(css, '@media (prefers-reduced-motion: no-preference)'),
  );

  it('scales the pressed button by a custom property, 0.98 by default', () => {
    expect(motion).toContain(
      'transform: scale(var(--andes-button-press-scale, 0.98))',
    );
    expect(motion).toContain('.andes-button:active');
  });

  it('presses only a button that can be pressed: not disabled, loading, a link or opted out', () => {
    const selector = motion.slice(
      motion.indexOf('.andes-button:active'),
      motion.indexOf('{', motion.indexOf('.andes-button:active')),
    );

    for (const excluded of [
      ':not(:disabled)',
      ':not([data-disabled])',
      ':not(.andes-button--loading)',
      ':not(.andes-button--link)',
      ':not(.andes-button--no-press)',
    ]) {
      expect(selector).toContain(excluded);
    }
  });

  it('animates the transform with a short ease, shaped by custom properties', () => {
    expect(motion).toContain('--andes-button-press-duration');
    expect(motion).toContain('--andes-button-press-ease');
    expect(motion).toContain('transform var(');
  });

  it('declares the press and the transform transition only under the motion-allowed query', () => {
    expect(declaredValue(css, '.andes-button', 'transition')).not.toContain(
      'transform',
    );
    expect(css.split('scale(var(--andes-button-press-scale').length - 1).toBe(
      1,
    );
    expect(motion).toContain('--andes-button-press-scale');
  });

  it('turns the press off with pressScale=false and by default leaves it on', () => {
    @Component({
      imports: [AndesButton],
      template: `<andes-button [pressScale]="press()">Save</andes-button>`,
    })
    class PressHost {
      readonly press = signal(true);
    }
    const fixture = TestBed.createComponent(PressHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(button.classList).not.toContain('andes-button--no-press');

    fixture.componentInstance.press.set(false);
    fixture.detectChanges();
    expect(button.classList).toContain('andes-button--no-press');
  });
});

describe('AndesButton elevation', () => {
  it.each([
    ['low', '--andes-shadow-sm'],
    ['medium', '--andes-shadow-md'],
    ['high', '--andes-shadow-lg'],
  ] as const)('%s uses the %s token', (level, token) => {
    @Component({
      imports: [AndesButton],
      template: `<andes-button [elevation]="level">Save</andes-button>`,
    })
    class ElevationHost {
      readonly level: AndesButtonElevation = level;
    }
    const fixture = TestBed.createComponent(ElevationHost);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('button') as HTMLElement).classList,
    ).toContain(`andes-button--elevation-${level}`);
    expect(
      declaredValue(css, `.andes-button--elevation-${level}`, 'box-shadow'),
    ).toBe(`var(${token})`);
  });

  it('adds no elevation class by default', () => {
    @Component({
      imports: [AndesButton],
      template: `<andes-button>Save</andes-button>`,
    })
    class FlatHost {}
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('button') as HTMLElement).className,
    ).not.toContain('elevation');
  });
});

describe('AndesButton clickAction', () => {
  @Component({
    imports: [AndesButton],
    template: `<andes-button
      [clickAction]="action()"
      [interruptible]="interruptible()"
      [disabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
      >Save</andes-button
    >`,
  })
  class ActionHost {
    readonly action = signal<AndesButtonClickAction | undefined>(undefined);
    readonly interruptible = signal(false);
    readonly disabled = signal(false);
    readonly clicks = signal(0);
  }

  function setup(action: AndesButtonClickAction) {
    const fixture = TestBed.createComponent(ActionHost);
    fixture.componentInstance.action.set(action);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    const click = async () => {
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, button, click };
  }

  it('runs on every click with the event, and a synchronous action shows no loading', async () => {
    const action = vi.fn();
    const { button, click, fixture } = setup(action);

    await click();
    await click();

    expect(action).toHaveBeenCalledTimes(2);
    expect(action.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.disabled).toBe(false);
    expect(fixture.componentInstance.clicks()).toBe(2);
  });

  it('is loading, blocked and busy until the returned promise settles', async () => {
    const pending = deferred();
    const action = vi.fn(() => pending.promise);
    const { fixture, button, click } = setup(action);

    await click();

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    expect(button.querySelector('.andes-button__spinner')).toBeTruthy();
    expect(button.classList).toContain('andes-button--loading');

    pending.resolve();
    await pending.promise;
    fixture.detectChanges();

    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.disabled).toBe(false);
    expect(button.querySelector('.andes-button__spinner')).toBeNull();
  });

  it('is not run twice while pending', async () => {
    const pending = deferred();
    const action = vi.fn(() => pending.promise);
    const { button, click } = setup(action);

    await click();
    button.click();

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('keeps the button clickable when interruptible, and only the newest action ends the loading', async () => {
    const first = deferred();
    const second = deferred();
    const queue = [first, second];
    const action = vi.fn(() => queue.shift()?.promise);
    const { fixture, button, click } = setup(action);
    fixture.componentInstance.interruptible.set(true);
    fixture.detectChanges();

    await click();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(false);

    await click();
    expect(action).toHaveBeenCalledTimes(2);

    first.resolve();
    await first.promise;
    fixture.detectChanges();
    // The interrupted action ending does not end the newest one.
    expect(button.getAttribute('aria-busy')).toBe('true');

    second.resolve();
    await second.promise;
    fixture.detectChanges();
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('hands a rejection to the ErrorHandler and ends the loading state', async () => {
    const handleError = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useValue: { handleError } }],
    });
    const pending = deferred();
    const { fixture, button, click } = setup(() => pending.promise);

    await click();
    const failure = new Error('save failed');
    pending.reject(failure);
    await pending.promise.catch(() => undefined);
    await Promise.resolve();
    fixture.detectChanges();

    expect(handleError).toHaveBeenCalledWith(failure);
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('hands a throwing action to the ErrorHandler', async () => {
    const handleError = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useValue: { handleError } }],
    });
    const failure = new Error('boom');
    const { click } = setup(() => {
      throw failure;
    });

    await click();

    expect(handleError).toHaveBeenCalledWith(failure);
  });

  it('does not run on a disabled button', () => {
    const action = vi.fn();
    const { fixture, button } = setup(action);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    button.click();

    expect(action).not.toHaveBeenCalled();
  });
});

describe('AndesButton focusableWhenDisabled', () => {
  @Component({
    imports: [AndesButton],
    template: `<andes-button
        [focusableWhenDisabled]="focusable()"
        [disabled]="disabled()"
        [loading]="loading()"
        [clickAction]="action"
        (click)="clicks.set(clicks() + 1)"
        >Save</andes-button
      ><andes-button
        href="https://andes-ng.dev"
        [focusableWhenDisabled]="focusable()"
        [disabled]="disabled()"
        >Link</andes-button
      >`,
  })
  class FocusHost {
    readonly focusable = signal(true);
    readonly disabled = signal(false);
    readonly loading = signal(false);
    readonly clicks = signal(0);
    readonly action = vi.fn();
  }

  function setup() {
    const fixture = TestBed.createComponent(FocusHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    return { fixture, button };
  }

  it('keeps a disabled button focusable, with aria-disabled instead of the native attribute', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('tabindex')).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('keeps a loading button focusable and busy', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('still blocks the click, for the host listener and the action alike', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    button.click();

    expect(fixture.componentInstance.clicks()).toBe(0);
    expect(fixture.componentInstance.action).not.toHaveBeenCalled();
  });

  it('lets an enabled button click as usual', () => {
    const { fixture, button } = setup();

    button.click();

    expect(fixture.componentInstance.clicks()).toBe(1);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
  });

  it('is the native disabled attribute again when not asked for', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.focusable.set(false);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
  });

  it('leaves a disabled link out of the click and the tab order', () => {
    const { fixture } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('href')).toBe(false);
  });
});

describe('AndesButton loading announcement', () => {
  @Component({
    imports: [AndesButton],
    template: `<andes-button
      [loading]="loading()"
      [loadingLabel]="label()"
      [clickAction]="action()"
      >Save</andes-button
    >`,
  })
  class StatusHost {
    readonly loading = signal(false);
    readonly label = signal('Loading');
    readonly action = signal<AndesButtonClickAction | undefined>(undefined);
  }

  const status = (fixture: { nativeElement: HTMLElement }) =>
    fixture.nativeElement.querySelector(
      '.andes-button__status',
    ) as HTMLElement | null;

  it('adds no live region to a button that never loads', () => {
    const fixture = TestBed.createComponent(StatusHost);
    fixture.detectChanges();

    expect(status(fixture)).toBeNull();
  });

  it('keeps a polite status region beside a button with a click action, filled only while busy', () => {
    const fixture = TestBed.createComponent(StatusHost);
    fixture.componentInstance.action.set(() => undefined);
    fixture.detectChanges();
    const region = status(fixture) as HTMLElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;

    expect(region.getAttribute('role')).toBe('status');
    expect(region.textContent).toBe('');
    expect(button.contains(region)).toBe(false);

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(region.textContent).toBe('Loading');
    // The button's own name is not polluted by the announcement.
    expect(button.textContent).not.toContain('Loading');

    fixture.componentInstance.label.set('Saving');
    fixture.detectChanges();
    expect(region.textContent).toBe('Saving');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(region.textContent).toBe('');
  });

  it('adds the region when a button first loads and keeps it afterwards', () => {
    const fixture = TestBed.createComponent(StatusHost);
    fixture.detectChanges();

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(status(fixture)?.textContent).toBe('Loading');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(status(fixture)?.textContent).toBe('');
  });

  it('hides the region visually without taking it out of the accessibility tree', () => {
    expect(declaredValue(css, '.andes-button__status', 'position')).toBe(
      'absolute',
    );
    expect(declaredValue(css, '.andes-button__status', 'clip-path')).toBe(
      'inset(50%)',
    );
    expect(
      declaredValue(css, '.andes-button__status', 'display'),
    ).toBeUndefined();
  });
});

describe('AndesButton form and link attributes', () => {
  @Component({
    imports: [AndesButton],
    template: `<andes-button
        type="submit"
        form="checkout"
        name="intent"
        [value]="value()"
        >Pay</andes-button
      ><andes-button href="https://andes-ng.dev" rel="noopener noreferrer"
        >Docs</andes-button
      ><andes-button>Plain</andes-button>`,
  })
  class AttrHost {
    readonly value = signal<string | number>('pay');
  }

  it('sets form, name and value on the real button', () => {
    const fixture = TestBed.createComponent(AttrHost);
    fixture.detectChanges();
    const [pay, plain] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(pay.getAttribute('form')).toBe('checkout');
    expect(pay.getAttribute('name')).toBe('intent');
    expect(pay.getAttribute('value')).toBe('pay');

    fixture.componentInstance.value.set(7);
    fixture.detectChanges();
    expect(pay.getAttribute('value')).toBe('7');

    expect(plain.hasAttribute('form')).toBe(false);
    expect(plain.hasAttribute('name')).toBe(false);
    expect(plain.hasAttribute('value')).toBe(false);
  });

  it('sets rel on the link only when given', () => {
    const fixture = TestBed.createComponent(AttrHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('AndesButton icon-only name', () => {
  @Component({
    imports: [AndesButton],
    template: `<andes-button
      size="icon"
      [attr.data-case]="'named'"
      aria-label="Search"
      >S</andes-button
    >`,
  })
  class NamedHost {}

  @Component({
    imports: [AndesButton],
    template: `<andes-button size="icon">S</andes-button>`,
  })
  class UnnamedHost {}

  afterEach(() => vi.restoreAllMocks());

  it('warns once in development when an icon-only button has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(UnnamedHost);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('aria-label');
  });

  it('is quiet when the icon-only button is named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('AndesButton focus()', () => {
  it('moves keyboard focus to the real button', () => {
    @Component({
      imports: [AndesButton],
      template: `<andes-button #b>Save</andes-button>`,
    })
    class FocusMethodHost {}
    const fixture = TestBed.createComponent(FocusMethodHost);
    fixture.detectChanges();
    const instance = fixture.debugElement.children[0]
      .componentInstance as AndesButton;

    instance.focus();

    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('button'),
    );
  });
});
