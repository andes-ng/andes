import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
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

/**
 * The player's icon vocabulary: each name is a lucide icon. The semantic names (`play`,
 * `seek-backward`, `chevron-start`...) stay the contract of the player's parts, so a part says
 * what the glyph means and this table says which lucide icon draws it.
 */
const ICONS = {
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
} as const;

/** Names of the player's built-in icons. */
export type AndesPlayerIconName = keyof typeof ICONS;

/** The transport glyphs players draw as solid shapes (the stylesheet fills them). */
const SOLID: ReadonlySet<AndesPlayerIconName> = new Set([
  'play',
  'pause',
  'previous',
  'next',
]);

/**
 * One of the player's line icons, drawn with lucide through `<ng-icon>`. Decorative: always
 * `aria-hidden`, the surrounding control carries the accessible name. `chevron-start` and
 * `chevron-end` mirror in right-to-left layouts.
 */
@Component({
  selector: 'andes-player-icon',
  viewProviders: [
    provideIcons({
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
    }),
  ],
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-player-icon',
    'aria-hidden': 'true',
    '[attr.data-icon]': 'name()',
    '[attr.data-solid]': 'solid() ? "" : null',
  },
  template: `
    <ng-icon [name]="glyph()" />
    @if (label(); as text) {
      <span class="andes-player-icon__label">{{ text }}</span>
    }
  `,
})
export class AndesPlayerIcon {
  readonly name = input.required<AndesPlayerIconName>();
  /** Short text drawn in the middle (the seconds of a seek icon). */
  readonly label = input<string | number | null>(null);

  protected readonly glyph = computed(() => ICONS[this.name()]);
  protected readonly solid = computed(() => SOLID.has(this.name()));
}
