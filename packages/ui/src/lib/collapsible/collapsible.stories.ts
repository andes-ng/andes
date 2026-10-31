import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesTextarea } from '../textarea/textarea';
import { AndesCollapsible } from './collapsible';
import { AndesCollapsibleContent } from './collapsible-content';
import { AndesCollapsibleLazy } from './collapsible-lazy';
import { AndesCollapsibleTrigger } from './collapsible-trigger';

const imports = [
  AndesInput,
  AndesSelect,
  AndesTextarea,
  AndesCollapsible,
  AndesCollapsibleTrigger,
  AndesCollapsibleContent,
  AndesCollapsibleLazy,
];

const chevron = `<svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>`;

/** Demo-only look for the trigger rows and panels; the component itself ships no chrome. */
const styles = [
  `
  .panel { width: 22rem; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .row h4 { margin: 0; font-size: 0.875rem; line-height: 1.375rem; font-weight: 600; }
  .item { border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-md); padding: 0.5rem 0.75rem; margin-top: 0.5rem; }
  .trigger-row { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.25rem 0; border: 0; background: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; text-align: start; border-radius: var(--andes-radius-sm); }
  .trigger-row:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 2px; }
  .trigger-row:disabled { cursor: not-allowed; opacity: 0.6; }
  .chevron { flex: none; transition: transform 200ms ease-in-out; }
  [data-state='open'] > .chevron, [data-state='open'] .chevron { transform: rotate(180deg); }
  .body { padding-top: 0.5rem; color: var(--andes-color-muted-foreground); }
  .body p { margin: 0 0 0.5rem; }
  @media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }
  `,
];

