import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  CAPTIONS,
  CHAPTERS,
  frame,
  MEDIA,
  POSTER,
  SOURCES,
  stack,
} from './testing/story-fixtures';
import type { AndesCaptionStyle } from './core/player-types';
import { AndesPlayerMenu } from './menus/player-menu';
import {
  AndesPlayerCaptionsButton,
  AndesPlayerFullscreenButton,
  AndesPlayerMuteButton,
  AndesPlayerPlayButton,
  AndesPlayerSeekButton,
} from './parts/buttons';
import { AndesPlayerTimeDisplay } from './parts/displays';
import { AndesPlayerTimeSlider } from './parts/time-slider';
import { AndesPlayerVolumeSlider } from './parts/volume-slider';
import { AndesVideoPlayer } from './video-player';

const meta: Meta<AndesVideoPlayer> = {
  title: 'Media/Video Player/Basics',
  component: AndesVideoPlayer,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AndesVideoPlayer,
        AndesPlayerPlayButton,
        AndesPlayerMuteButton,
        AndesPlayerVolumeSlider,
        AndesPlayerSeekButton,
        AndesPlayerTimeSlider,
        AndesPlayerTimeDisplay,
        AndesPlayerCaptionsButton,
        AndesPlayerFullscreenButton,
        AndesPlayerMenu,
      ],
    }),
  ],
  argTypes: {
    controls: { control: 'select', options: ['default', 'minimal', 'none'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    skin: { control: 'select', options: ['glass', 'solid'] },
    aspectRatio: {
      control: 'select',
      options: ['16/9', '4/3', '1/1', '9/16', 'auto'],
    },
    objectFit: { control: 'select', options: ['contain', 'cover', 'fill'] },
    hotkeys: { control: 'select', options: ['focus', 'global', 'off'] },
    compact: { control: 'boolean' },
    autohide: { control: 'number' },
  },
  args: {
    controls: 'default',
    size: 'md',
    skin: 'glass',
    aspectRatio: '16/9',
    objectFit: 'contain',
    hotkeys: 'focus',
    compact: false,
    autohide: 3000,
  },
  render: (args) => ({
    props: { ...args, sources: SOURCES },
    template: frame(`
      <andes-video-player
        [sources]="sources"
        title="Test pattern"
        [controls]="controls"
        [size]="size"
        [skin]="skin"
        [aspectRatio]="aspectRatio"
        [objectFit]="objectFit"
        [hotkeys]="hotkeys"
        [compact]="compact"
        [autohide]="autohide"
      />`),
  }),
};

export default meta;

type Story = StoryObj<AndesVideoPlayer>;

/** One element, one source: the default control bar over the picture. */
export const Basic: Story = {};

/** A poster until playback starts and the big centred play button. */
export const PosterAndBigPlay: Story = {
  render: () => ({
    props: { sources: SOURCES, poster: POSTER },
    template: frame(
      `<andes-video-player [sources]="sources" [poster]="poster" title="Test pattern" />`,
    ),
  }),
};

/**
 * `autoplay` tries with sound first; when the browser refuses, it plays muted and offers
 * "Tap to unmute". If even muted autoplay is refused, the big play button waits for a tap.
 */
export const AutoplayMutedFallback: Story = {
  render: () => ({
    props: { sources: SOURCES },
    template: frame(
      `<andes-video-player [sources]="sources" autoplay title="Autoplay" />`,
    ),
  }),
};

/**
 * Two subtitle tracks (English by default, Spanish), switched from the captions menu or C. The
 * second player starts with a custom caption appearance, set in Settings → Caption style: size,
 * text colour, background and its opacity, edges and font, each with a Default that keeps the
 * theme. It is remembered with `persistKey` and two-way through `captionStyle`; this one starts
 * as large yellow text with an outline on a transparent background.
 */
export const Captions: Story = {
  render: () => ({
    props: {
      sources: SOURCES,
      tracks: CAPTIONS,
      style: {
        size: 150,
        color: 'yellow',
        background: 'black',
        backgroundOpacity: 0,
        edge: 'outline',
        font: null,
      } satisfies AndesCaptionStyle,
    },
    template: stack(`
      <andes-video-player [sources]="sources" [tracks]="tracks" title="Captions" />
      <andes-video-player [sources]="sources" [tracks]="tracks" [captionStyle]="style" title="Caption style" />`),
  }),
};

/**
 * Chapters from a `chapters` track: markers on the seek bar, titles in the preview and bar. The
 * second player adds storyboard previews over the seek bar, from a WebVTT sprite map
 * (`thumbnails`).
 */
export const ChaptersAndThumbnails: Story = {
  render: () => ({
    props: {
      sources: SOURCES,
      tracks: [CHAPTERS],
      thumbnails: { src: `${MEDIA}/thumbnails.vtt` },
    },
    template: stack(`
      <andes-video-player [sources]="sources" [tracks]="tracks" title="Chapters" />
      <andes-video-player [sources]="sources" [tracks]="tracks" [thumbnails]="thumbnails" title="Thumbnails" />`),
  }),
};

/** A custom speed list in a dedicated menu; `<` and `>` step through it. */
export const PlaybackRate: Story = {
  render: () => ({
    props: { sources: SOURCES, rates: [0.5, 1, 1.5, 2] },
    template: frame(`
      <andes-video-player [sources]="sources" [playbackRates]="rates" controls="none" title="Speed">
        <div slot="controls" class="demo-row" style="display: flex; align-items: center; gap: 4px; padding: 0 8px 8px;">
          <andes-player-play-button />
          <andes-player-time-slider style="flex: 1;" />
          <andes-player-time />
          <andes-player-menu type="playback-rate" />
        </div>
      </andes-video-player>`),
  }),
};

/** `<audio>` with a compact bar and cover art. */
export const AudioOnly: Story = {
  render: () => ({
    props: { src: `${MEDIA}/sample-audio.m4a`, cover: `${MEDIA}/cover.jpg` },
    template: frame(
      `<andes-video-player audioOnly [src]="src" [poster]="cover" title="Tone study" />`,
      '560px',
    ),
  }),
};

/**
 * Decorative ambient video: muted, looping, no chrome, hidden from assistive tech. The second
 * one keeps a small pause toggle (`controls="minimal"`). Both hold still under reduced motion.
 */
export const Background: Story = {
  render: () => ({
    props: { sources: SOURCES },
    template: `
      <div style="display: grid; gap: 1rem; width: min(720px, calc(100vw - 2rem));">
        <andes-video-player background [sources]="sources" aspectRatio="21/9" />
        <andes-video-player background controls="minimal" [sources]="sources" aspectRatio="21/9" />
      </div>`,
  }),
};

/** Compact density and the one-row minimal bar, for cards and lists. */
export const Compact: Story = {
  render: () => ({
    props: { sources: SOURCES },
    template: `
      <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); width: min(720px, calc(100vw - 2rem));">
        <andes-video-player compact [sources]="sources" title="Compact" />
        <andes-video-player compact controls="minimal" size="sm" [sources]="sources" />
      </div>`,
  }),
};
