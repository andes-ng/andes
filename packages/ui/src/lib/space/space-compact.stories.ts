import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSelect } from '../select/select';
import { AndesSpace } from './space';
import { AndesSpaceCompact } from './space-compact';

/** A plain addon cell; every control in the groups below is the library's own. */
const DEMO_ADDON = `
  .demo-addon { display: inline-flex; flex: none; white-space: nowrap; align-items: center; height: 2rem; padding: 0 0.75rem; box-sizing: border-box; border: 1px solid var(--andes-color-input); border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font: 14px/22px var(--andes-font-family), sans-serif; }
`;

const meta: Meta<AndesSpaceCompact> = {
  title: 'Layout/Space/Features/Compact',
  component: AndesSpaceCompact,
  decorators: [
    moduleMetadata({
      imports: [
        AndesSpace,
        AndesSpaceCompact,
        AndesButton,
        AndesInput,
        AndesInputNumber,
        AndesSelect,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSpaceCompact>;

/** Compact group: squared inner corners, shared borders, raised on hover and focus. */
export const Groups: Story = {
  render: () => ({
    styles: [DEMO_ADDON],
    props: {
      currencies: [
        { value: 'PEN', label: 'PEN' },
        { value: 'USD', label: 'USD' },
      ],
    },
    template: `
      <div style="display:grid;gap:1.5rem;justify-items:start">
        <andes-space-compact aria-label="Actions">
          <andes-button variant="outline">Day</andes-button>
          <andes-button variant="outline">Week</andes-button>
          <andes-button variant="outline">Month</andes-button>
        </andes-space-compact>

        <andes-space-compact aria-label="Search">
          <andes-input type="search" placeholder="Search invoices" aria-label="Search invoices" />
          <andes-button>Search</andes-button>
        </andes-space-compact>

        <andes-space-compact aria-label="Amount">
          <andes-select aria-label="Currency" value="PEN" [options]="currencies" style="width: 6rem" />
          <andes-input-number aria-label="Amount" placeholder="0.00" [precision]="2" [controls]="false" />
          <span class="demo-addon">per unit</span>
        </andes-space-compact>

        <andes-space-compact aria-label="Pagination">
          <andes-button variant="outline" size="icon" aria-label="Previous page">&lsaquo;</andes-button>
          <andes-button variant="outline" size="icon" aria-label="Page 1">1</andes-button>
          <andes-button variant="outline" size="icon" aria-label="Page 2">2</andes-button>
          <andes-button variant="outline" size="icon" aria-label="Next page">&rsaquo;</andes-button>
        </andes-space-compact>
      </div>`,
  }),
};

/** `direction="vertical"` stacks the group, and `block` makes text fields take the remaining width; `data-grow` does the same for any child. */
export const VerticalAndBlock: Story = {
  render: () => ({
    props: {
      fields: [
        { value: 'supplier', label: 'Supplier' },
        { value: 'status', label: 'Status' },
      ],
    },
    template: `
      <div style="display:grid;gap:1.5rem;max-width:32rem;justify-items:start">
        <andes-space-compact direction="vertical" aria-label="Zoom" style="width:8rem">
          <andes-button variant="outline" fullWidth>Zoom in</andes-button>
          <andes-button variant="outline" fullWidth>Zoom out</andes-button>
          <andes-button variant="outline" fullWidth>Reset</andes-button>
        </andes-space-compact>
        <andes-space-compact block aria-label="Subscribe">
          <andes-input type="email" placeholder="you@company.com" aria-label="Email" />
          <andes-button>Subscribe</andes-button>
        </andes-space-compact>
        <andes-space-compact block aria-label="Filter">
          <andes-select aria-label="Field" value="supplier" [options]="fields" style="width: 9rem" />
          <andes-input placeholder="contains…" aria-label="Value" />
          <andes-button variant="outline">Apply</andes-button>
        </andes-space-compact>
      </div>`,
  }),
};

/** A compact group sits inside a space like any other child. */
export const InsideSpace: Story = {
  render: () => ({
    template: `
      <andes-space size="md" wrap>
        <andes-space-compact aria-label="View">
          <andes-button variant="outline">List</andes-button>
          <andes-button variant="outline">Grid</andes-button>
        </andes-space-compact>
        <andes-space-compact aria-label="Search">
          <andes-input type="search" placeholder="Search" aria-label="Search" />
          <andes-button>Go</andes-button>
        </andes-space-compact>
        <andes-button variant="outline">Export</andes-button>
      </andes-space>`,
  }),
};

/** The design system's own button works in a group unchanged: its inner `<button>` is the first element the rules reach. */
export const WithButtons: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:1.5rem;justify-items:start">
        <andes-space-compact aria-label="Range">
          <andes-button variant="outline">Day</andes-button>
          <andes-button variant="outline">Week</andes-button>
          <andes-button variant="outline">Month</andes-button>
        </andes-space-compact>
        <andes-space-compact aria-label="Save">
          <andes-button>Save</andes-button>
          <andes-button variant="outline" aria-label="More save options">&#9662;</andes-button>
        </andes-space-compact>
        <andes-space-compact direction="vertical" aria-label="Order" style="width:8rem">
          <andes-button variant="outline">Move up</andes-button>
          <andes-button variant="outline">Move down</andes-button>
        </andes-space-compact>
      </div>`,
  }),
};
