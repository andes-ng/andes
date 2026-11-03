import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from './checkbox';

const meta: Meta<AndesCheckbox> = {
  title: 'Data Entry/Checkbox/Basics/Features',
  component: AndesCheckbox,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesCheckbox>;

const note = `font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;`;

/**
 * Secondary text in `[slot=description]`: muted, indented under the label text (not under the
 * box), linked to the input with `aria-describedby`, and part of the click target. Shown with
 * the label at the end and at the start, in each size, and right-to-left.
 */
export const Description: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.5rem 2rem; max-width: 52rem;">
        <andes-checkbox [checked]="true">
          Weekly digest
          <span slot="description">One summary email every Monday morning.</span>
        </andes-checkbox>
        <andes-checkbox labelPosition="start">
          Label at the start
          <span slot="description">The description follows the label to the start side.</span>
        </andes-checkbox>
        <andes-checkbox size="sm">
          Small
          <span slot="description">Smaller box, same indent.</span>
        </andes-checkbox>
        <andes-checkbox size="lg">
          Large
          <span slot="description">A wrapping description stays aligned with the label text, never under the box.</span>
        </andes-checkbox>
        <andes-checkbox status="error">
          Accept the terms
          <span slot="description">Required to continue.</span>
        </andes-checkbox>
        <div dir="rtl">
          <andes-checkbox [checked]="true">
            تسمية
            <span slot="description">وصف قصير تحت التسمية</span>
          </andes-checkbox>
        </div>
      </div>
    `,
  }),
};

/**
 * `variant="card"`: the whole card is the click target; hover tints the border, keyboard focus
 * rings the card, and checked fills it with the primary subtle tint. Title + description,
 * every size, disabled, read-only, the two statuses, a card without its box
 * (`[indicator]="false"`) and right-to-left.
 */
export const Card: Story = {
  render: () => ({
    props: { proOn: true },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.75rem; max-width: 52rem;">
        <andes-checkbox variant="card">
          Backups
          <span slot="description">Daily snapshots, kept for 30 days.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" [(checked)]="proOn">
          Priority support
          <span slot="description">Answers within one business hour.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" labelPosition="start">
          Box at the end
          <span slot="description">labelPosition="start"</span>
        </andes-checkbox>
        <andes-checkbox variant="card" size="sm">Small card</andes-checkbox>
        <andes-checkbox variant="card" size="lg" [checked]="true">
          Large card
          <span slot="description">More padding, larger corners.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" disabled>
          Disabled
          <span slot="description">Not available on this plan.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" readOnly [checked]="true">
          Read-only
          <span slot="description">Included, cannot be removed.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" status="error">
          Error
          <span slot="description">Pick this to continue.</span>
        </andes-checkbox>
        <andes-checkbox variant="card" status="warning" [checked]="true">Warning</andes-checkbox>
        <andes-checkbox variant="card" [indicator]="false">
          No box
          <span slot="description">The card itself shows the state.</span>
        </andes-checkbox>
        <div dir="rtl" style="display: flex;">
          <andes-checkbox variant="card" [checked]="true" style="flex: 1;">
            بطاقة
            <span slot="description">من اليمين إلى اليسار</span>
          </andes-checkbox>
        </div>
      </div>
    `,
  }),
};

/**
 * `checkedIcon` / `indeterminateIcon` take a context-free template that replaces the tick or
 * the dash; its `<svg>` is sized to the box's glyph area in every size and drawn in
 * `currentColor`.
 */
export const CustomIcons: Story = {
  name: 'Custom icons',
  render: () => ({
    template: `
      <ng-template #heart>
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-5.5-3.3-5.5-7A3 3 0 0 1 8 5a3 3 0 0 1 5.5 2c0 3.7-5.5 7-5.5 7z" /></svg>
      </ng-template>
      <ng-template #cross>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </ng-template>
      <ng-template #dots>
        <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="8" r="1.5" /></svg>
      </ng-template>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center;">
          <andes-checkbox size="sm" [checkedIcon]="heart" [checked]="true">Small</andes-checkbox>
          <andes-checkbox [checkedIcon]="heart" [checked]="true">Favorite</andes-checkbox>
          <andes-checkbox size="lg" [checkedIcon]="heart" [checked]="true">Large</andes-checkbox>
          <andes-checkbox [checkedIcon]="heart">Click me</andes-checkbox>
        </div>
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center;">
          <andes-checkbox [checkedIcon]="cross" [checked]="true" status="error">Excluded</andes-checkbox>
          <andes-checkbox [indeterminateIcon]="dots" [indeterminate]="true">Partly loaded</andes-checkbox>
        </div>
      </div>
    `,
  }),
};

