import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  formItem,
  shared,
  text,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';

/*
 * The skeleton as a wrapper: it shows the placeholder while `loading` is true and the projected
 * content once it is false, with `delay`, `minDuration` and `keepContent` to keep the swap calm.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Loading wrapper',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The skeleton wraps the real content. */
export const ContainsSubComponent: Story = {
  name: 'Contains sub component',
  parameters: about(
    'The skeleton wraps the real content, showing the placeholder while loading is true and the content once it is false: flip the Loading switch, or press the button to load for three seconds.',
  ),
  render: () => {
    // Signals, so the template follows the timeout (the page does not rely on zone.js).
    const loading = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      props: {
        heading:
          'margin: 0 0 1rem; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600;',
        body: `margin: 0; ${text}`,
        formItem,
        loading,
        show() {
          loading.set(true);
          clearTimeout(timer);
          timer = setTimeout(() => loading.set(false), 3000);
        },
      },
      template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; max-width: 36rem;">
        <span [style]="formItem">
          <andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch>
        </span>
        <andes-skeleton [loading]="loading()" style="width: 100%;">
          <h4 [style]="heading">Andes NG, a design system</h4>
          <p [style]="body">
            A series of design principles, practical patterns and high quality design resources
            helps people create their product prototypes beautifully and efficiently.
          </p>
        </andes-skeleton>
        <andes-button variant="secondary" [disabled]="loading()" (click)="show()">
          Show Skeleton
        </andes-button>
      </div>
    `,
    };
  },
};

/** `keepContent` reserves the content's room and fades it in. */
export const KeepContent: Story = {
  name: 'Keep content and crossfade',
  parameters: about(
    'With keepContent the real content stays in the page, invisible, so the placeholder takes its room and nothing jumps, and flipping the Loaded switch fades the content in over the placeholder; without it the box grows when the content arrives.',
  ),
  render: () => ({
    props: { ...shared, loaded: signal(false) },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 52rem;">
        <andes-switch [checked]="loaded()" (checkedChange)="loaded.set($event)">Loaded</andes-switch>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1.5rem; align-items: start;">
          <div>
            <p [style]="muted" style="margin: 0 0 0.75rem;">Without keepContent</p>
            <div [style]="card">
              <andes-skeleton [loading]="!loaded()" active avatar [paragraph]="{ rows: 2 }">
                <div style="display: flex; gap: 1rem;" [style]="text">
                  <andes-avatar size="lg"><andes-avatar-fallback>LM</andes-avatar-fallback></andes-avatar>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <span [style]="strong">Lucía Mendoza</span>
                    <span [style]="text">
                      Designs calm interfaces for busy teams. Currently building the design system
                      behind the company's mobile apps, and the documentation that goes with it.
                    </span>
                  </div>
                </div>
              </andes-skeleton>
            </div>
          </div>
          <div>
            <p [style]="muted" style="margin: 0 0 0.75rem;">With keepContent</p>
            <div [style]="card">
              <andes-skeleton [loading]="!loaded()" keepContent active avatar [paragraph]="{ rows: 2 }" loadedLabel="Profile loaded">
                <div style="display: flex; gap: 1rem;" [style]="text">
                  <andes-avatar size="lg"><andes-avatar-fallback>LM</andes-avatar-fallback></andes-avatar>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <span [style]="strong">Lucía Mendoza</span>
                    <span [style]="text">
                      Designs calm interfaces for busy teams. Currently building the design system
                      behind the company's mobile apps, and the documentation that goes with it.
                    </span>
                  </div>
                </div>
              </andes-skeleton>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

/** The same refresh with no delay, with `delay`, and with `minDuration`. */
export const DelayAndMinimumDuration: Story = {
  name: 'Delay and minimum duration',
  parameters: about(
    'The same refresh three ways: with no delay a fast refresh flashes the placeholder, with delay of 300ms it never shows, and with minDuration of 800ms it shows and then stays long enough not to blink, while a slow refresh shows it in all three.',
  ),
  render: () => {
    const loading = signal(false);
    const latency = signal<number>(120);
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      props: {
        ...shared,
        loading,
        latency,
        reload() {
          loading.set(true);
          clearTimeout(timer);
          timer = setTimeout(() => loading.set(false), latency());
        },
      },
      template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 56rem;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;" [style]="text">
          <andes-button variant="secondary" [disabled]="loading()" (click)="reload()">Reload</andes-button>
          <span>Latency</span>
          <andes-radio-group aria-label="Latency" optionType="button" [value]="latency()" (valueChange)="latency.set($event ?? 120)">
            <andes-radio [value]="120">Fast (120ms)</andes-radio>
            <andes-radio [value]="1500">Slow (1.5s)</andes-radio>
          </andes-radio-group>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1.5rem;">
          <div>
            <p [style]="muted" style="margin: 0 0 0.75rem;">No delay</p>
            <andes-skeleton [loading]="loading()" active avatar [paragraph]="{ rows: 2 }">
              <div [style]="text"><strong>Loaded profile</strong><br />Everything is here.</div>
            </andes-skeleton>
          </div>
          <div>
            <p [style]="muted" style="margin: 0 0 0.75rem;">delay 300ms</p>
            <andes-skeleton [loading]="loading()" [delay]="300" active avatar [paragraph]="{ rows: 2 }">
              <div [style]="text"><strong>Loaded profile</strong><br />Everything is here.</div>
            </andes-skeleton>
          </div>
          <div>
            <p [style]="muted" style="margin: 0 0 0.75rem;">minDuration 800ms</p>
            <andes-skeleton [loading]="loading()" [minDuration]="800" active avatar [paragraph]="{ rows: 2 }">
              <div [style]="text"><strong>Loaded profile</strong><br />Everything is here.</div>
            </andes-skeleton>
          </div>
        </div>
      </div>
    `,
    };
  },
};

