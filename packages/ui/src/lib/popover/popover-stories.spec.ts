import { readFileSync } from 'node:fs';

import {
  asModule,
  mountStory,
  NATIVE_CONTROLS,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';
import * as overviewStories from './popover-1-overview.stories';
import * as triggerStories from './popover-2-triggers.stories';
import * as placementStories from './popover-3-placement.stories';
import * as contentStories from './popover-4-content.stories';
import * as controlledStories from './popover-5-controlled.stories';
import * as customisationStories from './popover-6-customisation.stories';
import * as accessibilityStories from './popover-7-accessibility.stories';
import * as compositionStories from './popover-8-compositions.stories';

/*
 * Mounts every story of the Popover, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a handler that throws, fails here. It drives
 * every trigger a story draws (hover, focus, context menu, click), presses the buttons inside
 * the panel, and holds the sidebar to its tree: one group per topic, every story named and
 * described in a sentence, and no native control in a story file. The numbers in the story file
 * names keep the groups in this order: Storybook lists story files alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  [
    'Data Display/Popover/Overview',
    asModule(overviewStories),
    'popover-1-overview',
  ],
  [
    'Data Display/Popover/Triggers',
    asModule(triggerStories),
    'popover-2-triggers',
  ],
  [
    'Data Display/Popover/Placement',
    asModule(placementStories),
    'popover-3-placement',
  ],
  [
    'Data Display/Popover/Content',
    asModule(contentStories),
    'popover-4-content',
  ],
  [
    'Data Display/Popover/Controlled',
    asModule(controlledStories),
    'popover-5-controlled',
  ],
  [
    'Data Display/Popover/Customisation',
    asModule(customisationStories),
    'popover-6-customisation',
  ],
  [
    'Data Display/Popover/Accessibility and motion',
    asModule(accessibilityStories),
    'popover-7-accessibility',
  ],
  [
    'Data Display/Popover/Compositions',
    asModule(compositionStories),
    'popover-8-compositions',
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

/** Stories whose panels are disabled for the whole run, so nothing may be drawn. */
const NEVER_OPENS = new Set(['Disabled popover']);

const panelDrawn = () => document.querySelector(PANEL) !== null;

describe('Popover stories: the sidebar', () => {
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

    expect(total).toBeGreaterThanOrEqual(60);
  });

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(
        `packages/ui/src/lib/popover/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );
});

describe.each(modules)('Popover stories: %s', (_, module) => {
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
        const fire = (type: string, init: EventInit = {}) =>
          target.dispatchEvent(
            type.startsWith('focus')
              ? new FocusEvent(type, { bubbles: true, ...init })
              : new MouseEvent(type, {
                  bubbles: true,
                  cancelable: true,
                  ...init,
                }),
          );

        for (const [type, wait] of [
          ['mouseenter', 900],
          ['mouseleave', 1200],
          ['focusin', 50],
          ['focusout', 50],
          ['contextmenu', 50],
          ['click', 50],
        ] as const) {
          fire(type);
          await settle(wait);
          await settle(0);
          drawn ||= panelDrawn();
          if (type === 'click' || type === 'contextmenu') {
            // Press whatever the panel holds, then dismiss it.
            for (const button of Array.from(
              document.querySelectorAll(
                `${PANEL} andes-button, ${PANEL} [role="switch"]`,
              ),
            )) {
              (button as HTMLElement).click();
              await settle();
            }
          }
          press('Escape');
          await settle(300);
        }
      }
      // Controls that are not triggers: switches and buttons of the demo itself.
      for (const control of Array.from(
        root.querySelectorAll(
          'andes-button:not([andespopovertrigger]), [role="switch"]',
        ),
      )) {
        if (control.hasAttribute('disabled')) {
          continue;
        }
        (control as HTMLElement).click();
        await settle(2200);
        drawn ||= panelDrawn();
      }

      // A disabled popover is the one story that must stay shut while it is disabled.
      expect(drawn).toBe(!NEVER_OPENS.has((story as AnyStory).name ?? ''));
    });
  });
});

describe('Popover stories: what a few of them promise', () => {
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

  it('"Open by default" draws its panel on the first render', async () => {
    const fixture = mountStory(
      resolveStory(
        controlledStories.default as never,
        find(asModule(controlledStories), 'Open by default'),
      ),
    );
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    expect(panelDrawn()).toBe(true);
  });

  it('"Drawn inside a container" draws its panel inside that element', async () => {
    const fixture = mountStory(
      resolveStory(
        customisationStories.default as never,
        find(asModule(customisationStories), 'Drawn inside a container'),
      ),
    );
    const trigger = fixture.nativeElement.querySelector(
      TRIGGERS,
    ) as HTMLElement;
    trigger.click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector(
      '#story-popover-container',
    ) as HTMLElement;
    expect(box.querySelector(PANEL)).not.toBeNull();
  });
});
