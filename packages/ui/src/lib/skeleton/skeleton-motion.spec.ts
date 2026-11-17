import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { readFileSync } from 'node:fs';

import { atRule, collapsed } from '../../testing/at-rule';
import { declaredValue } from '../../testing/computed-style';
import { AndesSkeleton } from './skeleton';
import { AndesSkeletonAvatar } from './skeleton-avatar';
import { AndesSkeletonElementProps } from './skeleton-element-base';
import { AndesSkeletonImage } from './skeleton-image';
import { AndesSkeletonText } from './skeleton-text';
import {
  AndesSkeletonAnimation,
  AndesSkeletonDirection,
  AndesSkeletonRadius,
  animationClass,
  indexAttribute,
  radiusValue,
  staggerAttribute,
  staggerStep,
} from './skeleton-utils';

const fillCss = () =>
  readFileSync('packages/ui/src/lib/skeleton/skeleton-fill.css', 'utf8');

const ACTIVE = 'andes-skeleton-fill--active';
const VERTICAL = 'andes-skeleton-fill--vertical';
const REVERSE = 'andes-skeleton-fill--reverse';

describe('Skeleton motion helpers', () => {
  it('adds the direction classes to the shimmer only', () => {
    expect(animationClass('shimmer')).toBe(ACTIVE);
    expect(animationClass('shimmer', { direction: 'horizontal' })).toBe(ACTIVE);
    expect(animationClass('shimmer', { direction: 'vertical' })).toBe(
      `${ACTIVE} ${VERTICAL}`,
    );
    expect(animationClass('shimmer', { reverse: true })).toBe(
      `${ACTIVE} ${REVERSE}`,
    );
    expect(
      animationClass('shimmer', { direction: 'vertical', reverse: true }),
    ).toBe(`${ACTIVE} ${VERTICAL} ${REVERSE}`);
    expect(
      animationClass('pulse', { direction: 'vertical', reverse: true }),
    ).toBe('andes-skeleton-fill--pulse');
    expect(animationClass('none', { direction: 'vertical' })).toBeNull();
  });

  it('reads a stagger: bare or true is 100ms, a number is milliseconds, the rest is off', () => {
    expect(staggerAttribute('')).toBe(100);
    expect(staggerAttribute(true)).toBe(100);
    expect(staggerAttribute(40)).toBe(40);
    expect(staggerAttribute('250')).toBe(250);
    expect(staggerAttribute(false)).toBe(0);
    expect(staggerAttribute(undefined)).toBe(0);
    expect(staggerAttribute(null)).toBe(0);
    expect(staggerAttribute(-5)).toBe(0);
    expect(staggerAttribute('soon')).toBe(0);
    expect(staggerStep(0)).toBeNull();
    expect(staggerStep(120)).toBe('120ms');
  });

  it('reads an index as a whole, non-negative number', () => {
    expect(indexAttribute(3)).toBe(3);
    expect(indexAttribute('4')).toBe(4);
    expect(indexAttribute(2.7)).toBe(2);
    expect(indexAttribute(-1)).toBe(0);
    expect(indexAttribute('x')).toBe(0);
    expect(indexAttribute(undefined)).toBe(0);
  });

  it('maps a radius step to the radius tokens', () => {
    expect(radiusValue(undefined)).toBeUndefined();
    expect(radiusValue('none')).toBe('0');
    expect(radiusValue('sm')).toBe('var(--andes-radius-sm)');
    expect(radiusValue('full')).toBe('var(--andes-radius-full)');
  });
});

