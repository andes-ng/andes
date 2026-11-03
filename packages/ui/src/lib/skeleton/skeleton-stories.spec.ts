import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as antStories from './skeleton-examples.stories';
import * as patternStories from './skeleton-patterns.stories';

/*
 * Mounts every example story of the Skeleton - the Ant Design page and the patterns - through
 * Storybook's own decorator chain, so a template that uses a component its module metadata does
 * not import (an NG0304 in the browser, not a build error), reads a property the story does not
 * provide, or breaks when the Loaded switch flips fails here.
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
  const context = {
    args: {},
    parameters: story.parameters ?? {},
    globals: {},
  };
  const render = story.render as NonNullable<AnyStory['render']>;
  const decorators = [
    ...((story.decorators as Decorate[]) ?? []),
    ...((meta.decorators as Decorate[]) ?? []),
  ];
  let storyFn = () => render({}, context);
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

const modules: [string, StoryModule][] = [
  ['Ant Design examples', antStories as unknown as StoryModule],
  ['patterns', patternStories as unknown as StoryModule],
];

const isSignal = (value: unknown): value is { set(next: boolean): void } =>
  typeof value === 'function' &&
  typeof (value as { set?: unknown }).set === 'function';

describe.each(modules)('Skeleton stories: %s', (_, module) => {
  const stories = Object.entries(module).filter(([name]) => name !== 'default');

  it('nests under Feedback/Skeleton/Examples', () => {
    expect(module.default.title).toMatch(/^Feedback\/Skeleton\/Examples\/./);
  });

  it.each(stories)('%s has a one-sentence description', (_name, story) => {
    const description = (story as AnyStory).parameters?.docs?.description
      ?.story;

    expect(description).toBeTruthy();
    expect(description?.length).toBeLessThan(420);
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
