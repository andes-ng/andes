import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { readFileSync } from 'node:fs';

import { declaredValue, expectLength } from '../../testing/computed-style';
import {
  AndesSkeleton,
  AndesSkeletonAvatarConfig,
  AndesSkeletonClassNames,
  AndesSkeletonParagraphConfig,
  AndesSkeletonProps,
  AndesSkeletonShape,
  AndesSkeletonStyles,
  AndesSkeletonTitleConfig,
} from './skeleton';
import { AndesSkeletonAnimation } from './skeleton-utils';

const cssFile = (name: string) =>
  readFileSync(`packages/ui/src/lib/skeleton/${name}`, 'utf8');
const skeletonCss = () => cssFile('skeleton.css');

@Component({
  imports: [AndesSkeleton],
  template: `<andes-skeleton
    [shape]="shape()"
    [width]="width()"
    [height]="height()"
    [animated]="animated()"
  />`,
})
class HostComponent {
  readonly shape = signal<AndesSkeletonShape>('text');
  readonly width = signal<string | number | undefined>(undefined);
  readonly height = signal<string | number | undefined>(undefined);
  readonly animated = signal(true);
}

describe('AndesSkeleton (block mode: `shape` set)', () => {
  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector(
      '[data-slot="skeleton"]',
    ) as HTMLElement;
    const host = fixture.nativeElement.querySelector(
      'andes-skeleton',
    ) as HTMLElement;
    return { fixture, bar, host };
  }

  it('renders the text shape', () => {
    const { bar } = createHost();

    expect(bar.classList).toContain('andes-skeleton--text');
    expect(bar.getAttribute('data-shape')).toBe('text');
  });

  it.each(['text', 'circular', 'rectangular'] as const)(
    'supports the %s shape',
    (shape) => {
      const { fixture, bar } = createHost();
      fixture.componentInstance.shape.set(shape);
      fixture.detectChanges();

      expect(bar.classList).toContain(`andes-skeleton--${shape}`);
      expect(bar.getAttribute('data-shape')).toBe(shape);
    },
  );

  it('always renders aria-hidden on the host, regardless of shape', () => {
    const { host } = createHost();

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('aria-busy')).toBe(false);
  });

  it('renders only the single bar - no composite sections or status text', () => {
    const { fixture } = createHost();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(1);
    expect(root.querySelector('[data-slot="skeleton-title"]')).toBeNull();
    expect(root.querySelector('[role="status"]')).toBeNull();
  });

  it('uses the theme-aware placeholder fill', () => {
    const { bar } = createHost();

    expect(bar.classList).toContain('andes-skeleton-fill');
  });

  it('does not set an inline width/height by default', () => {
    const { bar } = createHost();

    expect(bar.style.width).toBe('');
    expect(bar.style.height).toBe('');
  });

  it('applies a numeric width/height as pixels', () => {
    const { fixture, bar } = createHost();
    fixture.componentInstance.width.set(120);
    fixture.componentInstance.height.set(16);
    fixture.detectChanges();

    expect(bar.style.width).toBe('120px');
    expect(bar.style.height).toBe('16px');
  });

  it('applies a string width/height verbatim', () => {
    const { fixture, bar } = createHost();
    fixture.componentInstance.width.set('50%');
    fixture.componentInstance.height.set('3rem');
    fixture.detectChanges();

    expect(bar.style.width).toBe('50%');
    expect(bar.style.height).toBe('3rem');
  });

  it('is animated by default', () => {
    const { bar } = createHost();

    expect(bar.classList).not.toContain('andes-skeleton--static');
  });

  it('can disable the pulse animation', () => {
    const { fixture, bar } = createHost();
    fixture.componentInstance.animated.set(false);
    fixture.detectChanges();

    expect(bar.classList).toContain('andes-skeleton--static');
  });

  it('treats a bare animated attribute (no brackets) as true', () => {
    @Component({
      imports: [AndesSkeleton],
      template: `<andes-skeleton shape="circular" />`,
    })
    class BareAttrHost {}

    const fixture = TestBed.createComponent(BareAttrHost);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('[data-slot="skeleton"]');

    expect(bar.classList).toContain('andes-skeleton--circular');
    expect(bar.classList).not.toContain('andes-skeleton--static');
  });
});

