import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesSkeletonAvatar,
  AndesSkeletonAvatarShape,
} from './skeleton-avatar';
import {
  AndesSkeletonButton,
  AndesSkeletonButtonShape,
} from './skeleton-button';
import {
  AndesSkeletonElementClassNames,
  AndesSkeletonElementProps,
  AndesSkeletonElementStyles,
} from './skeleton-element-base';
import { AndesSkeletonImage } from './skeleton-image';
import { AndesSkeletonInput } from './skeleton-input';
import { AndesSkeletonNode } from './skeleton-node';
import {
  AndesSkeletonAnimation,
  AndesSkeletonSize,
  animationClass,
  resolveAnimation,
  resolveSemantic,
  rowWidths,
  toStyleMap,
} from './skeleton-utils';

function render<T>(component: new () => T) {
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const part = (slot: string) =>
    root.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
  return { fixture, root, part };
}

describe('AndesSkeletonAvatar', () => {
  @Component({
    imports: [AndesSkeletonAvatar],
    template: `<andes-skeleton-avatar
      [size]="size()"
      [shape]="shape()"
      [active]="active()"
    />`,
  })
  class Host {
    readonly size = signal<AndesSkeletonSize | number>('md');
    readonly shape = signal<AndesSkeletonAvatarShape>('circle');
    readonly active = signal(false);
  }

  it('defaults to a static md circle, hidden from assistive tech', () => {
    const { root, part } = render(Host);
    const avatar = part('skeleton-avatar');

    expect(avatar.classList).toContain('andes-skeleton-avatar--circle');
    expect(avatar.classList).toContain('andes-skeleton-element--md');
    expect(avatar.classList).not.toContain('andes-skeleton-fill--active');
    expect(
      root.querySelector('andes-skeleton-avatar')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it.each(['sm', 'md', 'lg'] as const)('supports the %s size', (size) => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();

    expect(part('skeleton-avatar').classList).toContain(
      `andes-skeleton-element--${size}`,
    );
  });

  it('applies a numeric size as pixels', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.size.set(72);
    fixture.detectChanges();
    const avatar = part('skeleton-avatar');

    expect(avatar.style.width).toBe('72px');
    expect(avatar.style.height).toBe('72px');
    expect(avatar.className).not.toMatch(/andes-skeleton-element--(sm|md|lg)/);
  });

  it('supports the square shape and the active shimmer', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.shape.set('square');
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(part('skeleton-avatar').classList).toContain(
      'andes-skeleton-avatar--square',
    );
    expect(part('skeleton-avatar').classList).toContain(
      'andes-skeleton-fill--active',
    );
  });
});

