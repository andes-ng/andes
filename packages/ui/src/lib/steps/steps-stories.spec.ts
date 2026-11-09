import { readFileSync } from 'node:fs';

import {
  asModule,
  mountStory,
  NATIVE_CONTROLS,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';
import * as overviewStories from './steps-01-overview.stories';
import * as statusStories from './steps-02-status-and-size.stories';
import * as orientationStories from './steps-03-orientation-and-placement.stories';
import * as iconStories from './steps-04-icons-and-dots.stories';
import * as interactionStories from './steps-05-interaction.stories';
import * as typeStories from './steps-06-types.stories';
import * as progressStories from './steps-07-progress-and-overflow.stories';
import * as customisationStories from './steps-08-customisation.stories';
import * as accessibilityStories from './steps-09-accessibility.stories';
import * as wizardStories from './steps-10-wizards-and-real-world.stories';

/*
 * Mounts every story of the Steps, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a handler that throws, fails here. It presses
 * every button and switch of a story, every step a clickable trail draws and every folded
 * marker, lets the timers run out, and holds the sidebar to its tree: one group per topic,
 * every story named and described in a sentence, and no native control in a story file. The
 * zero-padded numbers in the story file names keep the groups in this order: Storybook lists
 * story files alphabetically.
 */

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules = [
  ['Navigation/Steps/Overview', asModule(overviewStories), 'steps-01-overview'],
  [
    'Navigation/Steps/Status and size',
    asModule(statusStories),
    'steps-02-status-and-size',
  ],
  [
    'Navigation/Steps/Orientation and placement',
    asModule(orientationStories),
    'steps-03-orientation-and-placement',
  ],
  [
    'Navigation/Steps/Icons and dots',
    asModule(iconStories),
    'steps-04-icons-and-dots',
  ],
  [
    'Navigation/Steps/Interaction',
    asModule(interactionStories),
    'steps-05-interaction',
  ],
  ['Navigation/Steps/Types', asModule(typeStories), 'steps-06-types'],
  [
    'Navigation/Steps/Progress and overflow',
    asModule(progressStories),
    'steps-07-progress-and-overflow',
  ],
  [
    'Navigation/Steps/Customisation',
    asModule(customisationStories),
    'steps-08-customisation',
  ],
  [
    'Navigation/Steps/Accessibility and motion',
    asModule(accessibilityStories),
    'steps-09-accessibility',
  ],
  [
    'Navigation/Steps/Wizards and real world',
    asModule(wizardStories),
    'steps-10-wizards-and-real-world',
  ],
] as const;

const TRIGGERS = 'button.andes-step__trigger';
const CONTROLS = 'andes-button, [role="switch"], andes-checkbox';

/** Stories that draw no steps of their own (the trail is inside a closed dialog). */
const NO_STEPS_UNTIL_OPENED = new Set<string>(['Inside a dialog']);

describe('Steps stories: the sidebar', () => {
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

    expect(total).toBeGreaterThanOrEqual(70);
  });

  it('numbers its story files with two digits so the groups sort in order', () => {
    const files = modules.map(([, , file]) => file);

    expect([...files].sort()).toEqual(files);
  });

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(
        `packages/ui/src/lib/steps/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );
});

describe.each(modules)('Steps stories: %s', (_, module) => {
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

      if (!NO_STEPS_UNTIL_OPENED.has((story as AnyStory).name ?? '')) {
        expect(root.querySelectorAll('andes-step').length).toBeGreaterThan(0);
      }

      // The demo's own buttons and switches, then the steps and the folded markers.
      for (const control of Array.from(root.querySelectorAll(CONTROLS))) {
        if (control.hasAttribute('disabled')) {
          continue;
        }
        (control as HTMLElement).click();
        await settle(900);
      }
      for (const trigger of Array.from(root.querySelectorAll(TRIGGERS))) {
        const target = trigger as HTMLButtonElement;
        if (target.disabled) {
          continue;
        }
        for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End']) {
          target.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true }),
          );
        }
        target.click();
        await settle();
      }
      for (const marker of Array.from(
        root.querySelectorAll('andes-steps-more button'),
      )) {
        (marker as HTMLElement).click();
        await settle();
        for (const entry of Array.from(
          document.querySelectorAll('.andes-step__more-entry'),
        )) {
          (entry as HTMLElement).click();
          await settle();
        }
      }
      await settle(2000);
    });
  });
});

describe('Steps stories: what a few of them promise', () => {
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

  it('"Limit the visible steps" folds twelve steps into five slots and a list', async () => {
    const fixture = mountStory(
      resolveStory(
        progressStories.default as never,
        find(asModule(progressStories), 'Limit the visible steps'),
      ),
    );
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const shown = Array.from(root.querySelectorAll('andes-step')).filter(
      (step) => !step.hasAttribute('data-folded'),
    );

    expect(shown).toHaveLength(3);
    expect(root.querySelectorAll('andes-steps-more')).toHaveLength(2);
  });

  it('"Bound to the router" follows the route and navigates on a click', async () => {
    const fixture = mountStory(
      resolveStory(
        wizardStories.default as never,
        find(asModule(wizardStories), 'Bound to the router'),
      ),
    );
    const root: HTMLElement = fixture.nativeElement;
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    expect(root.textContent).toContain('The account page is at /account.');

    (root.querySelectorAll(TRIGGERS)[2] as HTMLButtonElement).click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    expect(root.textContent).toContain('The payment page is at /payment.');
    expect(
      root.querySelectorAll('andes-step')[2].getAttribute('aria-current'),
    ).toBe('step');
  });

  it('"Blocking a change" stays on the step until the box is ticked', async () => {
    const fixture = mountStory(
      resolveStory(
        interactionStories.default as never,
        find(asModule(interactionStories), 'Blocking a change'),
      ),
    );
    const root: HTMLElement = fixture.nativeElement;
    fixture.detectChanges();
    const steps = () => root.querySelectorAll('andes-step');

    (root.querySelectorAll(TRIGGERS)[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(steps()[0].getAttribute('aria-current')).toBe('step');
    expect(root.textContent).toContain('Accept the terms');
  });
});
