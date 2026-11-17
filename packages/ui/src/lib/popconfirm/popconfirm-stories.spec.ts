import { readFileSync } from 'node:fs';

import {
  asModule,
  mountStory,
  NATIVE_CONTROLS,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';
import * as overviewStories from './popconfirm-1-overview.stories';
import * as contentStories from './popconfirm-2-content.stories';
import * as buttonStories from './popconfirm-3-buttons.stories';
import * as asyncStories from './popconfirm-4-async-and-states.stories';
import * as placementStories from './popconfirm-5-placement-and-triggers.stories';
import * as controlledStories from './popconfirm-6-controlled.stories';
import * as customisationStories from './popconfirm-7-customisation.stories';
import * as accessibilityStories from './popconfirm-8-accessibility.stories';
import * as compositionStories from './popconfirm-9-compositions.stories';

/*
 * Mounts every story of the Popconfirm, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a handler that throws, fails here. It drives
 * every trigger a story draws, answers every question both ways, lets the pending requests run
 * out, and holds the sidebar to its tree: one group per topic, every story named and described
 * in a sentence, and no native control in a story file. The numbers in the story file names keep
 * the groups in this order: Storybook lists story files alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  [
    'Feedback/Popconfirm/Overview',
    asModule(overviewStories),
    'popconfirm-1-overview',
  ],
  [
    'Feedback/Popconfirm/Content',
    asModule(contentStories),
    'popconfirm-2-content',
  ],
  [
    'Feedback/Popconfirm/Buttons',
    asModule(buttonStories),
    'popconfirm-3-buttons',
  ],
  [
    'Feedback/Popconfirm/Async and states',
    asModule(asyncStories),
    'popconfirm-4-async-and-states',
  ],
  [
    'Feedback/Popconfirm/Placement and triggers',
    asModule(placementStories),
    'popconfirm-5-placement-and-triggers',
  ],
  [
    'Feedback/Popconfirm/Controlled',
    asModule(controlledStories),
    'popconfirm-6-controlled',
  ],
  [
    'Feedback/Popconfirm/Customisation',
    asModule(customisationStories),
    'popconfirm-7-customisation',
  ],
  [
    'Feedback/Popconfirm/Accessibility and motion',
    asModule(accessibilityStories),
    'popconfirm-8-accessibility',
  ],
  [
    'Feedback/Popconfirm/Compositions',
    asModule(compositionStories),
    'popconfirm-9-compositions',
  ],
] as const;

const TRIGGERS = '[andespopovertrigger], [andespopconfirmtrigger]';
const PANEL = '.andes-popover-content';

function press(key: string) {
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      keyCode: key === 'Escape' ? 27 : 0,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Stories whose triggers are disabled for the whole run, so nothing may be drawn. */
const NEVER_OPENS = new Set(['Disabled trigger']);

const panelDrawn = () => document.querySelector(PANEL) !== null;

describe('Popconfirm stories: the sidebar', () => {
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

  it('has a story for every topic worth showing', () => {
    const total = modules.reduce(
      (sum, [, module]) => sum + storiesOf(module).length,
      0,
    );

    expect(total).toBeGreaterThanOrEqual(50);
  });

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(
        `packages/ui/src/lib/popconfirm/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );
});

describe.each(modules)('Popconfirm stories: %s', (_, module) => {
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

    it('renders with every component it uses imported, and every trigger and button works', async () => {
      const fixture = mountStory(
        resolveStory(module.default, story as AnyStory),
      );
      const root: HTMLElement = fixture.nativeElement;
      const settle = async (ms = 50) => {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(ms);
        fixture.detectChanges();
      };
      let drawn = panelDrawn();

      for (const trigger of Array.from(root.querySelectorAll(TRIGGERS))) {
        const target = trigger as HTMLElement;
        for (const [type, wait] of [
          ['mouseenter', 900],
          ['mouseleave', 1200],
          ['focusin', 50],
          ['focusout', 50],
          ['contextmenu', 50],
          ['click', 50],
        ] as const) {
          target.dispatchEvent(
            type.startsWith('focus')
              ? new FocusEvent(type, { bubbles: true })
              : new MouseEvent(type, { bubbles: true, cancelable: true }),
          );
          await settle(wait);
          await settle(0);
          drawn ||= panelDrawn();
          if (type === 'click') {
            // Answer the question both ways: the first button, then the last, reopening between.
            for (const which of ['first', 'last'] as const) {
              const buttons = Array.from(
                document.querySelectorAll(`${PANEL} andes-button`),
              );
              const button = which === 'first' ? buttons[0] : buttons.at(-1);
              (button as HTMLElement | undefined)?.click();
              await settle(2500);
              target.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true }),
              );
              await settle();
            }
          }
          press('Escape');
          await settle(300);
        }
      }
      // Controls that are not triggers: the demo's own buttons and switches.
      for (const control of Array.from(
        root.querySelectorAll(
          'andes-button:not([andespopconfirmtrigger]):not([andespopovertrigger]), [role="switch"]',
        ),
      )) {
        if (control.hasAttribute('disabled')) {
          continue;
        }
        (control as HTMLElement).click();
        await settle(2500);
        drawn ||= panelDrawn();
      }

      expect(drawn).toBe(!NEVER_OPENS.has((story as AnyStory).name ?? ''));
    });
  });
});

describe('Popconfirm stories: what a few of them promise', () => {
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

  it('"Delete a row of a list" removes the row whose question is confirmed', async () => {
    const fixture = mountStory(
      resolveStory(
        compositionStories.default as never,
        find(asModule(compositionStories), 'Delete a row of a list'),
      ),
    );
    const rows = () =>
      fixture.nativeElement.querySelectorAll('[role="listitem"]');
    expect(rows().length).toBe(3);

    (fixture.nativeElement.querySelector(TRIGGERS) as HTMLElement).click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
    const ok = document.querySelector(
      `${PANEL} .andes-popconfirm-ok`,
    ) as HTMLElement;
    ok.click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    expect(rows().length).toBe(2);
  });

  it('"Async confirm" keeps OK busy until the request ends', async () => {
    const fixture = mountStory(
      resolveStory(
        asyncStories.default as never,
        find(asModule(asyncStories), 'Async confirm'),
      ),
    );
    (fixture.nativeElement.querySelector(TRIGGERS) as HTMLElement).click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
    (
      document.querySelector(`${PANEL} .andes-popconfirm-ok`) as HTMLElement
    ).click();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(
      document
        .querySelector(`${PANEL} .andes-popconfirm-ok button`)
        ?.hasAttribute('disabled'),
    ).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);
    fixture.detectChanges();
    expect(panelDrawn()).toBe(false);
  });
});
