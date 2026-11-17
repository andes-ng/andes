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
import { AndesPagination } from './pagination';
import * as overviewStories from './pagination-01-overview.stories';
import * as sizeStories from './pagination-02-sizes-and-variants.stories';
import * as navigationStories from './pagination-03-navigation.stories';
import * as pageSizeStories from './pagination-04-page-size.stories';
import * as totalStories from './pagination-05-total-and-ranges.stories';
import * as compactStories from './pagination-06-simple-and-compact.stories';
import * as stateStories from './pagination-07-state-and-control.stories';
import * as customisationStories from './pagination-08-customisation.stories';
import * as accessibilityStories from './pagination-09-accessibility.stories';
import * as compositionStories from './pagination-10-compositions.stories';

/*
 * Mounts every story of the Pagination, grouped by topic in the sidebar, through Storybook's
 * own decorator chain, so a template that uses a component its module metadata does not import
 * (an NG0304 in the browser, not a build error), or a handler that throws, fails here. It
 * presses every button and switch of a story and every item of the control, lets the timers
 * run out, and holds the sidebar to its tree: one group per topic, every story named and
 * described in a sentence, and no native control in a story file. The zero-padded numbers in
 * the story file names keep the groups in this order: Storybook lists story files
 * alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  [
    'Navigation/Pagination/Overview',
    asModule(overviewStories),
    'pagination-01-overview',
  ],
  [
    'Navigation/Pagination/Sizes and variants',
    asModule(sizeStories),
    'pagination-02-sizes-and-variants',
  ],
  [
    'Navigation/Pagination/Navigation',
    asModule(navigationStories),
    'pagination-03-navigation',
  ],
  [
    'Navigation/Pagination/Page size',
    asModule(pageSizeStories),
    'pagination-04-page-size',
  ],
  [
    'Navigation/Pagination/Total and ranges',
    asModule(totalStories),
    'pagination-05-total-and-ranges',
  ],
  [
    'Navigation/Pagination/Simple and compact',
    asModule(compactStories),
    'pagination-06-simple-and-compact',
  ],
  [
    'Navigation/Pagination/State and control',
    asModule(stateStories),
    'pagination-07-state-and-control',
  ],
  [
    'Navigation/Pagination/Customisation',
    asModule(customisationStories),
    'pagination-08-customisation',
  ],
  [
    'Navigation/Pagination/Accessibility',
    asModule(accessibilityStories),
    'pagination-09-accessibility',
  ],
  [
    'Navigation/Pagination/Compositions',
    asModule(compositionStories),
    'pagination-10-compositions',
  ],
] as const;

const CONTROLS = 'andes-button, [role="switch"]';
const ITEMS = '.andes-pagination__item';

/** The story that shows the companion of the control, not the control. */
const NO_PAGINATION = new Set<string>(['Load more companion']);

describe('Pagination stories: the sidebar', () => {
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

    expect(names.length).toBeGreaterThanOrEqual(60);
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
        `packages/ui/src/lib/pagination/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
      expect(source.includes('<svg')).toBe(false);
    },
  );

  it('never names a story prop after a member of the control', () => {
    // Storybook assigns a story's props onto the component of its meta as well, so a prop
    // called `size` or `totalText` would replace that input or computed of the control.
    const members = new Set<string>();
    let object: object | null = TestBed.createComponent(AndesPagination)
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
          if (members.has(key)) {
            clashes.push(`${name}: ${key}`);
          }
        }
      }
    }

    expect(clashes).toEqual([]);
  });
});

describe.each(modules)('Pagination stories: %s', (_, module) => {
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

    it('renders with every component it uses imported, and every control works', async () => {
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

      if (!NO_PAGINATION.has((story as AnyStory).name ?? '')) {
        expect(
          root.querySelectorAll('andes-pagination').length,
        ).toBeGreaterThan(0);
      }

      // The demo's own buttons and switches, then every item of the control.
      for (const control of Array.from(root.querySelectorAll(CONTROLS))) {
        if (control.hasAttribute('disabled')) {
          continue;
        }
        (control as HTMLElement).click();
        await settle(1000);
      }
      for (const item of Array.from(root.querySelectorAll(ITEMS))) {
        const target = item as HTMLButtonElement;
        if (!target.isConnected || target.disabled) {
          continue;
        }
        for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
          target.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true }),
          );
        }
        target.click();
        await settle(1000);
      }
      await settle(2000);

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

describe('Pagination stories: what a few of them promise', () => {
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

  it('"Loading while a page is fetched" is busy until the request answers', async () => {
    const { fixture, root } = await mount(
      asModule(stateStories),
      'Loading while a page is fetched',
    );

    (
      root.querySelector('.andes-pagination__item--next') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(root.querySelector('nav')?.getAttribute('aria-busy')).toBe('true');

    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(root.querySelector('nav')?.getAttribute('aria-busy')).toBeNull();
    expect(root.textContent).toContain('Margaret Dijkstra');
    expect(root.textContent).not.toContain('Ada Johnson');
  });

  it('"Table footer with its rows" shows five orders and the range of the page', async () => {
    const { fixture, root } = await mount(
      asModule(compactStories),
      'Table footer with its rows',
    );

    expect(root.querySelectorAll('[role="row"]')).toHaveLength(6);
    expect(
      root.querySelector('.andes-pagination__total')?.textContent,
    ).toContain('1-5 of 47');

    (
      root.querySelector('.andes-pagination__item--next') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(
      root.querySelector('.andes-pagination__total')?.textContent,
    ).toContain('6-10 of 47');
  });

  it('"Search results page" returns to page 1 on a new query and hides the control when it fits', async () => {
    const { fixture, root } = await mount(
      asModule(compositionStories),
      'Search results page',
    );

    (
      root.querySelector('.andes-pagination__item--next') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(
      root
        .querySelector('.andes-pagination__page--active')
        ?.textContent?.trim(),
    ).toBe('2');

    const field = root.querySelector('input') as HTMLInputElement;
    field.value = 'Turing';
    field.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    expect(root.querySelector('andes-pagination nav')).toBeNull();
  });

  it('"A blog with page links" draws the pages as links', async () => {
    const { root } = await mount(
      asModule(compositionStories),
      'A blog with page links',
    );

    expect(
      root
        .querySelector('.andes-pagination__page--active a')
        ?.getAttribute('href'),
    ).toBe('#/blog/page/1');
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
