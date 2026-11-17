import { readFileSync } from 'node:fs';

import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as overviewStories from './toast-1-overview.stories';
import * as messageStories from './toast-2-messages.stories';
import * as notificationStories from './toast-3-notifications.stories';
import * as placementStories from './toast-4-placement-and-stacking.stories';
import * as progressStories from './toast-5-progress-and-timing.stories';
import * as customisationStories from './toast-6-customisation.stories';
import * as accessibilityStories from './toast-7-accessibility.stories';
import * as compositionStories from './toast-8-compositions.stories';

/*
 * Mounts every story of the Toast, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a click handler that throws, fails here. It
 * clicks every button and switch of a story, lets the timers run out, and holds the sidebar to its tree:
 * one group per topic, every story named and described in a sentence, and no native control in
 * a story file. The numbers in the story file names keep the groups in this order: Storybook
 * lists story files alphabetically.
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
      meta.component as Type<unknown>,
      ...(result.moduleMetadata?.imports ?? []),
    ],
    providers: result.moduleMetadata?.providers ?? [],
  };
}

@Component({ template: '' })
class StoryHost {}

function mount(resolved: Resolved) {
  TestBed.configureTestingModule({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
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

const asModule = (module: unknown) => module as StoryModule;

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules: [string, StoryModule, string][] = [
  ['Feedback/Toast/Overview', asModule(overviewStories), 'toast-1-overview'],
  ['Feedback/Toast/Messages', asModule(messageStories), 'toast-2-messages'],
  [
    'Feedback/Toast/Notifications',
    asModule(notificationStories),
    'toast-3-notifications',
  ],
  [
    'Feedback/Toast/Placement and stacking',
    asModule(placementStories),
    'toast-4-placement-and-stacking',
  ],
  [
    'Feedback/Toast/Progress and timing',
    asModule(progressStories),
    'toast-5-progress-and-timing',
  ],
  [
    'Feedback/Toast/Customisation',
    asModule(customisationStories),
    'toast-6-customisation',
  ],
  [
    'Feedback/Toast/Accessibility and motion',
    asModule(accessibilityStories),
    'toast-7-accessibility',
  ],
  [
    'Feedback/Toast/Compositions',
    asModule(compositionStories),
    'toast-8-compositions',
  ],
];

/** Elements a story must draw with a library component instead. */
const NATIVE_CONTROLS = [
  '<button',
  '<input',
  '<select',
  '<textarea',
  '<label',
  '<img',
  '<a ',
  '<a>',
];

const storiesOf = (module: StoryModule) =>
  Object.entries(module).filter(([name]) => name !== 'default');

describe('Toast stories: the sidebar', () => {
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

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(
        `packages/ui/src/lib/toast/${file}.stories.ts`,
        'utf8',
      );

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );
});

describe.each(modules)('Toast stories: %s', (_, module) => {
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

    it('renders with every component it uses imported, and every button and switch works', async () => {
      const fixture = mount(resolve(module.default, story as AnyStory));
      const root: HTMLElement = fixture.nativeElement;
      let drawn = root.querySelector('andes-toast-item') !== null;

      for (const button of Array.from(
        root.querySelectorAll('andes-button, [role="switch"]'),
      )) {
        if (button.hasAttribute('disabled')) {
          continue;
        }
        (button as HTMLElement).click();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(50);
        fixture.detectChanges();
        drawn ||= root.querySelector('andes-toast-item') !== null;
      }
      // Let every countdown, loading toast and sequence run to its end.
      for (let second = 0; second < 40; second++) {
        await vi.advanceTimersByTimeAsync(1000);
        fixture.detectChanges();
        drawn ||= root.querySelector('andes-toast-item') !== null;
      }

      expect(drawn).toBe(true);
    });
  });
});
