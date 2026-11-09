import { AndesOverlayContentPrimitive } from '@andes-ng/primitives';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  untracked,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { AndesPopoverBase } from './popover-base';
import { AndesPopoverOutlet } from './popover-outlet';

/**
 * The popover's panel surface. Wraps its own `[andesOverlayContent]`-decorated
 * element (the `id`/`role`/`aria-modal`/`tabindex`/`data-state` wiring) the same
 * way `AndesButton` wraps `[andesButtonPrimitive]` - a real element component
 * owning the DOM node the shared primitive attaches to, rather than a directive
 * applied to arbitrary consumer markup, so it can carry its own scoped styles
 * (surface background/border/radius/shadow, entrance transition) and render the
 * optional arrow.
 *
 * It also renders the structured parts driven by the owning component's inputs -
 * the `title` header and the `content` body - above any projected children.
 * `AndesPopover` renders one automatically when none is projected, and
 * `AndesPopconfirm` uses it as its own surface.
 *
 * `data-side` reflects the side the panel actually renders on (after a collision
 * flip); `data-align` the requested alignment. Both are styling hooks.
 *
 * Styles are unencapsulated on purpose: the composed parts (`[andesPopoverTitle]`,
 * `[andesPopoverDescription]`, `[andesPopoverHeader]`) are consumer markup
 * projected from the consumer's own view, which an encapsulated stylesheet could
 * not reach. Every class is namespaced `andes-popover-*` to keep that safe.
 *
 * Theming: every visual property reads an `--andes-popover-*` custom property
 * first (`padding`, `min-width`, `max-width`, `radius`, `background`,
 * `foreground`, `border-color`, `shadow`), falling back to the theme tokens. Set
 * them on this element (`style="--andes-popover-padding: 0"`), on a `panelClass`,
 * or globally.
 */
@Component({
  selector: 'andes-popover-content',
  imports: [AndesOverlayContentPrimitive, AndesPopoverOutlet],
  templateUrl: './popover-content.html',
  styleUrl: './popover-content.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AndesPopoverContent {
  protected readonly popover = inject(AndesPopoverBase);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // A hover preview turned into a pinned panel by a click keeps its place, its arrow and its
    // motion: only the content changes. It does so softly - the content fades in and the
    // surface grows or shrinks to the new height - instead of jumping.
    let previous = this.popover.mode();
    effect(() => {
      const mode = this.popover.mode();
      untracked(() => {
        if (mode !== previous) {
          previous = mode;
          this.swapContent();
        }
      });
    });
  }

  /**
   * Runs before the template shows the new content: reads the height the panel has now, then
   * after the render animates from it to the new one and fades the content in.
   */
  private swapContent(): void {
    const surface = this.host.nativeElement.querySelector<HTMLElement>(
      '.andes-popover-content',
    );
    if (!surface || typeof surface.animate !== 'function') {
      return;
    }
    const from =
      this.popover.takeSwapHeight() ?? surface.getBoundingClientRect().height;
    const reduced =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    afterNextRender(
      {
        // Measure the new height, then start from the old one: both in one callback, since the
        // `write` phase runs before the `read` phase.
        mixedReadWrite: () => {
          const to = surface.getBoundingClientRect().height;
          const parts = Array.from(surface.children).filter(
            (child) => !child.classList.contains('andes-popover-arrow'),
          );
          for (const part of parts) {
            part.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: reduced ? 80 : 150,
              easing: 'ease-out',
            });
          }
          if (!reduced && Math.abs(to - from) >= 1) {
            // The surface clips while it resizes, but the arrow sits outside it.
            surface.setAttribute('data-swapping', '');
            const resize = surface.animate(
              [{ height: `${from}px` }, { height: `${to}px` }],
              { duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            );
            const done = () => surface.removeAttribute('data-swapping');
            resize.finished.then(done, done);
          }
        },
      },
      { injector: this.injector },
    );
  }

  protected isTemplate(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }
}
