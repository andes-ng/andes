import {
  Directive,
  inject,
  InjectionToken,
  input,
  type Provider,
} from '@angular/core';

import type {
  AndesEmptyClassNamesInput,
  AndesEmptyDescription,
  AndesEmptyImage,
  AndesEmptyPreset,
  AndesEmptyStylesInput,
} from './empty-types';

/** The message of each preset, for one language. */
export type AndesEmptyTexts = Readonly<Record<AndesEmptyPreset, string>>;

/** The built-in English messages. */
export const ANDES_EMPTY_TEXTS_EN: AndesEmptyTexts = {
  default: 'No data',
  select: 'No data',
  table: 'No data',
  list: 'No items',
  search: 'No results found',
};

/** Spanish messages, ready for `provideAndesEmpty({ texts: ANDES_EMPTY_TEXTS_ES })`. */
export const ANDES_EMPTY_TEXTS_ES: AndesEmptyTexts = {
  default: 'Sin datos',
  select: 'Sin datos',
  table: 'Sin datos',
  list: 'Sin elementos',
  search: 'No se encontraron resultados',
};

/**
 * Defaults every empty state below the place they are provided shares - the counterpart of
 * Ant Design's `ConfigProvider` (`empty` and `renderEmpty`). Every field is optional, and an
 * `<andes-empty>`'s own input always wins over it. The "no data" areas of other components
 * (the `andes-select` panel) render an `<andes-empty>`, so they follow it too.
 */
export interface AndesEmptyConfig {
  /** Default picture: `'default'`, `'simple'`, a URL, a template, or `false` for none. */
  readonly image?: AndesEmptyImage;
  /** Default message, whatever the preset. Wins over `texts`. */
  readonly description?: AndesEmptyDescription;
  /** The message of each preset, e.g. {@link ANDES_EMPTY_TEXTS_ES} for another language. */
  readonly texts?: Partial<AndesEmptyTexts>;
  /** Classes for the parts of every empty state; see `AndesEmpty.classNames`. */
  readonly classNames?: AndesEmptyClassNamesInput;
  /** Inline styles for the parts of every empty state; see `AndesEmpty.styles`. */
  readonly styles?: AndesEmptyStylesInput;
}

/** What an empty state finds its shared defaults from. */
export interface AndesEmptyConfigSource {
  /** Read inside a `computed`, so a change reaches every empty state below. */
  readonly config: () => AndesEmptyConfig;
}

/**
 * Where an empty state finds its shared defaults: the nearest {@link provideAndesEmpty} or
 * `[andesEmptyProvider]` above it.
 */
export const ANDES_EMPTY_CONFIG = new InjectionToken<AndesEmptyConfigSource>(
  'ANDES_EMPTY_CONFIG',
);

/**
 * Sets the defaults of every empty state in an injector subtree - the application
 * (`bootstrapApplication`'s `providers`), a route, or one component's `providers`.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideAndesEmpty({ image: 'simple', texts: ANDES_EMPTY_TEXTS_ES }),
 *   ],
 * });
 * ```
 *
 * For a part of a template - and a config that changes at runtime - use the
 * `[andesEmptyProvider]` directive instead.
 */
export function provideAndesEmpty(config: AndesEmptyConfig): Provider[] {
  return [
    {
      provide: ANDES_EMPTY_CONFIG,
      useValue: { config: () => config } satisfies AndesEmptyConfigSource,
    },
  ];
}

/**
 * `ConfigProvider` for a part of a template: every empty state inside the element - and the
 * "no data" areas of the components inside it - reads `andesEmptyProvider`. A nested
 * provider replaces the outer one field by field.
 *
 * ```html
 * <section [andesEmptyProvider]="{ image: 'simple', description: 'Data Not Found' }">
 *   <andes-select [options]="[]" />
 * </section>
 * ```
 */
@Directive({
  selector: '[andesEmptyProvider]',
  providers: [
    {
      provide: ANDES_EMPTY_CONFIG,
      useFactory: () => {
        const own = inject(AndesEmptyProvider);
        const outer = inject(ANDES_EMPTY_CONFIG, {
          skipSelf: true,
          optional: true,
        });
        return {
          config: () => ({ ...outer?.config(), ...own.andesEmptyProvider() }),
        } satisfies AndesEmptyConfigSource;
      },
    },
  ],
})
export class AndesEmptyProvider {
  readonly andesEmptyProvider = input.required<AndesEmptyConfig>();
}