describe('AndesSkeleton (composite)', () => {
  @Component({
    imports: [AndesSkeleton],
    template: `<andes-skeleton
      [loading]="loading()"
      [active]="active()"
      [avatar]="avatar()"
      [title]="title()"
      [paragraph]="paragraph()"
      [round]="round()"
      ><p class="real-content">Real content</p></andes-skeleton
    >`,
  })
  class CompositeHost {
    readonly loading = signal(true);
    readonly active = signal(false);
    readonly avatar = signal<boolean | AndesSkeletonAvatarConfig>(false);
    readonly title = signal<boolean | AndesSkeletonTitleConfig>(true);
    readonly paragraph = signal<boolean | AndesSkeletonParagraphConfig>(true);
    readonly round = signal(false);
  }

  function createComposite(
    setup: (host: CompositeHost) => void = () => undefined,
  ) {
    const fixture = TestBed.createComponent(CompositeHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = root.querySelector('andes-skeleton') as HTMLElement;
    const q = (slot: string) =>
      root.querySelector(`[data-slot="${slot}"]`) as HTMLElement | null;
    const rows = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-slot="skeleton-paragraph-row"]',
        ),
      );
    return { fixture, root, host, q, rows };
  }

  it('renders a title and a three-row paragraph by default, last row at 61%', () => {
    const { q, rows } = createComposite();

    expect(q('skeleton-title')).not.toBeNull();
    expect(q('skeleton-title')?.style.width).toBe('38%');
    expect(rows()).toHaveLength(3);
    expect(rows().map((row) => row.style.width)).toEqual(['', '', '61%']);
  });

  it('shows the placeholder instead of the projected content while loading', () => {
    const { root } = createComposite();

    expect(root.querySelector('.real-content')).toBeNull();
  });

  it('renders the projected content once loading is false', () => {
    const { fixture, root, q } = createComposite();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(root.querySelector('.real-content')?.textContent).toBe(
      'Real content',
    );
    expect(q('skeleton')).toBeNull();
  });

  it('switches back to the placeholder and keeps a single copy of the content', () => {
    const { fixture, root } = createComposite((h) => h.loading.set(false));
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(root.querySelector('.real-content')).toBeNull();

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(root.querySelectorAll('.real-content')).toHaveLength(1);
  });

  it('gives the host one status text, not aria-busy, and hides every bar from assistive tech', () => {
    const { host, q } = createComposite((h) => h.avatar.set(true));

    // aria-busy would let screen readers hold back the status announcement inside it.
    expect(host.hasAttribute('aria-busy')).toBe(false);
    expect(host.hasAttribute('aria-hidden')).toBe(false);
    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].textContent?.trim()).toBe('Loading…');
    const body = host.querySelector('.andes-skeleton-composite__body');
    expect(body?.getAttribute('aria-hidden')).toBe('true');
    expect(body?.contains(q('skeleton-title'))).toBe(true);
    expect(body?.querySelector('andes-skeleton-avatar')).not.toBeNull();
  });

  it('drops the status text once loaded', () => {
    const { host } = createComposite((h) => h.loading.set(false));

    expect(host.hasAttribute('aria-busy')).toBe(false);
    expect(host.hasAttribute('aria-hidden')).toBe(false);
    expect(host.querySelector('[role="status"]')).toBeNull();
  });

  it('accepts a custom loading label', () => {
    @Component({
      imports: [AndesSkeleton],
      template: `<andes-skeleton loadingLabel="Cargando perfil" />`,
    })
    class LabelHost {}
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent.trim(),
    ).toBe('Cargando perfil');
  });

  it('renders an avatar (circle, lg) and adjusts the defaults when avatar is on', () => {
    const { root, q, rows } = createComposite((h) => h.avatar.set(true));
    const avatar = root.querySelector('[data-slot="skeleton-avatar"]');

    expect(avatar?.classList).toContain('andes-skeleton-avatar--circle');
    expect(avatar?.classList).toContain('andes-skeleton-element--lg');
    expect(q('skeleton-title')?.style.width).toBe('50%');
    expect(rows()).toHaveLength(2);
    expect(rows().map((row) => row.style.width)).toEqual(['', '']);
  });

  it('defaults the avatar to square when there is a title but no paragraph', () => {
    const { root } = createComposite((h) => {
      h.avatar.set(true);
      h.paragraph.set(false);
    });

    expect(
      root.querySelector('[data-slot="skeleton-avatar"]')?.classList,
    ).toContain('andes-skeleton-avatar--square');
  });

  it('applies an avatar config', () => {
    const { root } = createComposite((h) =>
      h.avatar.set({ size: 64, shape: 'square' }),
    );
    const avatar = root.querySelector(
      '[data-slot="skeleton-avatar"]',
    ) as HTMLElement;

    expect(avatar.classList).toContain('andes-skeleton-avatar--square');
    expect(avatar.style.width).toBe('64px');
    expect(avatar.style.height).toBe('64px');
  });

  it('can hide the title and the paragraph', () => {
    const { q, rows } = createComposite((h) => {
      h.title.set(false);
      h.paragraph.set(false);
    });

    expect(q('skeleton-title')).toBeNull();
    expect(q('skeleton-paragraph')).toBeNull();
    expect(rows()).toHaveLength(0);
  });

  it('applies a title width', () => {
    const { q } = createComposite((h) => h.title.set({ width: 120 }));

    expect(q('skeleton-title')?.style.width).toBe('120px');
  });

  it('uses the full width for a title with no paragraph', () => {
    const { q } = createComposite((h) => h.paragraph.set(false));

    expect(q('skeleton-title')?.style.width).toBe('');
  });

  it('applies a row count and a single width to the last row only', () => {
    const { rows } = createComposite((h) =>
      h.paragraph.set({ rows: 4, width: 200 }),
    );

    expect(rows().map((row) => row.style.width)).toEqual(['', '', '', '200px']);
  });

  it('keeps the default last-row width when only rows is given', () => {
    const { rows } = createComposite((h) =>
      h.paragraph.set({ rows: 2, width: undefined }),
    );

    expect(rows().map((row) => row.style.width)).toEqual(['', '61%']);
  });

  it('applies an array of widths row by row', () => {
    const { rows } = createComposite((h) =>
      h.paragraph.set({ rows: 3, width: ['80%', 150] }),
    );

    // The last row of a paragraph of 3 rows or more ends short unless it has a width.
    expect(rows().map((row) => row.style.width)).toEqual([
      '80%',
      '150px',
      '61%',
    ]);
  });

  it('renders no paragraph for zero rows', () => {
    const { q } = createComposite((h) => h.paragraph.set({ rows: 0 }));

    expect(q('skeleton-paragraph')).toBeNull();
  });

  it('is static by default and shimmers every bar when active', () => {
    const { fixture, root, rows, q } = createComposite((h) =>
      h.avatar.set(true),
    );
    expect(root.querySelector('.andes-skeleton-fill--active')).toBeNull();

    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(q('skeleton-title')?.classList).toContain(
      'andes-skeleton-fill--active',
    );
    rows().forEach((row) =>
      expect(row.classList).toContain('andes-skeleton-fill--active'),
    );
    expect(
      root.querySelector('[data-slot="skeleton-avatar"]')?.classList,
    ).toContain('andes-skeleton-fill--active');
  });

  it('sweeps the shimmer for 1.4s, like Ant Design', () => {
    const { fixture, q } = createComposite();
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    const title = q('skeleton-title') as HTMLElement;

    expect(getComputedStyle(title).animation).toContain(
      'andes-skeleton-shimmer 1.4s ease infinite',
    );
  });

  it('lays out 16px bars, 16px apart, with 24px between the title and the paragraph', () => {
    const { q, rows } = createComposite();
    const css = skeletonCss();
    const title = getComputedStyle(q('skeleton-title') as HTMLElement);
    const row = getComputedStyle(rows()[0]);

    expectLength(title.height, '1rem');
    expectLength(title.marginTop, 0);
    expectLength(title.marginBottom, 0);
    expectLength(row.height, '1rem');
    expect(
      declaredValue(css, '.andes-skeleton-composite__paragraph', 'gap'),
    ).toBe('1rem');
    expect(
      declaredValue(
        css,
        '.andes-skeleton-composite__title + .andes-skeleton-composite__paragraph',
        'margin-top',
      ),
    ).toBe('var(--_paragraph-offset)');
    expect(
      declaredValue(css, '.andes-skeleton-composite', '--_paragraph-offset'),
    ).toBe('1.5rem');
  });

  it('centres the title on the 40px avatar and drops the paragraph to 28px', () => {
    const { q } = createComposite((h) => h.avatar.set(true));
    const css = skeletonCss();
    const title = getComputedStyle(q('skeleton-title') as HTMLElement);

    // 12px above a 16px bar is the middle of a 40px avatar.
    expectLength(title.marginTop, '0.75rem');
    expect(
      declaredValue(
        css,
        '.andes-skeleton-composite--with-avatar',
        '--_paragraph-offset',
      ),
    ).toBe('1.75rem');
  });

  it('keeps 16px between the avatar and the content', () => {
    expect(
      declaredValue(skeletonCss(), '.andes-skeleton-composite__body', 'gap'),
    ).toBe('var(--andes-space-4)');
  });

  it('rounds the bars', () => {
    const { q } = createComposite((h) => h.round.set(true));

    expect(q('skeleton')?.classList).toContain(
      'andes-skeleton-composite--round',
    );
  });

  it('accepts bare boolean attributes', () => {
    @Component({
      imports: [AndesSkeleton],
      template: `<andes-skeleton active avatar round />`,
    })
    class BareHost {}
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = root.querySelector('andes-skeleton') as HTMLElement;

    expect(root.querySelector('[data-slot="skeleton-avatar"]')).not.toBeNull();
    expect(
      root.querySelector('.andes-skeleton-composite--round'),
    ).not.toBeNull();
    expect(root.querySelector('.andes-skeleton-fill--active')).not.toBeNull();
    expect(host.hasAttribute('title')).toBe(false);
  });

  it('treats a bare loading attribute as true and loading="false" as loaded', () => {
    @Component({
      imports: [AndesSkeleton],
      template: `<andes-skeleton loading><b>a</b></andes-skeleton
        ><andes-skeleton loading="false"><b>b</b></andes-skeleton>`,
    })
    class LoadingAttrHost {}
    const fixture = TestBed.createComponent(LoadingAttrHost);
    fixture.detectChanges();
    const bold = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('b'),
    ).map((b) => b.textContent);

    expect(bold).toEqual(['b']);
  });
});

