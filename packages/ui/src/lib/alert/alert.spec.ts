import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Component,
  ElementRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { declaredValue, toPx } from '../../testing/computed-style';

import {
  AndesAlert,
  AndesAlertActionPlacement,
  AndesAlertClassNames,
  AndesAlertCloseEvent,
  AndesAlertPart,
  AndesAlertRole,
  AndesAlertSemanticValue,
  AndesAlertSeverity,
  AndesAlertStyles,
  AndesAlertTemplateContext,
  AndesAlertVariant,
} from './alert';

const alertCss = () =>
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'alert.css'),
    'utf-8',
  );

const themeCss = () =>
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../tokens/src/theme.css',
    ),
    'utf-8',
  );

/** A declared length in pixels, looking a lone `var(--andes-...)` up in the token sheet. */
function lengthOf(declared: string | undefined): number {
  const name = /^var\((--[\w-]+)\)$/.exec(declared ?? '')?.[1];
  return toPx(
    name ? (declaredValue(themeCss(), ':root', name) ?? '') : (declared ?? ''),
  );
}

/** The literal a `var(--name, literal)` falls back to. */
function fallbackOf(declared: string | undefined): string | undefined {
  const comma = declared?.indexOf(',') ?? -1;
  return declared && comma > 0
    ? declared.slice(comma + 1, declared.lastIndexOf(')')).trim()
    : undefined;
}

@Component({
  imports: [AndesAlert],
  template: `<andes-alert
    [severity]="severity()"
    [closable]="closable()"
    [showIcon]="showIcon()"
    [role]="role()"
    [closeLabel]="closeLabel()"
    (closing)="onClosing($event)"
    (afterClose)="afterCloseCount = afterCloseCount + 1"
  >
    <span slot="title">Heads up</span>
    Something you should know.
  </andes-alert>`,
})
class HostComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly severity = signal<AndesAlertSeverity | undefined>('info');
  readonly closable = signal(false);
  readonly showIcon = signal(true);
  readonly role = signal<AndesAlertRole | undefined>(undefined);
  readonly closeLabel = signal('Close');
  closedCount = 0;
  afterCloseCount = 0;
  preventClose = false;
  lastCloseEvent?: AndesAlertCloseEvent;

  onClosing(event: AndesAlertCloseEvent): void {
    this.closedCount++;
    this.lastCloseEvent = event;
    // Observed before hiding: the card must still be on screen when `closing` fires.
    this.visibleWhenClosing = !(
      this.elementRef.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement
    ).hidden;
    if (this.preventClose) event.preventDefault();
  }
  visibleWhenClosing?: boolean;
}

