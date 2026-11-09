import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as overviewStories from './tabs-01-overview.stories';
import * as typeStories from './tabs-02-types.stories';
import * as placementStories from './tabs-03-placement-and-size.stories';
import * as indicatorStories from './tabs-04-indicator.stories';
import * as overflowStories from './tabs-05-overflow.stories';
import * as extraStories from './tabs-06-extra-and-custom-bar.stories';
import * as customisationStories from './tabs-07-customisation.stories';
import * as accessibilityStories from './tabs-08-accessibility.stories';
import * as compositionStories from './tabs-09-compositions.stories';
import * as realWorldStories from './tabs-10-real-world.stories';

/*
 * Mounts every story of the Tabs, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a click handler that throws, fails here. It
 * clicks every button of a story, lets the timers run out, and holds the sidebar to its tree:
 * one group per topic, every story named and described in a sentence, and no native control in
 * a story file. The numbers in the story file names keep the groups in this order: Storybook
 * lists story files alphabetically, so they are zero-padded.
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
    applicationConfig?: { providers?: Provider[] };
  };
  return {
    template: result.template,
    props: result.props ?? {},
    // `@storybook/angular` adds the meta's own component to the story's module itself.
    imports: [
      meta.component as Type<unknown>,
      ...(result.moduleMetadata?.imports ?? []),
    ],
    providers: [
      ...(result.applicationConfig?.providers ?? []),
      ...(result.moduleMetadata?.providers ?? []),
    ],
  };
}

@Component({ template: '' })
class StoryHost {}

function mount(resolved: Resolved) {
  TestBed.configureTestingModule({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
    providers: resolved.providers,
  });
  // The story's template is only known at run time, so it is swapped in (JIT) over the stub.
  TestBed.overrideComponent(StoryHost, {
    set: { template: resolved.template, imports: resolved.imports },
  });
  const fixture = TestBed.createComponent(StoryHost);
  Object.assign(fixture.componentInstance, resolved.props);
  fixture.detectChanges();
  return fixture;
}

const asModule = (module: unknown) => module as StoryModule;

/** The sidebar, in order: one group per topic, and the file each one is written in. */
const modules: [string, StoryModule, string][] = [
  ['Navigation/Tabs/Overview', asModule(overviewStories), 'tabs-01-overview'],
  ['Navigation/Tabs/Types', asModule(typeStories), 'tabs-02-types'],
  [
    'Navigation/Tabs/Placement and size',
    asModule(placementStories),
    'tabs-03-placement-and-size',
  ],
  [
    'Navigation/Tabs/Indicator',
    asModule(indicatorStories),
    'tabs-04-indicator',
  ],
  ['Navigation/Tabs/Overflow', asModule(overflowStories), 'tabs-05-overflow'],
  [
    'Navigation/Tabs/Extra content and custom bar',
    asModule(extraStories),
    'tabs-06-extra-and-custom-bar',
  ],
  [
    'Navigation/Tabs/Customisation',
    asModule(customisationStories),
    'tabs-07-customisation',
  ],
  [
    'Navigation/Tabs/Accessibility',
    asModule(accessibilityStories),
    'tabs-08-accessibility',
  ],
  [
    'Navigation/Tabs/Compositions',
    asModule(compositionStories),
    'tabs-09-compositions',
  ],
  [
    'Navigation/Tabs/Real world',
    asModule(realWorldStories),
    'tabs-10-real-world',
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
  '<table',
];

const storiesOf = (module: StoryModule) =>
  Object.entries(module).filter(([name]) => name !== 'default');

const here = dirname(fileURLToPath(import.meta.url));

describe('Tabs stories: the sidebar', () => {
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

  it.each(modules)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(join(here, `${file}.stories.ts`), 'utf8');

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );

  it.each(modules)(
    '%s draws its icons with lucide through ng-icon',
    (_title, _module, file) => {
      const source = readFileSync(join(here, `${file}.stories.ts`), 'utf8');

      expect(source.includes('<svg')).toBe(false);
    },
  );
});

describe.each(modules)('Tabs stories: %s', (_, module) => {
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
      const fixture = mount(resolve(module.default, story as AnyStory));
      const root: HTMLElement = fixture.nativeElement;
      // A dialog draws its content in an overlay outside the story, so the whole page is searched.
      const isDrawn = () => document.querySelector('andes-tabs') !== null;
      let drawn = isDrawn();

      for (const button of Array.from(root.querySelectorAll('andes-button'))) {
        if (button.hasAttribute('disabled')) {
          continue;
        }
        (button as HTMLElement).click();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(50);
        fixture.detectChanges();
        drawn ||= isDrawn();
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
