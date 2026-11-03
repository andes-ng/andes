import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as accessibilityStories from './skeleton-7-accessibility.stories';
import * as compositionStories from './skeleton-6-compositions.stories';
import * as customisationStories from './skeleton-5-customisation.stories';
import * as elementStories from './skeleton-2-elements.stories';
import * as loadingStories from './skeleton-3-loading-wrapper.stories';
import * as textStories from './skeleton-4-text.stories';
import * as overviewStories from './skeleton-1-overview.stories';

/*
 * Mounts every story of the Skeleton, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), reads a property the story does not provide, or
 * breaks when the Loaded switch flips fails here. It also holds the sidebar to its tree: one
 * group per topic, every story named and described in a sentence. The numbers in the story file
 * names keep the groups in this order: Storybook lists story files alphabetically.
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

/** The sidebar, in order: one group per topic. */
const modules: [string, StoryModule][] = [
  ['Feedback/Skeleton/Overview', overviewStories as unknown as StoryModule],
  ['Feedback/Skeleton/Elements', elementStories as unknown as StoryModule],
  [
    'Feedback/Skeleton/Loading wrapper',
    loadingStories as unknown as StoryModule,
  ],
  ['Feedback/Skeleton/Text', textStories as unknown as StoryModule],
  [
    'Feedback/Skeleton/Customisation',
    customisationStories as unknown as StoryModule,
  ],
  [
    'Feedback/Skeleton/Compositions',
    compositionStories as unknown as StoryModule,
  ],
  [
    'Feedback/Skeleton/Accessibility and motion',
    accessibilityStories as unknown as StoryModule,
  ],
];

const isSignal = (value: unknown): value is { set(next: boolean): void } =>
  typeof value === 'function' &&
  typeof (value as { set?: unknown }).set === 'function';

describe('Skeleton stories: the sidebar', () => {
  it('has one group per topic, with no story name repeated in a group', () => {
    expect(modules.map(([, module]) => module.default.title)).toEqual(
      modules.map(([title]) => title),
    );
    for (const [, module] of modules) {
      const names = Object.entries(module)
        .filter(([key]) => key !== 'default')
        .map(([, story]) => (story as AnyStory).name);

      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe.each(modules)('Skeleton stories: %s', (_, module) => {
  const stories = Object.entries(module).filter(([name]) => name !== 'default');

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

    it('renders with every component it uses imported', () => {
      const fixture = mount(resolve(module.default, story as AnyStory));

      expect(fixture.nativeElement.textContent).toBeDefined();
      expect(
        fixture.nativeElement.querySelector(
          'andes-skeleton, andes-skeleton-avatar, andes-skeleton-button, andes-skeleton-input, andes-skeleton-image, andes-skeleton-node, andes-skeleton-text',
        ),
      ).not.toBeNull();
    });

    it('gives way to the real content when the Loaded switch is on', () => {
      const resolved = resolve(module.default, story as AnyStory);
      const loaded = resolved.props['loaded'];
      if (!isSignal(loaded)) {
        return;
      }
      const fixture = mount(resolved);
      const placeholders = () =>
        fixture.nativeElement.querySelectorAll(
          '[data-slot^="skeleton"]:not([data-slot="skeleton-status"])',
        ).length;
      expect(placeholders()).toBeGreaterThan(0);

      loaded.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(placeholders()).toBe(0);
    });
  });
});
