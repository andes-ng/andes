import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';

import { ANDES_EMPTY_CONFIG, ANDES_EMPTY_TEXTS_EN } from './empty-config';
import type {
  AndesEmptyClassNames,
  AndesEmptyClassNamesInput,
  AndesEmptyDescription,
  AndesEmptyIllustration,
  AndesEmptyImage,
  AndesEmptyPart,
  AndesEmptyPartStyle,
  AndesEmptyPreset,
  AndesEmptySize,
  AndesEmptyStyleInfo,
  AndesEmptyStyles,
  AndesEmptyStylesInput,
  AndesEmptyHeading,
} from './empty-types';

export type {
  AndesEmptyDescription,
  AndesEmptyIllustration,
  AndesEmptyImage,
  AndesEmptyPreset,
  AndesEmptySize,
} from './empty-types';

interface PresetConfig {
  readonly image: AndesEmptyIllustration;
  readonly size: AndesEmptySize;
}

const PRESETS: Record<AndesEmptyPreset, PresetConfig> = {
  default: { image: 'default', size: 'default' },
  select: { image: 'simple', size: 'small' },
  table: { image: 'simple', size: 'default' },
  list: { image: 'simple', size: 'small' },
  search: { image: 'default', size: 'default' },
};

/** What the picture is, for the stylesheet: the sizes and margins depend on it. */
type ImageKind = AndesEmptyIllustration | 'custom' | 'none';

/**
 * The state for "there is nothing to show": a picture, a short message and optional actions.
 *
 * - `image`: the built-in `default` / `simple` illustration (drawn inline, so it follows the
 *   light and dark theme tokens), an image URL, or a template. `false` hides it.
 * - `heading`: an optional title line above the message (text or a template).
 * - `description`: text or a template; `false` hides it.
 * - Projected content is the footer (buttons, links) below the message.
 * - `preset` picks illustration, size and message for a place - `select`, `table`, `list`,
 *   `search` - and every explicit input still wins over it. Drop `<andes-empty preset="table" />`
 *   inside a `<td colspan>` or a list's empty slot.
 * - `announce` makes it a polite live region (`role="status"`), for states that appear after a
 *   search or a filter; leave it off for empty states that are simply there on load.
 * - `classNames` and `styles` reach each part (`root`, `image`, `heading`, `description`,
 *   `footer`) as objects or as functions of the resolved state.
 * - `provideAndesEmpty()` / `[andesEmptyProvider]` set the image, message, texts and part
 *   styling of every empty state below them; an input still wins over it.
 *
 * Sizes follow Ant Design's: the picture is 100px tall (40px for the `simple` illustration, 35px
 * when `small`), with an 8px gap above the message and a 16px one above the footer.
 *
 * Styling hooks: `--andes-empty-image-size` (the picture's height), `--andes-empty-margin`,
 * `--andes-empty-padding`, `--andes-empty-color`, `--andes-empty-stroke`. `imageStyle` applies
 * inline styles to the picture box for one-off tweaks.
 */
@Component({
  selector: 'andes-empty',
  imports: [NgTemplateOutlet],
  templateUrl: './empty.html',
  styleUrl: './empty.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-slot]': '"empty"',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-image]': 'imageKind()',
    '[attr.role]': 'announce() ? "status" : null',
    '[class]': 'classes().root',
    '[style]': 'styleMaps().root',
  },
})
export class AndesEmpty {
  private readonly configSource = inject(ANDES_EMPTY_CONFIG, {
    optional: true,
  });

  /** Illustration, size and message defaults for a common place; explicit inputs override it. */
  readonly preset = input<AndesEmptyPreset>('default');
  readonly image = input<AndesEmptyImage | undefined>(undefined);
  /** Accessible text for a custom image URL; the built-in illustrations are decorative. */
  readonly imageAlt = input('');
  /**
   * Inline styles for the picture box, e.g. `{ '--andes-empty-image-size': '120px' }`. The
   * `image` entry of `styles` is applied after it.
   */
  readonly imageStyle = input<Readonly<Record<string, string>> | null>(null);
  /** A title line above the message; `false` / `null` / unset shows none. */
  readonly heading = input<AndesEmptyHeading | undefined>(undefined);
  readonly description = input<AndesEmptyDescription | undefined>(undefined);
  readonly size = input<AndesEmptySize | undefined>(undefined);
  /** Announce the state to screen readers when it appears (`role="status"`). */
  readonly announce = input(false, { transform: booleanAttribute });
  /**
   * Classes for each part (`root`, `image`, `heading`, `description`, `footer`), as an object or
   * a function of `{ props }`. They add to the classes the parts already have and to the
   * `classNames` of a provider; style properties the component sets itself are best changed
   * through its hooks or `styles`, which are never outranked.
   */
  readonly classNames = input<AndesEmptyClassNamesInput | undefined>(undefined);
  /**
   * Inline styles for each part, as an object or a function of `{ props }`. They are merged
   * over the `styles` of a provider.
   */
  readonly styles = input<AndesEmptyStylesInput | undefined>(undefined);