describe('AndesSkeletonButton', () => {
  @Component({
    imports: [AndesSkeletonButton],
    template: `<andes-skeleton-button
      [size]="size()"
      [shape]="shape()"
      [block]="block()"
      [active]="active()"
      [width]="width()"
    />`,
  })
  class Host {
    readonly size = signal<AndesSkeletonSize>('md');
    readonly shape = signal<AndesSkeletonButtonShape>('default');
    readonly block = signal(false);
    readonly active = signal(false);
    readonly width = signal<string | number | undefined>(undefined);
  }

  it('defaults to a static md placeholder with the default shape', () => {
    const { root, part } = render(Host);
    const button = part('skeleton-button');

    expect(button.classList).toContain('andes-skeleton-element--md');
    expect(button.className).not.toMatch(/andes-skeleton-button--/);
    expect(button.classList).not.toContain('andes-skeleton-fill--active');
    expect(
      root.querySelector('andes-skeleton-button')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it.each(['round', 'circle', 'square'] as const)(
    'supports the %s shape',
    (shape) => {
      const { fixture, part } = render(Host);
      fixture.componentInstance.shape.set(shape);
      fixture.detectChanges();

      expect(part('skeleton-button').classList).toContain(
        `andes-skeleton-button--${shape}`,
      );
    },
  );

  it.each(['sm', 'lg'] as const)('supports the %s size', (size) => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();

    expect(part('skeleton-button').classList).toContain(
      `andes-skeleton-element--${size}`,
    );
  });

  it('stretches to the parent width when block', () => {
    const { fixture, root, part } = render(Host);
    fixture.componentInstance.block.set(true);
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(root.querySelector('andes-skeleton-button')?.classList).toContain(
      'andes-skeleton-element--block',
    );
    expect(part('skeleton-button').classList).toContain(
      'andes-skeleton-element--block',
    );
    expect(part('skeleton-button').classList).toContain(
      'andes-skeleton-fill--active',
    );
  });

  it('applies a custom width as both width and min-width', () => {
    const { fixture, part } = render(Host);
    expect(part('skeleton-button').style.width).toBe('');

    fixture.componentInstance.width.set(120);
    fixture.detectChanges();
    expect(part('skeleton-button').style.width).toBe('120px');
    expect(part('skeleton-button').style.minWidth).toBe('120px');

    fixture.componentInstance.width.set('8rem');
    fixture.detectChanges();
    expect(part('skeleton-button').style.width).toBe('8rem');
  });

  it('lets block win over a custom width', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.width.set(120);
    fixture.componentInstance.block.set(true);
    fixture.detectChanges();

    expect(part('skeleton-button').style.width).toBe('');
    expect(part('skeleton-button').style.minWidth).toBe('');
  });
});

describe('AndesSkeletonInput', () => {
  @Component({
    imports: [AndesSkeletonInput],
    template: `<andes-skeleton-input
      [size]="size()"
      [block]="block()"
      [active]="active()"
      [width]="width()"
    />`,
  })
  class Host {
    readonly size = signal<AndesSkeletonSize>('md');
    readonly block = signal(false);
    readonly active = signal(false);
    readonly width = signal<string | number | undefined>(undefined);
  }

  it('defaults to a static, inline md placeholder', () => {
    const { root, part } = render(Host);

    expect(part('skeleton-input').classList).toContain(
      'andes-skeleton-element--md',
    );
    expect(part('skeleton-input').classList).not.toContain(
      'andes-skeleton-element--block',
    );
    expect(
      root.querySelector('andes-skeleton-input')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('supports size, block and active', () => {
    const { fixture, root, part } = render(Host);
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.block.set(true);
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    const input = part('skeleton-input');

    expect(input.classList).toContain('andes-skeleton-element--lg');
    expect(input.classList).toContain('andes-skeleton-element--block');
    expect(input.classList).toContain('andes-skeleton-fill--active');
    expect(root.querySelector('andes-skeleton-input')?.classList).toContain(
      'andes-skeleton-element--block',
    );
  });

  it('applies a custom width unless block is set', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.width.set(240);
    fixture.detectChanges();
    expect(part('skeleton-input').style.width).toBe('240px');
    expect(part('skeleton-input').style.minWidth).toBe('240px');

    fixture.componentInstance.block.set(true);
    fixture.detectChanges();
    expect(part('skeleton-input').style.width).toBe('');
  });

  it('treats a bare block attribute as true', () => {
    @Component({
      imports: [AndesSkeletonInput],
      template: `<andes-skeleton-input block />`,
    })
    class BareHost {}
    const { part } = render(BareHost);

    expect(part('skeleton-input').classList).toContain(
      'andes-skeleton-element--block',
    );
  });
});

describe('AndesSkeletonImage', () => {
  @Component({
    imports: [AndesSkeletonImage],
    template: `<andes-skeleton-image
      [width]="width()"
      [height]="height()"
      [active]="active()"
    />`,
  })
  class Host {
    readonly width = signal<string | number | undefined>(undefined);
    readonly height = signal<string | number | undefined>(undefined);
    readonly active = signal(false);
  }

  it('renders an image glyph inside a decorative placeholder', () => {
    const { root, part } = render(Host);

    expect(part('skeleton-image').querySelector('svg')).not.toBeNull();
    expect(part('skeleton-image').style.width).toBe('');
    expect(
      root.querySelector('andes-skeleton-image')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('draws a filled picture mark, not an outline', () => {
    const { part } = render(Host);
    const icon = part('skeleton-image').querySelector('svg') as SVGElement;

    expect(icon.getAttribute('viewBox')).toBe('0 0 1098 1024');
    expect(icon.getAttribute('fill')).toBe('currentColor');
    expect(icon.getAttribute('stroke')).toBeNull();
    expect(icon.querySelectorAll('path')).toHaveLength(1);
  });

  it('applies width/height and active', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.width.set(200);
    fixture.componentInstance.height.set('8rem');
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    const image = part('skeleton-image');

    expect(image.style.width).toBe('200px');
    expect(image.style.height).toBe('8rem');
    expect(image.classList).toContain('andes-skeleton-fill--active');
  });
});

describe('AndesSkeletonNode', () => {
  @Component({
    imports: [AndesSkeletonNode],
    template: `<andes-skeleton-node [width]="width()" [active]="active()"
      ><span class="glyph">chart</span></andes-skeleton-node
    >`,
  })
  class Host {
    readonly width = signal<string | number | undefined>(undefined);
    readonly active = signal(false);
  }

  it('projects its content into a decorative placeholder box', () => {
    const { root, part } = render(Host);

    expect(part('skeleton-node').querySelector('.glyph')?.textContent).toBe(
      'chart',
    );
    expect(
      root.querySelector('andes-skeleton-node')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('applies width and active', () => {
    const { fixture, part } = render(Host);
    fixture.componentInstance.width.set('10rem');
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(part('skeleton-node').style.width).toBe('10rem');
    expect(part('skeleton-node').classList).toContain(
      'andes-skeleton-fill--active',
    );
  });
});

describe('element placeholders: animation, classNames and styles', () => {
  @Component({
    imports: [
      AndesSkeletonAvatar,
      AndesSkeletonButton,
      AndesSkeletonImage,
      AndesSkeletonInput,
      AndesSkeletonNode,
    ],
    template: `
      <andes-skeleton-avatar
        [active]="active()"
        [animation]="animation()"
        [classNames]="classNames()"
        [styles]="styles()"
      />
      <andes-skeleton-button
        [active]="active()"
        [animation]="animation()"
        [classNames]="classNames()"
        [styles]="styles()"
      />
      <andes-skeleton-input
        [active]="active()"
        [animation]="animation()"
        [classNames]="classNames()"
        [styles]="styles()"
      />
      <andes-skeleton-image
        [active]="active()"
        [animation]="animation()"
        [classNames]="classNames()"
        [styles]="styles()"
      />
      <andes-skeleton-node
        [active]="active()"
        [animation]="animation()"
        [classNames]="classNames()"
        [styles]="styles()"
      />
    `,
  })
  class Host {
    readonly active = signal(false);
    readonly animation = signal<AndesSkeletonAnimation | undefined>(undefined);
    readonly classNames = signal<AndesSkeletonElementClassNames | undefined>(
      undefined,
    );
    readonly styles = signal<AndesSkeletonElementStyles | undefined>(undefined);
  }

  const SLOTS = [
    'skeleton-avatar',
    'skeleton-button',
    'skeleton-input',
    'skeleton-image',
    'skeleton-node',
  ] as const;

  const HOSTS = [
    'andes-skeleton-avatar',
    'andes-skeleton-button',
    'andes-skeleton-input',
    'andes-skeleton-image',
    'andes-skeleton-node',
  ] as const;

  function createHost() {
    const { fixture, root, part } = render(Host);
    const host = (tag: string) => root.querySelector(tag) as HTMLElement;
    return { fixture, root, part, host, state: fixture.componentInstance };
  }

  it.each(SLOTS)('%s is still unless animated', (slot) => {
    const { part } = createHost();

    expect(part(slot).className).not.toMatch(/andes-skeleton-fill--/);
  });

  it.each(SLOTS)('%s pulses with animation="pulse"', (slot) => {
    const { fixture, part, state } = createHost();
    state.animation.set('pulse');
    fixture.detectChanges();

    expect(part(slot).classList).toContain('andes-skeleton-fill--pulse');
    expect(part(slot).classList).not.toContain('andes-skeleton-fill--active');
  });

  it.each(SLOTS)(
    '%s shimmers with active, unless animation says none',
    (slot) => {
      const { fixture, part, state } = createHost();
      state.active.set(true);
      fixture.detectChanges();
      expect(part(slot).classList).toContain('andes-skeleton-fill--active');

      state.animation.set('none');
      fixture.detectChanges();
      expect(part(slot).className).not.toMatch(/andes-skeleton-fill--/);
    },
  );

  it.each(HOSTS.map((tag, index) => [tag, SLOTS[index]] as const))(
    '%s takes root classes on the element and content classes on the box',
    (tag, slot) => {
      const { fixture, part, host, state } = createHost();
      state.classNames.set({ root: 'c-root', content: 'c-content' });
      fixture.detectChanges();

      expect(host(tag).classList).toContain('c-root');
      expect(host(tag).classList).not.toContain('c-content');
      expect(part(slot).classList).toContain('c-content');
      expect(part(slot).classList).not.toContain('c-root');
      expect(part(slot).classList).toContain('andes-skeleton-fill');
    },
  );

  it.each(HOSTS.map((tag, index) => [tag, SLOTS[index]] as const))(
    '%s takes root and content styles, numbers as pixels',
    (tag, slot) => {
      const { fixture, part, host, state } = createHost();
      state.styles.set({
        root: { marginLeft: 8 },
        content: { border: '1px solid #aaa', opacity: 0.5 },
      });
      fixture.detectChanges();

      expect(host(tag).style.marginLeft).toBe('8px');
      expect(part(slot).style.border).toContain('1px solid');
      expect(part(slot).style.opacity).toBe('0.5');
    },
  );

  it('hands the element inputs to a classNames and styles function', () => {
    const seen: AndesSkeletonElementProps[] = [];
    @Component({
      imports: [AndesSkeletonButton],
      template: `<andes-skeleton-button
        size="lg"
        shape="round"
        block
        active
        [classNames]="classNames"
        [styles]="styles"
      />`,
    })
    class FunctionHost {
      readonly classNames: AndesSkeletonElementClassNames = (info) => {
        seen.push(info.props);
        return { content: info.props.shape === 'round' ? 'c-round' : '' };
      };
      readonly styles: AndesSkeletonElementStyles = (info) => ({
        content: { height: info.props.size === 'lg' ? 50 : 10 },
      });
    }
    const { part } = render(FunctionHost);

    expect(seen.at(-1)).toEqual({
      active: true,
      animation: 'shimmer',
      size: 'lg',
      shape: 'round',
      block: true,
    });
    expect(part('skeleton-button').classList).toContain('c-round');
    expect(part('skeleton-button').style.height).toBe('50px');
  });

  it('passes the avatar size and shape to the function', () => {
    const seen: AndesSkeletonElementProps[] = [];
    @Component({
      imports: [AndesSkeletonAvatar],
      template: `<andes-skeleton-avatar
        [size]="56"
        shape="square"
        [classNames]="classNames"
      />`,
    })
    class AvatarHost {
      readonly classNames: AndesSkeletonElementClassNames = (info) => {
        seen.push(info.props);
        return {};
      };
    }
    render(AvatarHost);

    expect(seen.at(-1)).toEqual({
      active: false,
      animation: 'none',
      size: 56,
      shape: 'square',
    });
  });

  it('keeps the width of a button next to its content styles', () => {
    @Component({
      imports: [AndesSkeletonButton],
      template: `<andes-skeleton-button
        [width]="120"
        [styles]="{ content: { height: 20 } }"
      />`,
    })
    class WidthHost {}
    const { part } = render(WidthHost);

    expect(part('skeleton-button').style.width).toBe('120px');
    expect(part('skeleton-button').style.height).toBe('20px');
  });

  it('lets a consumer class and style on the host through as before', () => {
    @Component({
      imports: [AndesSkeletonInput],
      template: `<andes-skeleton-input class="mine" style="margin-top: 4px" />`,
    })
    class PlainHost {}
    const { root } = render(PlainHost);
    const host = root.querySelector('andes-skeleton-input') as HTMLElement;

    expect(host.classList).toContain('mine');
    expect(host.style.marginTop).toBe('4px');
  });
});

describe('style helpers', () => {
  it('turns camelCase and kebab-case into kebab-case, numbers into pixels', () => {
    expect(
      toStyleMap({
        backgroundColor: 'red',
        'margin-top': 4,
        height: 20,
        zIndex: 3,
        lineHeight: 1.5,
        '--x': 7,
      }),
    ).toEqual({
      'background-color': 'red',
      'margin-top': '4px',
      height: '20px',
      'z-index': '3',
      'line-height': '1.5',
      '--x': '7',
    });
  });

  it('skips empty values and returns null when nothing is left', () => {
    expect(toStyleMap(undefined)).toBeNull();
    expect(toStyleMap({})).toBeNull();
    expect(toStyleMap({ height: undefined, width: null })).toBeNull();
    expect(toStyleMap({ height: undefined, width: 3 })).toEqual({
      width: '3px',
    });
  });

  it('resolves an animation from the explicit name, else from active', () => {
    expect(resolveAnimation(undefined, false)).toBe('none');
    expect(resolveAnimation(undefined, true)).toBe('shimmer');
    expect(resolveAnimation('pulse', false)).toBe('pulse');
    expect(resolveAnimation('none', true)).toBe('none');
    expect(animationClass('shimmer')).toBe('andes-skeleton-fill--active');
    expect(animationClass('pulse')).toBe('andes-skeleton-fill--pulse');
    expect(animationClass('none')).toBeNull();
  });

  it('resolves an object as itself and a function by calling it', () => {
    const object = { root: 'a' };

    expect(resolveSemantic(object, {})).toBe(object);
    expect(resolveSemantic(undefined, {})).toBeUndefined();
    expect(
      resolveSemantic(
        (info: { props: { n: number } }) => ({ root: `${info.props.n}` }),
        {
          n: 2,
        },
      ),
    ).toEqual({ root: '2' });
  });
});

describe('rowWidths', () => {
  it('leaves rows full width, ending a block of 3 or more at 61%', () => {
    expect(rowWidths(2, undefined)).toEqual([undefined, undefined]);
    expect(rowWidths(3, undefined)).toEqual([undefined, undefined, '61%']);
  });

  it('applies a single width to the last row only, numbers as pixels', () => {
    expect(rowWidths(3, 120)).toEqual([undefined, undefined, '120px']);
    expect(rowWidths(2, '40%')).toEqual([undefined, '40%']);
  });

  it('applies an array row by row, falling back to 61% for a missing last entry', () => {
    expect(rowWidths(4, ['90%', 80])).toEqual([
      '90%',
      '80px',
      undefined,
      '61%',
    ]);
  });

  it('copes with zero, negative and fractional counts', () => {
    expect(rowWidths(0, undefined)).toEqual([]);
    expect(rowWidths(-2, undefined)).toEqual([]);
    expect(rowWidths(2.9, undefined)).toHaveLength(2);
  });
});
