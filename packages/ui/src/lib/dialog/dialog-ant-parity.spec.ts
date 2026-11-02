import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';

import { declaredValue, toPx } from '../../testing/computed-style';
import { ANDES_DIALOG_IMPORTS } from './dialog';
import type { AndesDialogWidth } from './dialog-base';
import { AndesDialogService } from './dialog.service';

/**
 * The dialog's measurements against Ant Design's Modal, measured live on
 * https://ant.design/components/modal: a 520px surface, 20px by 24px padding, an 8px
 * gap under the title, a 12px gap above the footer, a 32px close control 12px from the
 * corner, a 45% black mask, and a zoom-and-fade entry.
 *
 * Sizes are asserted against the stylesheet source, with every `var()` followed to its
 * declaration: jsdom has no layout, and it reports a `var()` longhand as authored.
 */

const read = (path: string) => readFileSync(path, 'utf8');
const css = read('packages/ui/src/lib/dialog/dialog.css');
const buttonCss = read('packages/ui/src/lib/button/button.css');
const inputCss = read('packages/ui/src/lib/input/input.css');
const tokens = read('packages/tokens/src/theme.css');

/** The text between the braces of the first rule written as `selector { ... }`. */
function ruleBody(source: string, selector: string): string | undefined {
  for (
    let from = source.indexOf(selector);
    from !== -1;
    from = source.indexOf(selector, from + 1)
  ) {
    const rest = source.slice(from + selector.length).trimStart();
    if (rest.startsWith('{')) {
      return rest.slice(1, rest.indexOf('}'));
    }
  }
  return undefined;
}