const listItems = [1, 2, 3].map((n) => ({
  initials: `P${n}`,
  title: `Project update ${n}`,
  description: 'Weekly notes from the design system team.',
  content:
    'A series of design principles, practical patterns and high quality design resources helps people create their product prototypes beautifully and efficiently.',
}));

/** A skeleton per list item. */
export const List: Story = {
  name: 'List',
  parameters: about(
    'A skeleton per list item while the list loads: flip the switch to show the loaded items, with their actions and picture, built from plain layout since there is no list component yet.',
  ),
  render: () => ({
    props: {
      loaded: signal(false),
      items: listItems,
      text,
      formItem,
      link: 'color: var(--andes-color-primary-text); font-weight: 500; text-decoration: none;',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <span [style]="formItem">
          <andes-switch [checked]="loaded()" (checkedChange)="loaded.set($event)">Loaded</andes-switch>
        </span>
        <div style="border-top: 1px solid var(--andes-color-border);">
          @for (item of items; track item.title) {
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--andes-color-border);">
              <div style="display: flex; flex-direction: column; flex: 1 1 16rem; gap: 1rem; min-width: 0;">
                <andes-skeleton [loading]="!loaded()" active avatar>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: flex-start;" [style]="text">
                      <andes-avatar size="lg"><andes-avatar-fallback>{{ item.initials }}</andes-avatar-fallback></andes-avatar>
                      <div style="display: flex; flex-direction: column;">
                        <a href="#" [style]="link" (click)="$event.preventDefault()">{{ item.title }}</a>
                        <span style="color: var(--andes-color-muted-foreground);">{{ item.description }}</span>
                      </div>
                    </div>
                    <span [style]="text">{{ item.content }}</span>
                  </div>
                </andes-skeleton>
                @if (loaded()) {
                  <div [style]="text" style="display: flex; align-items: center; gap: 0.5rem; color: var(--andes-color-muted-foreground);">
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideStar" size="16" />156</span>
                    <span aria-hidden="true">|</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideThumbsUp" size="16" />156</span>
                    <span aria-hidden="true">|</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideMessageSquare" size="16" />2</span>
                  </div>
                }
              </div>
              @if (loaded()) {
                <div role="img" aria-label="Preview" style="flex: none; width: 272px; height: 153px; border-radius: var(--andes-radius-md); background: linear-gradient(135deg, var(--andes-color-primary), var(--andes-color-muted));"></div>
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};
