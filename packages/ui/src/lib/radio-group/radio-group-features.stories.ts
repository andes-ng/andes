import { signal } from '@angular/core';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesRadioGroup> = {
  title: 'Data Entry/RadioGroup/Basics/Features',
  component: AndesRadioGroup,
};

export default meta;

type Story = StoryObj<AndesRadioGroup>;

/** Generate the items from data: bare strings or `{ label, value, disabled, title, id }`. */
export const Options: Story = {
  render: () => ({
    props: {
      fruits: ['Apple', 'Pear', 'Orange'],
      plans: [
        { label: 'Starter', value: 1 },
        { label: 'Pro', value: 2 },
        {
          label: 'Enterprise',
          value: 3,
          disabled: true,
          title: 'Contact sales',
        },
      ],
      fruit: 'Apple',
      plan: 2,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <andes-radio-group aria-label="Fruit" orientation="horizontal" [options]="fruits" [(value)]="fruit" />
          <p style="margin: 0.5rem 0 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">Fruit: {{ fruit }}</p>
        </div>
        <div>
          <andes-radio-group aria-label="Plan" optionType="button" buttonStyle="solid" [options]="plans" [(value)]="plan" />
          <p style="margin: 0.5rem 0 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">Plan: {{ plan }} ({{ typeof plan }})</p>
        </div>
      </div>
    `,
  }),
};

/** Per-option `class` and `style` land on the generated `<andes-radio>` item. */
export const OptionsWithClassAndStyle: Story = {
  render: () => ({
    props: {
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        {
          label: 'Urgent',
          value: 'urgent',
          style: {
            fontWeight: 600,
            borderBottom: '2px solid var(--andes-color-danger)',
          },
        },
      ],
      priority: 'medium',
    },
    template: `
      <andes-radio-group aria-label="Priority" orientation="horizontal" [options]="options" [(value)]="priority" />
    `,
  }),
};

/** `optionLabel` customizes every generated option's label; the template receives the
 *  option as `let-option`, plus `checked` and `index`. */
export const OptionsWithLabelTemplate: Story = {
  render: () => ({
    props: {
      plans: [
        { label: 'Starter', value: 'starter' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      prices: { starter: 'Free', pro: '$12/mo', enterprise: 'Custom' },
      plan: 'pro',
    },
    template: `
      <andes-radio-group aria-label="Plan" [options]="plans" [optionLabel]="planLabel" [(value)]="plan" />
      <ng-template #planLabel let-option let-checked="checked">
        <span style="display: inline-flex; flex-direction: column;">
          <strong>{{ option.label }}{{ checked ? ' (selected)' : '' }}</strong>
          <small style="opacity: 0.8;">{{ prices[option.value] }}</small>
        </span>
      </ng-template>
    `,
  }),
};

/** `(selectionChange)` emits `{ value, event }` for user selections only - `[(value)]`
 *  writes do not emit it. */
export const ChangeEvent: Story = {
  render: () => {
    const log: string[] = [];
    return {
      moduleMetadata: { imports: [AndesRadio, AndesButton] },
      props: {
        value: 'a',
        log,
        onSelection(change: { value: unknown; event: Event }) {
          log.unshift(
            `selectionChange: value=${String(change.value)} event=${change.event.type}`,
          );
        },
      },
      template: `
        <andes-radio-group aria-label="Letter" optionType="button" [(value)]="value" (selectionChange)="onSelection($event)">
          <andes-radio value="a">A</andes-radio>
          <andes-radio value="b">B</andes-radio>
          <andes-radio value="c">C</andes-radio>
        </andes-radio-group>
        <andes-button variant="outline" size="sm" style="margin-left: 1rem;" (click)="value = 'a'">Set value to "a" programmatically</andes-button>
        <ol data-testid="change-log" style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
          @for (entry of log; track $index) { <li>{{ entry }}</li> }
        </ol>
      `,
    };
  },
};

/** `autoFocus` on the group focuses the checked item (or the first enabled one). */
export const AutoFocus: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <andes-radio-group aria-label="Plan" optionType="button" value="pro" autoFocus>
        <andes-radio value="starter">Starter</andes-radio>
        <andes-radio value="pro">Pro</andes-radio>
        <andes-radio value="enterprise">Enterprise</andes-radio>
      </andes-radio-group>
    `,
  }),
};

/** An `<andes-radio>` also works on its own, outside any group: `[(checked)]` holds its
 *  state (a one-way `[checked]="true"` only seeds it). Like a native radio, the user can
 *  check it but not uncheck it - the parent can. */
export const StandaloneRadio: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio, AndesButton] },
    props: { accepted: false },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
        <andes-radio [(checked)]="accepted">Use this address as default</andes-radio>
        <andes-radio [checked]="true">Seeded as checked</andes-radio>
        <andes-radio disabled>Disabled</andes-radio>
        <andes-radio disabled [checked]="true">Disabled and checked</andes-radio>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <andes-button variant="outline" size="sm" (click)="accepted = false">Reset</andes-button>
          <span data-testid="standalone-state">checked: {{ accepted }}</span>
        </div>
      </div>
    `,
  }),
};

/** Toggle `disabled` at runtime - on standalone radios and on a whole group. */
export const DisabledToggle: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio, AndesButton] },
    props: { disabled: true, value: 'b' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <div style="display: flex; gap: 1rem;">
          <andes-radio [disabled]="disabled">Unchecked</andes-radio>
          <andes-radio [disabled]="disabled" [checked]="true">Checked</andes-radio>
        </div>
        <andes-radio-group aria-label="Letter" orientation="horizontal" [disabled]="disabled" [(value)]="value">
          <andes-radio value="a">A</andes-radio>
          <andes-radio value="b">B</andes-radio>
          <andes-radio value="c">C</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="Letter (buttons)" optionType="button" [disabled]="disabled" [(value)]="value">
          <andes-radio value="a">A</andes-radio>
          <andes-radio value="b">B</andes-radio>
          <andes-radio value="c">C</andes-radio>
        </andes-radio-group>
        <andes-button size="sm" (click)="disabled = !disabled">{{ disabled ? 'Enable' : 'Disable' }}</andes-button>
      </div>
    `,
  }),
};

