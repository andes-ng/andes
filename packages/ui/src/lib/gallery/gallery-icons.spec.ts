import { provideAndesOverlay } from '@andes-ng/primitives';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  lucideDownload,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideMaximize,
  lucideMinimize,
  lucidePause,
  lucidePlay,
  lucideRotateCcw,
  lucideRotateCw,
  lucideUndo2,
  lucideZoomIn,
  lucideZoomOut,
} from '@ng-icons/lucide';

import { lucideName } from '../../testing/lucide';
import { AndesGallery } from './gallery';

/*
  The gallery draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic, inline and inside the lightbox overlay alike.
*/

/** The icons the gallery binds with `[name]` (an input, not an attribute). */
const BOUND = {
  lucideDownload,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideMaximize,
  lucideMinimize,
  lucidePause,
  lucidePlay,
  lucideRotateCcw,
  lucideRotateCw,
  lucideUndo2,
  lucideZoomIn,
  lucideZoomOut,
};

@Component({
  imports: [AndesGallery],
  template: `
    <andes-gallery
      [images]="['/one.jpg', '/two.jpg']"
      [autoplay]="true"
      [(fullscreen)]="fullscreen"
    />
  `,
})
class Host {
  readonly fullscreen = signal(false);
}

function iconsIn(root: ParentNode): { drawn: string[]; blank: string[] } {
  const drawn: string[] = [];
  const blank: string[] = [];
  for (const icon of Array.from(root.querySelectorAll('ng-icon'))) {
    const name = icon.getAttribute('name') ?? lucideName(icon, BOUND) ?? '?';
    (icon.querySelector('svg') ? drawn : blank).push(name);
  }
  return { drawn, blank };
}

describe('AndesGallery icons', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideAndesOverlay()] }),
  );

  it('draws the toolbar, the step chevrons and the player with lucide, registered by itself', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const { drawn, blank } = iconsIn(document);

    expect(blank).toEqual([]);
    expect(drawn).toEqual(
      expect.arrayContaining([
        'lucidePause',
        'lucideZoomOut',
        'lucideZoomIn',
        'lucideRotateCcw',
        'lucideRotateCw',
        'lucideFlipHorizontal2',
        'lucideFlipVertical2',
        'lucideUndo2',
        'lucideDownload',
        'lucideMaximize',
        'lucideChevronLeft',
        'lucideChevronRight',
      ]),
    );
    expect(document.querySelector('svg:not(ng-icon svg)')).toBeNull();

    // The slideshow plays on its own; pausing it swaps the player glyph.
    document
      .querySelector<HTMLButtonElement>('[data-action="play"] > button')
      ?.click();
    fixture.detectChanges();
    expect(iconsIn(document).drawn).toContain('lucidePlay');
  });

  it('draws the lightbox close and exit-fullscreen icons inside the overlay', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.fullscreen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const lightbox = document.querySelector('.andes-gallery-lightbox');
    expect(lightbox).not.toBeNull();
    const { drawn, blank } = iconsIn(lightbox as Element);

    expect(blank).toEqual([]);
    expect(drawn).toEqual(
      expect.arrayContaining(['lucideMinimize', 'lucideX']),
    );
    expect(drawn).not.toContain('lucideMaximize');
  });
});
