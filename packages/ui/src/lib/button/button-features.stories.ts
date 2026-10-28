import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from './button';

const icons = provideIcons({ lucideArrowLeft, lucideArrowRight });

const meta: Meta<AndesButton> = {
  title: 'General/Button/Basics/Features',
  component: AndesButton,
};

export default meta;

type Story = StoryObj<AndesButton>;

/** Icons go in the `icon-start` and `icon-end` slots, before or after the label. */
export const WithIcons: Story = {
  render: () => ({
    moduleMetadata: { imports: [NgIcon], providers: [icons] },
    template: `
      <div style="display: flex; gap: 1rem;">
        <andes-button>
          <ng-icon slot="icon-start" name="lucideArrowLeft" />
          Back
        </andes-button>
        <andes-button>
          Next
          <ng-icon slot="icon-end" name="lucideArrowRight" />
        </andes-button>
      </div>
    `,
  }),
};

/** `fullWidth` stretches the button to fill its container. */
export const FullWidth: Story = {
  render: () => ({
    template: `<div style="width: 320px;"><andes-button fullWidth>Save</andes-button></div>`,
  }),
};

/**
 * With an `href` the button renders as an anchor (`target="_blank"` opens a new tab); with
 * `type="submit"` it submits its form, here caught so the page does not reload.
 */
export const LinksAndSubmit: Story = {
  render: () => ({
    props: {
      submitted: (event: Event) => event.preventDefault(),
    },
    template: `
      <form (submit)="submitted($event)" style="display: flex; align-items: center; gap: 1rem;">
        <andes-button href="https://andes-ng.dev">Open the docs</andes-button>
        <andes-button href="https://andes-ng.dev" target="_blank" variant="outline">Open in a new tab</andes-button>
        <andes-button type="submit">Submit</andes-button>
      </form>
    `,
  }),
};

/** The press ripple is on by default; `[ripple]="false"` turns it off. */
export const Ripple: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 1rem;">
        <andes-button>With ripple</andes-button>
        <andes-button [ripple]="false">Without ripple</andes-button>
      </div>
    `,
  }),
};
