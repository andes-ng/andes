import { readFileSync } from 'node:fs';

import { TestBed } from '@angular/core/testing';

import {
  asModule,
  mountStory,
  NATIVE_CONTROLS,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';
import { AndesButton } from './button';
import * as overviewStories from './button-01-overview.stories';
import * as sizeStories from './button-02-sizes-and-shapes.stories';
import * as colorStories from './button-03-colors.stories';
import * as iconStories from './button-04-icons-and-links.stories';
import * as pressStories from './button-05-press-and-motion.stories';
import * as loadingStories from './button-06-loading-and-actions.stories';
import * as groupStories from './button-07-groups.stories';
import * as accessibilityStories from './button-08-accessibility.stories';

/*
 * Mounts every story of the Button, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a handler that throws, fails here. It presses
 * every button of a story, lets the timers run out, and holds the sidebar to its tree: one group
 * per topic, every story named and described in a sentence, and no native control in a story
 * file. The zero-padded numbers in the story file names keep the groups in this order: Storybook
 * lists story files alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  ['General/Button/Overview', asModule(overviewStories), 'button-01-overview'],
  [
    'General/Button/Sizes and shapes',
    asModule(sizeStories),
    'button-02-sizes-and-shapes',
  ],
  ['General/Button/Colors', asModule(colorStories), 'button-03-colors'],
  [
    'General/Button/Icons and links',
    asModule(iconStories),
    'button-04-icons-and-links',
  ],
  [
    'General/Button/Press and motion',
    asModule(pressStories),
    'button-05-press-and-motion',
  ],
  [
    'General/Button/Loading and actions',
    asModule(loadingStories),
    'button-06-loading-and-actions',
  ],
  ['General/Button/Groups', asModule(groupStories), 'button-07-groups'],
  [
    'General/Button/Accessibility',
    asModule(accessibilityStories),
    'button-08-accessibility',
  ],
] as const;

describe('Button stories: the sidebar', () => {
  it('has one group per topic, with no story name repeated in a group', () => {
    expect(modules.map(([, module]) => module.default.title)).toEqual(
      modules.map(([title]) => title),
    );
    for (const [, module] of modules) {
      const names = storiesOf(module).map(
        ([, story]) => (story as AnyStory).name,
      );

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('has one story per example, with no name used in two groups', () => {
    const names = modules.flatMap(([, module]) =>
      storiesOf(module).map(([, story]) => (story as AnyStory).name),
    );

    expect(names.length).toBeGreaterThanOrEqual(30);
    expect(new Set(names).size).toBe(names.length);
  });

  it('numbers its story files with two digits so the groups sort in order', () => {
    const files = modules.map(([, , file]) => file);

    expect([...files].sort()).toEqual(files);
  });

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(
        `packages/ui/src/lib/button/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
      expect(source.includes('<svg')).toBe(false);
    },
  );

  it('never names a story prop after a member of the button', () => {
    // Storybook assigns a story's props onto the component of its meta as well, so a prop
    // called `size` or `loading` would replace that input of the button.
    const members = new Set<string>();
    let object: object | null = TestBed.createComponent(AndesButton)
      .componentInstance as object;
    while (object && object !== Object.prototype) {
      Object.getOwnPropertyNames(object).forEach((name) => members.add(name));
      object = Object.getPrototypeOf(object);
    }
    const clashes: string[] = [];
    for (const [, module] of modules) {
      for (const [, story] of storiesOf(module)) {
        const name = (story as AnyStory).name ?? '';
        // The playground hands its args to the inputs on purpose.
        if (name === 'Playground') {
          continue;
        }
        const { props } = resolveStory(module.default, story as AnyStory);
        for (const key of Object.keys(props)) {
          if (members.has(key) && module.default.component === AndesButton) {
            clashes.push(`${name}: ${key}`);
          }
        }
      }
    }

    expect(clashes).toEqual([]);
  });
});

describe.each(modules)('Button stories: %s', (_, module) => {
  const stories = storiesOf(module);

  it.each(stories)('%s has a name', (_name, story) => {
    expect((story as AnyStory).name).toBeTruthy();
  });

  it.each(stories)('%s has a one-sentence description', (_name, story) => {
    const description = (story as AnyStory).parameters?.docs?.description
      ?.story;

    expect(description).toBeTruthy();
    expect(description?.length).toBeLessThan(420);
    // One sentence: no full stop followed by another capitalised sentence.
    expect(description).not.toMatch(/[.!?]\s+[A-Z]/);
  });

  describe.each(stories)('%s', (_name, story) => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('renders with every component it uses imported, and every button works', async () => {
      const fixture = mountStory(
        resolveStory(module.default, story as AnyStory),
      );
      const root: HTMLElement = fixture.nativeElement;
      const settle = async (ms = 50) => {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(ms);
        fixture.detectChanges();
      };
      await settle();

      expect(root.querySelectorAll('andes-button').length).toBeGreaterThan(0);

      // Press every button, with the pointer and the keyboard, and let the actions run out.
      for (const control of Array.from(
        root.querySelectorAll('andes-button button'),
      )) {
        const target = control as HTMLButtonElement;
        if (target.disabled || target.getAttribute('aria-disabled')) {
          continue;
        }
        target.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true }),
        );
        for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End']) {
          target.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true }),
          );
        }
        target.click();
        await settle(100);
      }
      await settle(5000);

      // Every native control on the page sits inside a library component.
      const bare = Array.from(
        root.querySelectorAll('button, input, select, textarea, a'),
      ).filter((control) => {
        for (
          let parent = control.parentElement;
          parent && parent !== root;
          parent = parent.parentElement
        ) {
          if (parent.localName.startsWith('andes-')) {
            return false;
          }
        }
        return true;
      });

      expect(bare.map((control) => control.outerHTML.slice(0, 80))).toEqual([]);
    });
  });
});

describe('Button stories: what a few of them promise', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const find = (module: ReturnType<typeof asModule>, name: string) => {
    const entry = storiesOf(module).find(
      ([, story]) => (story as AnyStory).name === name,
    );
    if (!entry) {
      throw new Error(`No story named ${name}`);
    }
    return entry[1] as AnyStory;
  };

  const mount = async (module: ReturnType<typeof asModule>, name: string) => {
    const fixture = mountStory(
      resolveStory(module.default as never, find(module, name)),
    );
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  };

  it('"Click action" is busy until the promise settles, then ready again', async () => {
    const { fixture, root } = await mount(
      asModule(loadingStories),
      'Click action',
    );
    const save = root.querySelector('button') as HTMLButtonElement;

    save.click();
    fixture.detectChanges();
    expect(save.getAttribute('aria-busy')).toBe('true');

    await vi.advanceTimersByTimeAsync(2000);
    fixture.detectChanges();
    expect(save.getAttribute('aria-busy')).toBeNull();
  });

  it('"Interruptible action" counts every click while it stays clickable', async () => {
    const { fixture, root } = await mount(
      asModule(loadingStories),
      'Interruptible action',
    );
    const search = root.querySelector('button') as HTMLButtonElement;

    search.click();
    search.click();
    fixture.detectChanges();

    expect(search.disabled).toBe(false);
    expect(root.textContent).toContain('Started 2 time(s)');
  });

  it('"Focus while busy" keeps the busy button focusable', async () => {
    const { root } = await mount(asModule(loadingStories), 'Focus while busy');
    const [, busy] = Array.from(root.querySelectorAll('button'));

    expect(busy.disabled).toBe(false);
    expect(busy.getAttribute('aria-disabled')).toBe('true');
  });

  it('"Disabled group" disables the first group and leaves the second as written', async () => {
    const { root } = await mount(asModule(groupStories), 'Disabled group');
    const groups = Array.from(root.querySelectorAll('andes-button-group'));

    expect(
      Array.from(groups[0].querySelectorAll('button')).every((b) => b.disabled),
    ).toBe(true);
    expect(
      Array.from(groups[1].querySelectorAll('button')).map((b) => b.disabled),
    ).toEqual([false, true, false]);
  });

  it('"One tab stop" leaves one button of each group in the tab order', async () => {
    const { root } = await mount(asModule(groupStories), 'One tab stop');

    for (const group of Array.from(
      root.querySelectorAll('andes-button-group'),
    )) {
      const stops = Array.from(group.querySelectorAll('button')).filter(
        (button) =>
          !button.disabled && button.getAttribute('tabindex') !== '-1',
      );
      expect(stops).toHaveLength(1);
    }
  });

  it('"Choosing the scale" sets the custom property on the buttons that ask', async () => {
    const { root } = await mount(asModule(pressStories), 'Choosing the scale');
    const scales = Array.from(root.querySelectorAll('andes-button')).map(
      (button) =>
        (button as HTMLElement).style.getPropertyValue(
          '--andes-button-press-scale',
        ),
    );

    expect(scales).toEqual(['', '0.92', '1.04', '0.94']);
  });

  it('"Turning the press off" drops the scale of the second button only', async () => {
    const { root } = await mount(
      asModule(pressStories),
      'Turning the press off',
    );
    const [first, second] = Array.from(root.querySelectorAll('button'));

    expect(first.classList).not.toContain('andes-button--no-press');
    expect(second.classList).toContain('andes-button--no-press');
  });

  it('"Right to left" asks for a right-to-left page', () => {
    const story = find(asModule(accessibilityStories), 'Right to left');

    expect((story.parameters as { dir?: string }).dir).toBe('rtl');
  });

  it('"Dark theme" asks for the dark theme', () => {
    const story = find(asModule(accessibilityStories), 'Dark theme');

    expect((story as { globals?: { theme?: string } }).globals?.theme).toBe(
      'dark',
    );
  });
});
