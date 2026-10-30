import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesSwitch } from './switch';
import type { AndesSwitchBlockedEvent } from './switch';

const meta: Meta<AndesSwitch> = {
  title: 'Data Entry/Switch/Basics/Features',
  component: AndesSwitch,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesSwitch>;

const note = `font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);`;

/**
 * The label is the projected text (default slot or `[slot=label]`) and `[slot=description]` is
 * secondary text under it, aligned with the label's start edge, not the track's. Both are part of
 * the click target. The accessible name is the label alone; the description is linked with
 * `aria-describedby`. `labelPosition="start"` puts the text before the track, in every size,
 * and the whole layout mirrors under `dir="rtl"`.
 */
export const DescriptionAndLabelPosition: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.5rem 2rem; max-width: 52rem;">
        <andes-switch [checked]="true">
          Weekly digest
          <span slot="description">One summary email every Monday morning.</span>
        </andes-switch>
        <andes-switch labelPosition="start">
          Label at the start
          <span slot="description">The description follows the label to the start side.</span>
        </andes-switch>
        <andes-switch size="sm">
          <span slot="label">Small, with [slot=label]</span>
          <span slot="description">Smaller track, same alignment.</span>
        </andes-switch>
        <andes-switch size="lg">
          Large
          <span slot="description">A long description wraps inside its own column and never slides back under the track.</span>
        </andes-switch>
        <andes-switch>Label only, no description</andes-switch>
        <andes-switch disabled [checked]="true">
          Disabled
          <span slot="description">Text and track dim together.</span>
        </andes-switch>
        <div dir="rtl">
          <andes-switch [checked]="true">
            الإشعارات
            <span slot="description">وصف قصير تحت التسمية</span>
          </andes-switch>
        </div>
        <div dir="rtl">
          <andes-switch labelPosition="start">
            الإشعارات
            <span slot="description">وصف قصير تحت التسمية</span>
          </andes-switch>
        </div>
      </div>
    `,
  }),
};

/**
 * Track content: `checkedChildren` / `unCheckedChildren` take a string or a `TemplateRef` (an
 * icon or markup), and a projected `[slot=checked|unchecked]` element still wins over both.
 * `checkedIcon` / `uncheckedIcon` draw inside the THUMB instead - sized from the thumb, centered,
 * and replaced by the spinner while the switch is `loading`.
 */
export const TrackContentAndIcons: Story = {
  render: () => ({
    template: `
      <ng-template #tick>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </ng-template>
      <ng-template #cross>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4 12 12M12 4 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
      </ng-template>
      <ng-template #sun><span aria-hidden="true">&#9728;</span></ng-template>
      <ng-template #moon><span aria-hidden="true">&#9790;</span></ng-template>
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch [checked]="true" checkedChildren="On" unCheckedChildren="Off" aria-label="Text, checked" />
          <andes-switch checkedChildren="On" unCheckedChildren="Off" aria-label="Text, unchecked" />
          <andes-switch [checked]="true" [checkedChildren]="tick" [unCheckedChildren]="cross" aria-label="Template, checked" />
          <andes-switch [checkedChildren]="tick" [unCheckedChildren]="cross" aria-label="Template, unchecked" />
          <andes-switch [checked]="true" checkedChildren="ignored" unCheckedChildren="Off" aria-label="Slot wins over text">
            <span slot="checked">&#10003;</span>
          </andes-switch>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch size="sm" [checked]="true" [checkedIcon]="tick" [uncheckedIcon]="cross" aria-label="Small, icon" />
          <andes-switch [checked]="true" [checkedIcon]="tick" [uncheckedIcon]="cross" aria-label="Medium, checked icon" />
          <andes-switch [checkedIcon]="tick" [uncheckedIcon]="cross" aria-label="Medium, unchecked icon" />
          <andes-switch size="lg" [checked]="true" [checkedIcon]="sun" [uncheckedIcon]="moon" aria-label="Large, checked icon" />
          <andes-switch size="lg" [checkedIcon]="sun" [uncheckedIcon]="moon" aria-label="Large, unchecked icon" />
          <andes-switch [checkedIcon]="tick" [uncheckedIcon]="cross" loading aria-label="Icon hidden while loading" />
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch size="lg" [checked]="true" [checkedChildren]="tick" [unCheckedChildren]="cross" [checkedIcon]="sun" [uncheckedIcon]="moon" aria-label="Track and thumb content" />
          <andes-switch size="lg" [checkedChildren]="tick" [unCheckedChildren]="cross" [checkedIcon]="sun" [uncheckedIcon]="moon" aria-label="Track and thumb content, unchecked" />
        </div>
      </div>
    `,
  }),
};

/**
 * `beforeChange` guards USER toggles. It gets the state the switch is about to take and answers
 * with a boolean, a `Promise` or an `Observable`. Below, a confirmation the user answers (the
 * switch shows `loading`, is `aria-busy` and ignores clicks while it waits), a request that
 * fails (an error counts as blocked) and a synchronous rule that refuses outright. Every
 * refusal fires `(changeBlocked)`; a `[(checked)]` binding or a form write is never guarded.
 */
export const BeforeChangeConfirm: Story = {
  render: () => {
    // Signals, not plain props: the story is zoneless, so a plain field written from a promise
    // callback would never be rendered.
    const asking = signal<boolean | null>(null);
    const log = signal<string[]>([]);
    let answer: ((allowed: boolean) => void) | null = null;
    const record = (line: string) => log.update((lines) => [line, ...lines]);

    return {
      moduleMetadata: { imports: [AndesButton] },
      props: {
        autopilot: false,
        asking,
        log,
        confirmGuard: (next: boolean) =>
          new Promise<boolean>((resolve) => {
            answer = resolve;
            asking.set(next);
          }),
        reply: (allowed: boolean) => {
          answer?.(allowed);
          answer = null;
          asking.set(null);
        },
        failingGuard: () =>
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error('offline')), 900),
          ),
        lockedGuard: () => false,
        onBlocked: (event: AndesSwitchBlockedEvent) =>
          record(
            `blocked: wanted ${event.attempted ? 'on' : 'off'} (${event.reason})`,
          ),
        onChanged: (event: { checked: boolean }) =>
          record(`changed: ${event.checked ? 'on' : 'off'}`),
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; ${note}">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-switch [(checked)]="autopilot" [beforeChange]="confirmGuard" (changed)="onChanged($event)" (changeBlocked)="onBlocked($event)">
              Autopilot
              <span slot="description">Asks before every change.</span>
            </andes-switch>
            @if (asking() !== null) {
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>Turn autopilot {{ asking() ? 'on' : 'off' }}?</span>
                <andes-button size="sm" (click)="reply(true)">Confirm</andes-button>
                <andes-button size="sm" variant="outline" (click)="reply(false)">Cancel</andes-button>
              </div>
            }
          </div>
          <andes-switch [beforeChange]="failingGuard" (changeBlocked)="onBlocked($event)">
            Request that fails
            <span slot="description">Loading for a moment, then it snaps back.</span>
          </andes-switch>
          <andes-switch [beforeChange]="lockedGuard" (changeBlocked)="onBlocked($event)">
            Locked by an admin
            <span slot="description">A synchronous guard refuses without any wait.</span>
          </andes-switch>
          <div style="display: flex; flex-direction: column;">
            @for (line of log(); track $index) {
              <code>{{ line }}</code>
            }
          </div>
        </div>
      `,
    };
  },
};

