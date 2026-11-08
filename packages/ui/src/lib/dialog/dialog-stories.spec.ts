import {
  Component,
  ErrorHandler,
  type Provider,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { readdirSync, readFileSync } from 'node:fs';

import * as alertAccessibilityStories from './alert-dialog-6-accessibility.stories';
import * as alertCompositionStories from './alert-dialog-5-compositions.stories';
import * as alertOverviewStories from './alert-dialog-1-overview.stories';
import * as alertPatternStories from './alert-dialog-3-patterns.stories';
import * as alertServiceStories from './alert-dialog-4-service.stories';
import * as alertToneStories from './alert-dialog-2-tones.stories';
import * as dialogAccessibilityStories from './dialog-7-accessibility.stories';
import * as dialogBasicStories from './dialog-2-basics.stories';
import * as dialogBehaviourStories from './dialog-4-behaviour.stories';
import * as dialogCompositionStories from './dialog-6-compositions.stories';
import * as dialogCustomisationStories from './dialog-5-customisation.stories';
import * as dialogFooterStories from './dialog-3-footer.stories';
import * as dialogOverviewStories from './dialog-1-overview.stories';

/*
 * Mounts every story of the Dialog and of the Alert Dialog, grouped by topic in the sidebar,
 * through Storybook's own decorator chain, so a template that uses a component its module
 * metadata does not import (an NG0304 in the browser, not a build error) or reads a property the
 * story does not provide fails here. It also holds the sidebar to its tree: one group per topic,
 * every story named and described in a sentence, and every "Open" button opens a dialog without
 * throwing. The numbers in the story file names keep the groups in this order: Storybook lists
 * story files alphabetically.
 */

type AnyStory = StoryObj<unknown> & {
  decorators?: unknown[];
  parameters?: { docs?: { description?: { story?: string } } };
  render?: (args: unknown, context: unknown) => Record<string, unknown>;
};

type Decorate = (fn: unknown, ctx: unknown) => unknown;

type StoryModule = Record<string, unknown> & { default: Meta<unknown> };

interface Resolved {
  template: string;
  props: Record<string, unknown>;
  imports: Type<unknown>[];
  providers: Provider[];
}

function resolve(meta: Meta<unknown>, story: AnyStory): Resolved {
  const args = { ...meta.args, ...story.args };
  const context = {
    args,
    parameters: { ...meta.parameters, ...story.parameters },
    globals: {},
  };
  const render = (story.render ?? meta.render) as NonNullable<
    AnyStory['render']
  >;
  const decorators = [
    ...((story.decorators as Decorate[]) ?? []),
    ...((meta.decorators as Decorate[]) ?? []),
  ];
  let storyFn = () => render(args, context);
  for (const decorator of decorators) {
    const inner = storyFn;
    storyFn = () => decorator(inner, context) as ReturnType<typeof storyFn>;
  }
  const result = storyFn() as {
    template: string;
    props?: Record<string, unknown>;
    moduleMetadata?: { imports?: Type<unknown>[]; providers?: Provider[] };
  };
  return {
    template: result.template,
    props: result.props ?? {},
    // `@storybook/angular` adds the meta's own component to the story's module itself.
    imports: [
      ...(meta.component ? [meta.component as Type<unknown>] : []),
      ...(result.moduleMetadata?.imports ?? []),
    ],
    providers: result.moduleMetadata?.providers ?? [],
  };
}

@Component({ template: '' })
class StoryHost {}

/** What went wrong inside Angular (an event handler, a render) while a story ran. */
let errors: unknown[] = [];

function mount(resolved: Resolved) {
  errors = [];
  TestBed.configureTestingModule({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
    rethrowApplicationErrors: false,
    providers: [
      {
        provide: ErrorHandler,
        useValue: { handleError: (error: unknown) => errors.push(error) },
      },
    ],
  });
  // The story's template is only known at run time, so it is swapped in (JIT) over the stub.
  TestBed.overrideComponent(StoryHost, {
    set: {
      template: resolved.template,
      imports: resolved.imports,
      providers: resolved.providers,
    },
  });
  const fixture = TestBed.createComponent(StoryHost);
  Object.assign(fixture.componentInstance, resolved.props);
  fixture.detectChanges();
  return fixture;
}

/** The sidebar, in order: one group per topic. */
const modules: [string, StoryModule][] = [
  ['Feedback/Dialog/Overview', dialogOverviewStories],
  ['Feedback/Dialog/Basics', dialogBasicStories],
  ['Feedback/Dialog/Footer', dialogFooterStories],
  ['Feedback/Dialog/Behaviour', dialogBehaviourStories],
  ['Feedback/Dialog/Customisation', dialogCustomisationStories],
  ['Feedback/Dialog/Compositions', dialogCompositionStories],
  ['Feedback/Dialog/Accessibility and motion', dialogAccessibilityStories],
  ['Feedback/Alert Dialog/Overview', alertOverviewStories],
  ['Feedback/Alert Dialog/Tones', alertToneStories],
  ['Feedback/Alert Dialog/Patterns', alertPatternStories],
  ['Feedback/Alert Dialog/Service', alertServiceStories],
  ['Feedback/Alert Dialog/Compositions', alertCompositionStories],
  ['Feedback/Alert Dialog/Accessibility and motion', alertAccessibilityStories],
].map(([title, module]) => [title as string, module as unknown as StoryModule]);

const storiesOf = (module: StoryModule) =>
  Object.entries(module).filter(([name]) => name !== 'default');

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';
const TRIGGER_SELECTOR = '[andesDialogTrigger], [andesAlertDialogTrigger]';

/** Lets the timers, the promises and the render hooks behind a click run. */
async function settle(fixture: { detectChanges(): void }) {
  fixture.detectChanges();
  await vi.advanceTimersByTimeAsync(50);
  fixture.detectChanges();
  await vi.advanceTimersByTimeAsync(50);
  fixture.detectChanges();
}

describe('Dialog stories: library components only', () => {
  const directory = 'packages/ui/src/lib/dialog';
  const files = readdirSync(directory)
    .filter((file) => /^(alert-)?dialog-\d-.+\.stories\.ts$/.test(file))
    .map((file) => `${directory}/${file}`);

  it('finds every story file of the two trees', () => {
    expect(files).toHaveLength(13);
  });

  it.each(files)(
    '%s uses no native control, link or image where a library component exists',
    (file) => {
      const source = readFileSync(file, 'utf8');
      const native = source.match(
        /<(button|input|textarea|select|label|img|a|kbd)(\s|>|\/)/g,
      );

      expect(native).toBeNull();
    },
  );
});

describe('Dialog stories: the sidebar', () => {
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

  it('has the stories of every topic', () => {
    const counts = Object.fromEntries(
      modules.map(([title, module]) => [title, storiesOf(module).length]),
    );

    for (const title of Object.keys(counts)) {
      expect(counts[title], title).toBeGreaterThan(0);
    }
    expect(
      modules
        .filter(([title]) => title.startsWith('Feedback/Dialog/'))
        .reduce((sum, [title]) => sum + counts[title], 0),
    ).toBeGreaterThanOrEqual(40);
    expect(
      modules
        .filter(([title]) => title.startsWith('Feedback/Alert Dialog/'))
        .reduce((sum, [title]) => sum + counts[title], 0),
    ).toBeGreaterThanOrEqual(35);
  });
});

describe.each(modules)('Dialog stories: %s', (_, module) => {
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

    it('renders with every component it uses imported', async () => {
      const fixture = mount(resolve(module.default, story as AnyStory));
      await settle(fixture);

      expect(fixture.nativeElement.textContent).toBeDefined();
      expect(
        fixture.nativeElement.querySelector('andes-button'),
      ).not.toBeNull();
      expect(errors).toEqual([]);
    });

    it('gives no prop the name of a member of the component the meta names', async () => {
      // Storybook assigns every prop to the meta's component as well as to the story, so a
      // prop called `open` or `toggle` would silently replace the dialog's own.
      const component = module.default.component;
      if (!component) {
        return;
      }
      const resolved = resolve(module.default, story as AnyStory);
      const fixture = mount(resolved);
      await settle(fixture);
      const found = fixture.debugElement.query(By.directive(component));
      if (!found) {
        return;
      }
      const clashes = Object.keys(resolved.props).filter(
        (key) => key in found.componentInstance,
      );

      expect(clashes).toEqual([]);
    });

    it('opens its dialogs from the buttons that open them, without throwing', async () => {
      const fixture = mount(resolve(module.default, story as AnyStory));
      await settle(fixture);
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll(
          'andes-button',
        ) as NodeListOf<HTMLElement>,
      );
      const triggers = buttons.filter((button) =>
        button.matches(TRIGGER_SELECTOR),
      );

      for (const trigger of triggers) {
        const before = document.querySelectorAll(DIALOG_SELECTOR).length;
        trigger.querySelector('button')?.click();
        await settle(fixture);

        expect(
          document.querySelectorAll(DIALOG_SELECTOR).length,
          'a dialog opened',
        ).toBeGreaterThan(before);

        // Close it again by the same control, so the next trigger starts from a closed page.
        trigger.querySelector('button')?.click();
        await settle(fixture);
      }

      for (const button of buttons.filter(
        (b) => !b.matches(TRIGGER_SELECTOR),
      )) {
        button.querySelector('button')?.click();
        await settle(fixture);
      }

      expect(errors).toEqual([]);
    });
  });
});
