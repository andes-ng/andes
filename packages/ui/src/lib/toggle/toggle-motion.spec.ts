import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import { AndesToggle } from './toggle';
import { AndesToggleGroup } from './toggle-group';

@Component({
  imports: [AndesToggle, AndesToggleGroup],
  template: `<andes-toggle
      id="solo"
      aria-label="Solo"
      [(pressed)]="pressed"
      [disabled]="disabled()"
      [readOnly]="readOnly()"
      >S</andes-toggle
    >
    <andes-toggle-group
      aria-label="Group"
      [readOnly]="groupReadOnly()"
      [(value)]="value"
    >
      <andes-toggle value="a" aria-label="A">A</andes-toggle>
      <andes-toggle value="b" aria-label="B">B</andes-toggle>
    </andes-toggle-group>`,
})
class MotionHost {
  readonly pressed = signal(false);
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly groupReadOnly = signal(false);
  readonly value = signal<string | null>(null);
}

/** Waits past the post-render tick that arms the motion hook. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** An animation event as the browser fires it: the framework scopes the keyframes name. */
function animation(
  target: HTMLElement,
  type: 'animationend' | 'animationcancel',
  animationName: string,
): void {
  target.dispatchEvent(
    Object.assign(new Event(type, { bubbles: true }), { animationName }),
  );
}

async function mount(init?: (host: MotionHost) => void) {
  const fixture = TestBed.createComponent(MotionHost);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  await settle();
  const root = fixture.nativeElement as HTMLElement;
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('button.andes-toggle__button'),
  );
  return {
    fixture,
    host: fixture.componentInstance,
    solo: buttons[0],
    a: buttons[1],
    b: buttons[2],
    motion: (button: HTMLButtonElement) => button.getAttribute('data-motion'),
  };
}

describe('AndesToggle click ring hook', () => {
  it('adds no data-motion to the default markup, nor for an initial pressed state', async () => {
    const { solo, a, motion } = await mount((host) => host.pressed.set(true));

    expect(solo.getAttribute('aria-pressed')).toBe('true');
    expect(motion(solo)).toBeNull();
    expect(motion(a)).toBeNull();
  });

  it('ignores a change made before the first render has settled', () => {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.detectChanges();
    const solo = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    solo.click();
    fixture.detectChanges();

    expect(solo.getAttribute('aria-pressed')).toBe('true');
    expect(solo.hasAttribute('data-motion')).toBe(false);
  });

  it('is set on pressing and again on releasing, and the names alternate', async () => {
    const { fixture, solo, motion } = await mount();

    solo.click();
    fixture.detectChanges();
    expect(solo.getAttribute('aria-pressed')).toBe('true');
    expect(motion(solo)).toBe('press');

    // The release lands while the first ring still runs: the twin name restarts it.
    solo.click();
    fixture.detectChanges();
    expect(solo.getAttribute('aria-pressed')).toBe('false');
    expect(motion(solo)).toBe('press-alt');

    solo.click();
    fixture.detectChanges();
    expect(motion(solo)).toBe('press');
  });

  it('is cleared only when the ring ends, and ignores any other animation', async () => {
    const { fixture, solo, motion } = await mount();
    solo.click();
    fixture.detectChanges();

    animation(solo, 'animationend', 'scope_andes-toggle-spin');
    fixture.detectChanges();
    expect(motion(solo)).toBe('press');

    // The ring's name coming from a descendant (a bubbled event) is not the button's ring.
    animation(
      solo.querySelector('.andes-toggle__label') as HTMLElement,
      'animationend',
      'scope_andes-toggle-ripple',
    );
    fixture.detectChanges();
    expect(motion(solo)).toBe('press');

    animation(solo, 'animationend', 'scope_andes-toggle-ripple');
    fixture.detectChanges();
    expect(solo.hasAttribute('data-motion')).toBe(false);

    solo.click();
    fixture.detectChanges();
    expect(motion(solo)).toBe('press-alt');
    animation(solo, 'animationend', 'scope_andes-toggle-ripple-alt');
    fixture.detectChanges();
    expect(solo.hasAttribute('data-motion')).toBe(false);
  });

  it('is also set by a binding, whatever caused the change', async () => {
    const { fixture, host, solo, motion } = await mount();

    host.pressed.set(true);
    fixture.detectChanges();

    expect(motion(solo)).toBe('press');
  });

  it('drops a ring that was cut short, but not the cancel of the ring it replaced', async () => {
    const { fixture, solo, motion } = await mount();
    solo.click();
    fixture.detectChanges();
    solo.click();
    fixture.detectChanges();
    expect(motion(solo)).toBe('press-alt');

    // Restarting under the twin name cancels the first ring: that must not end the new one.
    animation(solo, 'animationcancel', 'scope_andes-toggle-ripple');
    fixture.detectChanges();
    expect(motion(solo)).toBe('press-alt');

    animation(solo, 'animationcancel', 'scope_andes-toggle-spin');
    fixture.detectChanges();
    expect(motion(solo)).toBe('press-alt');

    animation(solo, 'animationcancel', 'scope_andes-toggle-ripple-alt');
    fixture.detectChanges();
    expect(solo.hasAttribute('data-motion')).toBe(false);
  });

  it('takes no hook while disabled or read-only, so nothing rings later', async () => {
    const { fixture, host, solo, motion } = await mount();

    host.disabled.set(true);
    fixture.detectChanges();
    host.pressed.set(true);
    fixture.detectChanges();
    expect(motion(solo)).toBeNull();

    host.disabled.set(false);
    host.readOnly.set(true);
    fixture.detectChanges();
    host.pressed.set(false);
    fixture.detectChanges();
    expect(motion(solo)).toBeNull();

    host.readOnly.set(false);
    fixture.detectChanges();
    expect(motion(solo)).toBeNull();
  });

  it('does not ring from a click that a disabled or read-only toggle ignores', async () => {
    const { fixture, host, solo, motion } = await mount();
    host.readOnly.set(true);
    fixture.detectChanges();

    solo.click();
    fixture.detectChanges();

    expect(solo.getAttribute('aria-pressed')).toBe('false');
    expect(motion(solo)).toBeNull();
  });
});

