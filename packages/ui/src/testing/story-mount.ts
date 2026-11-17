import {
  Component,
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Meta, StoryObj } from '@storybook/angular';

/*
 * Mounts a Storybook story in a TestBed the way Storybook does: through the story's own
 * decorator chain, so a template that uses a component its module metadata does not import (an
 * NG0304 in the browser, not a build error) fails in a spec. Internal to the unit tests:
 * excluded from the library build in `tsconfig.lib.json`.
 */

export type AnyStory = StoryObj<unknown> & {
  decorators?: unknown[];
  parameters?: { docs?: { description?: { story?: string } } };
  render?: (args: unknown, context: unknown) => Record<string, unknown>;
};

type Decorate = (fn: unknown, ctx: unknown) => unknown;

export type StoryModule = Record<string, unknown> & { default: Meta<unknown> };

export interface ResolvedStory {
  template: string;
  props: Record<string, unknown>;
  imports: Type<unknown>[];
  providers: Provider[];
  /** What a story's `applicationConfig` provides (a router, say): app-wide, not per component. */
  applicationProviders: (Provider | EnvironmentProviders)[];
}

/** Runs the render function and the decorators of a story, and returns what Storybook mounts. */
export function resolveStory(
  meta: Meta<unknown>,
  story: AnyStory,
): ResolvedStory {
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
    applicationConfig?: { providers?: (Provider | EnvironmentProviders)[] };
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
    applicationProviders: result.applicationConfig?.providers ?? [],
  };
}

@Component({ template: '' })
class StoryHost {}

/** Creates the story's host component with strict template checking of elements and inputs. */
export function mountStory(resolved: ResolvedStory) {
  TestBed.configureTestingModule({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
    providers: resolved.applicationProviders,
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

export const asModule = (module: unknown) => module as StoryModule;

export const storiesOf = (module: StoryModule) =>
  Object.entries(module).filter(([name]) => name !== 'default');

/** Elements a story must draw with a library component instead. */
export const NATIVE_CONTROLS = [
  '<button',
  '<input',
  '<select',
  '<textarea',
  '<label',
  '<img',
  '<a ',
  '<a>',
];