describe('AndesAlert', () => {
  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector(
      '[data-slot="alert"]',
    ) as HTMLElement;
    return { fixture, alert };
  }

  it('renders the projected title and description', () => {
    const { alert } = createHost();

    expect(alert.textContent).toContain('Heads up');
    expect(alert.textContent).toContain('Something you should know.');
  });

  it('defaults to the info severity', () => {
    const { alert } = createHost();

    expect(alert.classList).toContain('andes-alert--info');
    expect(alert.getAttribute('data-severity')).toBe('info');
  });

  it.each(['success', 'info', 'warning', 'danger'] as const)(
    'supports the %s severity',
    (severity) => {
      const { fixture, alert } = createHost();
      fixture.componentInstance.severity.set(severity);
      fixture.detectChanges();

      expect(alert.classList).toContain(`andes-alert--${severity}`);
      expect(alert.getAttribute('data-severity')).toBe(severity);
    },
  );

  it('defaults to role="status" for non-danger severities', () => {
    const { fixture, alert } = createHost();

    for (const severity of ['success', 'info', 'warning'] as const) {
      fixture.componentInstance.severity.set(severity);
      fixture.detectChanges();
      expect(alert.getAttribute('role')).toBe('status');
    }
  });

  it('defaults to role="alert" for the danger severity', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.severity.set('danger');
    fixture.detectChanges();

    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('lets a consumer override the resolved role', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.severity.set('info');
    fixture.componentInstance.role.set('alert');
    fixture.detectChanges();

    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('does not duplicate the role attribute onto the host element', () => {
    // Regression test: a static `role="..."` attribute (unlike a `[role]` property binding)
    // matches the `role` input's name, so Angular also writes it onto <andes-alert> itself
    // unless the host metadata explicitly nulls it out - producing two elements (host + inner
    // div) both carrying the same role and duplicate live-region announcements for screen
    // reader users. Only the inner div is supposed to carry it.
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert role="alert">Something went wrong.</andes-alert>`,
    })
    class StaticRoleHost {}

    const fixture = TestBed.createComponent(StaticRoleHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'andes-alert',
    ) as HTMLElement;
    const inner = host.querySelector('[data-slot="alert"]') as HTMLElement;

    expect(host.hasAttribute('role')).toBe(false);
    expect(inner.getAttribute('role')).toBe('alert');
  });

  it('shows the severity icon by default', () => {
    const { alert } = createHost();

    expect(alert.querySelector('.andes-alert__icon')).toBeTruthy();
  });

  it('hides the icon when showIcon is false', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.showIcon.set(false);
    fixture.detectChanges();

    expect(alert.querySelector('.andes-alert__icon')).toBeFalsy();
  });

  describe('severity icons', () => {
    /** The drawn shape of the rendered glyph: its `<circle>` count plus every path's geometry. */
    function iconShape(alert: HTMLElement) {
      const svg = alert.querySelector(
        '.andes-alert__icon svg',
      ) as SVGSVGElement | null;
      if (!svg) return null;
      return {
        circles: svg.querySelectorAll('circle').length,
        paths: Array.from(svg.querySelectorAll('path')).map(
          (p) => p.getAttribute('d') ?? '',
        ),
      };
    }

    function shapeFor(severity: AndesAlertSeverity) {
      const { fixture, alert } = createHost();
      fixture.componentInstance.severity.set(severity);
      fixture.detectChanges();
      return iconShape(alert);
    }

    it('draws a check inside a disc for success', () => {
      const shape = shapeFor('success');

      expect(shape?.circles).toBe(1);
      // A single polyline stroke: down-right into the corner, then up-right - a check mark.
      expect(shape?.paths).toEqual(['m7.7 12.7 2.6 3 6.1-7']);
    });

    it('draws an "i" inside a disc for info', () => {
      const shape = shapeFor('info');

      expect(shape?.circles).toBe(1);
      // The stem, then the tittle above it (a zero-length stroke with a round cap = a dot).
      expect(shape?.paths).toEqual(['M12 11v6.25', 'M12 7.25h.01']);
    });

    it('draws an exclamation mark inside a disc for warning', () => {
      const shape = shapeFor('warning');

      // Round like the others, as in Ant Design: the "!" and the amber tell it from info.
      expect(shape?.circles).toBe(1);
      expect(shape?.paths).toEqual(['M12 6.75v6.5', 'M12 17.25h.01']);
    });

    it('draws an X inside a disc for danger', () => {
      const shape = shapeFor('danger');

      expect(shape?.circles).toBe(1);
      // Two strokes crossing at the disc's centre.
      expect(shape?.paths).toEqual(['m8.6 8.6 6.8 6.8', 'm15.4 8.6-6.8 6.8']);
    });

    it('draws a distinct glyph for every severity', () => {
      // Guards the @switch: a missing @case would silently fall through to the @default (info)
      // glyph, leaving two severities visually identical while every other test still passed.
      const shapes = (['success', 'info', 'warning', 'danger'] as const).map(
        (severity) => JSON.stringify(shapeFor(severity)),
      );

      expect(new Set(shapes).size).toBe(4);
    });

    it.each(['success', 'info', 'warning', 'danger'] as const)(
      'fills the %s disc and cuts the mark out in the surface color',
      (severity) => {
        const { fixture, alert } = createHost();
        fixture.componentInstance.severity.set(severity);
        fixture.detectChanges();
        const svg = alert.querySelector(
          '.andes-alert__icon svg',
        ) as SVGSVGElement;
        const disc = svg.querySelector('circle') as SVGCircleElement;
        const mark = svg.querySelector('.andes-alert__mark') as SVGGElement;

        // The disc is the glyph's own color; every path is inside the group that the
        // stylesheet strokes with the surface color, so no mark is left in `currentColor`.
        expect(svg.getAttribute('fill')).toBe('currentColor');
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(disc.getAttribute('r')).toBe('12');
        expect(svg.querySelectorAll('path')).toHaveLength(
          mark.querySelectorAll('path').length,
        );
        expect(declaredValue(alertCss(), '.andes-alert__mark', 'stroke')).toBe(
          'var(--andes-alert-surface)',
        );
        expect(declaredValue(alertCss(), '.andes-alert__mark', 'fill')).toBe(
          'none',
        );
      },
    );

    it('renders no glyph at all when showIcon is false', () => {
      const { fixture, alert } = createHost();
      fixture.componentInstance.showIcon.set(false);
      fixture.detectChanges();

      expect(iconShape(alert)).toBeNull();
      expect(alert.querySelectorAll('.andes-alert__icon svg')).toHaveLength(0);
    });

    it('keeps honouring showIcon after the severity changes', () => {
      const { fixture, alert } = createHost();
      fixture.componentInstance.showIcon.set(false);
      fixture.componentInstance.severity.set('danger');
      fixture.detectChanges();

      expect(alert.querySelector('.andes-alert__icon')).toBeFalsy();

      fixture.componentInstance.showIcon.set(true);
      fixture.detectChanges();

      expect(iconShape(alert)?.paths).toEqual([
        'm8.6 8.6 6.8 6.8',
        'm15.4 8.6-6.8 6.8',
      ]);
    });
  });

  describe('layout modifiers', () => {
    it('collapses the icon gutter when no icon is rendered', () => {
      const { fixture, alert } = createHost();

      expect(alert.classList).not.toContain('andes-alert--no-icon');

      fixture.componentInstance.showIcon.set(false);
      fixture.detectChanges();

      expect(alert.classList).toContain('andes-alert--no-icon');
    });

    it('flags a closable alert with a modifier class', () => {
      const { fixture, alert } = createHost();

      expect(alert.classList).not.toContain('andes-alert--closable');

      fixture.componentInstance.closable.set(true);
      fixture.detectChanges();

      expect(alert.classList).toContain('andes-alert--closable');
    });
  });

  it('does not render a close button by default', () => {
    const { alert } = createHost();

    expect(alert.querySelector('.andes-alert__close')).toBeFalsy();
  });

  it('renders a labeled close button when closable', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.detectChanges();
    const close = alert.querySelector(
      '.andes-alert__close',
    ) as HTMLButtonElement;

    expect(close).toBeTruthy();
    expect(close.getAttribute('aria-label')).toBe('Close');
    expect(close.getAttribute('type')).toBe('button');
  });

  it('uses a custom closeLabel for the close button accessible name', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.componentInstance.closeLabel.set('Dismiss');
    fixture.detectChanges();
    const close = alert.querySelector(
      '.andes-alert__close',
    ) as HTMLButtonElement;

    expect(close.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('hides itself and emits closing when the close button is clicked', () => {
    const { fixture, alert } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.detectChanges();
    const close = alert.querySelector(
      '.andes-alert__close',
    ) as HTMLButtonElement;

    close.click();
    fixture.detectChanges();

    expect(alert.hidden).toBe(true);
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('projects custom action content', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert>
        Body text
        <button slot="action">Undo</button>
      </andes-alert>`,
    })
    class ActionHost {}

    const fixture = TestBed.createComponent(ActionHost);
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector(
      '.andes-alert__action',
    ) as HTMLElement;

    expect(action.querySelector('button')?.textContent).toBe('Undo');
  });

  it('treats bare boolean attributes (no brackets) as true, not the string ""', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert closable showIcon>Body text</andes-alert>`,
    })
    class BareAttrHost {}

    const fixture = TestBed.createComponent(BareAttrHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector(
      '[data-slot="alert"]',
    ) as HTMLElement;

    expect(alert.querySelector('.andes-alert__close')).toBeTruthy();
    expect(alert.querySelector('.andes-alert__icon')).toBeTruthy();
  });

  describe('closing and afterClose', () => {
    function clickClose(fixture: ReturnType<typeof createHost>['fixture']) {
      fixture.componentInstance.closable.set(true);
      fixture.detectChanges();
      const close = fixture.nativeElement.querySelector(
        '.andes-alert__close',
      ) as HTMLButtonElement;
      close.click();
      fixture.detectChanges();
    }

    it('emits closing with the originating click before anything is hidden', () => {
      const { fixture } = createHost();

      clickClose(fixture);

      const event = fixture.componentInstance.lastCloseEvent;
      expect(event).toBeInstanceOf(AndesAlertCloseEvent);
      expect(event?.originalEvent).toBeInstanceOf(MouseEvent);
      expect(fixture.componentInstance.visibleWhenClosing).toBe(true);
    });

    it('keeps the alert open when closing is default-prevented', async () => {
      const { fixture, alert } = createHost();
      fixture.componentInstance.preventClose = true;

      clickClose(fixture);
      await fixture.whenStable();

      expect(fixture.componentInstance.lastCloseEvent?.defaultPrevented).toBe(
        true,
      );
      expect(alert.hidden).toBe(false);
      expect(fixture.componentInstance.afterCloseCount).toBe(0);
    });

    it('emits afterClose once the alert is hidden', async () => {
      const { fixture, alert } = createHost();

      clickClose(fixture);
      await fixture.whenStable();

      expect(alert.hidden).toBe(true);
      expect(fixture.componentInstance.afterCloseCount).toBe(1);
    });

    it('takes the host out of layout, not just the inner card', async () => {
      const { fixture } = createHost();
      const host = fixture.nativeElement.querySelector(
        'andes-alert',
      ) as HTMLElement;

      expect(host.style.display).toBe('');

      clickClose(fixture);
      await fixture.whenStable();

      expect(host.style.display).toBe('none');
    });

    describe('collapse animation', () => {
      let animate: ReturnType<typeof vi.fn>;
      let cancel: ReturnType<typeof vi.fn>;
      let finish: () => void;
      let reducedMotion: boolean;

      beforeEach(() => {
        reducedMotion = false;
        cancel = vi.fn();
        animate = vi.fn(() => {
          const finished = new Promise<void>((resolve) => (finish = resolve));
          return { finished, cancel } as unknown as Animation;
        });
        Object.defineProperty(HTMLElement.prototype, 'animate', {
          configurable: true,
          value: animate,
        });
        // jsdom implements neither API, so both are installed for this block only.
        Object.defineProperty(window, 'matchMedia', {
          configurable: true,
          value: (query: string) =>
            ({
              matches: query.includes('reduce') && reducedMotion,
              media: query,
            }) as MediaQueryList,
        });
      });

      afterEach(() => {
        delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
        delete (window as Partial<Window>).matchMedia;
      });

      it('collapses the host before hiding it, then emits afterClose', async () => {
        const { fixture, alert } = createHost();

        clickClose(fixture);

        expect(animate).toHaveBeenCalledTimes(1);
        const [keyframes, options] = animate.mock.calls[0];
        expect(keyframes.at(-1)).toEqual({
          height: '0px',
          paddingBlock: '0px',
          opacity: 0,
        });
        expect(options.fill).toBe('forwards');
        // Ant Design's unmount: 0.3s on its ease-in-out-circ curve, with the height and the
        // opacity running together from the first frame to the last.
        expect(options.duration).toBe(300);
        expect(options.easing).toBe('cubic-bezier(0.78, 0.14, 0.15, 0.86)');
        expect(keyframes).toHaveLength(2);
        expect(keyframes[0].opacity).toBe(1);
        expect(keyframes[0].height).toMatch(/px$/);
        // The card itself is what shrinks, so its border and corners stay whole to the end.
        expect(animate.mock.contexts[0]).toBe(alert);
        // Mid-collapse: still visible, afterClose not yet fired.
        expect(alert.hidden).toBe(false);
        expect(fixture.componentInstance.afterCloseCount).toBe(0);

        finish();
        // Let the component's `finished.then(...)` run before waiting for the render.
        await Promise.resolve();
        await fixture.whenStable();

        expect(alert.hidden).toBe(true);
        expect(cancel).toHaveBeenCalled();
        expect(fixture.componentInstance.afterCloseCount).toBe(1);
      });

      it('ignores repeat clicks while collapsing', async () => {
        const { fixture } = createHost();

        clickClose(fixture);
        (
          fixture.nativeElement.querySelector(
            '.andes-alert__close',
          ) as HTMLButtonElement
        ).click();

        expect(animate).toHaveBeenCalledTimes(1);
        expect(fixture.componentInstance.closedCount).toBe(1);

        finish();
        // Let the component's `finished.then(...)` run before waiting for the render.
        await Promise.resolve();
        await fixture.whenStable();
        expect(fixture.componentInstance.afterCloseCount).toBe(1);
      });

      it('skips the animation under prefers-reduced-motion', async () => {
        reducedMotion = true;
        const { fixture, alert } = createHost();

        clickClose(fixture);
        await fixture.whenStable();

        expect(animate).not.toHaveBeenCalled();
        expect(alert.hidden).toBe(true);
        expect(fixture.componentInstance.afterCloseCount).toBe(1);
      });
    });
  });

  describe('focus after dismissal', () => {
    @Component({
      imports: [AndesAlert],
      template: `<div class="container" [attr.tabindex]="containerTabindex()">
        @if (before()) {
          <button type="button" class="before">Before</button>
        }
        <andes-alert closable>Saved.</andes-alert>
        @if (after()) {
          <button type="button" disabled>Disabled</button>
          <span tabindex="-1">Programmatic only</span>
          <a href="#" hidden>Hidden</a>
          <a href="#" class="after">After</a>
        }
      </div>`,
    })
    class FocusHost {
      readonly before = signal(true);
      readonly after = signal(true);
      readonly containerTabindex = signal<string | null>(null);
    }

    function dismissFromCloseButton(
      configure: (host: FocusHost) => void = () => undefined,
      beforeDismiss: (root: HTMLElement) => void = () => undefined,
    ) {
      const fixture = TestBed.createComponent(FocusHost);
      configure(fixture.componentInstance);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      beforeDismiss(root);
      const close = root.querySelector(
        '.andes-alert__close',
      ) as HTMLButtonElement;
      close.focus();
      expect(document.activeElement).toBe(close);
      close.click();
      fixture.detectChanges();
      return { fixture, root };
    }

    it('moves focus to the next tabbable element after the alert', () => {
      const { root } = dismissFromCloseButton();

      expect(document.activeElement).toBe(root.querySelector('.after'));
    });

    it('falls back to the previous tabbable element when nothing follows', () => {
      const { root } = dismissFromCloseButton((h) => h.after.set(false));

      expect(document.activeElement).toBe(root.querySelector('.before'));
    });

    it('falls back to a focusable ancestor when no tabbable element is left', () => {
      // "No tabbable element left" has to hold for the whole document, which other specs
      // sharing it (e.g. a leftover overlay input) can't be trusted to keep - so everything
      // outside this fixture is made inert for the test, which the focus fallback skips.
      const outside = Array.from(document.body.children).filter(
        (el) => !el.hasAttribute('inert'),
      );
      const { root } = dismissFromCloseButton(
        (h) => {
          h.before.set(false);
          h.after.set(false);
          h.containerTabindex.set('-1');
        },
        (fixtureRoot) =>
          outside
            .filter((el) => !el.contains(fixtureRoot))
            .forEach((el) => el.setAttribute('inert', '')),
      );

      try {
        expect(document.activeElement).toBe(root.querySelector('.container'));
      } finally {
        outside.forEach((el) => el.removeAttribute('inert'));
      }
    });

    it('leaves focus alone when it was not inside the alert', () => {
      const fixture = TestBed.createComponent(FocusHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const before = root.querySelector('.before') as HTMLButtonElement;
      before.focus();

      (root.querySelector('.andes-alert__close') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(before);
    });
  });

  describe('banner', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert
        [banner]="banner()"
        [severity]="severity()"
        [showIcon]="showIcon()"
        >Scheduled maintenance tonight.</andes-alert
      >`,
    })
    class BannerHost {
      readonly banner = signal(true);
      readonly severity = signal<AndesAlertSeverity | undefined>(undefined);
      readonly showIcon = signal(true);
    }

    function createBanner() {
      const fixture = TestBed.createComponent(BannerHost);
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;
      return { fixture, alert };
    }

    it('adds the banner modifier', () => {
      const { alert } = createBanner();

      expect(alert.classList).toContain('andes-alert--banner');
    });

    it('defaults to the warning severity and shows its icon', () => {
      const { alert } = createBanner();

      expect(alert.getAttribute('data-severity')).toBe('warning');
      expect(alert.classList).toContain('andes-alert--warning');
      expect(alert.querySelector('.andes-alert__icon svg')).toBeTruthy();
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('still honours an explicit severity', () => {
      const { fixture, alert } = createBanner();
      fixture.componentInstance.severity.set('danger');
      fixture.detectChanges();

      expect(alert.getAttribute('data-severity')).toBe('danger');
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('falls back to info when neither banner nor severity is set', () => {
      const { fixture, alert } = createBanner();
      fixture.componentInstance.banner.set(false);
      fixture.detectChanges();

      expect(alert.classList).not.toContain('andes-alert--banner');
      expect(alert.getAttribute('data-severity')).toBe('info');
    });
  });

  describe('variant', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert [variant]="variant()" severity="success"
        >Saved.</andes-alert
      >`,
    })
    class VariantHost {
      readonly variant = signal<AndesAlertVariant>('tinted');
    }

    it('defaults to the tinted variant', () => {
      @Component({
        imports: [AndesAlert],
        template: `<andes-alert>Saved.</andes-alert>`,
      })
      class DefaultHost {}

      const fixture = TestBed.createComponent(DefaultHost);
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;

      expect(alert.classList).toContain('andes-alert--tinted');
      expect(alert.classList).not.toContain('andes-alert--outlined');
    });

    it('switches to the outlined variant', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      fixture.componentInstance.variant.set('outlined');
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;

      expect(alert.classList).toContain('andes-alert--outlined');
      expect(alert.classList).not.toContain('andes-alert--tinted');
      expect(alert.classList).toContain('andes-alert--success');
    });

    it('switches to the borderless filled variant', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      fixture.componentInstance.variant.set('filled');
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;

      expect(alert.classList).toContain('andes-alert--filled');
      expect(alert.classList).not.toContain('andes-alert--tinted');
      expect(alert.classList).not.toContain('andes-alert--outlined');
    });
  });

  describe('marquee', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert
        banner
        [marquee]="marquee()"
        [marqueeSpeed]="speed()"
        [description]="description()"
        >Projected notice
        <a href="#" class="notice-link">details</a></andes-alert
      >`,
    })
    class MarqueeHost {
      readonly marquee = signal(true);
      readonly speed = signal(60);
      readonly description = signal<string | null>(null);
    }

    function createMarquee() {
      const fixture = TestBed.createComponent(MarqueeHost);
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;
      return { fixture, alert };
    }

    it('wraps the projected description in a scrolling track', () => {
      const { alert } = createMarquee();

      expect(alert.classList).toContain('andes-alert--marquee');
      const track = alert.querySelector(
        '.andes-alert__description > .andes-alert__marquee',
      ) as HTMLElement;
      expect(track).toBeTruthy();
      expect(track.textContent).toContain('Projected notice');
      expect(track.querySelector('.notice-link')).toBeTruthy();
    });

    it('scrolls a plain-text description input as well', () => {
      const { fixture, alert } = createMarquee();
      fixture.componentInstance.description.set('Input notice');
      fixture.detectChanges();

      expect(
        alert.querySelector('.andes-alert__marquee')?.textContent?.trim(),
      ).toBe('Input notice');
    });

    it('keeps the projected content when the marquee is switched off and on again', () => {
      const { fixture, alert } = createMarquee();

      fixture.componentInstance.marquee.set(false);
      fixture.detectChanges();
      const description = alert.querySelector(
        '.andes-alert__description',
      ) as HTMLElement;
      expect(alert.classList).not.toContain('andes-alert--marquee');
      expect(description.querySelector('.andes-alert__marquee')).toBeNull();
      expect(description.textContent).toContain('Projected notice');
      expect(description.querySelector('.notice-link')).toBeTruthy();

      fixture.componentInstance.marquee.set(true);
      fixture.detectChanges();
      expect(
        alert.querySelector('.andes-alert__marquee .notice-link'),
      ).toBeTruthy();
    });

    it('derives the loop duration from the measured track width and the speed', () => {
      let resize: (() => void) | undefined;
      class FakeResizeObserver {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(): void {
          /* measured on demand through `resize` */
        }
        disconnect(): void {
          /* nothing to release */
        }
      }
      const original = window.ResizeObserver;
      window.ResizeObserver =
        FakeResizeObserver as unknown as typeof ResizeObserver;
      try {
        const { fixture, alert } = createMarquee();
        const track = alert.querySelector(
          '.andes-alert__marquee',
        ) as HTMLElement;
        Object.defineProperty(track, 'offsetWidth', { value: 900 });

        resize?.();
        fixture.detectChanges();
        expect(track.style.animationDuration).toBe('15s');

        fixture.componentInstance.speed.set(90);
        fixture.detectChanges();
        expect(track.style.animationDuration).toBe('10s');
      } finally {
        window.ResizeObserver = original;
      }
    });

    it('defaults to a calm 40px per second', () => {
      let resize: (() => void) | undefined;
      class FakeResizeObserver {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(): void {
          /* measured on demand through `resize` */
        }
        disconnect(): void {
          /* nothing to release */
        }
      }
      const original = window.ResizeObserver;
      window.ResizeObserver =
        FakeResizeObserver as unknown as typeof ResizeObserver;
      try {
        const fixture = TestBed.createComponent(AndesAlert);
        fixture.componentRef.setInput('marquee', true);
        fixture.componentRef.setInput('description', 'Maintenance tonight');
        fixture.detectChanges();
        const track = fixture.nativeElement.querySelector(
          '.andes-alert__marquee',
        ) as HTMLElement;
        Object.defineProperty(track, 'offsetWidth', { value: 900 });

        resize?.();
        fixture.detectChanges();
        expect(track.style.animationDuration).toBe('22.5s');
      } finally {
        window.ResizeObserver = original;
      }
    });
  });

  describe('template inputs', () => {
    @Component({
      imports: [AndesAlert],
      template: `<ng-template #iconTpl let-severity
          ><b class="custom-icon">{{ severity }}</b></ng-template
        >
        <ng-template #closeTpl><i class="custom-close">close</i></ng-template>
        <ng-template #titleTpl let-severity
          ><em class="rich-title">Rich {{ severity }} title</em></ng-template
        >
        <ng-template #descriptionTpl
          ><strong class="rich-description">Rich body</strong></ng-template
        >
        <ng-template #actionTpl
          ><button type="button" class="tpl-action">Retry</button></ng-template
        >
        <andes-alert
          severity="danger"
          closable
          [icon]="useIcon() ? iconTpl : null"
          [closeIcon]="useCloseIcon() ? closeTpl : null"
          [title]="title()"
          [description]="description()"
          [action]="useAction() ? actionTpl : null"
        >
          <span slot="title" class="slot-title">Slot title</span>
          <span class="slot-description">Slot body</span>
          <button slot="action" type="button" class="slot-action">Undo</button>
        </andes-alert>`,
    })
    class TemplateHost {
      readonly titleTpl =
        viewChild.required<TemplateRef<AndesAlertTemplateContext>>('titleTpl');
      readonly descriptionTpl =
        viewChild.required<TemplateRef<AndesAlertTemplateContext>>(
          'descriptionTpl',
        );
      readonly useIcon = signal(false);
      readonly useCloseIcon = signal(false);
      readonly useAction = signal(false);
      readonly title = signal<
        string | TemplateRef<AndesAlertTemplateContext> | null
      >(null);
      readonly description = signal<
        string | TemplateRef<AndesAlertTemplateContext> | null
      >(null);
    }

    function createTemplateHost() {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector(
        '[data-slot="alert"]',
      ) as HTMLElement;
      return { fixture, alert, host: fixture.componentInstance };
    }

    it('falls back to the projected slots when no inputs are set', () => {
      const { alert } = createTemplateHost();

      expect(
        alert.querySelector('.andes-alert__title .slot-title'),
      ).toBeTruthy();
      expect(
        alert.querySelector('.andes-alert__description .slot-description'),
      ).toBeTruthy();
      expect(
        alert.querySelector('.andes-alert__action .slot-action'),
      ).toBeTruthy();
    });

    it('renders a custom icon template with the severity as context, inside the tinted icon slot', () => {
      const { fixture, alert, host } = createTemplateHost();
      host.useIcon.set(true);
      fixture.detectChanges();

      const icon = alert.querySelector('.andes-alert__icon') as HTMLElement;
      expect(icon.querySelector('.custom-icon')?.textContent).toBe('danger');
      expect(icon.querySelector('svg')).toBeFalsy();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not render a custom icon when showIcon is false', () => {
      @Component({
        imports: [AndesAlert],
        template: `<ng-template #tpl><b class="custom-icon">!</b></ng-template>
          <andes-alert [showIcon]="false" [icon]="tpl">Body</andes-alert>`,
      })
      class NoIconHost {}

      const fixture = TestBed.createComponent(NoIconHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.custom-icon')).toBeFalsy();
    });

    it('renders a custom close icon while keeping the accessible name', () => {
      const { fixture, alert, host } = createTemplateHost();
      host.useCloseIcon.set(true);
      fixture.detectChanges();

      const close = alert.querySelector('.andes-alert__close') as HTMLElement;
      expect(close.querySelector('.custom-close')).toBeTruthy();
      expect(close.querySelector('svg')).toBeFalsy();
      expect(close.getAttribute('aria-label')).toBe('Close');
    });

    it('renders plain-text title and description inputs over the slots', () => {
      const { fixture, alert, host } = createTemplateHost();
      host.title.set('Text title');
      host.description.set('Text body');
      fixture.detectChanges();

      const title = alert.querySelector('.andes-alert__title') as HTMLElement;
      const description = alert.querySelector(
        '.andes-alert__description',
      ) as HTMLElement;
      expect(title.textContent?.trim()).toBe('Text title');
      expect(description.textContent?.trim()).toBe('Text body');
      expect(alert.querySelector('.slot-title')).toBeFalsy();
      expect(alert.querySelector('.slot-description')).toBeFalsy();
    });

    it('renders title, description and action templates over the slots', () => {
      const { fixture, alert, host } = createTemplateHost();
      host.title.set(host.titleTpl());
      host.description.set(host.descriptionTpl());
      host.useAction.set(true);
      fixture.detectChanges();

      expect(
        alert.querySelector('.andes-alert__title .rich-title')?.textContent,
      ).toBe('Rich danger title');
      expect(
        alert.querySelector('.andes-alert__description .rich-description'),
      ).toBeTruthy();
      expect(
        alert.querySelector('.andes-alert__action .tpl-action'),
      ).toBeTruthy();
      expect(alert.querySelector('.slot-title')).toBeFalsy();
      expect(alert.querySelector('.slot-action')).toBeFalsy();
    });

    it('treats an empty-string title as unset and keeps the slot', () => {
      const { fixture, alert, host } = createTemplateHost();
      host.title.set('');
      fixture.detectChanges();

      expect(alert.querySelector('.slot-title')).toBeTruthy();
    });
  });

  it('keeps a static title attribute off the host (no native tooltip)', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert title="Saved"
        >Your changes are live.</andes-alert
      >`,
    })
    class StaticTitleHost {}

    const fixture = TestBed.createComponent(StaticTitleHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'andes-alert',
    ) as HTMLElement;

    expect(host.hasAttribute('title')).toBe(false);
    expect(host.querySelector('.andes-alert__title')?.textContent?.trim()).toBe(
      'Saved',
    );
  });

  it('keeps the title and description containers empty (so :empty hides them) when nothing is provided', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert />`,
    })
    class EmptyHost {}

    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();

    for (const part of ['title', 'description', 'action']) {
      const el = fixture.nativeElement.querySelector(
        `.andes-alert__${part}`,
      ) as HTMLElement;
      expect(el.matches(':empty')).toBe(true);
    }
  });
});