describe('AndesSkeleton (direction, stagger and radius)', () => {
  @Component({
    imports: [AndesSkeleton],
    template: `<andes-skeleton
      [active]="active()"
      [animation]="animation()"
      [direction]="direction()"
      [reverse]="reverse()"
      [stagger]="stagger()"
      [radius]="radius()"
      [avatar]="avatar()"
      [title]="title()"
      [paragraph]="paragraph()"
      [classNames]="classNames()"
    />`,
  })
  class Host {
    readonly active = signal(true);
    readonly animation = signal<AndesSkeletonAnimation | undefined>(undefined);
    readonly direction = signal<AndesSkeletonDirection>('horizontal');
    readonly reverse = signal(false);
    readonly stagger = signal<boolean | number | string>(0);
    readonly radius = signal<AndesSkeletonRadius | undefined>(undefined);
    readonly avatar = signal(false);
    readonly title = signal(true);
    readonly paragraph = signal<boolean | { rows: number }>({ rows: 3 });
    readonly classNames = signal<
      | ((info: { props: unknown }) => Partial<Record<'root', string>>)
      | undefined
    >(undefined);
  }

  function create(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const bars = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-slot="skeleton-title"], [data-slot="skeleton-paragraph-row"], [data-slot="skeleton-avatar"]',
        ),
      );
    const rows = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-slot="skeleton-paragraph-row"]',
        ),
      );
    const title = () =>
      root.querySelector<HTMLElement>('[data-slot="skeleton-title"]');
    const placeholder = () =>
      root.querySelector<HTMLElement>('[data-slot="skeleton"]');
    return { fixture, root, bars, rows, title, placeholder };
  }

  describe('direction', () => {
    it('sweeps horizontally by default: no direction class', () => {
      const { bars } = create((h) => h.avatar.set(true));

      for (const bar of bars()) {
        expect(bar.classList).toContain(ACTIVE);
        expect(bar.classList).not.toContain(VERTICAL);
        expect(bar.classList).not.toContain(REVERSE);
      }
    });

    it('sweeps vertically on every bar, avatar included', () => {
      const { bars } = create((h) => {
        h.avatar.set(true);
        h.direction.set('vertical');
      });

      // The avatar, the title and the three rows.
      expect(bars()).toHaveLength(5);
      for (const bar of bars()) {
        expect(bar.classList).toContain(VERTICAL);
      }
    });

    it('reverses the sweep on every bar', () => {
      const { bars } = create((h) => {
        h.avatar.set(true);
        h.reverse.set(true);
      });

      for (const bar of bars()) {
        expect(bar.classList).toContain(REVERSE);
        expect(bar.classList).not.toContain(VERTICAL);
      }
    });

    it('follows the input when it changes', () => {
      const { fixture, title } = create();
      fixture.componentInstance.direction.set('vertical');
      fixture.detectChanges();

      expect(title()?.classList).toContain(VERTICAL);

      fixture.componentInstance.direction.set('horizontal');
      fixture.detectChanges();

      expect(title()?.classList).not.toContain(VERTICAL);
    });

    it('has no direction while pulsing or still', () => {
      const pulsing = create((h) => {
        h.animation.set('pulse');
        h.direction.set('vertical');
        h.reverse.set(true);
      });
      for (const bar of pulsing.bars()) {
        expect(bar.classList).not.toContain(VERTICAL);
        expect(bar.classList).not.toContain(REVERSE);
      }

      const still = create((h) => {
        h.active.set(false);
        h.direction.set('vertical');
      });
      for (const bar of still.bars()) {
        expect(bar.className).not.toMatch(/andes-skeleton-fill--/);
      }
    });

    it('hands direction, reverse and stagger to a classNames function', () => {
      const seen: unknown[] = [];
      create((h) => {
        h.direction.set('vertical');
        h.reverse.set(true);
        h.stagger.set(80);
        h.classNames.set(({ props }) => {
          seen.push(props);
          return {};
        });
      });

      expect(seen.at(-1)).toMatchObject({
        direction: 'vertical',
        reverse: true,
        stagger: 80,
      });
    });
  });

  describe('stagger', () => {
    const indexOf = (bar: HTMLElement) =>
      bar.style.getPropertyValue('--andes-skeleton-index');

    it('is off by default: no index and no step', () => {
      const { bars, placeholder } = create();

      for (const bar of bars()) {
        expect(indexOf(bar)).toBe('');
      }
      expect(
        placeholder()?.style.getPropertyValue('--andes-skeleton-stagger'),
      ).toBe('');
    });

    it('numbers the bars from the top: the title is 0 and each row follows', () => {
      const { rows, title, placeholder } = create((h) => h.stagger.set(100));

      expect(indexOf(title() as HTMLElement)).toBe('');
      expect(rows().map(indexOf)).toEqual(['1', '2', '3']);
      expect(
        placeholder()?.style.getPropertyValue('--andes-skeleton-stagger'),
      ).toBe('100ms');
    });

    it('starts the rows at 0 when there is no title', () => {
      const { rows } = create((h) => {
        h.stagger.set(100);
        h.title.set(false);
      });

      expect(rows().map(indexOf)).toEqual(['0', '1', '2']);
    });

    it('sets the step in milliseconds', () => {
      const { placeholder } = create((h) => h.stagger.set(250));

      expect(
        placeholder()?.style.getPropertyValue('--andes-skeleton-stagger'),
      ).toBe('250ms');
    });

    it('reads a bare attribute as 100ms', () => {
      @Component({
        imports: [AndesSkeleton],
        template: `<andes-skeleton active stagger />`,
      })
      class Bare {}
      const fixture = TestBed.createComponent(Bare);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;

      expect(
        root
          .querySelector<HTMLElement>('[data-slot="skeleton"]')
          ?.style.getPropertyValue('--andes-skeleton-stagger'),
      ).toBe('100ms');
      expect(
        root
          .querySelector<HTMLElement>('[data-slot="skeleton-paragraph-row"]')
          ?.style.getPropertyValue('--andes-skeleton-index'),
      ).toBe('1');
    });

    it('stagger false switches it off again', () => {
      const { fixture, rows } = create((h) => h.stagger.set(100));
      fixture.componentInstance.stagger.set(false);
      fixture.detectChanges();

      expect(rows().map(indexOf)).toEqual(['', '', '']);
    });

    it('staggers a pulse the same way', () => {
      const { rows } = create((h) => {
        h.animation.set('pulse');
        h.stagger.set(60);
      });

      expect(rows().map(indexOf)).toEqual(['1', '2', '3']);
    });
  });

  describe('radius', () => {
    it('leaves the corners to the stylesheet by default', () => {
      const { bars } = create();

      for (const bar of bars()) {
        expect(bar.style.borderRadius).toBe('');
      }
    });

    it('rounds the title and every row to the chosen step', () => {
      const { title, rows } = create((h) => h.radius.set('xl'));

      expect(title()?.style.borderRadius).toBe('var(--andes-radius-xl)');
      for (const row of rows()) {
        expect(row.style.borderRadius).toBe('var(--andes-radius-xl)');
      }
    });

    it('keeps a corner set through styles while radius is unset', () => {
      @Component({
        imports: [AndesSkeleton],
        template: `<andes-skeleton
          active
          [styles]="{ title: { borderRadius: 9 }, paragraph: { opacity: 0.5 } }"
        />`,
      })
      class Styled {}
      const fixture = TestBed.createComponent(Styled);
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector(
        '[data-slot="skeleton-title"]',
      ) as HTMLElement;

      expect(title.style.borderRadius).toBe('9px');
    });

    it('squares the corners with none', () => {
      const { title } = create((h) => h.radius.set('none'));

      expect(title()?.style.borderRadius).toMatch(/^0(px)?$/);
    });
  });

  describe('block mode', () => {
    @Component({
      imports: [AndesSkeleton],
      template: `<andes-skeleton
        shape="text"
        [index]="index()"
        [radius]="radius()"
      />`,
    })
    class BlockHost {
      readonly index = signal<number | string>(0);
      readonly radius = signal<AndesSkeletonRadius | undefined>(undefined);
    }

    it('staggers the pulse by index and rounds with radius', () => {
      const fixture = TestBed.createComponent(BlockHost);
      fixture.detectChanges();
      const bar = fixture.nativeElement.querySelector(
        '[data-slot="skeleton"]',
      ) as HTMLElement;

      expect(bar.style.getPropertyValue('--andes-skeleton-index')).toBe('');
      expect(bar.style.borderRadius).toBe('');

      fixture.componentInstance.index.set(3);
      fixture.componentInstance.radius.set('full');
      fixture.detectChanges();

      expect(bar.style.getPropertyValue('--andes-skeleton-index')).toBe('3');
      expect(bar.style.borderRadius).toBe('var(--andes-radius-full)');
    });
  });
});

