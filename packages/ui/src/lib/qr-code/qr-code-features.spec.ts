import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { decodeQrModules } from '../../testing/qr-decoder';
import {
  AndesQrCode,
  type AndesQrCodeIconContext,
  type AndesQrCodeStatus,
} from './qr-code';
import type {
  AndesQrCodeClassNamesInput,
  AndesQrCodeError,
  AndesQrCodeSegment,
  AndesQrCodeStylesInput,
} from './qr-code-semantic';
import type { QrFinderShape, QrModuleShape } from './qr-render';

const LOGO =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E';

@Component({
  imports: [AndesQrCode],
  template: `<andes-qr-code
      #qr
      [value]="value()"
      [size]="size()"
      [fluid]="fluid()"
      [type]="type()"
      [shape]="shape()"
      [finderShape]="finderShape()"
      [finderColor]="finderColor()"
      [quietZoneColor]="quietZoneColor()"
      [bgColor]="bgColor()"
      [mask]="mask()"
      [minVersion]="minVersion()"
      [icon]="icon()"
      [iconTemplate]="withTemplate() ? logo : undefined"
      [iconSize]="iconSize()"
      [excavate]="excavate()"
      [status]="status()"
      [classNames]="classNames()"
      [styles]="styles()"
      (encodeError)="errors.push($event)"
    />
    <ng-template #logo let-size let-width="width" let-height="height">
      <span
        class="logo"
        [attr.data-size]="size"
        [attr.data-wh]="width + 'x' + height"
        >L</span
      >
    </ng-template>`,
})
class Host {
  readonly qr = viewChild.required<AndesQrCode>('qr');
  readonly value = signal<string | readonly AndesQrCodeSegment[]>(
    'https://andes.example/pay/42',
  );
  readonly size = signal(160);
  readonly fluid = signal(false);
  readonly type = signal<'svg' | 'canvas'>('svg');
  readonly shape = signal<QrModuleShape>('square');
  readonly finderShape = signal<QrFinderShape>('square');
  readonly finderColor = signal<string | undefined>(undefined);
  readonly quietZoneColor = signal<string | undefined>(undefined);
  readonly bgColor = signal<string | undefined>(undefined);
  readonly mask = signal<number | undefined>(undefined);
  readonly minVersion = signal<number | undefined>(undefined);
  readonly icon = signal<string | undefined>(undefined);
  readonly withTemplate = signal(false);
  readonly iconSize = signal<number | undefined>(undefined);
  readonly excavate = signal(true);
  readonly status = signal<AndesQrCodeStatus>('active');
  readonly classNames = signal<AndesQrCodeClassNamesInput | undefined>(
    undefined,
  );
  readonly styles = signal<AndesQrCodeStylesInput | undefined>(undefined);
  readonly errors: AndesQrCodeError[] = [];
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    el: root.querySelector('andes-qr-code') as HTMLElement,
  };
}