describe('AndesToggleGroup items ring', () => {
  it('rings the item that is pressed and the one it releases', async () => {
    const { fixture, a, b, motion } = await mount();

    a.click();
    fixture.detectChanges();
    expect(motion(a)).toBe('press');
    expect(motion(b)).toBeNull();

    b.click();
    fixture.detectChanges();
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(a.getAttribute('aria-pressed')).toBe('false');
    expect(motion(b)).toBe('press');
    expect(motion(a)).toBe('press-alt');
  });

  it('does not ring for the group value an item starts with', async () => {
    const { a, b, motion } = await mount((host) => host.value.set('b'));

    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(motion(a)).toBeNull();
    expect(motion(b)).toBeNull();
  });

  it('does not ring in a read-only group', async () => {
    const { fixture, host, a, motion } = await mount();
    host.groupReadOnly.set(true);
    fixture.detectChanges();

    a.click();
    fixture.detectChanges();
    host.value.set('b');
    fixture.detectChanges();

    expect(motion(a)).toBeNull();
  });
});

describe('toggle motion stylesheet contract', () => {
  const toggle = readFileSync('packages/ui/src/lib/toggle/toggle.css', 'utf8');
  const group = readFileSync(
    'packages/ui/src/lib/toggle/toggle-group.css',
    'utf8',
  );
  const MOTION_MEDIA =
    '@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {';
  const CURVE = 'cubic-bezier(0.78, 0.14, 0.15, 0.86)';
  const IDLE = ':host(:not([data-readonly])) .andes-toggle__button';

  /** The stylesheet without comments and with whitespace runs collapsed. */
  const flat = (css: string) =>
    css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const sheet = flat(toggle);
  /** Everything from the motion media query to the forced-colors block that follows it. */
  const motionBlock = () => {
    const from = sheet.indexOf(MOTION_MEDIA);
    return sheet.slice(from, sheet.indexOf('@media (forced-colors: active)'));
  };
  const beforeMotionBlock = () => sheet.slice(0, sheet.indexOf(MOTION_MEDIA));
  const keyframes = (name: string) => {
    const from = sheet.indexOf(`@keyframes ${name} {`);
    return sheet.slice(from, sheet.indexOf('@keyframes', from + 1));
  };

  it('moves the colors on 200ms and the shared curve, and the press scale on 120ms', () => {
    const transition = declaredValue(
      toggle,
      '.andes-toggle__button',
      'transition',
    );

    expect(transition).toContain(`background-color 200ms ${CURVE}`);
    expect(transition).toContain(`border-color 200ms ${CURVE}`);
    expect(transition).toContain(`color 200ms ${CURVE}`);
    expect(transition).toContain(
      'transform var(--andes-motion-duration-fast, 120ms)',
    );
  });

  it('drops every transition under reduced motion', () => {
    expect(sheet).toContain(
      '@media (prefers-reduced-motion: reduce) { .andes-toggle__button { transition: none; } }',
    );
  });

  it('plays the ring for a second on the hook, never on a disabled or read-only toggle', () => {
    const motion = motionBlock();

    expect(motion).toContain(
      `${IDLE}[data-motion='press']:not(:disabled) { position: relative; z-index: 2; animation: andes-toggle-ripple 1s linear; }`,
    );
    expect(motion).toContain(
      `${IDLE}[data-motion='press-alt']:not(:disabled) { position: relative; z-index: 2; animation: andes-toggle-ripple-alt 1s linear; }`,
    );
    expect(motion.match(/animation:/g)).toHaveLength(2);
    // No ring, scale or animation exists outside the motion media query.
    expect(beforeMotionBlock()).not.toContain('animation:');
    expect(beforeMotionBlock()).not.toContain('scale(');
  });

  it('draws the ring with the checkbox curve: 20 / 16 / 11 / 6 / 0% over linear stops', () => {
    for (const name of ['andes-toggle-ripple', 'andes-toggle-ripple-alt']) {
      const frames = keyframes(name);
      const stops = frames.match(/\d+% \{/g);

      expect(stops).toEqual(['0% {', '6% {', '16% {', '41% {', '100% {']);
      for (const [stop, alpha] of [
        ['0%', 20],
        ['6%', 16],
        ['16%', 11],
        ['41%', 6],
        ['100%', 0],
      ] as const) {
        const from = frames.indexOf(`${stop} {`);
        const body = frames.slice(from, frames.indexOf('}', from));
        expect(body).toContain(
          `color-mix(in srgb, var(--_ring-color) ${alpha}%, transparent)`,
        );
      }
      expect(frames).toContain('box-shadow: 0 0 0 var(--_ring)');
      expect(frames).toContain('calc(var(--_ring) * 0.7)');
      expect(frames).toContain('calc(var(--_ring) * 0.93)');
    }
  });

  it('reaches 4 / 6 / 8px with the size', () => {
    expect(declaredValue(toggle, ':host', '--_ring')).toBe('0.375rem');
    expect(declaredValue(toggle, ":host([data-size='sm'])", '--_ring')).toBe(
      '0.25rem',
    );
    expect(declaredValue(toggle, ":host([data-size='lg'])", '--_ring')).toBe(
      '0.5rem',
    );
  });

  it('rings in the primary, the outline accent, or the status color (status wins)', () => {
    expect(declaredValue(toggle, ':host', '--_ring-color')).toContain(
      'var(--andes-color-primary',
    );
    expect(
      declaredValue(toggle, ":host([data-variant='outline'])", '--_ring-color'),
    ).toContain('var(--andes-color-accent-foreground');
    expect(
      declaredValue(toggle, ":host([data-status='error'])", '--_ring-color'),
    ).toContain('var(--andes-color-danger');
    expect(
      declaredValue(toggle, ":host([data-status='warning'])", '--_ring-color'),
    ).toContain('var(--andes-color-warning-hover');
    expect(sheet.indexOf(":host([data-variant='outline']) {")).toBeLessThan(
      sheet.indexOf(":host([data-status='error']) {"),
    );
  });

  it('shrinks to 96% only while held down and only for a toggle that can change', () => {
    expect(motionBlock()).toContain(
      `${IDLE}:active:not(:disabled) { transform: scale(0.96); }`,
    );
    expect(sheet.match(/scale\(/g)).toHaveLength(1);
  });

  it('lightens a hovered pressed toggle toward white and never darkens it', () => {
    const pressedHover = `${IDLE}[aria-pressed='true']:hover:not(:disabled) { background-color: color-mix( in srgb, var(--andes-color-accent-hover, #e5e7eb) 82%, white ); }`;

    expect(sheet).toContain(pressedHover);
    expect(sheet).not.toContain('var(--andes-color-foreground, #0f172a) );');
  });

  it('gives hover feedback only to an enabled, writable toggle', () => {
    expect(sheet).toContain(
      `${IDLE}:hover:not(:disabled) { background-color: var(--andes-color-accent, #f3f4f6); }`,
    );
    // Every hover rule carries both guards.
    for (const part of sheet.split(':hover').slice(0, -1)) {
      const selector = part.slice(part.lastIndexOf('}') + 1);
      expect(selector).toContain(':host(:not([data-readonly]))');
    }
    expect(sheet.split(':hover:not(:disabled)').length - 1).toBe(
      sheet.split(':hover').length - 1,
    );
  });

  it('lets the ring show in a group: no overflow clips it, and it is raised above its siblings', () => {
    expect(flat(group)).not.toContain('overflow');
    expect(flat(toggle)).not.toContain('overflow');
    // The pressed lift of a joined group is z-index 1; the ring runs above it.
    expect(flat(group)).toContain('z-index: 1');
    expect(motionBlock()).toContain('z-index: 2');
  });
});