/** `--name: value;` declarations of a rule, as written. */
function declarations(source: string, selector: string): Map<string, string> {
  const result = new Map<string, string>();
  const body = ruleBody(source, selector);
  for (const match of (body ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    result.set(match[1], match[2].replace(/\s+/g, ' ').trim());
  }
  return result;
}

const surfaceVars = declarations(css, '.andes-dialog');
const tokenVars = declarations(tokens, ':root');

/** Resolves an authored length, following `var(--x)` through the dialog and the tokens. */
function resolve(length: string): number {
  let text = length;
  for (let guard = 0; text.includes('var(') && guard < 20; guard++) {
    text = text.replace(/var\((--[\w-]+)\)/g, (_match, name: string) => {
      const value = surfaceVars.get(name) ?? tokenVars.get(name);
      if (value === undefined) {
        throw new Error(`${name} is not declared`);
      }
      return value.includes(' ') && !value.startsWith('calc(')
        ? `(${value})`
        : value;
    });
  }
  return toPx(text);
}

/** Closes up the whitespace Prettier puts inside a wrapped `calc( ... )`. */
const tight = (value: string | undefined) =>
  value?.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

const dialogVar = (name: string) => {
  const value = surfaceVars.get(name);
  if (value === undefined) {
    throw new Error(`${name} is not declared on .andes-dialog`);
  }
  return resolve(value);
};

describe('dialog geometry matches Ant Design', () => {
  it('is 520px wide by default and 416px for a confirmation', () => {
    expect(
      toPx(declaredValue(css, '.andes-dialog--md', 'max-width') ?? ''),
    ).toBe(520);
    expect(
      toPx(
        declaredValue(
          css,
          '.andes-dialog--alert.andes-dialog--md',
          'max-width',
        ) ?? '',
      ),
    ).toBe(416);
  });

  it('pads the surface 20px above and below and 24px at the sides', () => {
    expect(dialogVar('--andes-dialog-padding-block')).toBe(20);
    expect(dialogVar('--andes-dialog-padding-inline')).toBe(24);
  });

  it('takes the 1px border out of the padding, so text sits exactly 24px in', () => {
    const border = dialogVar('--andes-dialog-border-width');
    expect(border).toBe(1);
    expect(declaredValue(css, '.andes-dialog', 'border')).toBe(
      'var(--andes-dialog-border-width) solid var(--andes-color-border)',
    );
    const padding = tight(
      declaredValue(css, '.andes-dialog__viewport', 'padding'),
    );
    expect(padding).toContain(
      'calc(var(--andes-dialog-padding-block) - var(--andes-dialog-border-width))',
    );
    expect(padding).toContain(
      'calc(var(--andes-dialog-padding-inline) - var(--andes-dialog-border-width))',
    );
  });

  it('puts 8px under the header and 12px above the footer', () => {
    expect(dialogVar('--andes-dialog-gap')).toBe(8);
    expect(dialogVar('--andes-dialog-footer-gap')).toBe(12);
    const margin = declaredValue(
      css,
      '.andes-dialog__viewport > .andes-dialog__footer',
      'margin-block-start',
    );
    // The flex gap supplies 8px; the margin tops it up to the footer gap.
    expect(dialogVar('--andes-dialog-gap') + resolve(margin ?? '')).toBe(12);
  });

  it('keeps 8px between the buttons of the footer', () => {
    expect(declaredValue(css, '.andes-dialog__footer', 'gap')).toBe(
      'var(--andes-space-2)',
    );
    expect(resolve('var(--andes-space-2)')).toBe(8);
  });

  it('has a 32px close control 12px from the corner with a 16px glyph', () => {
    expect(dialogVar('--andes-dialog-close-size')).toBe(32);
    expect(dialogVar('--andes-dialog-close-inset')).toBe(12);
    expect(declaredValue(css, '.andes-dialog__close-icon', 'width')).toBe(
      '1rem',
    );
    expect(declaredValue(css, '.andes-dialog__close', 'border-radius')).toBe(
      'var(--andes-radius-sm)',
    );
    expect(resolve('var(--andes-radius-sm)')).toBe(4);
    // Positioned against the padding box, so the border comes off the inset.
    const expected =
      'calc(var(--andes-dialog-close-inset) - var(--andes-dialog-border-width))';
    expect(
      tight(declaredValue(css, '.andes-dialog__close', 'inset-block-start')),
    ).toBe(expected);
    expect(
      tight(declaredValue(css, '.andes-dialog__close', 'inset-inline-end')),
    ).toBe(expected);
  });

  it('seats the maximize control one hit area in from the close control', () => {
    expect(
      tight(declaredValue(css, '.andes-dialog__maximize', 'inset-inline-end')),
    ).toBe(
      'calc(var(--andes-dialog-close-inset) + var(--andes-dialog-close-size) - var(--andes-dialog-border-width))',
    );
  });

  it('keeps a long title clear of the close control, and of the maximize one beside it', () => {
    const clearance = (selector: string) =>
      resolve(declaredValue(css, selector, 'padding-inline-end') ?? '');
    // The "x" reaches 20px past the content edge (32 + 12 - 24); 8px of air on top.
    expect(
      clearance(
        '.andes-dialog:has(> .andes-dialog__close) .andes-dialog__header',
      ),
    ).toBe(28);
    expect(
      clearance(
        '.andes-dialog--maximizable:has(> .andes-dialog__close) .andes-dialog__header',
      ),
    ).toBe(60);
  });

  it('uses the three-layer Ant Design elevation', () => {
    expect(declaredValue(css, '.andes-dialog', 'box-shadow')).toBe(
      '0 6px 16px 0 rgb(0 0 0 / 8%), 0 3px 6px -4px rgb(0 0 0 / 12%), 0 9px 28px 8px rgb(0 0 0 / 5%)',
    );
  });

  it('leaves a 16px gutter around the surface, so it is 100vw - 32px on a phone', () => {
    const selector =
      '.andes-overlay-pane:has(> .andes-dialog, > .andes-dialog-keep-alive > .andes-dialog)';
    expect(declaredValue(css, selector, 'padding')).toBe(
      'var(--andes-space-4)',
    );
    expect(resolve('var(--andes-space-4)')).toBe(16);
  });

  it('parks a top-aligned surface 100px down on a tall screen', () => {
    const selector =
      '.andes-overlay-pane:has(> .andes-dialog--top, > .andes-dialog-keep-alive > .andes-dialog--top)';
    expect(declaredValue(css, selector, 'padding-block-start')).toBe(
      'clamp(var(--andes-space-4), 12.5dvh, 6.25rem)',
    );
    expect(toPx('6.25rem')).toBe(100);
  });

  it('paints the mask 45% black in both themes, overridable with --andes-dialog-mask', () => {
    expect(
      declaredValue(css, '.andes-dialog-backdrop', '--andes-color-overlay'),
    ).toBe('var(--andes-dialog-mask, rgb(0 0 0 / 45%))');
  });

  it('draws the loading skeleton as four 16px bars 16px apart, the last at 61%', () => {
    expect(declaredValue(css, '.andes-dialog__skeleton-line', 'height')).toBe(
      '1rem',
    );
    expect(declaredValue(css, '.andes-dialog__skeleton', 'gap')).toBe(
      'var(--andes-space-4)',
    );
    expect(
      declaredValue(css, '.andes-dialog__skeleton-line:last-child', 'width'),
    ).toBe('61%');
    expect(declaredValue(css, '.andes-dialog__skeleton', 'margin-block')).toBe(
      'var(--andes-dialog-gap) var(--andes-space-4)',
    );
  });

  it('sets a confirmation icon of 22px, 12px before the text, 8px between title and content', () => {
    expect(declaredValue(css, '.andes-dialog__method-icon', 'width')).toBe(
      '1.375rem',
    );
    expect(toPx('1.375rem')).toBe(22);
    expect(
      declaredValue(css, '.andes-dialog__method-icon', 'margin-block-start'),
    ).toBe('1px');
    expect(declaredValue(css, '.andes-dialog__method', 'gap')).toBe(
      'var(--andes-space-3)',
    );
    expect(declaredValue(css, '.andes-dialog__method-text', 'gap')).toBe(
      'var(--andes-space-2)',
    );
  });
});

describe('dialog focus halos are not painted over', () => {
  /** The inner shadow of a pinned part: the second layer of its `box-shadow`. */
  function innerMask(selector: string): number {
    const shadow = declaredValue(css, selector, 'box-shadow') ?? '';
    const layers = shadow.split(/,\s*(?![^(]*\))/);
    const layer = layers[1] ?? '';
    const offset = /^0\s+(.+?)\s+0\s+var\(/.exec(layer)?.[1];
    return resolve(offset ?? '');
  }

  /** How far the widest focus indicator of the library's controls reaches. */
  const outlineReach = (() => {
    const outline = declaredValue(
      buttonCss,
      '.andes-button:focus-visible',
      'outline',
    );
    const offset = declaredValue(
      buttonCss,
      '.andes-button:focus-visible',
      'outline-offset',
    );
    return toPx(/^(\S+)/.exec(outline ?? '')?.[1] ?? '') + toPx(offset ?? '');
  })();

  const ringReach = (() => {
    const shadow = declaredValue(
      inputCss,
      '.andes-input-group:focus-within',
      'box-shadow',
    );
    return toPx(
      /var\(--_andes-input-ring-width, (\S+)\)/.exec(shadow ?? '')?.[1] ?? '',
    );
  })();

  it('measures the halos it has to leave room for', () => {
    expect(outlineReach).toBe(4);
    expect(ringReach).toBe(2);
    expect(dialogVar('--andes-dialog-ring-room')).toBeGreaterThanOrEqual(
      outlineReach,
    );
  });

  it('stops the pinned header mask short of the control below it', () => {
    const mask = innerMask('.andes-dialog__viewport > .andes-dialog__header');
    const room = dialogVar('--andes-dialog-gap') - mask;
    expect(mask).toBeGreaterThan(0);
    expect(room).toBeGreaterThanOrEqual(outlineReach);
    expect(room).toBeGreaterThanOrEqual(ringReach);
  });

  it('stops the pinned footer mask short of the control above it', () => {
    const mask = -innerMask('.andes-dialog__viewport > .andes-dialog__footer');
    const room = dialogVar('--andes-dialog-footer-gap') - mask;
    expect(mask).toBeGreaterThan(0);
    expect(room).toBeGreaterThanOrEqual(outlineReach);
    expect(room).toBeGreaterThanOrEqual(ringReach);
  });

  it('still masks the full padding strip on the outer side of both parts', () => {
    const outer = (selector: string) =>
      /^0\s+(.+?)\s+0\s+var\(/.exec(
        (declaredValue(css, selector, 'box-shadow') ?? '').split(
          /,\s*(?![^(]*\))/,
        )[0],
      )?.[1] ?? '';
    expect(
      resolve(outer('.andes-dialog__viewport > .andes-dialog__header')),
    ).toBe(-20);
    expect(
      resolve(outer('.andes-dialog__viewport > .andes-dialog__footer')),
    ).toBe(20);
  });

  it('leaves the close control focus outline inside the clipping surface', () => {
    const inset =
      dialogVar('--andes-dialog-close-inset') -
      dialogVar('--andes-dialog-border-width');
    expect(inset).toBeGreaterThan(outlineReach);
  });

  it('keeps the scroll box padding wide enough for a halo on its side edges', () => {
    const inline =
      dialogVar('--andes-dialog-padding-inline') -
      dialogVar('--andes-dialog-border-width');
    expect(inline).toBeGreaterThanOrEqual(outlineReach);
  });
});

@Component({
  imports: [ANDES_DIALOG_IMPORTS],
  template: `
    <andes-dialog
      [(open)]="open"
      [(fullscreen)]="fullscreen"
      [maximizable]="maximizable()"
      [maskClass]="maskClass()"
      [maskBlur]="maskBlur()"
      [width]="width()"
      [centered]="centered()"
      [loading]="loading()"
    >
      <andes-dialog-content
        *andesDialogContent
        [maximizeLabel]="'Enlarge'"
        [restoreLabel]="'Shrink'"
      >
        <div andesDialogHeader>
          <h2 andesDialogTitle>Title</h2>
        </div>
        <p>Body</p>
      </andes-dialog-content>
    </andes-dialog>
  `,
})
class FullscreenHost {
  readonly open = signal(false);
  readonly fullscreen = signal(false);
  readonly maximizable = signal(false);
  readonly maskClass = signal<string | readonly string[] | null>(null);
  readonly maskBlur = signal(false);
  readonly width = signal<AndesDialogWidth | null>(null);
  readonly centered = signal(true);
  readonly loading = signal(false);
}

describe('dialog fullscreen, maximize and mask class', () => {
  beforeAll(() => {
    // jsdom has no layout, which CDK reads as "nothing here is tabbable".
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

  async function create(setup?: (host: FullscreenHost) => void) {
    const fixture = TestBed.createComponent(FullscreenHost);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const surface = () =>
      document.querySelector('[data-slot="dialog-content"]') as HTMLElement;
    const maximize = () =>
      surface().querySelector(
        '[data-slot="dialog-maximize-button"]',
      ) as HTMLButtonElement | null;
    return { fixture, host: fixture.componentInstance, surface, maximize };
  }

  it('is a regular surface by default, with no maximize control', async () => {
    const { surface, maximize } = await create();

    expect(surface().classList).not.toContain('andes-dialog--fullscreen');
    expect(surface().classList).not.toContain('andes-dialog--maximizable');
    expect(maximize()).toBeNull();
  });

  it('fills the viewport under fullscreen, dropping the width and top classes', async () => {
    const { surface } = await create((host) => {
      host.fullscreen.set(true);
      host.width.set(300);
      host.centered.set(false);
    });

    expect(surface().classList).toContain('andes-dialog--fullscreen');
    expect(surface().classList).not.toContain('andes-dialog--custom-width');
    expect(surface().classList).not.toContain('andes-dialog--top');
  });

  it('gives the fullscreen surface edge-to-edge geometry in the stylesheet', () => {
    const selector = '.andes-dialog.andes-dialog--fullscreen';
    expect(declaredValue(css, selector, 'width')).toBe('100%');
    expect(declaredValue(css, selector, 'max-width')).toBe('none');
    expect(declaredValue(css, selector, 'height')).toBe('100%');
    expect(declaredValue(css, selector, 'max-height')).toBe('none');
    expect(declaredValue(css, selector, 'border-radius')).toBe('0');
    const pane =
      '.andes-overlay-pane:has(> .andes-dialog--fullscreen, > .andes-dialog-keep-alive > .andes-dialog--fullscreen)';
    expect(declaredValue(css, pane, 'padding')).toBe('0');
    expect(declaredValue(css, pane, 'height')).toBe('100%');
  });

  it('renders a maximize control beside the close control under maximizable', async () => {
    const { surface, maximize } = await create((host) =>
      host.maximizable.set(true),
    );

    expect(surface().classList).toContain('andes-dialog--maximizable');
    const button = maximize();
    expect(button).toBeTruthy();
    expect(button?.getAttribute('aria-label')).toBe('Enlarge');
    expect(button?.getAttribute('aria-pressed')).toBe('false');
    expect(button?.nextElementSibling?.getAttribute('data-slot')).toBe(
      'dialog-close-button',
    );
  });

  it('toggles fullscreen two-way from the maximize control', async () => {
    const { fixture, host, surface, maximize } = await create((h) =>
      h.maximizable.set(true),
    );

    maximize()?.click();
    fixture.detectChanges();

    expect(host.fullscreen()).toBe(true);
    expect(surface().classList).toContain('andes-dialog--fullscreen');
    expect(maximize()?.getAttribute('aria-label')).toBe('Shrink');
    expect(maximize()?.getAttribute('aria-pressed')).toBe('true');

    maximize()?.click();
    fixture.detectChanges();

    expect(host.fullscreen()).toBe(false);
    expect(surface().classList).not.toContain('andes-dialog--fullscreen');
    expect(maximize()?.getAttribute('aria-label')).toBe('Enlarge');
  });

  it('follows fullscreen set from outside', async () => {
    const { fixture, host, surface } = await create();

    host.fullscreen.set(true);
    fixture.detectChanges();

    expect(surface().classList).toContain('andes-dialog--fullscreen');
  });

  it('adds maskClass to the backdrop next to the dialog class', async () => {
    await create((host) => host.maskClass.set('custom-mask other-mask'));

    const backdrop = document.querySelector('.andes-overlay-backdrop');
    expect(backdrop?.classList).toContain('andes-dialog-backdrop');
    expect(backdrop?.classList).toContain('custom-mask');
    expect(backdrop?.classList).toContain('other-mask');
  });

  it('accepts maskClass as an array, together with the blur class', async () => {
    await create((host) => {
      host.maskClass.set(['one', 'two']);
      host.maskBlur.set(true);
    });

    const backdrop = document.querySelector('.andes-overlay-backdrop');
    expect(backdrop?.classList).toContain('one');
    expect(backdrop?.classList).toContain('two');
    expect(backdrop?.classList).toContain('andes-dialog-backdrop--blur');
  });

  it('renders four skeleton bars while loading', async () => {
    const { surface } = await create((host) => host.loading.set(true));

    expect(
      surface().querySelectorAll('.andes-dialog__skeleton-line'),
    ).toHaveLength(4);
  });
});

describe('service dialogs: Ant Design status icons', () => {
  /** The cut-out glyph path each kind draws on its disc. */
  const GLYPHS = {
    confirm: 'M12 6.75v6.5M12 17.25h.01',
    warning: 'M12 6.75v6.5M12 17.25h.01',
    error: 'M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8',
    info: 'M12 11v6.25M12 7.25h.01',
    success: 'M7.7 12.7l2.6 3 6.1-7',
  } as const;

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

  it.each(Object.keys(GLYPHS) as (keyof typeof GLYPHS)[])(
    'draws %s as a full-size disc with its glyph cut out',
    async (kind) => {
      const service = TestBed.inject(AndesDialogService);
      service[kind]({ title: 'Title' });
      await TestBed.inject(ApplicationRef).whenStable();

      const svg = document.querySelector(
        '[data-slot="dialog-method-icon"] > svg',
      );
      expect(svg?.classList).toContain('andes-dialog__method-glyph');
      expect(svg?.querySelector('circle')?.getAttribute('r')).toBe('12');
      expect(svg?.querySelector('path')?.getAttribute('d')).toBe(GLYPHS[kind]);

      service.destroyAll();
    },
  );

  it('fills the disc with the status colour and cuts the glyph out in the surface colour', () => {
    expect(
      declaredValue(
        css,
        '.andes-dialog__method-icon > svg.andes-dialog__method-glyph',
        'fill',
      ),
    ).toBe('currentcolor');
    expect(
      declaredValue(css, '.andes-dialog__method-glyph > path', 'stroke'),
    ).toBe('var(--andes-color-popover)');
  });
});
