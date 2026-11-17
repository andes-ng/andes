import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import { ANDES_CAROUSEL_SCROLLER } from './carousel-scroller-context';

/**
 * One item of an `andes-carousel-scroller`. Announced as "slide, 2 of 5" and, with `snap`
 * on, lined up with the start edge of the scroller when it comes to rest.
 *
 * Items are always in the accessibility tree and in the tab order: unlike a slide of the
 * stage carousel, nothing is hidden, because every item is reachable by scrolling.
 */
@Component({
  selector: 'andes-carousel-scroller-item',
  template: '<ng-content />',
  styleUrl: './carousel-scroller-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    'aria-roledescription': 'slide',
    '[attr.aria-label]': 'name()',
    '[attr.data-slot]': '"carousel-scroller-item"',
    '[attr.data-snap]': 'scroller.snap() ? "" : null',
    '[attr.data-paging]': 'scroller.paging()',
    '[style.--andes-carousel-index]': 'index()',
  },
})
export class AndesCarouselScrollerItem {
  protected readonly scroller = inject(ANDES_CAROUSEL_SCROLLER);

  /** The item's own element, for measuring. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Extra description appended to the item's name ("2 of 5: Autumn"). */
  readonly label = input<string | null>(null);

  /** 0-based position among the scroller's items. */
  readonly index = computed(() => this.scroller.indexOf(this));

  protected readonly name = computed(() => {
    const base = this.scroller
      .resolvedLabels()
      .slide(this.index() + 1, this.scroller.itemCount());
    const label = this.label();
    return label ? `${base}: ${label}` : base;
  });
}