/** A vertical group whose last item reveals extra content (here a free-text field) once it
 *  is selected. Any markup can sit inside an item's label. */
export const VerticalWithExtraContent: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio, AndesInput] },
    props: { value: 'email', other: signal('') },
    template: `
      <andes-radio-group aria-label="Contact preference" [(value)]="value">
        <andes-radio value="email">Email</andes-radio>
        <andes-radio value="phone">Phone</andes-radio>
        <andes-radio value="mail">Postal mail</andes-radio>
        <andes-radio value="other">
          Other...
          @if (value === 'other') {
            <andes-input
              size="sm"
              aria-label="Other contact preference"
              placeholder="Please specify"
              style="display: inline-flex; vertical-align: middle; margin-inline-start: 0.5rem; inline-size: 14rem;"
              [(value)]="other"
            />
          }
        </andes-radio>
      </andes-radio-group>
    `,
  }),
};

const caption =
  'margin: 0 0 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

/**
 * Secondary text under the label: project `<span slot="description">` into an `<andes-radio>`
 * or give an option a `description`. It is muted, aligned under the label text (not under the
 * circle) with `labelPlacement` end or start and in right-to-left, and linked with
 * `aria-describedby` - the accessible name stays the label alone.
 */
export const Description: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      tiers: [
        {
          label: 'Starter',
          value: 'starter',
          description: 'For side projects and small experiments.',
        },
        {
          label: 'Pro',
          value: 'pro',
          description: 'For teams that ship every week.',
        },
        {
          label: 'Enterprise',
          value: 'enterprise',
          disabled: true,
          description: 'Talk to sales.',
        },
      ],
      tier: 'pro',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <div>
          <p style="${caption}">From options</p>
          <andes-radio-group aria-label="Tier" [options]="tiers" [(value)]="tier" />
        </div>
        <div>
          <p style="${caption}">Projected, label before the circle</p>
          <andes-radio-group aria-label="Notifications" labelPlacement="start" value="all">
            <andes-radio value="all">
              All activity
              <span slot="description">Every comment, mention and status change.</span>
            </andes-radio>
            <andes-radio value="mentions">
              Mentions only
              <span slot="description">Only when someone writes your name.</span>
            </andes-radio>
          </andes-radio-group>
        </div>
        <div dir="rtl">
          <p style="${caption}">Right-to-left</p>
          <andes-radio-group aria-label="RTL" value="a">
            <andes-radio value="a">الأول<span slot="description">وصف الخيار الأول</span></andes-radio>
            <andes-radio value="b">الثاني<span slot="description">وصف الخيار الثاني</span></andes-radio>
          </andes-radio-group>
        </div>
      </div>
    `,
  }),
};

/**
 * `status` on the group (or on one radio) like the Input and Checkbox: `error` paints the
 * danger color and sets `aria-invalid` on the radiogroup (the old `aria-invalid` input keeps
 * working), `warning` only paints the warning color. Shown on the classic circles and on the
 * button style.
 */
export const Status: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; gap: 3rem; flex-wrap: wrap;">
          <andes-radio-group aria-label="Error" status="error">
            <andes-radio value="a">Error, none selected</andes-radio>
            <andes-radio value="b">Second option</andes-radio>
          </andes-radio-group>
          <andes-radio-group aria-label="Warning" status="warning" value="b">
            <andes-radio value="a">Warning</andes-radio>
            <andes-radio value="b">Second option</andes-radio>
          </andes-radio-group>
          <andes-radio-group aria-label="Error, selected" status="error" value="a">
            <andes-radio value="a">Error, selected</andes-radio>
            <andes-radio value="b">Second option</andes-radio>
          </andes-radio-group>
        </div>
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
          <andes-radio-group aria-label="Error (buttons)" optionType="button" status="error">
            <andes-radio value="a">Day</andes-radio>
            <andes-radio value="b">Week</andes-radio>
          </andes-radio-group>
          <andes-radio-group aria-label="Warning (buttons)" optionType="button" status="warning" value="a">
            <andes-radio value="a">Day</andes-radio>
            <andes-radio value="b">Week</andes-radio>
          </andes-radio-group>
        </div>
        <andes-radio-group aria-label="One radio flagged" value="a">
          <andes-radio value="a">Fine</andes-radio>
          <andes-radio value="b" status="warning">This one carries a warning</andes-radio>
        </andes-radio-group>
        <div style="display: flex; gap: 1.5rem;">
          <andes-radio status="error">Standalone error</andes-radio>
          <andes-radio status="warning" [checked]="true">Standalone warning</andes-radio>
        </div>
      </div>
    `,
  }),
};