describe('Element placeholders (direction, index and radius)', () => {
  @Component({
    imports: [AndesSkeletonAvatar, AndesSkeletonImage],
    template: `
      <andes-skeleton-avatar
        [active]="true"
        [direction]="direction()"
        [reverse]="reverse()"
        [index]="index()"
        [radius]="radius()"
        [styles]="styles()"
        [classNames]="classNames()"
      />
      <andes-skeleton-image
        animation="shimmer"
        direction="vertical"
        [index]="2"
        radius="lg"
      />
    `,
  })
  class Host {
    readonly direction = signal<AndesSkeletonDirection>('horizontal');
    readonly reverse = signal(false);
    readonly index = signal<number | string>(0);
    readonly radius = signal<AndesSkeletonRadius | undefined>(undefined);
    readonly styles = signal<
      { content: { borderRadius?: number } } | undefined
    >(undefined);
    readonly classNames = signal<
      ((info: { props: AndesSkeletonElementProps }) => object) | undefined
    >(undefined);
  }

  function create(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const avatar = () =>
      root.querySelector('[data-slot="skeleton-avatar"]') as HTMLElement;
    const image = () =>
      root.querySelector('[data-slot="skeleton-image"]') as HTMLElement;
    return { fixture, avatar, image };
  }

  it('adds the vertical and reverse classes to a shimmering element', () => {
    const { avatar, image } = create((h) => {
      h.direction.set('vertical');
      h.reverse.set(true);
    });

    expect(avatar().classList).toContain(ACTIVE);
    expect(avatar().classList).toContain(VERTICAL);
    expect(avatar().classList).toContain(REVERSE);
    expect(image().classList).toContain(VERTICAL);
    expect(image().classList).not.toContain(REVERSE);
  });

  it('sweeps horizontally by default', () => {
    const { avatar } = create();

    expect(avatar().classList).not.toContain(VERTICAL);
  });

  it('sets the index as a custom property, and none at 0', () => {
    const { fixture, avatar, image } = create();

    expect(avatar().style.getPropertyValue('--andes-skeleton-index')).toBe('');
    expect(image().style.getPropertyValue('--andes-skeleton-index')).toBe('2');

    fixture.componentInstance.index.set('5');
    fixture.detectChanges();

    expect(avatar().style.getPropertyValue('--andes-skeleton-index')).toBe('5');
  });

  it('rounds to a radius step, over the shape, and lets styles win', () => {
    const { fixture, avatar, image } = create((h) => h.radius.set('md'));

    expect(avatar().style.borderRadius).toBe('var(--andes-radius-md)');
    expect(image().style.borderRadius).toBe('var(--andes-radius-lg)');

    fixture.componentInstance.styles.set({ content: { borderRadius: 2 } });
    fixture.detectChanges();

    expect(avatar().style.borderRadius).toBe('2px');
  });

  it('hands direction, reverse, index and radius to a classNames function', () => {
    const seen: AndesSkeletonElementProps[] = [];
    create((h) => {
      h.direction.set('vertical');
      h.reverse.set(true);
      h.index.set(4);
      h.radius.set('sm');
      h.classNames.set(({ props }) => {
        seen.push(props);
        return {};
      });
    });

    expect(seen.at(-1)).toMatchObject({
      direction: 'vertical',
      reverse: true,
      index: 4,
      radius: 'sm',
    });
  });
});