/**
 * Native form field: with a `name`, a switch that is on submits `name=value` through a hidden
 * input (`value` defaults to `on`), like a checked native checkbox; one that is off submits
 * nothing, and a disabled one is left out. Submit to see the FormData.
 */
export const FormNameAndValue: Story = {
  render: () => {
    const submitted = signal<string[] | null>(null);

    return {
      moduleMetadata: { imports: [AndesButton] },
      props: {
        submitted,
        send: (event: SubmitEvent) => {
          event.preventDefault();
          const data = new FormData(event.target as HTMLFormElement);
          submitted.set(
            Array.from(data.entries()).map(([key, entry]) => `${key}=${entry}`),
          );
        },
      },
      template: `
        <form (submit)="send($event)" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; ${note}">
          <andes-switch name="newsletter" value="weekly" [checked]="true">Newsletter (value "weekly")</andes-switch>
          <andes-switch name="beta">Beta features (default value "on")</andes-switch>
          <andes-switch name="alerts" [checked]="true">Alerts (on, default value)</andes-switch>
          <andes-switch name="locked" [checked]="true" disabled>Locked (disabled, never submitted)</andes-switch>
          <andes-button type="submit" size="sm">Submit</andes-button>
          <code>{{ submitted() === null ? 'Not submitted yet' : submitted()!.length ? submitted()!.join('&') : '(nothing)' }}</code>
        </form>
      `,
    };
  },
};

