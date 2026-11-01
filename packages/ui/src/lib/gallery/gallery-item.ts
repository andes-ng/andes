import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import type { AndesGalleryImage } from './gallery-types';

/**
 * Declares one picture of an `andes-gallery` in markup, as an alternative to its `images`
 * input. It renders nothing itself.
 *
 * ```html
 * <andes-gallery>
 *   <andes-gallery-item src="/a.jpg" thumbnail="/a-small.jpg" alt="Harbour" title="Dusk" />
 * </andes-gallery>
 * ```
 */
@Component({
  selector: 'andes-gallery-item',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { hidden: '', '[attr.data-slot]': '"gallery-item"' },
})
export class AndesGalleryItem {
  readonly src = input.required<string>();
  readonly thumbnail = input<string | undefined>(undefined);
  readonly alt = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly fallback = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);

  /** The item as the gallery reads it. */
  readonly image = computed<AndesGalleryImage>(() => ({
    src: this.src(),
    thumbnail: this.thumbnail(),
    alt: this.alt(),
    title: this.title(),
    fallback: this.fallback(),
    name: this.name(),
  }));
}
