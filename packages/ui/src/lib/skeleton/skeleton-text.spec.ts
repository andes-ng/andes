import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import {
  AndesSkeletonElementClassNames,
  AndesSkeletonElementProps,
  AndesSkeletonElementStyles,
} from './skeleton-element-base';
import { AndesSkeletonText } from './skeleton-text';
import { AndesSkeletonAnimation } from './skeleton-utils';

describe('AndesSkeletonText', () => {
  @Component({
    imports: [AndesSkeletonText],
    template: `<andes-skeleton-text
      [lines]="lines()"
      [width]="width()"
      [round]="round()"
      [active]="active()"
      [animation]="animation()"
      [classNames]="classNames()"
      [styles]="styles()"
    />`,
  })
  class Host {
    readonly lines = signal<number | string>(1);
    readonly width = signal<string | number | (string | number)[] | undefined>(
      undefined,
    );
    readonly round = signal(false);
    readonly active = signal(false);
    readonly animation = signal<AndesSkeletonAnimation | undefined>(undefined);
    readonly classNames = signal<AndesSkeletonElementClassNames | undefined>(
      undefined,
    );
    readonly styles = signal<AndesSkeletonElementStyles | undefined>(
      undefined,
    );
  }

  function render(setup: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = root.querySelector('andes-skeleton-text') as HTMLElement;
    const lines = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>('[data-slot="skeleton-text-line"]'),
      );
    return { fixture, host, lines };
  }

  it('renders one full-width line by default, hidden from assistive tech', () => {
    const { host, lines } = render();

    expect(lines()).toHaveLength(1);
    expect(lines()[0].style.width).toBe('');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(lines()[0].classList).toContain('andes-skeleton-fill');
    expect(lines()[0].classList).not.toContain('andes-skeleton-fill--active');
  });

  it('renders the requested number of lines, ending a block of 3+ at 61%', () => {
    const { lines } = render((h) => h.lines.set(4));

    expect(lines().map((line) => line.style.width)).toEqual([
      '',
      '',
      '',
      '61%',
    ]);
  });

  it('reads a string line count', () => {
    const { lines } = render((h) => h.lines.set('2'));

    expect(lines()).toHaveLength(2);
  });

  it('sets the last line from a single width, or every line from an array', () => {
    const single = render((h) => {
      h.lines.set(3);
      h.width.set(120);
    });
    expect(single.lines().map((line) => line.style.width)).toEqual([
      '',
      '',
      '120px',
    ]);

    const array = render((h) => {
      h.lines.set(3);
      h.width.set(['100%', '80%', 40]);
    });
    expect(array.lines().map((line) => line.style.width)).toEqual([
      '100%',
      '80%',
      '40px',
    ]);
  });

  it('follows the animation inputs', () => {
    const { fixture, lines } = render((h) => h.lines.set(2));
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    expect(
      lines().every((line) =>
        line.classList.contains('andes-skeleton-fill--active'),
      ),
    ).toBe(true);

    fixture.componentInstance.animation.set('pulse');
    fixture.detectChanges();
    expect(
      lines().every((line) =>
        line.classList.contains('andes-skeleton-fill--pulse'),
      ),
    ).toBe(true);
  });

  it('rounds the lines', () => {
    const { host } = render((h) => h.round.set(true));

    expect(host.classList).toContain('andes-skeleton-text--round');
  });

  it('adds classNames to the root and to every line, and styles likewise', () => {
    const { host, lines } = render((h) => {
      h.lines.set(2);
      h.classNames.set({ root: 'my-root', content: 'my-line' });
      h.styles.set({ root: { opacity: 0.5 }, content: { height: 8 } });
    });

    expect(host.classList).toContain('my-root');
    expect(lines().every((line) => line.classList.contains('my-line'))).toBe(
      true,
    );
    expect(host.style.opacity).toBe('0.5');
    expect(lines().map((line) => line.style.height)).toEqual(['8px', '8px']);
  });

  it('hands the line count and shape to a classNames function', () => {
    const seen: AndesSkeletonElementProps[] = [];
    render((h) => {
      h.lines.set(3);
      h.round.set(true);
      h.classNames.set(({ props }) => {
        seen.push(props);
        return {};
      });
    });

    expect(seen.at(-1)).toMatchObject({ lines: 3, round: true });
  });

  describe('stylesheet', () => {
    const css = readFileSync(
      'packages/ui/src/lib/skeleton/skeleton-text.css',
      'utf8',
    );

    it('stacks 16px lines 16px apart', () => {
      expect(declaredValue(css, ':host', 'display')).toBe('flex');
      expect(declaredValue(css, ':host', 'flex-direction')).toBe('column');
      expect(declaredValue(css, ':host', 'gap')).toBe('1rem');
      expect(
        declaredValue(css, '.andes-skeleton-text__line', 'height'),
      ).toBe('1rem');
    });

    it('rounds a round block to a capsule', () => {
      expect(
        declaredValue(
          css,
          ':host(.andes-skeleton-text--round) .andes-skeleton-text__line',
          'border-radius',
        ),
      ).toBe('100px');
    });
  });
});
