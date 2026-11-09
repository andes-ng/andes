import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Component, type Provider, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

import * as overviewStories from './qr-code-1-overview.stories';
import * as appearanceStories from './qr-code-2-appearance.stories';
import * as exportStories from './qr-code-3-render-and-export.stories';
import * as correctionStories from './qr-code-4-error-correction.stories';
import * as iconStories from './qr-code-5-icon.stories';
import * as statusStories from './qr-code-6-status.stories';
import * as customisationStories from './qr-code-7-customisation.stories';
import * as accessibilityStories from './qr-code-8-accessibility.stories';
import * as compositionStories from './qr-code-9-compositions.stories';

/*
 * Mounts every story of the QR Code, grouped by topic in the sidebar, through Storybook's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error), or a click handler that throws, fails here. It
 * clicks every button of a story, lets the timers run out, and holds the sidebar to its tree:
 * one group per topic, every story named and described in a sentence, and no native control or
 * hand-drawn svg in a story file. The numbers in the story file names keep the groups in this
 * order: Storybook lists story files alphabetically.
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
      ...(meta.component ? [meta.component as Type<unknown>] : []),
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
    rethrowApplicationErrors: false,
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
  [
    'Data Display/QR Code/Overview',
    asModule(overviewStories),
    'qr-code-1-overview',
  ],
  [
    'Data Display/QR Code/Appearance',
    asModule(appearanceStories),
    'qr-code-2-appearance',
  ],
  [
    'Data Display/QR Code/Render and export',
    asModule(exportStories),
    'qr-code-3-render-and-export',
  ],
  [
    'Data Display/QR Code/Error correction',
    asModule(correctionStories),
    'qr-code-4-error-correction',
  ],
  ['Data Display/QR Code/Icon', asModule(iconStories), 'qr-code-5-icon'],
  ['Data Display/QR Code/Status', asModule(statusStories), 'qr-code-6-status'],
  [
    'Data Display/QR Code/Customisation',
    asModule(customisationStories),
    'qr-code-7-customisation',
  ],
  [
    'Data Display/QR Code/Accessibility',
    asModule(accessibilityStories),
    'qr-code-8-accessibility',
  ],
  [
    'Data Display/QR Code/Compositions',
    asModule(compositionStories),
    'qr-code-9-compositions',
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

const here = dirname(fileURLToPath(import.meta.url));

/** A canvas context that accepts every call, so a story can draw without a real canvas. */
const context2d = new Proxy(
  {},
  {
    get: (target: Record<string, unknown>, key: string) =>
      key in target ? target[key] : vi.fn(),
    set: (target: Record<string, unknown>, key: string, value: unknown) => {
      target[key] = value;
      return true;
    },
  },
);

describe('QR Code stories: the sidebar', () => {
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

    expect(names.length).toBeGreaterThanOrEqual(45);
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

describe.each(modules)('QR Code stories: %s', (_, module) => {
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
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (() => context2d) as never,
      );
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
        'data:image/png;base64,AAAA',
      );
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        function (callback) {
          callback(new Blob(['png'], { type: 'image/png' }));
        },
      );
      vi.spyOn(window, 'print').mockImplementation(() => undefined);
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:story'),
        revokeObjectURL: vi.fn(),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('renders with every component it uses imported, and every button works', async () => {
      const fixture = mount(resolve(module.default, story as AnyStory));
      const root: HTMLElement = fixture.nativeElement;
      const drawn = () => document.body.querySelector('andes-qr-code') !== null;
      let seen = drawn();

      for (const button of Array.from(root.querySelectorAll('andes-button'))) {
        if (button.hasAttribute('disabled')) {
          continue;
        }
        (button as HTMLElement).click();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(50);
        fixture.detectChanges();
        seen ||= drawn();
      }
      // Let every countdown and every pending refresh run to its end.
      for (let second = 0; second < 12; second++) {
        await vi.advanceTimersByTimeAsync(1000);
        fixture.detectChanges();
        seen ||= drawn();
      }

      expect(seen).toBe(true);
    });
  });
});
