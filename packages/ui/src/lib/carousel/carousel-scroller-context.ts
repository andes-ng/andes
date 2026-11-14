import { InjectionToken, type Signal } from '@angular/core';

import type {
  AndesCarouselLabels,
  AndesCarouselScrollerPaging,
} from './carousel-types';

/** What `andes-carousel-scroller` offers the items inside it. */
export interface AndesCarouselScrollerContext {
  readonly itemCount: Signal<number>;
  /** Items line up with the start edge when the scroller comes to rest. */
  readonly snap: Signal<boolean>;
  readonly paging: Signal<AndesCarouselScrollerPaging>;
  readonly resolvedLabels: Signal<Required<AndesCarouselLabels>>;
  indexOf(item: object): number;
}

export const ANDES_CAROUSEL_SCROLLER =
  new InjectionToken<AndesCarouselScrollerContext>('ANDES_CAROUSEL_SCROLLER');