describe('AndesAlert action placement', () => {
  @Component({
    imports: [AndesAlert],
    template: `<ng-template #retryTpl
        ><button type="button" class="tpl-action">Retry</button></ng-template
      >
      <andes-alert
        [actionPlacement]="placement()"
        [action]="useTemplate() ? retryTpl : null"
        >Saved.<button slot="action" type="button" class="slot-action">
          Undo
        </button></andes-alert
      >`,
  })
  class PlacementHost {
    readonly placement = signal<AndesAlertActionPlacement>('bottom');
    readonly useTemplate = signal(false);
  }

  function createPlacementHost() {
    const fixture = TestBed.createComponent(PlacementHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector(
      '[data-slot="alert"]',
    ) as HTMLElement;
    return { fixture, alert, host: fixture.componentInstance };
  }

  it('stacks the action under the text by default', () => {
    const { alert } = createPlacementHost();

    expect(
      alert.querySelector('.andes-alert__content > .andes-alert__action'),
    ).toBeTruthy();
    expect(alert.querySelector('.andes-alert__action--end')).toBeFalsy();
    expect(alert.classList).not.toContain('andes-alert--action-end');
  });

  it('moves the projected action beside the text with placement "end"', () => {
    const { fixture, alert, host } = createPlacementHost();
    host.placement.set('end');
    fixture.detectChanges();

    const end = alert.querySelector('.andes-alert__action--end') as HTMLElement;
    expect(end.parentElement).toBe(alert);
    expect(end.querySelector('.slot-action')).toBeTruthy();
    expect(
      alert.querySelector('.andes-alert__content .slot-action'),
    ).toBeFalsy();
    expect(alert.classList).toContain('andes-alert--action-end');
  });

  it('keeps the projected action when the placement flips back and forth', () => {
    const { fixture, alert, host } = createPlacementHost();
    host.placement.set('end');
    fixture.detectChanges();
    host.placement.set('bottom');
    fixture.detectChanges();

    expect(
      alert.querySelector('.andes-alert__content .slot-action'),
    ).toBeTruthy();
    expect(alert.querySelectorAll('.slot-action').length).toBe(1);
  });

  it('places an action template at the end too', () => {
    const { fixture, alert, host } = createPlacementHost();
    host.useTemplate.set(true);
    host.placement.set('end');
    fixture.detectChanges();

    expect(
      alert.querySelector('.andes-alert__action--end .tpl-action'),
    ).toBeTruthy();
    expect(alert.querySelector('.slot-action')).toBeFalsy();
  });
});

describe('AndesAlert close button options', () => {
  @Component({
    imports: [AndesAlert],
    template: `<ng-template #closeTpl
        ><i class="custom-close">x</i></ng-template
      >
      <andes-alert
        closable
        [closeText]="closeText()"
        [closeDisabled]="closeDisabled()"
        [closeIcon]="useCloseIcon() ? closeTpl : null"
        (closing)="closingCount = closingCount + 1"
        >Saved.</andes-alert
      >`,
  })
  class CloseHost {
    readonly closeText = signal<string | null>(null);
    readonly closeDisabled = signal(false);
    readonly useCloseIcon = signal(false);
    closingCount = 0;
  }

  function createCloseHost() {
    const fixture = TestBed.createComponent(CloseHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector(
      '[data-slot="alert"]',
    ) as HTMLElement;
    const close = () =>
      alert.querySelector('.andes-alert__close') as HTMLButtonElement;
    return { fixture, alert, close, host: fixture.componentInstance };
  }

  it('shows closeText instead of the glyph and lets it name the button', () => {
    const { fixture, close, host } = createCloseHost();
    host.closeText.set('Got it');
    fixture.detectChanges();

    expect(close().textContent?.trim()).toBe('Got it');
    expect(close().querySelector('svg')).toBeFalsy();
    expect(close().classList).toContain('andes-alert__close--text');
    // The visible text is the accessible name; a different aria-label would contradict it.
    expect(close().hasAttribute('aria-label')).toBe(false);
  });

  it('treats an empty closeText as unset', () => {
    const { fixture, close, host } = createCloseHost();
    host.closeText.set('');
    fixture.detectChanges();

    expect(close().querySelector('svg')).toBeTruthy();
    expect(close().getAttribute('aria-label')).toBe('Close');
  });

  it('lets a closeIcon template win over closeText', () => {
    const { fixture, close, host } = createCloseHost();
    host.closeText.set('Got it');
    host.useCloseIcon.set(true);
    fixture.detectChanges();

    expect(close().querySelector('.custom-close')).toBeTruthy();
    expect(close().textContent).not.toContain('Got it');
    expect(close().getAttribute('aria-label')).toBe('Close');
  });

  it('disables the close button and refuses to close with closeDisabled', () => {
    const { fixture, alert, close, host } = createCloseHost();
    host.closeDisabled.set(true);
    fixture.detectChanges();

    expect(close().disabled).toBe(true);
    close().click();
    // Programmatic dispatch bypasses the native disabled check.
    close().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(alert.hidden).toBe(false);
    expect(host.closingCount).toBe(0);
  });

  it('closes again once closeDisabled is lifted', () => {
    const { fixture, alert, close, host } = createCloseHost();
    host.closeDisabled.set(true);
    fixture.detectChanges();
    host.closeDisabled.set(false);
    fixture.detectChanges();

    close().click();
    fixture.detectChanges();

    expect(host.closingCount).toBe(1);
    expect(alert.hidden).toBe(true);
  });
});

describe('AndesAlert metrics', () => {
  // The numbers are Ant Design's, measured on its live Alert page. The unit tests cannot lay
  // anything out, so they pin the declarations the layout comes from.
  const css = alertCss();
  const base = (property: string) =>
    declaredValue(css, '.andes-alert', property);
  const withDescription = (property: string) =>
    declaredValue(
      css,
      '.andes-alert:has( .andes-alert__title:not(:empty) + .andes-alert__description:not(:empty) )',
      property,
    );

  it('is a compact 8px x 12px strip with a 14px icon, 14px/22px text and an 8px radius', () => {
    expect(lengthOf(base('--andes-alert-padding-block'))).toBe(8);
    expect(lengthOf(base('--andes-alert-padding-inline'))).toBe(12);
    expect(lengthOf(base('--andes-alert-icon-size'))).toBe(14);
    expect(lengthOf(base('--andes-alert-icon-gap'))).toBe(8);
    expect(lengthOf(base('--andes-alert-trailing-gap'))).toBe(8);
    expect(lengthOf(base('--andes-alert-title-size'))).toBe(14);
    expect(lengthOf(base('--andes-alert-title-leading'))).toBe(22);
    expect(lengthOf(base('border-radius'))).toBe(8);
    expect(base('border')).toBe('1px solid var(--andes-color-border)');
  });

  it('centres the icon, text, action and close button on the row as a group', () => {
    expect(base('align-items')).toBe('center');
    expect(base('display')).toBe('flex');
  });

  it('steps up to 20px x 24px, a 24px icon and a 16px title with a description', () => {
    expect(lengthOf(withDescription('--andes-alert-padding-block'))).toBe(20);
    expect(lengthOf(withDescription('--andes-alert-padding-inline'))).toBe(24);
    expect(lengthOf(withDescription('--andes-alert-icon-size'))).toBe(24);
    expect(lengthOf(withDescription('--andes-alert-icon-gap'))).toBe(12);
    expect(lengthOf(withDescription('--andes-alert-title-size'))).toBe(16);
    expect(lengthOf(withDescription('--andes-alert-row-gap'))).toBe(8);
    // 16px x 1.5714285714285714 = 25.14px, the line Ant's title sits on.
    expect(withDescription('--andes-alert-title-leading')).toBe(
      '1.5714285714285714',
    );
  });

  it('hangs the parts from the top edge with a description', () => {
    expect(withDescription('align-items')).toBe('flex-start');
  });

  it('sets the title in regular weight, as Ant Design does', () => {
    expect(base('--andes-alert-title-weight')).toBe(
      'var(--andes-font-weight-regular)',
    );
    expect(declaredValue(css, '.andes-alert__title', 'font-weight')).toBe(
      'var(--andes-alert-title-weight)',
    );
    expect(
      declaredValue(themeCss(), ':root', '--andes-font-weight-regular'),
    ).toBe('400');
  });

  it('draws the close glyph at 12px inside a 24px target', () => {
    expect(lengthOf(base('--andes-alert-close-glyph'))).toBe(12);
    expect(lengthOf(base('--andes-alert-control-size'))).toBe(24);
    const close = (property: string) =>
      declaredValue(css, '.andes-alert__close', property);
    // The box is the glyph's, so the close button lines up like Ant's 12px one...
    expect(close('width')).toBe('var(--andes-alert-close-glyph)');
    expect(close('height')).toBe('var(--andes-alert-close-glyph)');
    expect(close('margin-inline-start')).toBe(
      'var(--andes-alert-trailing-gap)',
    );
    // ...and an invisible hit area reaches 6px past it on every side.
    expect(declaredValue(css, '.andes-alert__close::after', 'inset')).toBe(
      'calc( (var(--andes-alert-close-glyph) - var(--andes-alert-control-size)) / 2 )',
    );
  });

  it('draws the close glyph on a 12-unit grid', () => {
    const { alert } = createClosableAlert();
    const svg = alert.querySelector('.andes-alert__close svg') as SVGSVGElement;

    expect(svg.getAttribute('viewBox')).toBe('0 0 12 12');
  });

  it('puts the action 8px before the close button, at the inline-end edge', () => {
    expect(
      declaredValue(css, '.andes-alert__action--end', 'margin-inline-start'),
    ).toBe('var(--andes-alert-trailing-gap)');
  });

  it('runs a banner edge to edge: square, and without side borders', () => {
    expect(declaredValue(css, '.andes-alert--banner', 'border-radius')).toBe(
      '0',
    );
    expect(
      declaredValue(css, '.andes-alert--banner', 'border-inline-width'),
    ).toBe('0');
    expect(
      declaredValue(
        css,
        '.andes-alert--banner.andes-alert--tinted',
        'border-width',
      ),
    ).toBe('0');
    expect(declaredValue(css, ':host', 'display')).toBe('block');
  });

  function createClosableAlert() {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert closable>Saved.</andes-alert>`,
    })
    class ClosableHost {}

    const fixture = TestBed.createComponent(ClosableHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector(
      '[data-slot="alert"]',
    ) as HTMLElement;
    return { fixture, alert };
  }
});

describe('AndesAlert palette', () => {
  // Ant Design's colors for each type, in light and dark, read off its live Alert page.
  const css = alertCss();
  const palette = {
    success: {
      light: ['#52c41a', '#f6ffed', '#b7eb8f'],
      dark: ['#49aa19', '#162312', '#274916'],
    },
    info: {
      light: ['#1677ff', '#e6f4ff', '#91caff'],
      dark: ['#1668dc', '#111a2c', '#15325b'],
    },
    warning: {
      light: ['#faad14', '#fffbe6', '#ffe58f'],
      dark: ['#d89614', '#2b2111', '#594214'],
    },
    danger: {
      light: ['#ff4d4f', '#fff2f0', '#ffccc7'],
      dark: ['#dc4446', '#2c1618', '#5b2526'],
    },
  } as const;

  describe.each(['light', 'dark'] as const)('on the %s theme', (theme) => {
    it.each(Object.keys(palette) as (keyof typeof palette)[])(
      'colors the %s glyph, wash and border',
      (severity) => {
        const selector =
          theme === 'dark'
            ? `:host-context([data-andes-theme='dark']) .andes-alert--${severity}`
            : `.andes-alert--${severity}`;
        const [accent, tint, border] = palette[severity][theme];

        expect(
          fallbackOf(declaredValue(css, selector, '--andes-alert-accent')),
        ).toBe(accent);
        expect(
          fallbackOf(declaredValue(css, selector, '--andes-alert-tint')),
        ).toBe(tint);
        expect(
          fallbackOf(declaredValue(css, selector, '--andes-alert-tint-border')),
        ).toBe(border);
      },
    );
  });

  it.each(Object.keys(palette))(
    'lets a theme override the %s colors with --andes-alert-%s-*',
    (severity) => {
      const light = declaredValue(
        css,
        `.andes-alert--${severity}`,
        '--andes-alert-accent',
      );
      const dark = declaredValue(
        css,
        `:host-context([data-andes-theme='dark']) .andes-alert--${severity}`,
        '--andes-alert-accent',
      );

      // The same hook on both themes, so one override re-colors the severity everywhere.
      expect(light).toContain(`var(--andes-alert-${severity}-icon,`);
      expect(dark).toContain(`var(--andes-alert-${severity}-icon,`);
    },
  );

  it('washes a tinted alert and borders it in the tint border', () => {
    expect(declaredValue(css, '.andes-alert--tinted', 'border-color')).toBe(
      'var(--andes-alert-tint-border)',
    );
    expect(declaredValue(css, '.andes-alert--tinted', 'background-color')).toBe(
      'var(--andes-alert-tint)',
    );
  });

  it('keeps the wash of a filled alert and drops only its border', () => {
    expect(declaredValue(css, '.andes-alert--filled', 'border-color')).toBe(
      'transparent',
    );
    // A transparent border, not none: switching variants never shifts the layout.
    expect(declaredValue(css, '.andes-alert', 'border')).toContain('1px solid');
  });

  it('cuts the glyph mark out in the color behind the icon', () => {
    expect(
      declaredValue(css, '.andes-alert--filled', '--andes-alert-surface'),
    ).toBe('var(--andes-alert-tint)');
    expect(declaredValue(css, '.andes-alert', '--andes-alert-surface')).toBe(
      'var(--andes-color-card)',
    );
  });

  it('colors the close glyph at half the text color, which clears 3:1 on every wash', () => {
    expect(declaredValue(css, '.andes-alert__close', 'color')).toBe(
      'color-mix(in srgb, var(--andes-color-foreground) 50%, transparent)',
    );
  });
});

describe('AndesAlert accessibility styles', () => {
  const css = alertCss();

  it('spells out the outline and the glyph mark in system colors under forced colors', () => {
    const at = css.indexOf('@media (forced-colors: active)');

    expect(at).toBeGreaterThan(0);
    const block = css.slice(at);
    expect(block).toContain('border-color: CanvasText');
    expect(block).toContain('stroke: Canvas');
  });

  it('runs the marquee the other way round in a right-to-left context', () => {
    expect(
      declaredValue(
        css,
        '.andes-alert--marquee:dir(rtl) .andes-alert__marquee',
        'animation-name',
      ),
    ).toBe('andes-alert-marquee-rtl');
    expect(css).toContain('@keyframes andes-alert-marquee-rtl');
  });

  it('uses logical properties only, so the layout mirrors in a right-to-left context', () => {
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

    for (const physical of [
      'margin-left',
      'margin-right',
      'padding-left',
      'padding-right',
      'border-left',
      'border-right',
    ]) {
      expect(rules).not.toContain(`${physical}:`);
    }
  });

  it('stops the marquee under prefers-reduced-motion', () => {
    const at = css.indexOf('@media (prefers-reduced-motion: reduce)');

    expect(at).toBeGreaterThan(0);
    expect(css.slice(at)).toContain('animation: none');
  });
});

describe('AndesAlert live region', () => {
  @Component({
    imports: [AndesAlert],
    template: `<andes-alert [severity]="severity()" [title]="title()" />`,
  })
  class LiveHost {
    readonly severity = signal<AndesAlertSeverity>('info');
    readonly title = signal('Saving...');
  }

  it('updates the text inside the same live region, so a change is announced', () => {
    const fixture = TestBed.createComponent(LiveHost);
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('[role]') as HTMLElement;

    fixture.componentInstance.title.set('Saved.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role]')).toBe(region);
    expect(region.getAttribute('role')).toBe('status');
    expect(region.textContent).toContain('Saved.');
  });

  it('keeps exactly one live region on the page', () => {
    const fixture = TestBed.createComponent(LiveHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role]')).toHaveLength(1);
  });

  it('leaves the close button a native button, so Enter and Space activate it', () => {
    @Component({
      imports: [AndesAlert],
      template: `<andes-alert closable title="Saved." />`,
    })
    class KeyboardHost {}

    const fixture = TestBed.createComponent(KeyboardHost);
    fixture.detectChanges();
    const close = fixture.nativeElement.querySelector(
      '.andes-alert__close',
    ) as HTMLButtonElement;

    expect(close.tagName).toBe('BUTTON');
    expect(close.type).toBe('button');
    expect(close.tabIndex).toBe(0);
  });
});

describe('AndesAlert classNames and styles', () => {
  @Component({
    imports: [AndesAlert],
    template: `<andes-alert
      [severity]="severity()"
      title="Heads up"
      description="Details."
      actionPlacement="end"
      closable
      [classNames]="classNames()"
      [styles]="styles()"
    >
      <span slot="action">Undo</span>
    </andes-alert>`,
  })
  class SemanticHost {
    readonly severity = signal<AndesAlertSeverity>('info');
    readonly classNames =
      signal<AndesAlertSemanticValue<AndesAlertClassNames>>(undefined);
    readonly styles =
      signal<AndesAlertSemanticValue<AndesAlertStyles>>(undefined);
  }

  const PARTS: Record<AndesAlertPart, string> = {
    root: '.andes-alert',
    icon: '.andes-alert__icon',
    section: '.andes-alert__content',
    title: '.andes-alert__title',
    description: '.andes-alert__description',
    actions: '.andes-alert__action',
    close: '.andes-alert__close',
  };

  function create() {
    const fixture = TestBed.createComponent(SemanticHost);
    fixture.detectChanges();
    const part = (name: AndesAlertPart) =>
      fixture.nativeElement.querySelector(PARTS[name]) as HTMLElement;
    return { fixture, part, host: fixture.componentInstance };
  }

  it('adds nothing when neither input is set', () => {
    const { part } = create();

    expect(Array.from(part('root').classList).sort()).toEqual([
      'andes-alert',
      'andes-alert--action-end',
      'andes-alert--closable',
      'andes-alert--info',
      'andes-alert--tinted',
    ]);
    expect(part('root').getAttribute('style')).toBeNull();
  });

  it.each(Object.keys(PARTS) as AndesAlertPart[])(
    "adds a class to the %s part, after the component's own",
    (name) => {
      const { fixture, part, host } = create();
      host.classNames.set({ [name]: 'mine' });
      fixture.detectChanges();

      expect(part(name).classList).toContain('mine');
      expect(part(name).classList.length).toBeGreaterThan(1);
      // Only that part.
      for (const other of Object.keys(PARTS) as AndesAlertPart[]) {
        if (other !== name) {
          expect(part(other).classList).not.toContain('mine');
        }
      }
    },
  );

  it.each(Object.keys(PARTS) as AndesAlertPart[])(
    'styles the %s part inline',
    (name) => {
      const { fixture, part, host } = create();
      host.styles.set({ [name]: { color: 'rgb(1, 2, 3)' } });
      fixture.detectChanges();

      expect(part(name).style.color).toBe('rgb(1, 2, 3)');
      for (const other of Object.keys(PARTS) as AndesAlertPart[]) {
        if (other !== name) {
          expect(part(other).style.color).toBe('');
        }
      }
    },
  );

  it('takes camelCase, dash-case and custom-property keys', () => {
    const { fixture, part, host } = create();
    host.styles.set({
      root: {
        borderWidth: '2px',
        'background-color': 'rgb(4, 5, 6)',
        '--andes-alert-padding-block': '12px',
      },
    });
    fixture.detectChanges();

    expect(part('root').style.borderWidth).toBe('2px');
    expect(part('root').style.backgroundColor).toBe('rgb(4, 5, 6)');
    expect(
      part('root').style.getPropertyValue('--andes-alert-padding-block'),
    ).toBe('12px');
  });

  it("calls a function with the alert's resolved props, again when they change", () => {
    const { fixture, part, host } = create();
    const seen: string[] = [];
    host.styles.set(({ props }) => {
      seen.push(props.severity);
      return props.severity === 'success'
        ? { icon: { color: 'rgb(7, 8, 9)' } }
        : {};
    });
    fixture.detectChanges();

    expect(part('icon').style.color).toBe('');

    host.severity.set('success');
    fixture.detectChanges();

    expect(part('icon').style.color).toBe('rgb(7, 8, 9)');
    expect(seen).toContain('info');
    expect(seen.at(-1)).toBe('success');
  });

  it('hands a classNames function the whole props object', () => {
    const { fixture, host } = create();
    let received: unknown;
    host.classNames.set((info) => {
      received = info;
      return {};
    });
    fixture.detectChanges();

    expect(received).toEqual({
      props: {
        severity: 'info',
        variant: 'tinted',
        banner: false,
        closable: true,
        showIcon: true,
        marquee: false,
        actionPlacement: 'end',
      },
    });
  });

  it('drops the classes and styles again when the inputs are cleared', () => {
    const { fixture, part, host } = create();
    host.classNames.set({ root: 'mine', icon: 'mine' });
    host.styles.set({ root: { color: 'rgb(1, 2, 3)' } });
    fixture.detectChanges();

    host.classNames.set(null);
    host.styles.set(null);
    fixture.detectChanges();

    expect(part('root').classList).not.toContain('mine');
    expect(part('icon').classList).not.toContain('mine');
    expect(part('root').style.color).toBe('');
  });
});