/**
 * Click to watch: checking draws the tick and pops the box, a mixed state scales its dash in,
 * unchecking fades the mark out, and every change sends a soft ring out of the box (4 / 6 / 8px
 * for the small / medium / large box, fading over a second; a button or a card without an
 * indicator rings its whole face). Hover a checked or mixed box and it LIGHTENS. The box that
 * starts checked does NOT animate on load, the buttons show that programmatic changes animate
 * too, and nothing moves under `prefers-reduced-motion` or in forced-colors mode.
 */
export const Animation: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { isOn: true, isMixed: false },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <andes-checkbox size="lg">Click me</andes-checkbox>
          <andes-checkbox size="lg" [checked]="true">Checked on load (no animation)</andes-checkbox>
          <andes-checkbox size="lg" [(checked)]="isOn" [(indeterminate)]="isMixed">Driven by the buttons</andes-checkbox>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <andes-button size="sm" variant="outline" (click)="isMixed = false; isOn = !isOn">Toggle</andes-button>
          <andes-button size="sm" variant="outline" (click)="isMixed = true">Make mixed</andes-button>
        </div>
      </div>
    `,
  }),
};

export const IndeterminateToChecked: Story = {
  name: 'Indeterminate resolves to checked',
  render: () => ({
    props: { isChecked: false, isMixed: true },
    // Clicking - or pressing Space on - a mixed checkbox checks it, like the native control.
    template: `
      <andes-checkbox [(checked)]="isChecked" [(indeterminate)]="isMixed">Mixed state</andes-checkbox>
      <p style="${note}">
        checked={{ isChecked }}, indeterminate={{ isMixed }}
      </p>
    `,
  }),
};

export const Controlled: Story = {
  name: 'Controlled (checked + disabled from outside)',
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { isChecked: true, isDisabled: false },
    // The parent owns both states: the buttons flip them, and `[(checked)]` keeps a user click
    // in sync with the parent's own value.
    template: `
      <andes-checkbox [(checked)]="isChecked" [disabled]="isDisabled">
        {{ isChecked ? 'Checked' : 'Unchecked' }}-{{ isDisabled ? 'Disabled' : 'Enabled' }}
      </andes-checkbox>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <andes-button size="sm" (click)="isChecked = !isChecked">{{ isChecked ? 'Uncheck' : 'Check' }}</andes-button>
        <andes-button size="sm" variant="outline" (click)="isDisabled = !isDisabled">{{ isDisabled ? 'Enable' : 'Disable' }}</andes-button>
      </div>
    `,
  }),
};

export const ChangeEvent: Story = {
  name: 'Change event',
  render: () => ({
    props: { isChecked: false, last: 'none yet' },
    // `(changed)` receives an `AndesCheckboxChange`: new state, value, and the native event.
    template: `
      <andes-checkbox
        value="newsletter"
        [(checked)]="isChecked"
        (changed)="last = 'checked=' + $event.checked + ', value=' + $event.value + ', native=' + $event.event.type"
      >Subscribe to newsletter</andes-checkbox>
      <p style="${note}">
        Last change: {{ last }}
      </p>
    `,
  }),
};

/**
 * `autoFocus` focuses the first checkbox on mount (press Space to toggle). The second one
 * reports `(focused)` / `(blurred)` with the native FocusEvent; `focus()`, `blur()` and
 * `nativeElement` are public on the component instance (here via a template reference).
 */
export const Focus: Story = {
  name: 'Focus, blur and the native input',
  // Kept off the docs page: autoFocus would steal focus from the other stories there.
  tags: ['!autodocs'],
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { log: 'none yet' },
    template: `
      <andes-checkbox autoFocus>Focused on first render</andes-checkbox>
      <andes-checkbox
        #box
        style="display: flex; margin-top: 1rem;"
        (focused)="log = 'focused (' + $event.type + ')'"
        (blurred)="log = 'blurred (' + $event.type + ')'"
      >Remember me</andes-checkbox>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <andes-button size="sm" variant="outline" (mousedown)="$event.preventDefault()" (click)="box.focus()">focus()</andes-button>
        <andes-button size="sm" variant="outline" (mousedown)="$event.preventDefault()" (click)="box.blur()">blur()</andes-button>
        <andes-button size="sm" variant="outline" (click)="log = 'nativeElement: <' + box.nativeElement.tagName.toLowerCase() + ' type=' + box.nativeElement.type + '>'">Read nativeElement</andes-button>
      </div>
      <p style="${note}">Last event: {{ log }}</p>
    `,
  }),
};

export const CustomBorderWidth: Story = {
  name: 'Custom border width',
  render: () => ({
    // `--andes-checkbox-border-width` (default 1px) is the styling hook for the box outline.
    template: `
      <div style="display: flex; gap: 1.5rem; --andes-checkbox-border-width: 2px;">
        <andes-checkbox>2px border</andes-checkbox>
        <andes-checkbox checked>2px border</andes-checkbox>
        <andes-checkbox indeterminate>2px border</andes-checkbox>
      </div>
    `,
  }),
};