  private readonly config = computed(() => this.configSource?.config() ?? {});

  private readonly presetConfig = computed(() => PRESETS[this.preset()]);

  protected readonly resolvedSize = computed(
    () => this.size() ?? this.presetConfig().size,
  );

  protected readonly resolvedImage = computed<AndesEmptyImage>(() => {
    const image = this.image();
    if (image !== undefined) {
      return image;
    }
    const shared = this.config().image;
    return shared !== undefined ? shared : this.presetConfig().image;
  });

  protected readonly resolvedDescription = computed<AndesEmptyDescription>(
    () => {
      const description = this.description();
      if (description !== undefined) {
        return description;
      }
      const config = this.config();
      return (
        config.description ??
        config.texts?.[this.preset()] ??
        ANDES_EMPTY_TEXTS_EN[this.preset()]
      );
    },
  );

  protected readonly illustration = computed<AndesEmptyIllustration | null>(
    () => {
      const image = this.resolvedImage();
      return image === 'default' || image === 'simple' ? image : null;
    },
  );

  protected readonly imageUrl = computed(() => {
    const image = this.resolvedImage();
    return typeof image === 'string' && !this.illustration() && image !== ''
      ? image
      : null;
  });

  protected readonly imageTemplate = computed(() => {
    const image = this.resolvedImage();
    return image instanceof TemplateRef ? image : null;
  });

  protected readonly headingText = computed(() => {
    const heading = this.heading();
    return typeof heading === 'string' && heading !== '' ? heading : null;
  });

  protected readonly headingTemplate = computed(() => {
    const heading = this.heading();
    return heading instanceof TemplateRef ? heading : null;
  });

  protected readonly descriptionText = computed(() => {
    const description = this.resolvedDescription();
    return typeof description === 'string' && description !== ''
      ? description
      : null;
  });

  protected readonly descriptionTemplate = computed(() => {
    const description = this.resolvedDescription();
    return description instanceof TemplateRef ? description : null;
  });

  protected readonly hasImage = computed(
    () =>
      this.illustration() !== null ||
      this.imageUrl() !== null ||
      this.imageTemplate() !== null,
  );

  protected readonly imageKind = computed<ImageKind>(
    () => this.illustration() ?? (this.hasImage() ? 'custom' : 'none'),
  );

  private readonly styleInfo = computed<AndesEmptyStyleInfo>(() => ({
    props: {
      preset: this.preset(),
      image: this.resolvedImage(),
      heading: this.heading() ?? false,
      description: this.resolvedDescription(),
      size: this.resolvedSize(),
    },
  }));

  /** @internal The extra classes of every part: the provider's, then the own `classNames`. */
  protected readonly classes = computed<Record<AndesEmptyPart, string>>(() => {
    const info = this.styleInfo();
    const sources = [this.config().classNames, this.classNames()].map(
      (value): AndesEmptyClassNames =>
        typeof value === 'function' ? value(info) : (value ?? {}),
    );
    const join = (part: AndesEmptyPart) =>
      sources
        .map((names) => names[part])
        .filter((name): name is string => !!name)
        .join(' ');
    return {
      root: join('root'),
      image: join('image'),
      heading: join('heading'),
      description: join('description'),
      footer: join('footer'),
    };
  });

  /**
   * @internal The inline styles of every part: the provider's `styles`, then the own ones over
   * them (and, for the picture box, `styles.image` over `imageStyle`).
   */
  protected readonly styleMaps = computed<
    Record<AndesEmptyPart, AndesEmptyPartStyle>
  >(() => {
    const info = this.styleInfo();
    const sources = [this.config().styles, this.styles()].map(
      (value): AndesEmptyStyles =>
        typeof value === 'function' ? value(info) : (value ?? {}),
    );
    const merge = (part: AndesEmptyPart): AndesEmptyPartStyle =>
      Object.assign({}, ...sources.map((source) => source[part]));
    return {
      root: merge('root'),
      image: { ...this.imageStyle(), ...merge('image') },
      heading: merge('heading'),
      description: merge('description'),
      footer: merge('footer'),
    };
  });
}