/**
 * `readOnly` freezes the selection without dimming it: the radios stay focusable and keep
 * their normal look, give no hover feedback, and the group is announced as read-only
 * (`aria-readonly` on the radiogroup). The switch shows it turning on and off; `disabled`
 * is the dimmed, unfocusable alternative.
 */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => ({
    moduleMetadata: { imports: [AndesRadio, AndesButton] },
    props: { frozen: true, pick: 'pro' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-radio-group aria-label="Plan (read-only)" [readOnly]="frozen" [(value)]="pick">
          <andes-radio value="starter">Starter</andes-radio>
          <andes-radio value="pro">Pro</andes-radio>
          <andes-radio value="enterprise">Enterprise</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="Plan (read-only buttons)" optionType="button" [readOnly]="frozen" [(value)]="pick">
          <andes-radio value="starter">Starter</andes-radio>
          <andes-radio value="pro">Pro</andes-radio>
          <andes-radio value="enterprise">Enterprise</andes-radio>
        </andes-radio-group>
        <andes-radio readOnly [checked]="true">Standalone read-only</andes-radio>
        <andes-button size="sm" variant="outline" (click)="frozen = !frozen">
          {{ frozen ? 'Allow changes' : 'Make read-only' }}
        </andes-button>
        <span data-testid="readonly-state" style="font-size: 0.875rem; color: var(--andes-color-foreground);">plan: {{ pick }}</span>
      </div>
    `,
  }),
};

/**
 * `columns` lays the items out in a grid of N equal columns, for long lists and card
 * pickers (`orientation` stays the simpler choice for one row or column). A button group in
 * columns draws separate buttons instead of one segmented bar.
 */
export const Columns: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      regions: [
        'Lima',
        'Cusco',
        'Arequipa',
        'Trujillo',
        'Piura',
        'Iquitos',
        'Tacna',
        'Puno',
      ],
      region: 'Cusco',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 30rem;">
        <div>
          <p style="${caption}">columns = 3</p>
          <andes-radio-group aria-label="Region" [columns]="3" [options]="regions" [(value)]="region" />
        </div>
        <div>
          <p style="${caption}">columns = 4, buttons</p>
          <andes-radio-group aria-label="Region (buttons)" optionType="button" [columns]="4" [options]="regions" [(value)]="region" />
        </div>
      </div>
    `,
  }),
};

