import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSwitch } from './switch';

const meta: Meta<AndesSwitch> = {
  title: 'Data Entry/Switch/Basics/Field',
  component: AndesSwitch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readonly: { control: 'boolean' },
    loading: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
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
    template: `<andes-switch [checked]="checked" [disabled]="disabled" [required]="required" [readonly]="readonly" [loading]="loading" [size]="size" [status]="status" [checkedChildren]="checkedChildren" [unCheckedChildren]="unCheckedChildren" aria-label="Toggle setting" />`,
  }),
};

export default meta;

type Story = StoryObj<AndesSwitch>;

/** Playground: every input is a control. */
export const Default: Story = {};

/**
 * The three sizes, unchecked and checked, bare and with a label: 16 / 22 / 28px tracks, and the
 * label follows the same text steps as the Input (14px on a 22px line for sm and md, 16px on
 * 24px for lg). `checked` is a `model()`, which - unlike `size`'s plain `input()` - doesn't
 * support a `transform` (a two-way binding's output must emit exactly the type its input
 * accepts), so a bare, bracket-less attribute isn't coerced through `booleanAttribute`; bind the
 * literal with brackets instead (same fix `AndesCheckbox`'s stories needed).
 *
 * Try pressing and holding any of them: the thumb stretches by 30% toward the side it will
 * travel to (its outer edge stays at the track edge when on) and settles back as it slides, and
 * every change sends a soft ring out of the track. Both are relative to the size, and both are
 * skipped under `prefers-reduced-motion`.
 */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch size="sm" aria-label="Small, unchecked" />
          <andes-switch size="sm" [checked]="true" aria-label="Small, checked" />
          <andes-switch size="md" aria-label="Medium, unchecked" />
          <andes-switch size="md" [checked]="true" aria-label="Medium, checked" />
          <andes-switch size="lg" aria-label="Large, unchecked" />
          <andes-switch size="lg" [checked]="true" aria-label="Large, checked" />
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <andes-switch size="sm">Small</andes-switch>
          <andes-switch size="md">Medium</andes-switch>
          <andes-switch size="lg">Large</andes-switch>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch size="lg" [checked]="true" checkedChildren="On" unCheckedChildren="Off" aria-label="Large with text" />
          <andes-switch size="lg" loading aria-label="Large, loading" />
          <andes-switch size="lg" status="error" aria-label="Large, error" />
        </div>
      </div>
    `,
  }),
};

/**
 * Every state side by side: unchecked, checked, disabled (both ways), read-only, required and
 * invalid (`aria-invalid`). `checked` needs a property binding, not a bare attribute;
 * `disabled`, `readonly` and `required` stay bare since they're plain `input()`s with a
 * `booleanAttribute` transform. Press and hold the first two to feel the thumb stretch; the
 * disabled and read-only ones give no press or hover feedback and never ring.
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

/**
 * `status` like the Input and Checkbox: `error` paints the track in the danger color AND sets
 * `aria-invalid` (the same result as `aria-invalid="true"`), `warning` only paints the warning
 * color. Unchecked and checked, with the keyboard focus ring (Tab to see it) following the
 * status color.
 */
export const Status: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-switch status="error" aria-label="Error, unchecked" />
          <andes-switch status="error" [checked]="true" aria-label="Error, checked" />
          <andes-switch status="warning" aria-label="Warning, unchecked" />
          <andes-switch status="warning" [checked]="true" aria-label="Warning, checked" />
          <andes-switch aria-invalid="true" aria-label="aria-invalid only" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <andes-switch status="error">
            Accept the terms
            <span slot="description">Required to continue.</span>
          </andes-switch>
          <andes-switch status="warning">
            Share usage data
            <span slot="description">Recommended, but optional.</span>
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