describe('AndesSkeletonText (stagger)', () => {
  @Component({
    imports: [AndesSkeletonText],
    template: `<andes-skeleton-text
      [lines]="4"
      [active]="true"
      [stagger]="stagger()"
      [index]="index()"
      [direction]="direction()"
    />`,
  })
  class Host {
    readonly stagger = signal<boolean | number | string>(0);
    readonly index = signal(0);
    readonly direction = signal<AndesSkeletonDirection>('horizontal');
  }

  function create(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const lines = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-slot="skeleton-text-line"]',
      ),
    );
    const indexes = () =>
      lines.map((line) =>
        line.style.getPropertyValue('--andes-skeleton-index'),
      );
    return { fixture, lines, indexes };
  }

  it('moves the lines together by default', () => {
    const { indexes, lines } = create();

    expect(indexes()).toEqual(['', '', '', '']);
    expect(lines[0].style.getPropertyValue('--andes-skeleton-stagger')).toBe(
      '',
    );
  });

  it('starts each line one step after the one above it', () => {
    const { indexes, lines } = create((h) => h.stagger.set(120));

    expect(indexes()).toEqual(['', '1', '2', '3']);
    expect(lines[1].style.getPropertyValue('--andes-skeleton-stagger')).toBe(
      '120ms',
    );
  });

  it('offsets the whole block by its own index', () => {
    const { indexes } = create((h) => {
      h.stagger.set(true);
      h.index.set(2);
    });

    expect(indexes()).toEqual(['2', '3', '4', '5']);
  });

  it('without a stagger, an index delays the block as one', () => {
    const { indexes } = create((h) => h.index.set(3));

    expect(indexes()).toEqual(['3', '3', '3', '3']);
  });

  it('sweeps every line vertically', () => {
    const { lines } = create((h) => h.direction.set('vertical'));

    for (const line of lines) {
      expect(line.classList).toContain(VERTICAL);
    }
  });
});

