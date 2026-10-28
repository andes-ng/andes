import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesSwitch } from './switch';

const meta: Meta<AndesSwitch> = {
  title: 'Data Entry/Switch',
  component: AndesSwitch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readonly: { control: 'boolean' },
    loading: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md'] },
    checkedChildren: { control: 'text' },
    unCheckedChildren: { control: 'text' },
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    readonly: false,
    loading: false,
    size: 'md',
    checkedChildren: '',
    unCheckedChildren: '',
  },
  render: (args) => ({
    props: args,
    template: `<andes-switch [checked]="checked" [disabled]="disabled" [required]="required" [readonly]="readonly" [loading]="loading" [size]="size" [checkedChildren]="checkedChildren" [unCheckedChildren]="unCheckedChildren" aria-label="Toggle setting" />`,
  }),
};

export default meta;

type Story = StoryObj<AndesSwitch>;

/** Playground: every input is a control. */
export const Default: Story = {};

/**
 * The two sizes, unchecked and checked. `checked` is a `model()`, which - unlike `size`'s plain
 * `input()` - doesn't support a `transform` (a two-way binding's output must emit exactly the
 * type its input accepts), so a bare, bracket-less attribute isn't coerced through
 * `booleanAttribute`; bind the literal with brackets instead (same fix `AndesCheckbox`'s
 * stories needed).
 */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-switch size="sm" aria-label="Small, unchecked" />
        <andes-switch size="sm" [checked]="true" aria-label="Small, checked" />
        <andes-switch size="md" aria-label="Medium, unchecked" />
        <andes-switch size="md" [checked]="true" aria-label="Medium, checked" />
      </div>
    `,
  }),
};

/**
 * Every state side by side: unchecked, checked, disabled (both ways), read-only, required and
 * invalid (`aria-invalid`). `checked` needs a property binding, not a bare attribute;
 * `disabled`, `readonly` and `required` stay bare since they're plain `input()`s with a
 * `booleanAttribute` transform.
 */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-switch aria-label="Unchecked" />
        <andes-switch [checked]="true" aria-label="Checked" />
        <andes-switch disabled aria-label="Disabled, unchecked" />
        <andes-switch disabled [checked]="true" aria-label="Disabled, checked" />
        <andes-switch readonly [checked]="true" aria-label="Readonly, checked" />
        <andes-switch required aria-label="Required" />
        <andes-switch aria-invalid="true" aria-label="Invalid" />
      </div>
    `,
  }),
};

/** Wrapped in a `<label>`, the whole text toggles the switch. */
export const WithLabel: Story = {
  render: () => ({
    template: `
      <label style="display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
        <andes-switch />
        Enable notifications
      </label>
    `,
  }),
};

/**
 * The text inside the track: the `checkedChildren` / `unCheckedChildren` strings (short and
 * long, both sizes), projected `[slot=checked|unchecked]` elements, and the rule that a
 * projected slot wins over the string input for that state.
 */
export const TrackContent: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch [checked]="true" checkedChildren="On" unCheckedChildren="Off" aria-label="Text, checked" />
          <andes-switch [checked]="true" checkedChildren="Enabled" unCheckedChildren="Disabled" aria-label="Long text, checked" />
          <andes-switch [checked]="false" checkedChildren="Enabled" unCheckedChildren="Disabled" aria-label="Long text, unchecked" />
          <andes-switch size="sm" [checked]="true" checkedChildren="Yes" unCheckedChildren="No" aria-label="Small, checked" />
          <andes-switch size="sm" [checked]="false" checkedChildren="Yes" unCheckedChildren="No" aria-label="Small, unchecked" />
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch [checked]="true" aria-label="Slots, checked">
            <span slot="checked">On</span>
            <span slot="unchecked">Off</span>
          </andes-switch>
          <andes-switch aria-label="Slots, unchecked">
            <span slot="checked">On</span>
            <span slot="unchecked">Off</span>
          </andes-switch>
          <andes-switch [checked]="true" checkedChildren="ignored" unCheckedChildren="Off" aria-label="Slot wins over text">
            <span slot="checked">&#10003;</span>
          </andes-switch>
        </div>
      </div>
    `,
  }),
};

/** `[(ngModel)]` and the `[(checked)]` model, each echoing its value. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { modelValue: false, twoWay: true },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
        <andes-switch [(ngModel)]="modelValue" aria-label="ngModel" />
        <span>ngModel: {{ modelValue }}</span>
        <andes-switch [(checked)]="twoWay" aria-label="Two-way checked" />
        <span>checked: {{ twoWay }}</span>
      </div>
    `,
  }),
};

/**
 * `loading` shows a spinner in the thumb and blocks toggling, at both sizes, unchecked and
 * checked.
 */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-switch size="sm" loading aria-label="Small, loading" />
        <andes-switch size="sm" loading [checked]="true" aria-label="Small, loading, checked" />
        <andes-switch loading aria-label="Medium, loading" />
        <andes-switch loading [checked]="true" aria-label="Medium, loading, checked" />
      </div>
    `,
  }),
};

/**
 * The async-save pattern: the switch goes busy while a (fake) request runs, ignoring
 * further clicks, then settles. `[(checked)]` keeps the parent's state and the switch's in step.
 */
export const AsyncToggle: Story = {
  render: () => {
    // Signals, not plain props: the story is zoneless, so a setTimeout write to a plain field
    // would never be rendered.
    const busy = signal(false);
    return {
      props: {
        value: false,
        busy,
        save: () => {
          busy.set(true);
          setTimeout(() => busy.set(false), 1200);
        },
      },
      template: `
      <label style="display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
        <andes-switch [(checked)]="value" [loading]="busy()" (changed)="save()" />
        Sync to cloud ({{ busy() ? 'saving...' : value ? 'on' : 'off' }})
      </label>
    `,
    };
  },
};

/** `(changed)` and `(clicked)` payloads, newest first. */
export const Events: Story = {
  render: () => ({
    props: { value: false, log: [] as string[] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
        <andes-switch
          [(checked)]="value"
          (changed)="log = ['changed: ' + $event.checked + ' (' + $event.event.type + ')'].concat(log)"
          (clicked)="log = ['clicked: ' + $event.checked].concat(log)"
          aria-label="Toggle setting"
        />
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

/**
 * `autoFocus` focuses the switch on mount (first one); `focus()` and `blur()` drive the focus
 * from code.
 */
export const Focus: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <andes-switch autoFocus aria-label="Focused on mount" />
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-switch #sw aria-label="Toggle setting" />
          <andes-button variant="outline" size="sm" (click)="sw.focus()">focus()</andes-button>
          <andes-button variant="outline" size="sm" (click)="sw.blur()">blur()</andes-button>
        </div>
      </div>
    `,
  }),
};
