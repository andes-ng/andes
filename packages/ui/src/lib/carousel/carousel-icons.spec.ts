import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesCarousel } from './carousel';
import { AndesCarouselSlide } from './carousel-slide';

/*
  The previous and next arrows and the play/pause control are lucide icons drawn through
  `<ng-icon>` and registered by the carousel itself: this test bed does not call
  `provideIcons`, so an icon whose svg is rendered proves the registration is automatic.
*/

@Component({
  imports: [AndesCarousel, AndesCarouselSlide],
  template: `<andes-carousel
    aria-label="Gallery"
    arrows="always"
    [autoplay]="autoplay()"
    [autoplayControl]="true"
  >
    <andes-carousel-slide>One</andes-carousel-slide>
    <andes-carousel-slide>Two</andes-carousel-slide>
  </andes-carousel>`,
})
class Host {
  readonly autoplay = signal(false);
}

function slot(root: HTMLElement, name: string): Element | null {
  return root.querySelector(`[data-slot="${name}"] ng-icon`);
}

describe('AndesCarousel lucide icons', () => {
  it('draws the chevrons of the previous and next arrows, hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const previous = slot(el, 'carousel-previous');
    const next = slot(el, 'carousel-next');

    expect(previous?.getAttribute('name')).toBe('lucideChevronLeft');
    expect(next?.getAttribute('name')).toBe('lucideChevronRight');
    for (const icon of [previous, next]) {
      expect(icon?.classList).toContain('andes-carousel__chevron');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.querySelector('svg')).not.toBeNull();
    }
  });

  it('draws pause while it rotates by itself and play once it is paused', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.autoplay.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(slot(el, 'carousel-pause')?.getAttribute('name')).toBe(
      'lucidePause',
    );
    expect(slot(el, 'carousel-pause')?.querySelector('svg')).not.toBeNull();

    (el.querySelector('[data-slot="carousel-pause"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(slot(el, 'carousel-pause')?.getAttribute('name')).toBe('lucidePlay');
    expect(slot(el, 'carousel-pause')?.querySelector('svg')).not.toBeNull();
  });
});