describe('AndesQrCode features', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('module and corner shapes', () => {
    it('draws square modules as one path with the corners inside it', () => {
      const { el } = setup();

      expect(el.querySelector('.andes-qr-code__finders')).toBeNull();
      expect(
        el
          .querySelector('.andes-qr-code__svg')
          ?.getAttribute('shape-rendering'),
      ).toBe('crispEdges');
      expect(el.getAttribute('data-shape')).toBe('square');
    });

    it.each(['rounded', 'dots'] as const)(
      'draws %s modules and the corners as their own path',
      (shape) => {
        const { fixture, host, el } = setup();
        host.shape.set(shape);
        fixture.detectChanges();

        const modules = el.querySelector('.andes-qr-code__modules');
        const finders = el.querySelector('.andes-qr-code__finders');
        expect(modules?.getAttribute('d')).toContain('a');
        expect(finders?.getAttribute('fill-rule')).toBe('evenodd');
        expect(el.getAttribute('data-shape')).toBe(shape);
        expect(
          el
            .querySelector('.andes-qr-code__svg')
            ?.hasAttribute('shape-rendering'),
        ).toBe(false);
      },
    );

    it.each(['rounded', 'circle'] as const)(
      'draws %s corners without touching the modules',
      (shape) => {
        const { fixture, host, el } = setup();
        const before = el
          .querySelector('.andes-qr-code__modules')
          ?.getAttribute('d');
        host.finderShape.set(shape);
        fixture.detectChanges();

        expect(el.querySelector('.andes-qr-code__finders')).not.toBeNull();
        // The corners leave the data path, so it is shorter than the all-in-one one.
        expect(
          (el.querySelector('.andes-qr-code__modules')?.getAttribute('d') ?? '')
            .length,
        ).toBeLessThan((before ?? '').length);
      },
    );

    it('gives the corners their own colour through a custom property', () => {
      const { fixture, host, el } = setup();
      host.finderColor.set('#2563eb');
      fixture.detectChanges();

      expect(el.style.getPropertyValue('--andes-qr-code-finder')).toBe(
        '#2563eb',
      );
      expect(el.querySelector('.andes-qr-code__finders')).not.toBeNull();
    });

    it('keeps the code readable whatever the shapes', () => {
      const { fixture, host } = setup();
      host.shape.set('dots');
      host.finderShape.set('circle');
      fixture.detectChanges();

      const matrix = host.qr().matrix();
      expect(matrix).not.toBeNull();
      expect(decodeQrModules(matrix?.modules ?? []).text).toBe(
        'https://andes.example/pay/42',
      );
    });

    it('exports the shapes in the SVG, the corners as their own path', () => {
      const { fixture, host } = setup();
      host.shape.set('dots');
      host.finderShape.set('rounded');
      fixture.detectChanges();
      const svg = host.qr().toSvg({ color: '#0f172a', bgColor: '#ffffff' });

      expect(svg).toContain('fill-rule="evenodd"');
      expect(svg).not.toContain('crispEdges');
      expect(svg.match(/<path /g)).toHaveLength(2);
    });

    it('keeps an explicit export colour on the corners too', () => {
      const { fixture, host } = setup();
      host.finderColor.set('#2563eb');
      fixture.detectChanges();
      const svg = host.qr().toSvg({ color: '#112233', bgColor: '#ffffff' });

      expect(svg).not.toContain('37, 99, 235');
      expect(svg.match(/fill="rgb\(17, 34, 51\)"/g)).toHaveLength(2);
    });
  });

  describe('value as segments', () => {
    it('encodes a list one part at a time', () => {
      const { fixture, host } = setup();
      host.value.set([
        'https://andes.example/t/',
        '0123456789012345678',
        { mode: 'alphanumeric', text: 'TICKET-7' },
      ]);
      fixture.detectChanges();
      const matrix = host.qr().matrix();
      const decoded = decodeQrModules(matrix?.modules ?? []);

      expect(decoded.modes).toEqual(['byte', 'numeric', 'alphanumeric']);
      expect(decoded.text).toBe(
        'https://andes.example/t/0123456789012345678TICKET-7',
      );
    });

    it('names the code after the joined text', () => {
      const { fixture, host, el } = setup();
      host.value.set(['one-', { mode: 'numeric', text: '42' }]);
      fixture.detectChanges();

      expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
        'QR code: one-42',
      );
    });

    it('reports a segment its mode cannot hold as an invalid value', () => {
      const { fixture, host, el } = setup();
      host.value.set([{ mode: 'numeric', text: '12ab' }]);
      fixture.detectChanges();

      expect(host.errors.at(-1)?.reason).toBe('invalid');
      expect(el.querySelector('.andes-qr-code__placeholder')).not.toBeNull();
    });

    it('treats an empty list as no value', () => {
      const { fixture, host } = setup();
      host.value.set([]);
      fixture.detectChanges();

      expect(host.qr().empty()).toBe(true);
      expect(host.errors).toEqual([]);
    });
  });

  describe('version and mask', () => {
    it('forces the mask', () => {
      const { fixture, host } = setup();
      host.mask.set(5);
      fixture.detectChanges();

      expect(host.qr().matrix()?.mask).toBe(5);
    });

    it('picks a mask by itself otherwise, and reports the version', () => {
      const { host } = setup();

      expect(host.qr().matrix()?.mask).toBeGreaterThanOrEqual(0);
      expect(host.qr().version()).toBe(host.qr().matrix()?.version);
    });

    it('starts from a larger version when asked', () => {
      const { fixture, host } = setup();
      host.minVersion.set(8);
      fixture.detectChanges();

      expect(host.qr().version()).toBe(8);
    });
  });

  describe('errors and the empty state', () => {
    it('emits `encodeError` with a reason when the value is too long, and draws a placeholder', () => {
      const { fixture, host, el } = setup();
      host.value.set('x'.repeat(4000));
      fixture.detectChanges();

      expect(host.errors).toHaveLength(1);
      expect(host.errors[0].reason).toBe('overflow');
      expect(host.errors[0].message).toContain('too long');
      expect(el.getAttribute('data-error')).toBe('overflow');
      expect(
        el
          .querySelector('.andes-qr-code__placeholder')
          ?.getAttribute('data-reason'),
      ).toBe('error');
      expect(
        el
          .querySelector('.andes-qr-code__placeholder ng-icon')
          ?.getAttribute('name'),
      ).toBe('lucideTriangleAlert');
    });

    it('announces the failure and names it on the image', () => {
      const { fixture, host, el } = setup();
      host.value.set('x'.repeat(4000));
      fixture.detectChanges();

      expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
        'Too long to encode',
      );
      expect(
        el.querySelector('[role="img"]')?.getAttribute('aria-label'),
      ).toContain('(Too long to encode)');
    });

    it('emits nothing for a valid value, and again when the value changes to a bad one', () => {
      const { fixture, host } = setup();
      expect(host.errors).toEqual([]);

      host.value.set('y'.repeat(4000));
      fixture.detectChanges();
      host.value.set('z'.repeat(4001));
      fixture.detectChanges();

      expect(host.errors).toHaveLength(2);
    });

    it('draws a quiet placeholder with the qr icon while there is no value', () => {
      const { fixture, host, el } = setup();
      host.value.set('');
      fixture.detectChanges();

      expect(el.getAttribute('data-empty')).toBe('');
      expect(
        el
          .querySelector('.andes-qr-code__placeholder ng-icon')
          ?.getAttribute('name'),
      ).toBe('lucideQrCode');
      expect(
        el.querySelector('.andes-qr-code__placeholder')?.textContent?.trim(),
      ).toBe('No value');
      // Nothing is announced for an empty code.
      expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    });

    it('refuses to export an unencodable value', async () => {
      const { fixture, host } = setup();
      host.value.set('x'.repeat(4000));
      fixture.detectChanges();

      expect(() => host.qr().toSvg()).toThrow('cannot be encoded');
    });
  });

  describe('centre logo', () => {
    it('draws a template over the centre and clears the modules under it', () => {
      const { fixture, host, el } = setup();
      host.withTemplate.set(true);
      fixture.detectChanges();
      const box = el.querySelector('.andes-qr-code__icon-box') as HTMLElement;
      const logo = box.querySelector('.logo') as HTMLElement;

      expect(box).not.toBeNull();
      expect(logo.textContent).toBe('L');
      // 20 % of 160 px: the template learns the logo box in pixels.
      expect(logo.getAttribute('data-wh')).toBe('32x32');
      expect(
        parseFloat(box.style.left) + parseFloat(box.style.width) / 2,
      ).toBeCloseTo(50, 1);
      expect(el.querySelector('[data-slot="qr-code-icon"]')).not.toBeNull();
      expect(el.querySelector('image')).toBeNull();
      expect(['Q', 'H']).toContain(host.qr().effectiveErrorLevel());
    });

    it('draws the image and the template together when both are given', () => {
      const { fixture, host, el } = setup();
      host.icon.set(LOGO);
      host.withTemplate.set(true);
      fixture.detectChanges();

      expect(el.querySelector('image')).not.toBeNull();
      expect(el.querySelector('.andes-qr-code__icon-box')).not.toBeNull();
    });

    it('can leave the modules under the logo in place (excavate off)', () => {
      const { fixture, host } = setup();
      host.icon.set(LOGO);
      fixture.detectChanges();
      const withHole = (
        fixture.nativeElement.querySelector(
          '.andes-qr-code__modules',
        ) as Element
      ).getAttribute('d');

      host.excavate.set(false);
      fixture.detectChanges();
      const kept = (
        fixture.nativeElement.querySelector(
          '.andes-qr-code__modules',
        ) as Element
      ).getAttribute('d');

      expect((kept ?? '').length).toBeGreaterThan((withHole ?? '').length);
      // The symbol still raises the level for the logo it hides.
      expect(['Q', 'H']).toContain(host.qr().effectiveErrorLevel());
    });

    it('uses a logo given at export time when the on-screen one is a template', () => {
      const { fixture, host } = setup();
      host.withTemplate.set(true);
      fixture.detectChanges();

      expect(host.qr().toSvg()).not.toContain('<image');
      expect(host.qr().toSvg({ icon: LOGO })).toContain(
        '<image href="data:image/svg+xml',
      );
    });
  });

  describe('fluid width', () => {
    it('marks the host, drops the fixed pixel size and keeps the size as a maximum', () => {
      const { fixture, host, el } = setup();
      host.fluid.set(true);
      host.size.set(240);
      fixture.detectChanges();
      const symbol = el.querySelector('[role="img"]') as HTMLElement;

      expect(el.hasAttribute('data-fluid')).toBe(true);
      expect(symbol.style.width).toBe('');
      expect(el.style.getPropertyValue('--_andes-qr-code-size')).toBe('240px');
    });

    it('lets the canvas fill its box too', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (() => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        })) as never,
      );
      const { fixture, host, el } = setup();
      host.type.set('canvas');
      host.fluid.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        (el.querySelector('canvas') as HTMLCanvasElement).style.width,
      ).toBe('100%');
    });
  });

  describe('transparent background', () => {
    it('lets the status overlay follow the theme', () => {
      const { fixture, host, el } = setup();
      host.bgColor.set('transparent');
      fixture.detectChanges();

      expect(el.hasAttribute('data-transparent')).toBe(true);
    });

    it('exports a transparent PNG/SVG background', () => {
      const { fixture, host } = setup();
      host.bgColor.set('transparent');
      fixture.detectChanges();

      expect(host.qr().toSvg({ bgColor: 'transparent' })).toMatch(
        /<rect [^>]*fill="(transparent|rgba\(0, 0, 0, 0\))"/,
      );
    });
  });

  describe('classNames and styles', () => {
    it('adds classes and styles to every part', () => {
      const { fixture, host, el } = setup();
      host.status.set('expired');
      host.classNames.set({
        root: 'my-root',
        symbol: ['my-symbol', 'second'],
        svg: 'my-svg',
        mask: 'my-mask',
        status: 'my-status',
        refresh: 'my-refresh',
      });
      host.styles.set({
        root: { borderRadius: 20 },
        symbol: { '--my-var': 'x' },
        mask: { opacity: 0.5 },
        status: { color: 'red' },
        refresh: { marginTop: '4px' },
      });
      fixture.detectChanges();

      expect(el.querySelector('.andes-qr-code')?.classList).toContain(
        'my-root',
      );
      expect(el.querySelector('.andes-qr-code__symbol')?.classList).toContain(
        'second',
      );
      expect(
        el.querySelector('.andes-qr-code__svg')?.classList.contains('my-svg'),
      ).toBe(true);
      expect(el.querySelector('.andes-qr-code__cover')?.classList).toContain(
        'my-mask',
      );
      expect(el.querySelector('.andes-qr-code__message')?.classList).toContain(
        'my-status',
      );
      expect(el.querySelector('.andes-qr-code__refresh')?.classList).toContain(
        'my-refresh',
      );
      expect(
        (el.querySelector('.andes-qr-code') as HTMLElement).style.borderRadius,
      ).toBe('20px');
      expect(
        (el.querySelector('.andes-qr-code__cover') as HTMLElement).style
          .opacity,
      ).toBe('0.5');
      expect(
        (el.querySelector('.andes-qr-code__message') as HTMLElement).style
          .color,
      ).toBe('red');
    });

    it('accepts functions of the props', () => {
      const { fixture, host, el } = setup();
      host.classNames.set(({ props }) => ({
        root: `size-${props.size} level-${props.errorLevel}`,
      }));
      host.styles.set(({ props }) => ({
        root: { '--has-code': props.hasCode ? '1' : '0' },
      }));
      fixture.detectChanges();
      const frame = el.querySelector('.andes-qr-code') as HTMLElement;

      expect(frame.classList).toContain('size-160');
      expect(frame.classList).toContain(
        `level-${host.qr().effectiveErrorLevel()}`,
      );
      expect(frame.style.getPropertyValue('--has-code')).toBe('1');
    });

    it('styles the canvas part', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (() => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        })) as never,
      );
      const { fixture, host, el } = setup();
      host.type.set('canvas');
      host.classNames.set({ canvas: 'my-canvas' });
      fixture.detectChanges();
      await fixture.whenStable();

      expect(el.querySelector('canvas')?.classList).toContain('my-canvas');
    });
  });

  describe('canvas shapes', () => {
    class Path2DStub {
      constructor(readonly data: string) {}
    }

    it('fills rounded modules and styled corners from path data', async () => {
      vi.stubGlobal('Path2D', Path2DStub);
      const context = {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fill: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
      };
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (() => context) as never,
      );
      const { fixture, host } = setup();
      host.type.set('canvas');
      host.shape.set('dots');
      host.finderShape.set('circle');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const fills = context.fill.mock.calls as [Path2DStub, string][];
      expect(fills.length).toBe(2);
      expect(fills[0][1]).toBe('nonzero');
      expect(fills[1][1]).toBe('evenodd');
      expect(fills[1][0].data).toContain('a');
      // Only the background is a plain rectangle.
      expect(context.fillRect).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });
  });

  describe('clipboard', () => {
    it('reports whether the browser can copy an image', () => {
      const { host } = setup();

      expect(host.qr().canCopy()).toBe(false);
    });

    it('refuses to copy where the browser cannot', async () => {
      const { host } = setup();

      await expect(host.qr().copy()).rejects.toThrow('not supported');
    });

    it('writes the PNG as a clipboard item', async () => {
      class Item {
        constructor(readonly items: Record<string, Promise<Blob>>) {}
      }
      const write = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('ClipboardItem', Item);
      Object.defineProperty(window.navigator, 'clipboard', {
        value: { write },
        configurable: true,
      });
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (() => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        })) as never,
      );
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        function (callback) {
          callback(new Blob(['png'], { type: 'image/png' }));
        },
      );
      const { host } = setup();

      expect(host.qr().canCopy()).toBe(true);
      await host.qr().copy();
      const [items] = write.mock.calls[0] as [Item[]];
      expect(Object.keys(items[0].items)).toEqual(['image/png']);
      expect((await items[0].items['image/png']).type).toBe('image/png');
      vi.unstubAllGlobals();
      Object.defineProperty(window.navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
    });
  });
});

// Keeps the template context type exported and in use.
export type { AndesQrCodeIconContext };
