import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  lucideALargeSmall,
  lucideCast,
  lucideCaptions,
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleAlert,
  lucideExternalLink,
  lucideFilm,
  lucideFlag,
  lucideGauge,
  lucideHeadphones,
  lucideKeyboard,
  lucideLayers,
  lucideLink,
  lucideListVideo,
  lucideMaximize,
  lucideMinimize,
  lucideMusic,
  lucidePause,
  lucidePictureInPicture,
  lucidePictureInPicture2,
  lucidePlay,
  lucideRepeat,
  lucideRotateCcw,
  lucideRotateCw,
  lucideShuffle,
  lucideSkipBack,
  lucideSkipForward,
  lucideSlidersHorizontal,
  lucideVolume1,
  lucideVolume2,
  lucideVolumeX,
  lucideX,
} from '@ng-icons/lucide';

import { lucideName } from '../../../testing/lucide';
import { AndesPlayerIcon, type AndesPlayerIconName } from './player-icon';

/*
  The player's vocabulary of glyphs is drawn with lucide through `<ng-icon>` and registered by
  `andes-player-icon` itself: this test bed does not call `provideIcons`, so an icon whose svg
  is rendered proves the registration is automatic wherever a part uses it (the menu panels
  included, which live in an overlay).
*/

const LUCIDE = {
  lucideALargeSmall,
  lucideCast,
  lucideCaptions,
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleAlert,
  lucideExternalLink,
  lucideFilm,
  lucideFlag,
  lucideGauge,
  lucideHeadphones,
  lucideKeyboard,
  lucideLayers,
  lucideLink,
  lucideListVideo,
  lucideMaximize,
  lucideMinimize,
  lucideMusic,
  lucidePause,
  lucidePictureInPicture,
  lucidePictureInPicture2,
  lucidePlay,
  lucideRepeat,
  lucideRotateCcw,
  lucideRotateCw,
  lucideShuffle,
  lucideSkipBack,
  lucideSkipForward,
  lucideSlidersHorizontal,
  lucideVolume1,
  lucideVolume2,
  lucideVolumeX,
  lucideX,
};

const EXPECTED: Record<AndesPlayerIconName, keyof typeof LUCIDE> = {
  play: 'lucidePlay',
  pause: 'lucidePause',
  replay: 'lucideRotateCcw',
  'volume-high': 'lucideVolume2',
  'volume-low': 'lucideVolume1',
  'volume-muted': 'lucideVolumeX',
  fullscreen: 'lucideMaximize',
  'fullscreen-exit': 'lucideMinimize',
  pip: 'lucidePictureInPicture2',
  'pip-exit': 'lucidePictureInPicture',
  captions: 'lucideCaptions',
  settings: 'lucideSlidersHorizontal',
  speed: 'lucideGauge',
  audio: 'lucideHeadphones',
  quality: 'lucideLayers',
  'seek-backward': 'lucideRotateCcw',
  'seek-forward': 'lucideRotateCw',
  remote: 'lucideCast',
  check: 'lucideCheck',
  'chevron-start': 'lucideChevronLeft',
  'chevron-end': 'lucideChevronRight',
  alert: 'lucideCircleAlert',
  previous: 'lucideSkipBack',
  next: 'lucideSkipForward',
  playlist: 'lucideListVideo',
  repeat: 'lucideRepeat',
  shuffle: 'lucideShuffle',
  'text-size': 'lucideALargeSmall',
  keyboard: 'lucideKeyboard',
  close: 'lucideX',
  link: 'lucideLink',
  frame: 'lucideFilm',
  chapter: 'lucideFlag',
  restore: 'lucideExternalLink',
  music: 'lucideMusic',
};

const NAMES = Object.keys(EXPECTED) as AndesPlayerIconName[];

@Component({
  imports: [AndesPlayerIcon],
  template: `
    @for (name of names; track name) {
      <andes-player-icon [name]="name" />
    }
    <andes-player-icon id="seek" name="seek-backward" [label]="10" />
  `,
})
class Host {
  readonly names = NAMES;
}

describe('AndesPlayerIcon', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it.each(NAMES)('draws %s with its lucide icon', (name) => {
    const icon = render().querySelector(
      `andes-player-icon[data-icon="${name}"] ng-icon`,
    );

    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(lucideName(icon, LUCIDE)).toBe(EXPECTED[name]);
  });

  it('is decorative: aria-hidden on every glyph', () => {
    for (const icon of Array.from(
      render().querySelectorAll('andes-player-icon'),
    )) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('marks the transport glyphs as solid shapes', () => {
    const el = render();
    const solid = Array.from(el.querySelectorAll('[data-solid]')).map((icon) =>
      icon.getAttribute('data-icon'),
    );

    expect(solid.sort()).toEqual(['next', 'pause', 'play', 'previous']);
  });

  it('draws the seconds of a seek icon over the arrow, as text', () => {
    const seek = render().querySelector('#seek');

    expect(
      seek?.querySelector('.andes-player-icon__label')?.textContent?.trim(),
    ).toBe('10');
    expect(seek?.querySelector('svg text')).toBeNull();
  });
});