describe('AndesSkeleton (rows, animation and semantic parts)', () => {
  @Component({
    imports: [AndesSkeleton],
    template: `<andes-skeleton
      [active]="active()"
      [animation]="animation()"
      [avatar]="avatar()"
      [title]="title()"
      [paragraph]="paragraph()"
      [round]="round()"
      [classNames]="classNames()"
      [styles]="styles()"
    />`,
  })
  class Host {
    readonly active = signal(false);
    readonly animation = signal<AndesSkeletonAnimation | undefined>(undefined);
    readonly avatar = signal<boolean | AndesSkeletonAvatarConfig>(false);
    readonly title = signal<boolean | AndesSkeletonTitleConfig>(true);
    readonly paragraph = signal<boolean | AndesSkeletonParagraphConfig>(true);
    readonly round = signal(false);
    readonly classNames = signal<AndesSkeletonClassNames | undefined>(
      undefined,
    );
    readonly styles = signal<AndesSkeletonStyles | undefined>(undefined);
  }

  function createHost(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const q = (slot: string) =>
      root.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
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
    return { fixture, root, q, bars, rows };
  }

  describe('last paragraph row', () => {
    it('ends at 61% in a paragraph of three rows or more, even beside an avatar', () => {
      const { rows } = createHost((h) => {
        h.avatar.set(true);
        h.paragraph.set({ rows: 4 });
      });

      expect(rows().map((row) => row.style.width)).toEqual(['', '', '', '61%']);
    });

    it('keeps both rows of a two-row paragraph beside an avatar full width', () => {
      const { rows } = createHost((h) => h.avatar.set(true));

      expect(rows().map((row) => row.style.width)).toEqual(['', '']);
    });

    it('lets an explicit width win over the 61% default', () => {
      const { rows } = createHost((h) =>
        h.paragraph.set({ rows: 4, width: '100%' }),
      );

      expect(rows().map((row) => row.style.width)).toEqual([
        '',
        '',
        '',
        '100%',
      ]);
    });
  });

  describe('avatar config', () => {
    it('is a 40px circle by default', () => {
      const { q } = createHost((h) => h.avatar.set(true));

      expect(q('skeleton-avatar').classList).toContain(
        'andes-skeleton-element--lg',
      );
      expect(q('skeleton-avatar').classList).toContain(
        'andes-skeleton-avatar--circle',
      );
    });

    it('shimmers on its own with active', () => {
      const { q, rows } = createHost((h) => h.avatar.set({ active: true }));

      expect(q('skeleton-avatar').classList).toContain(
        'andes-skeleton-fill--active',
      );
      expect(rows()[0].classList).not.toContain('andes-skeleton-fill--active');
    });

    it('stays still with active false while the rest shimmers', () => {
      const { q, rows } = createHost((h) => {
        h.active.set(true);
        h.avatar.set({ active: false });
      });

      expect(q('skeleton-avatar').classList).not.toContain(
        'andes-skeleton-fill--active',
      );
      expect(rows()[0].classList).toContain('andes-skeleton-fill--active');
    });
  });

  describe('animation', () => {
    it('is still by default', () => {
      const { bars } = createHost((h) => h.avatar.set(true));

      for (const bar of bars()) {
        expect(bar.className).not.toMatch(/andes-skeleton-fill--/);
      }
    });

    it('pulses every bar, avatar included', () => {
      const { bars } = createHost((h) => {
        h.avatar.set(true);
        h.animation.set('pulse');
      });

      // The avatar, the title and the two rows that go with an avatar.
      expect(bars()).toHaveLength(4);
      for (const bar of bars()) {
        expect(bar.classList).toContain('andes-skeleton-fill--pulse');
        expect(bar.classList).not.toContain('andes-skeleton-fill--active');
      }
    });

    it('takes active as the shimmer shorthand', () => {
      const { bars } = createHost((h) => h.active.set(true));

      for (const bar of bars()) {
        expect(bar.classList).toContain('andes-skeleton-fill--active');
      }
    });

    it('lets an explicit animation win over active', () => {
      const { bars } = createHost((h) => {
        h.active.set(true);
        h.animation.set('none');
      });

      for (const bar of bars()) {
        expect(bar.className).not.toMatch(/andes-skeleton-fill--/);
      }
    });
  });

  describe('classNames and styles', () => {
    it('adds a class to each part from an object', () => {
      const { root, q } = createHost((h) => {
        h.avatar.set(true);
        h.classNames.set({
          root: 'c-root',
          header: 'c-header',
          section: 'c-section',
          avatar: 'c-avatar',
          title: 'c-title',
          paragraph: 'c-paragraph',
        });
      });

      expect(q('skeleton').classList).toContain('c-root');
      expect(
        root.querySelector('.andes-skeleton-composite__header')?.classList,
      ).toContain('c-header');
      expect(
        root.querySelector('.andes-skeleton-composite__content')?.classList,
      ).toContain('c-section');
      expect(q('skeleton-avatar').classList).toContain('c-avatar');
      expect(q('skeleton-title').classList).toContain('c-title');
      expect(q('skeleton-paragraph').classList).toContain('c-paragraph');
    });

    it('keeps the component classes next to the added ones', () => {
      const { q } = createHost((h) =>
        h.classNames.set({ title: 'c-title', root: 'c-root' }),
      );

      expect(q('skeleton-title').classList).toContain(
        'andes-skeleton-composite__title',
      );
      expect(q('skeleton-title').classList).toContain('andes-skeleton-fill');
      expect(q('skeleton').classList).toContain('andes-skeleton-composite');
    });

    it('applies inline styles from an object, numbers as pixels', () => {
      const { root, q } = createHost((h) => {
        h.avatar.set(true);
        h.styles.set({
          root: { padding: 12, borderRadius: '10px' },
          header: { 'margin-bottom': 12 },
          section: { opacity: 0.5 },
          avatar: { border: '1px solid #aaa' },
          title: { height: 20, backgroundColor: 'rgb(1, 2, 3)' },
          paragraph: { '--demo': 'x' },
        });
      });

      expect(q('skeleton').style.padding).toBe('12px');
      expect(q('skeleton').style.borderRadius).toBe('10px');
      expect(
        (root.querySelector('.andes-skeleton-composite__header') as HTMLElement)
          .style.marginBottom,
      ).toBe('12px');
      // A unitless property keeps its number.
      expect(
        (
          root.querySelector(
            '.andes-skeleton-composite__content',
          ) as HTMLElement
        ).style.opacity,
      ).toBe('0.5');
      expect(q('skeleton-avatar').style.border).toContain('1px solid');
      expect(q('skeleton-title').style.height).toBe('20px');
      expect(q('skeleton-title').style.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(q('skeleton-paragraph').style.getPropertyValue('--demo')).toBe(
        'x',
      );
    });

    it('keeps the title width next to its styles', () => {
      const { q } = createHost((h) => h.styles.set({ title: { height: 20 } }));

      expect(q('skeleton-title').style.width).toBe('38%');
      expect(q('skeleton-title').style.height).toBe('20px');
    });

    it('calls a classNames function with the current inputs', () => {
      const seen: AndesSkeletonProps[] = [];
      const { fixture, q } = createHost((h) =>
        h.classNames.set((info) => {
          seen.push(info.props);
          return { root: info.props.active ? 'c-active' : 'c-still' };
        }),
      );
      expect(q('skeleton').classList).toContain('c-still');

      fixture.componentInstance.active.set(true);
      fixture.detectChanges();

      expect(q('skeleton').classList).toContain('c-active');
      expect(q('skeleton').classList).not.toContain('c-still');
      expect(seen.at(-1)).toMatchObject({
        loading: true,
        active: true,
        animation: 'shimmer',
        round: false,
        avatar: false,
        title: true,
        paragraph: true,
      });
    });

    it('calls a styles function with the current inputs', () => {
      const { fixture, q } = createHost((h) =>
        h.styles.set((info) =>
          info.props.active ? { title: { height: 20, borderRadius: 20 } } : {},
        ),
      );
      expect(q('skeleton-title').style.height).toBe('');

      fixture.componentInstance.active.set(true);
      fixture.detectChanges();

      expect(q('skeleton-title').style.height).toBe('20px');
      expect(q('skeleton-title').style.borderRadius).toBe('20px');
    });

    it('tolerates a function that returns nothing for a part', () => {
      const { q } = createHost((h) => {
        h.classNames.set(() => ({}));
        h.styles.set(() => ({}));
      });

      expect(q('skeleton-title').getAttribute('style')).toBe('width: 38%;');
    });
  });
});

describe('Skeleton stylesheets (look of the placeholders)', () => {
  const fillCss = () => cssFile('skeleton-fill.css');
  const elementCss = () => cssFile('skeleton-element.css');

  it('fills a bar with the foreground colour at 6%, and at 12% on the dark theme', () => {
    const css = fillCss();

    expect(
      declaredValue(css, ':where(.andes-skeleton-fill)', '--_fill-alpha'),
    ).toBe('6%');
    expect(
      declaredValue(css, ':where(.andes-skeleton-fill)', '--_highlight-alpha'),
    ).toBe('15%');
    expect(
      declaredValue(
        css,
        ":host-context([data-andes-theme='dark']) :where(.andes-skeleton-fill)",
        '--_fill-alpha',
      ),
    ).toBe('12%');
    expect(
      declaredValue(
        css,
        ":host-context([data-andes-theme='dark']) :where(.andes-skeleton-fill)",
        '--_highlight-alpha',
      ),
    ).toBe('18%');
    expect(declaredValue(css, ':where(.andes-skeleton-fill)', '--_fill')).toBe(
      'var( --andes-skeleton-color, color-mix( in srgb, var(--andes-color-foreground) var(--_fill-alpha), transparent ) )',
    );
  });

  it('can be recoloured through two custom properties', () => {
    const css = fillCss();

    expect(
      declaredValue(css, ':where(.andes-skeleton-fill)', '--_highlight'),
    ).toBe(
      'var( --andes-skeleton-highlight-color, color-mix( in srgb, var(--andes-color-foreground) var(--_highlight-alpha), transparent ) )',
    );
  });

  it('shimmers a 400% wide 25/37/63 gradient for 1.4s, as Ant Design does', () => {
    const css = fillCss();

    expect(
      declaredValue(css, '.andes-skeleton-fill--active', 'background-image'),
    ).toBe(
      'linear-gradient( 90deg, var(--_fill) 25%, var(--_highlight) 37%, var(--_fill) 63% )',
    );
    expect(
      declaredValue(css, '.andes-skeleton-fill--active', 'background-size'),
    ).toBe('400% 100%');
    expect(
      declaredValue(css, '.andes-skeleton-fill--active', 'animation'),
    ).toBe('andes-skeleton-shimmer 1.4s ease infinite');
  });

  it('draws the fill once: the shimmer clears the plain background colour', () => {
    expect(
      declaredValue(
        fillCss(),
        ':where(.andes-skeleton-fill--active)',
        'background-color',
      ),
    ).toBe('transparent');
  });

  it('sweeps the other way under RTL', () => {
    expect(
      declaredValue(
        fillCss(),
        '.andes-skeleton-fill--active:dir(rtl)',
        'animation-direction',
      ),
    ).toBe('reverse');
  });

  it('pulses by fading to 60% opacity', () => {
    const css = fillCss();

    expect(declaredValue(css, '.andes-skeleton-fill--pulse', 'animation')).toBe(
      'andes-skeleton-fade 2s ease-in-out infinite',
    );
    expect(css).toMatch(
      /@keyframes andes-skeleton-fade \{\s*0%,\s*100% \{\s*opacity: 1;\s*\}\s*50% \{\s*opacity: 0\.6;/,
    );
  });

  it('stops every animation under prefers-reduced-motion', () => {
    expect(fillCss()).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.andes-skeleton-fill--active,\s*\.andes-skeleton-fill--pulse \{\s*animation: none;\s*\}\s*\}/,
    );
  });

  it('rounds every element placeholder to 4px, and a square avatar not at all', () => {
    const css = elementCss();

    expect(declaredValue(css, '.andes-skeleton-element', 'border-radius')).toBe(
      'var(--andes-radius-sm)',
    );
    expect(
      declaredValue(css, '.andes-skeleton-avatar--square', 'border-radius'),
    ).toBe('0');
    expect(
      declaredValue(css, '.andes-skeleton-avatar--circle', 'border-radius'),
    ).toBe('var(--andes-radius-full)');
  });

  it('sizes an image and a node 96px square, with a 48px glyph', () => {
    const css = elementCss();

    expect(declaredValue(css, '.andes-skeleton-image', 'width')).toBe('6rem');
    expect(declaredValue(css, '.andes-skeleton-image', 'height')).toBe('6rem');
    expect(declaredValue(css, '.andes-skeleton-image__icon', 'max-width')).toBe(
      '3rem',
    );
  });
});
