import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import clsx from 'clsx';

import {
  AndesSkeletonAvatar,
  AndesSkeletonAvatarShape,
} from './skeleton-avatar';
import {
  AndesSkeletonAnimation,
  AndesSkeletonSemanticValue,
  AndesSkeletonSize,
  AndesSkeletonStyle,
  animationClass,
  resolveAnimation,
  resolveSemantic,
  toCssSize,
  toStyleMap,
} from './skeleton-utils';

export type AndesSkeletonShape = 'text' | 'circular' | 'rectangular';

export interface AndesSkeletonAvatarConfig {
  /** A named step of the shared scale (`lg`, 40px, by default) or a number of pixels. */
  size?: AndesSkeletonSize | number;
  shape?: AndesSkeletonAvatarShape;
  /** Shimmers (or, with `false`, stills) the avatar on its own, apart from the other bars. */
  active?: boolean;
}

export interface AndesSkeletonTitleConfig {
  /** Numbers are pixels. */
  width?: number | string;
}

export interface AndesSkeletonParagraphConfig {
  rows?: number;
  /**
   * An array sets each row's width in order; a single value sets only the LAST row's width,
   * so the paragraph ends on a shorter line. Numbers are pixels.
   */
  width?: number | string | (number | string)[];
}

/** The parts of the composite placeholder a `classNames` / `styles` input can target. */
export type AndesSkeletonSlot =
  'root' | 'header' | 'section' | 'avatar' | 'title' | 'paragraph';

/** The composite placeholder's current inputs, handed to a `classNames` / `styles` function. */
export interface AndesSkeletonProps {
  loading: boolean;
  active: boolean;
  animation: AndesSkeletonAnimation;
  round: boolean;
  avatar: boolean | AndesSkeletonAvatarConfig;
  title: boolean | AndesSkeletonTitleConfig;
  paragraph: boolean | AndesSkeletonParagraphConfig;
}

export type AndesSkeletonClassNames = AndesSkeletonSemanticValue<
  Partial<Record<AndesSkeletonSlot, string>>,
  AndesSkeletonProps
>;

export type AndesSkeletonStyles = AndesSkeletonSemanticValue<
  Partial<Record<AndesSkeletonSlot, AndesSkeletonStyle>>,
  AndesSkeletonProps
>;

/** The width of a paragraph's last row when it is not set and the paragraph has 3 rows or more. */
const LAST_ROW_WIDTH = '61%';

type SectionInput<T> = boolean | T | string | null | undefined;

/** `true`/`false`, a bare attribute (`<andes-skeleton avatar>`), or a config object. */
function sectionAttribute<T extends object>(
  value: SectionInput<T>,
): boolean | T {
  return typeof value === 'object' && value !== null
    ? value
    : booleanAttribute(value);
}

/** Drops `undefined` keys so `{ rows: 4, width: undefined }` doesn't erase a default width. */
function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

@Component({
  selector: 'andes-skeleton',
  imports: [AndesSkeletonAvatar, NgTemplateOutlet],
  templateUrl: './skeleton.html',
  styleUrls: ['./skeleton-fill.css', './skeleton.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Block mode (legacy `shape` API) is a single decorative bar, hidden from assistive tech as
    // before - a consumer composing several bars provides its own loading status around them.
    //
    // Composite mode owns that loading status itself: while the placeholder shows, the host
    // carries one visually hidden status text (`loadingLabel`); every placeholder bar below it is
    // aria-hidden. The host is deliberately NOT aria-busy - screen readers may hold back
    // announcements from inside a busy region, which would silence the status text. Once
    // `loading` is false the host is a plain wrapper around the real content, with nothing hidden.
    '[attr.aria-hidden]': 'isBlock() ? "true" : null',
    // `title` is an input here (the title bar config), not a tooltip - a bare `title` attribute
    // must not leave an empty native tooltip on the host.
    '[attr.title]': 'null',
  },
})
export class AndesSkeleton {
  // --- Composite API ---------------------------------------------------------------------------

  /** Shows the placeholder while true; renders the projected content once false. */
  readonly loading = input(true, { transform: booleanAttribute });
  /** Shimmer animation (ignored under `prefers-reduced-motion: reduce`). */
  readonly active = input(false, { transform: booleanAttribute });
  /**
   * Picks the animation by name - `shimmer`, `pulse` or `none` - and wins over `active`, which
   * is the shorthand for `'shimmer'`. Ignored under `prefers-reduced-motion: reduce`.
   */
  readonly animation = input<AndesSkeletonAnimation | undefined>(undefined);
  readonly avatar = input<
    boolean | AndesSkeletonAvatarConfig,
    SectionInput<AndesSkeletonAvatarConfig>
  >(false, { transform: sectionAttribute });
  readonly title = input<
    boolean | AndesSkeletonTitleConfig,
    SectionInput<AndesSkeletonTitleConfig>
  >(true, { transform: sectionAttribute });
  readonly paragraph = input<
    boolean | AndesSkeletonParagraphConfig,
    SectionInput<AndesSkeletonParagraphConfig>
  >(true, { transform: sectionAttribute });
  /** Fully rounded title and paragraph bars. */
  readonly round = input(false, { transform: booleanAttribute });
  /** Visually hidden status text announced while the placeholder shows. */
  readonly loadingLabel = input('Loading…');
  /**
   * Extra classes for the `root`, `header`, `section`, `avatar`, `title` and `paragraph` parts, as
   * an object or as a function of the current inputs.
   */
  readonly classNames = input<AndesSkeletonClassNames | undefined>(undefined);
  /**
   * Inline styles for the same parts as `classNames`, as an object or as a function of the
   * current inputs. Numbers are pixels.
   */
  readonly styles = input<AndesSkeletonStyles | undefined>(undefined);

