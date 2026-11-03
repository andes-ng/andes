import {
  booleanAttribute,
  computed,
  Directive,
  input,
  Signal,
} from '@angular/core';

import {
  AndesSkeletonAnimation,
  AndesSkeletonSemanticValue,
  AndesSkeletonSize,
  AndesSkeletonStyle,
  animationClass,
  resolveAnimation,
  resolveSemantic,
  toStyleMap,
} from './skeleton-utils';

/** The parts of an element placeholder a `classNames` / `styles` input can target. */
export type AndesSkeletonElementSlot = 'root' | 'content';

/** The element placeholder's current inputs, handed to a `classNames` / `styles` function. */
export interface AndesSkeletonElementProps {
  active: boolean;
  animation: AndesSkeletonAnimation;
  size?: AndesSkeletonSize | number;
  shape?: string;
  block?: boolean;
  /** `andes-skeleton-text` only. */
  lines?: number;
  round?: boolean;
}

export type AndesSkeletonElementClassNames = AndesSkeletonSemanticValue<
  Partial<Record<AndesSkeletonElementSlot, string>>,
  AndesSkeletonElementProps
>;

export type AndesSkeletonElementStyles = AndesSkeletonSemanticValue<
  Partial<Record<AndesSkeletonElementSlot, AndesSkeletonStyle>>,
  AndesSkeletonElementProps
>;

/**
 * What every element placeholder (avatar, button, input, image, node) shares: the animation
 * inputs and the `classNames` / `styles` hooks. `root` is the element itself, `content` the
 * painted box inside it. Not part of the public API - the components below it are.
 */
@Directive({
  host: {
    '[class]': 'rootClass()',
    '[style]': 'rootStyle()',
  },
})
export abstract class AndesSkeletonElementBase {
  /** Shimmer animation (ignored under `prefers-reduced-motion: reduce`). */
  readonly active = input(false, { transform: booleanAttribute });
  /** Picks the animation by name; `active` is the shorthand for `'shimmer'`. */
  readonly animation = input<AndesSkeletonAnimation | undefined>(undefined);
  /** Extra classes for the `root` and `content` parts, as an object or a function of the inputs. */
  readonly classNames = input<AndesSkeletonElementClassNames | undefined>(
    undefined,
  );
  /** Inline styles for the `root` and `content` parts, as an object or a function of the inputs. */
  readonly styles = input<AndesSkeletonElementStyles | undefined>(undefined);

  /** Size, shape and block of the subclass, for the `classNames` / `styles` functions. */
  protected abstract readonly extraProps: Signal<
    Pick<
      AndesSkeletonElementProps,
      'size' | 'shape' | 'block' | 'lines' | 'round'
    >
  >;

  protected readonly resolvedAnimation = computed(() =>
    resolveAnimation(this.animation(), this.active()),
  );

  /** The modifier class that runs the animation, or `null` for a still placeholder. */
  protected readonly animationClass = computed(() =>
    animationClass(this.resolvedAnimation()),
  );

  private readonly semanticProps = computed((): AndesSkeletonElementProps => ({
    active: this.active(),
    animation: this.resolvedAnimation(),
    ...this.extraProps(),
  }));

  private readonly resolvedClassNames = computed(() =>
    resolveSemantic(this.classNames(), this.semanticProps()),
  );

  private readonly resolvedStyles = computed(() =>
    resolveSemantic(this.styles(), this.semanticProps()),
  );

  protected readonly rootClass = computed(
    () => this.resolvedClassNames()?.root ?? null,
  );
  protected readonly contentClass = computed(
    () => this.resolvedClassNames()?.content ?? null,
  );
  protected readonly rootStyle = computed(() =>
    toStyleMap(this.resolvedStyles()?.root),
  );
  protected readonly contentStyle = computed(() =>
    toStyleMap(this.resolvedStyles()?.content),
  );
}
