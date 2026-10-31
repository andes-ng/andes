import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import type {
  AndesMediaAdapter,
  AndesMediaAdapterHooks,
} from './core/media-adapter';
import type { AndesMediaSource, AndesPlaylistItem } from './core/player-types';
import {
  CAPTIONS,
  CHAPTERS,
  frame,
  liveAdapter,
  liveDvrAdapter,
  MEDIA,
  MP4,
  POSTER,
  renditionsAdapter,
  SOURCES,
  stack,
  WEBM,
} from './testing/story-fixtures';
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
  title: 'Media/Video Player/Advanced',
  component: AndesVideoPlayer,
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
};

export default meta;

type Story = StoryObj<AndesVideoPlayer>;

/** No default bar: the same public parts arranged by the app (`slot="controls"`). */
export const CustomComposedControls: Story = {
  render: () => ({
    props: { sources: SOURCES, tracks: CAPTIONS },
    template: frame(`
      <andes-video-player [sources]="sources" [tracks]="tracks" controls="none" skin="solid" title="Custom layout">
        <div slot="controls" style="display: flex; flex-direction: column; gap: 2px; padding: 8px; background: color-mix(in srgb, var(--andes-color-card) 92%, transparent); color: var(--andes-color-card-foreground); --andes-video-control-color: var(--andes-color-card-foreground); --andes-video-track: color-mix(in srgb, var(--andes-color-card-foreground) 18%, transparent);">
          <andes-player-time-slider />
          <div style="display: flex; align-items: center; gap: 4px;">
            <andes-player-seek-button seconds="-5" />
            <andes-player-play-button />
            <andes-player-seek-button seconds="5" />
            <andes-player-time type="remaining" />
            <span style="flex: 1"></span>
            <andes-player-mute-button />
            <andes-player-volume-slider />
            <andes-player-captions-button />
            <andes-player-menu type="captions" />
            <andes-player-fullscreen-button />
          </div>
        </div>
      </andes-video-player>`),
  }),
};

/** Renditions and audio tracks reported by a demo adapter, in the settings menu. */
export const QualityAndAudioTracks: Story = {
  render: () => ({
    props: { adapters: [renditionsAdapter], src: MP4 },
    template: frame(
      `<andes-video-player [src]="src" [adapters]="adapters" title="Quality and audio" />`,
    ),
  }),
};

/** A live stream with a DVR window (demo adapter): LIVE badge, time behind live, seek window. */
export const LiveDvr: Story = {
  render: () => ({
    props: { adapters: [liveDvrAdapter], src: MP4, pure: [liveAdapter] },
    template: `
      <div style="display: grid; gap: 1rem; width: min(720px, calc(100vw - 2rem));">
        <andes-video-player [src]="src" [adapters]="adapters" title="Live with DVR" autoplay />
        <andes-video-player [src]="src" [adapters]="pure" title="Live" controls="minimal" autoplay />
      </div>`,
  }),
};

const PLAYLIST: AndesPlaylistItem[] = [
  {
    title: 'Test pattern',
    sources: SOURCES,
    poster: POSTER,
    tracks: [...CAPTIONS, CHAPTERS],
    thumbnails: { src: `${MEDIA}/thumbnails.vtt` },
    duration: 12,
  },
  {
    title: 'Colour bars',
    src: `${MEDIA}/clip-bars.mp4`,
    poster: `${MEDIA}/clip-bars.jpg`,
    duration: 8,
  },
  {
    title: 'Moving pattern',
    src: `${MEDIA}/clip-pattern.mp4`,
    poster: `${MEDIA}/clip-pattern.jpg`,
    duration: 8,
  },
];

@Component({
  selector: 'andes-video-player-playlist-demo',
  imports: [AndesVideoPlayer],
  template: `
    <div
      style="display: grid; gap: 0.75rem; width: min(720px, calc(100vw - 2rem));"
    >
      <andes-video-player
        [playlist]="playlist"
        [(playlistIndex)]="index"
        [(repeat)]="repeat"
        [(shuffle)]="shuffle"
        [upNextDelay]="8"
        (playlistCompleted)="log('playlist completed')"
      />
      <p style="margin: 0; font-size: 0.875rem; line-height: 1.375rem;">
        Playing {{ index() + 1 }} of {{ playlist.length }} · repeat
        {{ repeat() }} · shuffle {{ shuffle() ? 'on' : 'off' }}. Seek near the
        end of an entry to see the up-next card; Shift+N / Shift+P skip.
      </p>
      <p
        style="margin: 0; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);"
      >
        {{ events().join(' · ') }}
      </p>
    </div>
  `,
})
class PlaylistDemo {
  readonly playlist = PLAYLIST;
  readonly index = signal(0);
  readonly repeat = signal<'off' | 'all' | 'one'>('off');
  readonly shuffle = signal(false);
  readonly events = signal<string[]>([]);

  log(entry: string): void {
    this.events.update((list) => [entry, ...list].slice(0, 5));
  }
}

/**
 * A playlist: previous / next in the bar, a playlist menu, Repeat (off / all / one) and Shuffle
 * in settings, and an up-next card with a countdown when an entry ends. Each entry brings its
 * own title, poster, tracks and thumbnails. `playlistIndex`, `repeat` and `shuffle` are two-way.
 */
export const Playlist: Story = {
  render: () => ({
    moduleMetadata: { imports: [PlaylistDemo] },
    template: `<andes-video-player-playlist-demo />`,
  }),
};

