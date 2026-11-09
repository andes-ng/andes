import { readdirSync, readFileSync } from 'node:fs';

import * as overviewStories from './table-01-overview.stories';
import * as columnsStories from './table-02-columns.stories';
import * as selectionStories from './table-03-selection.stories';
import * as sorting_and_filteringStories from './table-04-sorting-and-filtering.stories';
import * as expansion_and_treeStories from './table-05-expansion-and-tree.stories';
import * as fixed_and_scrollStories from './table-06-fixed-and-scroll.stories';
import * as paginationStories from './table-07-pagination.stories';
import * as editingStories from './table-08-editing.stories';
import * as drag_and_resizeStories from './table-09-drag-and-resize.stories';
import * as statesStories from './table-10-states.stories';
import * as customisationStories from './table-11-customisation.stories';
import * as accessibilityStories from './table-12-accessibility.stories';
import * as toolbars_and_exportStories from './table-13-toolbars-and-export.stories';
import * as compositionsStories from './table-14-compositions.stories';
import {
  asModule,
  mountStory,
  NATIVE_CONTROLS,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';

/*
 * Mounts every story of the Table, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a handler that throws, fails here. It presses
 * every button and switch of a story, every sortable header and every expand toggle, lets the
 * timers run out, and holds the sidebar to its tree: one group per topic, every story named and
 * described in a sentence, no native control and no hand-drawn icon in a story file. The
 * zero-padded numbers in the story file names keep the groups in this order: Storybook lists
 * story files alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  [
    'Data Display/Table/Overview',
    asModule(overviewStories),
    'table-01-overview',
  ],
  ['Data Display/Table/Columns', asModule(columnsStories), 'table-02-columns'],
  [
    'Data Display/Table/Selection',
    asModule(selectionStories),
    'table-03-selection',
  ],
  [
    'Data Display/Table/Sorting and filtering',
    asModule(sorting_and_filteringStories),
    'table-04-sorting-and-filtering',
  ],
  [
    'Data Display/Table/Expansion and tree',
    asModule(expansion_and_treeStories),
    'table-05-expansion-and-tree',
  ],
  [
    'Data Display/Table/Fixed and scroll',
    asModule(fixed_and_scrollStories),
    'table-06-fixed-and-scroll',
  ],
  [
    'Data Display/Table/Pagination',
    asModule(paginationStories),
    'table-07-pagination',
  ],
  [
    'Data Display/Table/Editing and custom cells',
    asModule(editingStories),
    'table-08-editing',
  ],
  [
    'Data Display/Table/Drag and resize',
    asModule(drag_and_resizeStories),
    'table-09-drag-and-resize',
  ],
  ['Data Display/Table/States', asModule(statesStories), 'table-10-states'],
  [
    'Data Display/Table/Customisation',
    asModule(customisationStories),
    'table-11-customisation',
  ],
  [
    'Data Display/Table/Accessibility and keyboard',
    asModule(accessibilityStories),
    'table-12-accessibility',
  ],
  [
    'Data Display/Table/Toolbars and export',
    asModule(toolbars_and_exportStories),
    'table-13-toolbars-and-export',
  ],
  [
    'Data Display/Table/Compositions',
    asModule(compositionsStories),
    'table-14-compositions',
  ],
] as const;

const CONTROLS = 'andes-button, [role="switch"]';
const HEADS = 'th[aria-sort]';
const EXPANDERS = 'button.andes-table-control__expand';

/** Names of other products that no table file may carry; spelled in parts so this file does not. */
const OTHER_PRODUCTS = [
  'an' + 't design',
  'an' + 'td',
  'shad' + 'cn',
  'tan' + 'stack',
  'prime' + 'ng',
  'mate' + 'rial',
  'an' + "t's",
];

const here = 'packages/ui/src/lib/table';

const tableFiles = () =>
  readdirSync(here)
    .filter((file) => !file.endsWith('.spec.ts'))
    .map((file) => [file, readFileSync(`${here}/${file}`, 'utf8')] as const);

describe('Table stories: the sidebar', () => {
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

    expect(names.length).toBeGreaterThanOrEqual(120);
    expect(new Set(names).size).toBe(names.length);
  });

  it('numbers its story files with two digits so the groups sort in order', () => {
    const files = modules.map(([, , file]) => file);

    expect([...files].sort()).toEqual(files);
  });

  it('has no other story file in the folder', () => {
    const stories = readdirSync(here).filter((file) =>
      file.endsWith('.stories.ts'),
    );

    expect(stories.sort()).toEqual(
      modules.map(([, , file]) => `${file}.stories.ts`).sort(),
    );
  });

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(`${here}/${file}.stories.ts`, 'utf8');

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
      expect(source.includes('<table')).toBe(false);
    },
  );

  it.each(modules)(
    '%s draws its icons with lucide through ng-icon',
    (_title, _module, file) => {
      const source = readFileSync(`${here}/${file}.stories.ts`, 'utf8');

      expect(source.includes('<svg')).toBe(false);
    },
  );

  it('names no other product in a table file, a story or a version plan', () => {
    const plans = readdirSync('.nx/version-plans')
      .filter((file) => file.endsWith('.md'))
      .map(
        (file) =>
          [file, readFileSync(`.nx/version-plans/${file}`, 'utf8')] as const,
      )
      .filter(
        ([, source]) =>
          source.includes('@andes-ng/ui') && /table/i.test(source),
      );

    for (const [file, source] of [
      ...tableFiles(),
      [
        'table-story-kit.ts',
        readFileSync('packages/ui/src/testing/table-story-kit.ts', 'utf8'),
      ] as const,
      ...plans,
    ]) {
      for (const name of OTHER_PRODUCTS) {
        expect([file, source.toLowerCase().includes(name)]).toEqual([
          file,
          false,
        ]);
      }
    }
  });

  it('keeps the patterns the static scanners block out of the stories', () => {
    for (const [file, source] of tableFiles()) {
      expect([file, source.includes('new RegExp(')]).toEqual([file, false]);
      expect([file, source.includes('{{{')]).toEqual([file, false]);
    }
  });
});

describe.each(modules)('Table stories: %s', (_, module) => {
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

      // A dialog draws its content in an overlay outside the story, so the page is searched.
      let drawn = document.querySelector('andes-table') !== null;
      for (const control of Array.from(root.querySelectorAll(CONTROLS))) {
        if (control.hasAttribute('disabled')) {
          continue;
        }
        (control as HTMLElement).click();
        await settle();
        drawn ||= document.querySelector('andes-table') !== null;
      }
      for (const selector of [HEADS, EXPANDERS]) {
        for (const element of Array.from(root.querySelectorAll(selector))) {
          (element as HTMLElement).click();
          await settle(10);
        }
      }
      // Let every timer run to its end.
      for (let second = 0; second < 4; second++) {
        await vi.advanceTimersByTimeAsync(1000);
        fixture.detectChanges();
      }

      expect(drawn).toBe(true);
    });
  });
});
