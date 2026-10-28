import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesSpace } from './space';
import { AndesSpaceCompact } from './space-compact';

/**
 * Plain-looking controls for the compact demos. They carry no component classes on purpose: the
 * grouping rules only look at the group's children, so the same markup works with any control.
 */
const DEMO_CONTROLS = `
  .demo-btn, .demo-select, .demo-field {
    box-sizing: border-box; height: 2rem; margin: 0;
    border: 1px solid var(--andes-color-input);
    border-radius: var(--andes-radius-md);
    background: var(--andes-color-background);
    color: var(--andes-color-foreground);
    font: 14px/22px var(--andes-font-family), sans-serif;
  }
  .demo-btn, .demo-select { padding: 0 0.75rem; cursor: pointer; }
  .demo-btn { display: inline-flex; align-items: center; }
  .demo-btn:hover, .demo-select:hover { border-color: color-mix(in srgb, var(--andes-color-primary) 65%, var(--andes-color-input)); }
  .demo-btn:focus-visible, .demo-select:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 0; }
  .demo-btn--primary { background: var(--andes-color-primary); border-color: var(--andes-color-primary); color: var(--andes-color-primary-foreground); }
  .demo-btn--icon { width: 2rem; padding: 0; justify-content: center; }
  .demo-field { display: inline-flex; align-items: center; padding: 0 0.75rem; min-width: 0; }
  .demo-field:focus-within { border-color: var(--andes-color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--andes-color-primary) 20%, transparent); }
  .demo-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 0; font: inherit; color: inherit; }
  .demo-field input::placeholder { color: var(--andes-color-muted-foreground); }
  .demo-addon { display: inline-flex; align-items: center; height: 2rem; padding: 0 0.75rem; box-sizing: border-box; border: 1px solid var(--andes-color-input); border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font: 14px/22px var(--andes-font-family), sans-serif; }
`;

const meta: Meta<AndesSpaceCompact> = {
  title: 'Layout/Space/Features/Compact',
  component: AndesSpaceCompact,
  decorators: [
    moduleMetadata({
      imports: [AndesSpace, AndesSpaceCompact, AndesButton],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSpaceCompact>;

/** Compact group: squared inner corners, shared borders, raised on hover and focus. */
export const Groups: Story = {
  render: () => ({
    styles: [DEMO_CONTROLS],
    template: `
      <div style="display:grid;gap:1.5rem;justify-items:start">
        <andes-space-compact aria-label="Actions">
          <button class="demo-btn" type="button">Day</button>
          <button class="demo-btn" type="button">Week</button>
          <button class="demo-btn" type="button">Month</button>
        </andes-space-compact>

        <andes-space-compact aria-label="Search">
          <label class="demo-field"><input type="search" placeholder="Search invoices" aria-label="Search invoices" /></label>
          <button class="demo-btn demo-btn--primary" type="button">Search</button>
        </andes-space-compact>

        <andes-space-compact aria-label="Amount">
          <select class="demo-select" aria-label="Currency"><option>PEN</option><option>USD</option></select>
          <label class="demo-field"><input type="text" inputmode="decimal" placeholder="0.00" aria-label="Amount" /></label>
          <span class="demo-addon">per unit</span>
        </andes-space-compact>

        <andes-space-compact aria-label="Pagination">
          <button class="demo-btn demo-btn--icon" type="button" aria-label="Previous page">&lsaquo;</button>
          <button class="demo-btn demo-btn--icon" type="button" aria-label="Page 1">1</button>
          <button class="demo-btn demo-btn--icon" type="button" aria-label="Page 2">2</button>
          <button class="demo-btn demo-btn--icon" type="button" aria-label="Next page">&rsaquo;</button>
        </andes-space-compact>
      </div>`,
  }),
};

/** `direction="vertical"` stacks the group, and `block` makes text fields take the remaining width; `data-grow` does the same for any child. */
export const VerticalAndBlock: Story = {
  render: () => ({
    styles: [DEMO_CONTROLS],
    template: `
      <div style="display:grid;gap:1.5rem;max-width:32rem;justify-items:start">
        <andes-space-compact direction="vertical" aria-label="Zoom" style="width:8rem">
          <button class="demo-btn" type="button">Zoom in</button>
          <button class="demo-btn" type="button">Zoom out</button>
          <button class="demo-btn" type="button">Reset</button>
        </andes-space-compact>
        <andes-space-compact block aria-label="Subscribe">
          <label class="demo-field" data-grow><input type="email" placeholder="you@company.com" aria-label="Email" /></label>
          <button class="demo-btn demo-btn--primary" type="button">Subscribe</button>
        </andes-space-compact>
        <andes-space-compact block aria-label="Filter">
          <select class="demo-select" aria-label="Field"><option>Supplier</option><option>Status</option></select>
          <label class="demo-field" data-grow><input type="text" placeholder="contains…" aria-label="Value" /></label>
          <button class="demo-btn" type="button">Apply</button>
        </andes-space-compact>
      </div>`,
  }),
};

/** A compact group sits inside a space like any other child. */
export const InsideSpace: Story = {
  render: () => ({
    styles: [DEMO_CONTROLS],
    template: `
      <andes-space size="md" wrap>
        <andes-space-compact aria-label="View">
          <button class="demo-btn" type="button">List</button>
          <button class="demo-btn" type="button">Grid</button>
        </andes-space-compact>
        <andes-space-compact aria-label="Search">
          <label class="demo-field"><input type="search" placeholder="Search" aria-label="Search" /></label>
          <button class="demo-btn demo-btn--primary" type="button">Go</button>
        </andes-space-compact>
        <button class="demo-btn" type="button">Export</button>
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