describe('Skeleton stylesheet (direction, stagger and motion)', () => {
  it('sweeps vertically with a 180deg band over a 400% tall image', () => {
    const css = fillCss();
    const vertical =
      '.andes-skeleton-fill--active.andes-skeleton-fill--vertical';

    expect(declaredValue(css, vertical, 'background-image')).toBe(
      'linear-gradient( 180deg, var(--_fill) 25%, var(--_highlight) 37%, var(--_fill) 63% )',
    );
    expect(declaredValue(css, vertical, 'background-size')).toBe('100% 400%');
    expect(declaredValue(css, vertical, 'animation-name')).toBe(
      'andes-skeleton-shimmer-vertical',
    );
    expect(css).toMatch(
      /@keyframes andes-skeleton-shimmer-vertical \{\s*0% \{\s*background-position: 50% 100%;\s*\}\s*100% \{\s*background-position: 50% 0;/,
    );
  });

  it('keeps the vertical sweep out of the RTL flip', () => {
    const css = fillCss();

    expect(
      declaredValue(
        css,
        '.andes-skeleton-fill--active.andes-skeleton-fill--vertical',
        'animation-direction',
      ),
    ).toBe('normal');
    // The vertical rule comes after the RTL one, so it wins at equal specificity.
    expect(
      css.indexOf(
        '.andes-skeleton-fill--active.andes-skeleton-fill--vertical {',
      ),
    ).toBeGreaterThan(css.indexOf('.andes-skeleton-fill--active:dir(rtl)'));
  });

  it('reverses the sweep, cancels the RTL flip under RTL, and reverses a vertical one in RTL too', () => {
    const css = fillCss();
    const reverse = '.andes-skeleton-fill--active.andes-skeleton-fill--reverse';

    expect(declaredValue(css, reverse, 'animation-direction')).toBe('reverse');
    expect(
      declaredValue(css, `${reverse}:dir(rtl)`, 'animation-direction'),
    ).toBe('normal');
    expect(
      declaredValue(
        css,
        '.andes-skeleton-fill--active.andes-skeleton-fill--vertical.andes-skeleton-fill--reverse',
        'animation-direction',
      ),
    ).toBe('reverse');
    // Later rules win at equal specificity: plain reverse, then its RTL cancel, then vertical.
    const plain = css.indexOf(`${reverse} {`);
    const rtl = css.indexOf(`${reverse}:dir(rtl)`);
    const vertical = css.indexOf(
      '.andes-skeleton-fill--active.andes-skeleton-fill--vertical.andes-skeleton-fill--reverse',
    );
    expect(plain).toBeLessThan(rtl);
    expect(rtl).toBeLessThan(vertical);
  });

  it('delays a bar by its index times the step, both settable per subtree', () => {
    const css = fillCss();

    expect(collapsed(css)).toContain(
      '.andes-skeleton-fill--active, .andes-skeleton-fill--pulse { animation-delay: calc( var(--andes-skeleton-delay, 0ms) + var(--andes-skeleton-stagger, 100ms) * var(--andes-skeleton-index, 0) );',
    );
    // After the shorthands, so they do not reset the delay.
    expect(css.lastIndexOf('animation-delay')).toBeGreaterThan(
      css.indexOf('animation: andes-skeleton-fade'),
    );
  });

  it('drops every animation, direction and stagger included, under reduced motion', () => {
    const reduced = atRule(
      fillCss(),
      '@media (prefers-reduced-motion: reduce)',
    );

    expect(reduced).toMatch(
      /\.andes-skeleton-fill--active,\s*\.andes-skeleton-fill--pulse \{\s*animation: none;/,
    );
  });

  it('leaves the horizontal sweep and its RTL flip as they were', () => {
    const css = fillCss();

    expect(
      declaredValue(css, '.andes-skeleton-fill--active', 'background-size'),
    ).toBe('400% 100%');
    expect(
      declaredValue(
        css,
        '.andes-skeleton-fill--active:dir(rtl)',
        'animation-direction',
      ),
    ).toBe('reverse');
  });

  it('delays a block-mode pulse the same way', () => {
    const css = readFileSync(
      'packages/ui/src/lib/skeleton/skeleton.css',
      'utf8',
    );

    expect(declaredValue(css, '.andes-skeleton', 'animation-delay')).toBe(
      'calc( var(--andes-skeleton-delay, 0ms) + var(--andes-skeleton-stagger, 100ms) * var(--andes-skeleton-index, 0) )',
    );
  });
});
