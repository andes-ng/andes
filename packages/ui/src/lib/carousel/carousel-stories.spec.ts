import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as motionStories from './carousel-motion.stories';
import * as overviewStories from './carousel-scroller-01-overview.stories';
import * as edgeStories from './carousel-scroller-02-edges-and-buttons.stories';
import * as pagingStories from './carousel-scroller-03-snapping-and-paging.stories';
import * as layoutStories from './carousel-scroller-04-layout-and-accessibility.stories';

/*
 * Mounts every story of the carousel scroller, and the slide carousel stories added with it,
 * through Storybook's own decorator chain, so a template that uses a component its module
 * metadata does not import (an NG0304 in the browser, not a build error), or a click handler
 * that throws, fails here. It also holds the sidebar to its tree: one group per topic, every
 * story named and described in a sentence, and no native control or hand-drawn icon in a
 * story file.
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

/** The scroller's sidebar, in order: one group per topic, and the file each one is written in. */
const scroller: [string, StoryModule, string][] = [
  [
    'Data Display/Carousel/Scroller',
    asModule(overviewStories),
    'carousel-scroller-01-overview',
  ],
  [
    'Data Display/Carousel/Scroller edges and buttons',
    asModule(edgeStories),
    'carousel-scroller-02-edges-and-buttons',
  ],
  [
    'Data Display/Carousel/Scroller snapping and paging',
    asModule(pagingStories),
    'carousel-scroller-03-snapping-and-paging',
  ],
  [
    'Data Display/Carousel/Scroller layout and accessibility',
    asModule(layoutStories),
    'carousel-scroller-04-layout-and-accessibility',
  ],
];

/** Elements a scroller story must draw with a library component instead. */
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

const DIR = 'packages/ui/src/lib/carousel';

describe('Carousel scroller stories: the sidebar', () => {
  it('has one group per topic, with no story name repeated in a group', () => {
    expect(scroller.map(([, module]) => module.default.title)).toEqual(
      scroller.map(([title]) => title),
    );
    for (const [, module] of scroller) {
      const names = storiesOf(module).map(
        ([, story]) => (story as AnyStory).name,
      );

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('has one story per example, with no name used in two groups', () => {
    const names = scroller.flatMap(([, module]) =>
      storiesOf(module).map(([, story]) => (story as AnyStory).name),
    );

    expect(names.length).toBeGreaterThanOrEqual(14);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(scroller)(
    '%s uses library components for every control',
    (_title, _module, file) => {
      const source = readFileSync(join(DIR, `${file}.stories.ts`), 'utf8');

      for (const element of NATIVE_CONTROLS) {
        expect(source.includes(element)).toBe(false);
      }
    },
  );

  it.each(scroller)(
    '%s draws its icons with lucide through ng-icon',
    (_title, _module, file) => {
      const source = readFileSync(join(DIR, `${file}.stories.ts`), 'utf8');

      expect(source.includes('<svg')).toBe(false);
    },
  );

  it('keeps the shared kit free of native controls and hand-drawn icons', () => {
    const source = readFileSync(
      'packages/ui/src/testing/carousel-story-kit.ts',
      'utf8',
    );

    for (const element of [...NATIVE_CONTROLS, '<svg']) {
      expect(source.includes(element)).toBe(false);
    }
  });
});

describe.each(scroller)('Carousel scroller stories: %s', (_, module) => {
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
    it('renders with every component it uses imported, and every button works', () => {
      const fixture = mount(resolve(module.default, story as AnyStory));
      const root: HTMLElement = fixture.nativeElement;

      expect(root.querySelector('andes-carousel-scroller')).not.toBeNull();
      expect(
        root.querySelectorAll('andes-carousel-scroller-item').length,
      ).toBeGreaterThan(0);
      for (const button of Array.from(root.querySelectorAll('andes-button'))) {
        (button as HTMLElement).click();
        fixture.detectChanges();
      }

      // The region is named, as a carousel must be.
      for (const region of Array.from(
        root.querySelectorAll('andes-carousel-scroller'),
      )) {
        expect(region.getAttribute('aria-label')).toBeTruthy();
      }
    });
  });
});

describe('Carousel motion stories added for the shorthands', () => {
  const module = asModule(motionStories);

  it.each([
    ['FadeShorthand', 'fade'],
    ['AutoplayDotProgress', 'andes-carousel__dot--progress'],
  ])('%s renders', (name, expected) => {
    const fixture = mount(resolve(module.default, module[name] as AnyStory));
    const root: HTMLElement = fixture.nativeElement;

    if (expected === 'fade') {
      expect(
        root.querySelector('andes-carousel')?.getAttribute('data-effect'),
      ).toBe('fade');
    } else {
      expect(root.querySelector(`.${expected}`)).not.toBeNull();
    }
  });
});