  // --- Block (original single-bar) API ---------------------------------------------------------
  // Setting `shape` switches the component to the original single-bar rendering, unchanged:
  // same DOM, same default sizes, same pulse animation controlled by `animated`.

  readonly shape = input<AndesSkeletonShape | undefined>(undefined);
  readonly width = input<string | number | undefined>(undefined);
  readonly height = input<string | number | undefined>(undefined);
  readonly animated = input(true, { transform: booleanAttribute });

  protected readonly isBlock = computed(() => this.shape() !== undefined);

  protected readonly blockClasses = computed(() =>
    clsx(
      'andes-skeleton',
      'andes-skeleton-fill',
      `andes-skeleton--${this.shape()}`,
      !this.animated() && 'andes-skeleton--static',
    ),
  );

  protected readonly widthStyle = computed(() => toCssSize(this.width()));
  protected readonly heightStyle = computed(() => toCssSize(this.height()));

  // Section defaults are chosen so a bare <andes-skeleton /> looks balanced: the title
  // shortens and the paragraph gets fewer rows as more sections share the space.

  /** What actually runs: an explicit `animation`, else the shimmer when `active`. */
  protected readonly animationMode = computed(() =>
    resolveAnimation(this.animation(), this.active()),
  );

  protected readonly avatarConfig = computed(
    (): {
      size: AndesSkeletonSize | number;
      shape: AndesSkeletonAvatarShape;
      animation: AndesSkeletonAnimation;
    } | null => {
      const avatar = this.avatar();
      if (!avatar) {
        return null;
      }
      const hasSquareDefault = !!this.title() && !this.paragraph();
      const config = {
        size: 'lg' as AndesSkeletonSize | number,
        shape: (hasSquareDefault
          ? 'square'
          : 'circle') as AndesSkeletonAvatarShape,
        ...(avatar === true ? {} : definedOnly(avatar)),
      };
      const mode = this.animationMode();
      return {
        size: config.size,
        shape: config.shape,
        // An avatar's own `active` overrides the placeholder's animation for that avatar alone.
        animation:
          config.active === undefined
            ? mode
            : config.active
              ? mode === 'none'
                ? 'shimmer'
                : mode
              : 'none',
      };
    },
  );

  protected readonly titleWidth = computed((): string | undefined | null => {
    const title = this.title();
    if (!title) {
      return null;
    }
    const hasAvatar = !!this.avatar();
    const hasParagraph = !!this.paragraph();
    const defaultWidth = hasParagraph ? (hasAvatar ? '50%' : '38%') : undefined;
    const width = title === true ? undefined : title.width;
    return toCssSize(width ?? defaultWidth);
  });

  /** One entry per paragraph row: its CSS width, or undefined for full width. */
  protected readonly paragraphRows = computed((): (string | undefined)[] => {
    const paragraph = this.paragraph();
    if (!paragraph) {
      return [];
    }
    const hasAvatar = !!this.avatar();
    const hasTitle = !!this.title();
    const config: AndesSkeletonParagraphConfig = {
      rows: !hasAvatar && hasTitle ? 3 : 2,
      width: !hasAvatar || !hasTitle ? '61%' : undefined,
      ...(paragraph === true ? {} : definedOnly(paragraph)),
    };
    const rows = Math.max(0, Math.floor(config.rows ?? 0));
    const width = config.width;

    return Array.from({ length: rows }, (_, index) => {
      const rowWidth = Array.isArray(width)
        ? toCssSize(width[index])
        : index === rows - 1
          ? toCssSize(width)
          : undefined;
      // A paragraph of 3 rows or more ends on a shorter line unless its last row has a width.
      return (
        rowWidth ??
        (rows >= 3 && index === rows - 1 ? LAST_ROW_WIDTH : undefined)
      );
    });
  });

  private readonly barAnimationClass = computed(() =>
    animationClass(this.animationMode()),
  );

  protected readonly titleClass = computed(() =>
    clsx(
      'andes-skeleton-composite__title',
      'andes-skeleton-fill',
      this.barAnimationClass(),
      this.parts().classNames.title,
    ),
  );

  protected readonly rowClass = computed(() =>
    clsx(
      'andes-skeleton-composite__row',
      'andes-skeleton-fill',
      this.barAnimationClass(),
    ),
  );

  private readonly semanticProps = computed((): AndesSkeletonProps => ({
    loading: this.loading(),
    active: this.active(),
    animation: this.animationMode(),
    round: this.round(),
    avatar: this.avatar(),
    title: this.title(),
    paragraph: this.paragraph(),
  }));

  /** The resolved `classNames` / `styles`: classes per part, style maps per part. */
  protected readonly parts = computed(() => {
    const props = this.semanticProps();
    const classNames = resolveSemantic(this.classNames(), props) ?? {};
    const styles = resolveSemantic(this.styles(), props) ?? {};
    return {
      classNames,
      styles: {
        root: toStyleMap(styles.root),
        header: toStyleMap(styles.header),
        section: toStyleMap(styles.section),
        title: toStyleMap(styles.title),
        paragraph: toStyleMap(styles.paragraph),
      },
      // The avatar is a placeholder element of its own: its parts are `root` and `content`.
      avatarClassNames: { content: classNames.avatar },
      avatarStyles: { content: styles.avatar },
    };
  });

  protected readonly classes = computed(() =>
    clsx(
      'andes-skeleton-composite',
      this.avatar() && 'andes-skeleton-composite--with-avatar',
      this.round() && 'andes-skeleton-composite--round',
      this.parts().classNames.root,
    ),
  );
}
