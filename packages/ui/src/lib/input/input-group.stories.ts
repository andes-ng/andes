import { AndesButton } from '../button/button';
import { AndesInput } from './input';
import { AndesInputGroup } from './input-group';
import { AndesInputSearch } from './input-search';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesInputGroup> = {
  title: 'Data Entry/Input/Layout/Group',
  component: AndesInputGroup,
};

export default meta;

type Story = StoryObj<AndesInputGroup>;

/** Fields and buttons joined into one row that shares its borders, focus ring and status. */
export const Compact: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesInput, AndesButton, AndesInputSearch],
    },
    template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; width: 28rem;">
        <andes-input-group aria-label="Name">
          <andes-input aria-label="First name" placeholder="First name" />
          <andes-input aria-label="Last name" placeholder="Last name" />
        </andes-input-group>
        <andes-input-group block aria-label="Convert amount">
          <andes-input aria-label="Amount" placeholder="0.00" addonBefore="USD" />
          <andes-button>Convert</andes-button>
        </andes-input-group>
        <andes-input-group block aria-label="Search orders">
          <andes-input aria-label="Order field" value="Order #" style="flex: 0 0 7rem;" />
          <andes-input-search aria-label="Search orders" placeholder="Search…" enterButton />
        </andes-input-group>
        <andes-input-group block aria-label="Email and code">
          <andes-input aria-label="Email" status="error" value="not-an-email" />
          <andes-input aria-label="Code" placeholder="Code" />
          <andes-button>Send</andes-button>
        </andes-input-group>
        <andes-input-group block aria-label="Name and nickname">
          <andes-input aria-label="Name" placeholder="Name" [countMax]="3" value="too long" />
          <andes-input aria-label="Nickname" placeholder="Nickname" />
        </andes-input-group>
        <andes-input-group block aria-label="Small row">
          <andes-input size="sm" aria-label="From" placeholder="From" />
          <andes-input size="sm" aria-label="To" placeholder="To" />
          <andes-button size="sm" variant="outline">Apply</andes-button>
        </andes-input-group>
      </div>
    `,
  }),
};