const meta: Meta<AndesCollapsible> = {
  title: 'Data Display/Collapsible',
  component: AndesCollapsible,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    openChange: { action: 'openChange' },
  },
  args: { open: false, disabled: false },
  render: (args) => ({
    moduleMetadata: { imports },
    props: args,
    styles,
    template: `
      <andes-collapsible class="panel" [(open)]="open" [disabled]="disabled" (openChange)="openChange($event)">
        <div class="row">
          <h4>3 repositories starred</h4>
          <button andesCollapsibleTrigger class="trigger-row" style="width:auto" aria-label="Toggle list">${chevron}</button>
        </div>
        <div class="item">andes-ng/ui</div>
        <andes-collapsible-content>
          <div class="item">andes-ng/tokens</div>
          <div class="item">andes-ng/primitives</div>
        </andes-collapsible-content>
      </andes-collapsible>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesCollapsible>;

/** A native `<button>` is the simplest trigger: Space and Enter come for free. */
export const Default: Story = {};

/**
 * The four combinations of `open` and `disabled`. A disabled collapsible keeps its current state
 * (open or closed) and ignores its triggers, whichever state it is frozen in.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports },
    styles,
    template: `
      <div class="panel">
        <andes-collapsible class="item">
          <button andesCollapsibleTrigger class="trigger-row">Closed (default) ${chevron}</button>
          <andes-collapsible-content><div class="body">Closed until the trigger is used.</div></andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item" [open]="true">
          <button andesCollapsibleTrigger class="trigger-row">Open by default ${chevron}</button>
          <andes-collapsible-content><div class="body">Starts expanded.</div></andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item" [disabled]="true">
          <button andesCollapsibleTrigger class="trigger-row">Disabled, closed ${chevron}</button>
          <andes-collapsible-content><div class="body">Never shown.</div></andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item" [open]="true" [disabled]="true">
          <button andesCollapsibleTrigger class="trigger-row">Disabled, open ${chevron}</button>
          <andes-collapsible-content><div class="body">Stays visible and cannot be collapsed.</div></andes-collapsible-content>
        </andes-collapsible>
      </div>
    `,
  }),
};

/** The trigger can be any element: it gets `role="button"`, a tab stop and Enter/Space handling. */
export const CustomTriggerElements: Story = {
  render: () => ({
    moduleMetadata: { imports },
    styles,
    template: `
      <div class="panel">
        <andes-collapsible class="item">
          <andes-collapsible-trigger class="trigger-row">
            Element trigger ${chevron}
          </andes-collapsible-trigger>
          <andes-collapsible-content><div class="body">Any element can toggle the region.</div></andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item">
          <h4 andesCollapsibleTrigger class="trigger-row" style="margin: 0; cursor: pointer;">
            Heading trigger ${chevron}
          </h4>
          <andes-collapsible-content><div class="body">A heading with a button role keeps its text content.</div></andes-collapsible-content>
        </andes-collapsible>
      </div>
    `,
  }),
};

/** Open state is a model, so a parent can drive it and listen to changes. */
export const ControlledFromOutside: Story = {
  render: () => ({
    moduleMetadata: { imports: [...imports, AndesButton] },
    styles,
    props: { open: false, log: [] as string[] },
    template: `
      <div class="panel">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
          <andes-button size="sm" variant="outline" (click)="open = true">Expand</andes-button>
          <andes-button size="sm" variant="outline" (click)="open = false">Collapse</andes-button>
        </div>
        <andes-collapsible [(open)]="open" (openChange)="log = [($event ? 'opened' : 'closed'), ...log].slice(0, 3)">
          <button andesCollapsibleTrigger class="trigger-row">Shipping details ${chevron}</button>
          <andes-collapsible-content>
            <div class="body"><p>Ships within two business days.</p><p>Free returns for 30 days.</p></div>
          </andes-collapsible-content>
        </andes-collapsible>
        <p style="margin-top: 0.75rem; font-size: 0.75rem; line-height: 1.25rem;">State: {{ open ? 'open' : 'closed' }} - last events: {{ log.join(', ') || 'none' }}</p>
      </div>
    `,
  }),
};

/** Several triggers can share one region; each one reports the same expanded state. */
export const MultipleTriggers: Story = {
  render: () => ({
    moduleMetadata: { imports },
    styles,
    template: `
      <andes-collapsible class="panel">
        <button andesCollapsibleTrigger class="trigger-row">Top trigger ${chevron}</button>
        <andes-collapsible-content><div class="body">Shared region.</div></andes-collapsible-content>
        <button andesCollapsibleTrigger class="trigger-row">Bottom trigger ${chevron}</button>
      </andes-collapsible>
    `,
  }),
};

/**
 * Lazy content, three ways. By default the `andesCollapsibleLazy` template is created on first
 * open, so heavy content is not built until needed. `unmountOnClose` destroys it after each
 * collapse animation (the textarea resets). `forceMount` builds it up front, e.g. so form fields
 * exist before opening.
 */
export const LazyContent: Story = {
  render: () => ({
    moduleMetadata: { imports },
    styles,
    template: `
      <div class="panel">
        <andes-collapsible class="item">
          <button andesCollapsibleTrigger class="trigger-row">Activity (loads on first open) ${chevron}</button>
          <andes-collapsible-content>
            <ng-template andesCollapsibleLazy>
              <div class="body"><p>Rendered when first opened.</p><p>Invoice 1042 paid by Acme Corp.</p><p>Invoice 1043 sent to Globex.</p></div>
            </ng-template>
          </andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item">
          <button andesCollapsibleTrigger class="trigger-row">Draft notes (unmountOnClose) ${chevron}</button>
          <andes-collapsible-content unmountOnClose>
            <ng-template andesCollapsibleLazy>
              <div class="body"><andes-textarea rows="3" aria-label="Notes" /></div>
            </ng-template>
          </andes-collapsible-content>
        </andes-collapsible>
        <andes-collapsible class="item">
          <button andesCollapsibleTrigger class="trigger-row">Advanced options (forceMount) ${chevron}</button>
          <andes-collapsible-content forceMount>
            <ng-template andesCollapsibleLazy>
              <div class="body"><label>Reference <andes-input size="sm" /></label></div>
            </ng-template>
          </andes-collapsible-content>
        </andes-collapsible>
      </div>
    `,
  }),
};

/** Common admin use: hide secondary filters until they are asked for. */
export const AdvancedFilters: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      statuses: [
        { value: 'any', label: 'Any' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
    styles: [
      ...styles,
      `.filters { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.75rem; }
       .btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 2rem; padding: 0 0.6875rem; border: 1px solid var(--andes-color-input); border-radius: var(--andes-radius-md); background: var(--andes-color-background); color: inherit; font: inherit; font-size: 0.875rem; cursor: pointer; }
       .btn:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 2px; }
       .filters label { display: grid; gap: 0.25rem; font-size: 0.75rem; line-height: 1.25rem; }
       .filters input[type='date'] { box-sizing: border-box; height: 2rem; padding: 0 0.6875rem; border: 1px solid var(--andes-color-input); border-radius: var(--andes-radius-md); background: var(--andes-color-background); color: inherit; font: inherit; font-size: 0.875rem; }`,
    ],
    template: `
      <andes-collapsible class="panel" style="width: 26rem;">
        <div class="row">
          <andes-input style="flex: 1;" aria-label="Search invoices" placeholder="Search invoices" />
          <button andesCollapsibleTrigger class="btn">Filters ${chevron}</button>
        </div>
        <andes-collapsible-content>
          <div class="filters">
            <label>Status<andes-select aria-label="Status" value="any" [options]="statuses" /></label>
            <label>Customer<andes-input aria-label="Customer" placeholder="Any customer" /></label>
            <label>From<input type="date" /></label>
            <label>To<input type="date" /></label>
          </div>
        </andes-collapsible-content>
      </andes-collapsible>
    `,
  }),
};