/**
 * With a `persistKey` the player remembers where the viewer stopped each source and offers to
 * continue ("Resume from 0:06" / "Start over"). This story saves a position first so the card
 * shows straight away; `resume="auto"` would continue silently.
 */
export const ResumePlayback: Story = {
  render: () => {
    try {
      localStorage.setItem(
        'andes-player:story-resume',
        JSON.stringify({ positions: { [WEBM]: 6.5, [MP4]: 6.5 } }),
      );
    } catch {
      // Storage blocked: the story then simply starts at the beginning.
    }
    return {
      props: { sources: SOURCES },
      template: frame(
        `<andes-video-player [sources]="sources" persistKey="story-resume" title="Resume" />`,
      ),
    };
  },
};

/**
 * `miniPlayer`: start playback, then scroll down. While the player is out of view the picture
 * floats in the corner with "Back to the player" and "Close mini player"; the player keeps its
 * place in the page and docks again when it scrolls back.
 */
export const MiniPlayer: Story = {
  render: () => ({
    props: { sources: SOURCES, tracks: CAPTIONS },
    template: `
      <div style="width: min(720px, calc(100vw - 2rem));">
        <andes-video-player miniPlayer [sources]="sources" [tracks]="tracks" title="Mini player" />
        <div style="height: 160vh; padding-top: 1rem; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);">
          Play the video, then scroll down: it keeps playing in the corner.
        </div>
      </div>`,
  }),
};

/** A demo adapter whose first two loads fail with a network error. */
class FlakyNetworkAdapter implements AndesMediaAdapter {
  readonly name = 'demo-flaky';
  private attempts = 0;

  canPlay(): boolean {
    return true;
  }

  attach(
    media: HTMLMediaElement,
    source: AndesMediaSource,
    hooks: AndesMediaAdapterHooks,
  ): void {
    this.attempts++;
    if (this.attempts <= 2) {
      setTimeout(
        () =>
          hooks.reportError({
            code: 'network',
            fatal: true,
            detail: 'demo outage',
          }),
        300,
      );
      return;
    }
    media.src = source.src;
  }

  detach(): void {
    // Nothing to release.
  }
}

/**
 * Two ways playback can fail. The first player has a missing file: the error panel explains it
 * and offers a retry, and the button fixes the source. In the second, the first two loads fail
 * with a network error (demo adapter): the player retries on its own (after 1 s, then 2 s) with
 * "Reconnecting…" under the spinner, then plays; only when every attempt fails
 * (`retryAttempts`) does the error panel show.
 */
export const Errors: Story = {
  render: () => ({
    props: {
      src: signal(`${MEDIA}/missing.mp4`),
      working: MP4,
      flakySrc: MP4,
      adapters: [() => new FlakyNetworkAdapter()],
    },
    template: stack(
      `
      <andes-video-player [src]="src()" title="Broken source" />
      <div><button type="button" (click)="src.set(working)">Use a working source</button></div>
      <andes-video-player [src]="flakySrc" [adapters]="adapters" autoplay title="Flaky network" />`,
      '0.75rem',
    ),
  }),
};

@Component({
  selector: 'andes-video-player-sandbox',
  imports: [AndesVideoPlayer],
  template: `
    <div
      style="display: grid; gap: 0.75rem; width: min(720px, calc(100vw - 2rem));"
    >
      <andes-video-player
        [sources]="sources"
        [tracks]="tracks"
        title="Keyboard and gestures"
        (played)="log('played')"
        (pausedChange)="log('paused: ' + $event)"
        (completed)="log('completed')"
        (fullscreenChanged)="log('fullscreen: ' + $event)"
        (captionsChanged)="log('captions: ' + ($event?.label ?? 'off'))"
        (volumeChange)="log('volume: ' + $event)"
      />
      <p
        style="margin: 0; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);"
      >
        Focus the player, then: Space/K play, M mute, F full screen, ←/→ 5s, J/L
        10s, ↑/↓ volume, 0–9 jump, &lt;/&gt; speed, C captions, I picture in
        picture. While paused, , and . step one frame; PageUp / PageDown jump
        between chapters. Press ? for the keyboard help (it lists the live key
        map) and right-click the picture (or Shift+F10) for the player's menu:
        loop, copy the address (also at the current time), picture-in-picture.
        Touch: tap shows or hides the controls; double-tap the left or right
        third to seek 10s; double-click toggles full screen. A single click
        plays or pauses; a double click toggles full screen without also
        toggling playback.
      </p>
      <ol
        data-testid="event-log"
        style="margin: 0; padding-inline-start: 1.25rem; font-size: 0.75rem; line-height: 1.25rem; max-height: 8rem; overflow: auto;"
      >
        @for (entry of events(); track $index) {
          <li>{{ entry }}</li>
        }
      </ol>
    </div>
  `,
})
class SandboxComponent {
  readonly sources = SOURCES;
  readonly tracks = [...CAPTIONS, CHAPTERS];
  readonly events = signal<string[]>([]);

  log(entry: string): void {
    this.events.update((list) => [entry, ...list].slice(0, 30));
  }
}

/**
 * Every hotkey and gesture, with the outputs they trigger logged below. Press ? for the keyboard
 * help, right-click for the player menu; PageUp / PageDown jump between chapters.
 */
export const KeyboardAndGestures: Story = {
  render: () => ({
    moduleMetadata: { imports: [SandboxComponent] },
    template: `<andes-video-player-sandbox />`,
  }),
};