/**
 * `loading` shows a spinner in the thumb and blocks toggling, at every size, unchecked and
 * checked. The async-save pattern: the switch goes busy while a (fake) request runs, ignoring
 * further clicks, then settles.
 */
export const Loading: Story = {
  render: () => {
    const busy = signal(false);
    return {
      props: {
        syncOn: false,
        busy,
        save: () => {
          busy.set(true);
          setTimeout(() => busy.set(false), 1200);
        },
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <andes-switch size="sm" loading aria-label="Small, loading" />
            <andes-switch size="sm" loading [checked]="true" aria-label="Small, loading, checked" />
            <andes-switch loading aria-label="Medium, loading" />
            <andes-switch loading [checked]="true" aria-label="Medium, loading, checked" />
            <andes-switch size="lg" loading aria-label="Large, loading" />
            <andes-switch size="lg" loading [checked]="true" aria-label="Large, loading, checked" />
          </div>
          <andes-switch [(checked)]="syncOn" [loading]="busy()" (changed)="save()">
            Sync to cloud ({{ busy() ? 'saving...' : syncOn ? 'on' : 'off' }})
          </andes-switch>
        </div>
      `,
    };
  },
};

/**
 * `(changed)`, `(clicked)`, `(focused)` and `(blurred)`, newest first. `focus()` and `blur()`
 * drive the focus from code and `autoFocus` focuses the first switch on mount. Click, Tab in and
 * out, or use the buttons.
 */
export const EventsAndFocus: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { flag: false, log: [] as string[] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; ${note}">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-switch
            #sw
            autoFocus
            [(checked)]="flag"
            (changed)="log = ['changed: ' + $event.checked + ' (' + $event.event.type + ')'].concat(log)"
            (clicked)="log = ['clicked: ' + $event.checked].concat(log)"
            (focused)="log = ['focused'].concat(log)"
            (blurred)="log = ['blurred'].concat(log)"
            aria-label="Toggle setting"
          />
          <andes-button variant="outline" size="sm" (click)="sw.focus()">focus()</andes-button>
          <andes-button variant="outline" size="sm" (click)="sw.blur()">blur()</andes-button>
        </div>
        @for (line of log; track $index) {
          <code>{{ line }}</code>
        }
      </div>
    `,
  }),
};

/** Disabling and re-enabling at runtime, e.g. while a permission check is pending. */
export const ToggleDisabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { off: true },
    template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem;">
        <andes-switch [checked]="true" [disabled]="off" aria-label="Toggle setting" />
        <andes-button variant="outline" size="sm" (click)="off = !off">Toggle disabled</andes-button>
      </div>
    `,
  }),
};

/**
 * Restyling through the CSS custom property hooks set on the host: geometry
 * (`--andes-switch-track-height`, `--andes-switch-track-width`, `--andes-switch-thumb-size`,
 * `--andes-switch-track-padding`, `--andes-switch-inner-margin`) and color
 * (`--andes-switch-track-color`, `--andes-switch-track-hover-color`,
 * `--andes-switch-track-checked-color`, `--andes-switch-track-checked-hover-color`,
 * `--andes-switch-thumb-color`, `--andes-switch-thumb-shadow`).
 */
export const CustomProperties: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-switch
          [checked]="true"
          aria-label="Large success switch"
          style="
            --andes-switch-track-height: 2rem;
            --andes-switch-track-width: 3.5rem;
            --andes-switch-thumb-size: 1.5rem;
            --andes-switch-track-padding: 0.25rem;
            --andes-switch-track-checked-color: var(--andes-color-success);
            --andes-switch-track-checked-hover-color: var(--andes-color-success-hover);
          "
        />
        <andes-switch
          checkedChildren="ON"
          unCheckedChildren="OFF"
          aria-label="Danger switch"
          style="
            --andes-switch-track-checked-color: var(--andes-color-danger);
            --andes-switch-thumb-shadow: none;
            --andes-switch-inner-margin: 0.5rem;
          "
        />
      </div>
    `,
  }),
};