/**
 * `indicator` replaces the dot of the checked radio with your own glyph: a context-free
 * `<ng-template>` (typically an `<svg>` in `currentColor`, the primary color) sized from the
 * circle. Set it on the group for every radio, or on one radio. `[showIndicator]="false"`
 * hides the circle altogether - the native input stays the keyboard stop and the label (or
 * card) the click target; a button segment never draws one.
 */
export const Indicator: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: { mood: 'good' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <andes-radio-group aria-label="Mood (glyph)" [indicator]="check" [(value)]="mood">
          <andes-radio value="bad">Bad</andes-radio>
          <andes-radio value="good">Good</andes-radio>
          <andes-radio value="great" [indicator]="star">Great (its own glyph)</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="Mood (no circle)" variant="card" orientation="horizontal" [showIndicator]="false" [(value)]="mood">
          <andes-radio value="bad">Bad</andes-radio>
          <andes-radio value="good">Good</andes-radio>
          <andes-radio value="great">Great</andes-radio>
        </andes-radio-group>
        <ng-template #check>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </ng-template>
        <ng-template #star>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l2.1 4.6 5 .5-3.8 3.4 1.1 4.9L8 11.8 3.6 14.4l1.1-4.9L.9 6.1l5-.5z" /></svg>
        </ng-template>
      </div>
    `,
  }),
};

/**
 * Object values: the selected object is rarely the same reference as the option (a value
 * loaded from the server, say). `compareWith` decides when they are the same one; the group
 * still emits the option's own object. Here the preselected value is a fresh object.
 */
export const ObjectValues: Story = {
  name: 'Object values',
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      plans: [
        { label: 'Starter', value: { id: 1, name: 'Starter' } },
        { label: 'Pro', value: { id: 2, name: 'Pro' } },
        { label: 'Enterprise', value: { id: 3, name: 'Enterprise' } },
      ],
      current: { id: 2, name: 'loaded from the server' },
      sameId: (a: { id: number }, b: { id: number }) => a.id === b.id,
    },
    template: `
      <andes-radio-group aria-label="Plan" [options]="plans" [compareWith]="sameId" [(value)]="current" />
      <p data-testid="object-state" style="${caption} margin-top: 0.75rem;">selected: {{ current.id }} / {{ current.name }}</p>
    `,
  }),
};

/**
 * Keyboard and focus. Arrow keys move focus AND selection; by default they wrap around, and
 * `[loop]="false"` stops them at the first and last radio. The group exposes `focus()` /
 * `blur()` and the `(focused)` / `(blurred)` outputs, which fire when focus enters or leaves
 * the group as a whole - not as it moves between radios.
 */
export const KeyboardAndFocus: Story = {
  name: 'Keyboard and focus',
  render: () => {
    const log: string[] = [];
    return {
      moduleMetadata: { imports: [AndesRadio, AndesButton] },
      props: {
        log,
        wrap: true,
        onFocusEvent(name: string) {
          log.unshift(name);
        },
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
          <andes-radio-group #group aria-label="Size" orientation="horizontal" [loop]="wrap" value="m" (focused)="onFocusEvent('focused')" (blurred)="onFocusEvent('blurred')">
            <andes-radio value="s">S</andes-radio>
            <andes-radio value="m">M</andes-radio>
            <andes-radio value="l">L</andes-radio>
          </andes-radio-group>
          <div style="display: flex; gap: 0.5rem;">
            <andes-button size="sm" variant="outline" (click)="wrap = !wrap">loop: {{ wrap }}</andes-button>
            <andes-button size="sm" variant="outline" (click)="group.focus()">focus()</andes-button>
            <andes-button size="sm" variant="outline" (click)="group.blur()">blur()</andes-button>
          </div>
          <ol data-testid="focus-log" style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">
            @for (entry of log; track $index) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};
