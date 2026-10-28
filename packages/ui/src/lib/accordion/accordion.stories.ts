import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesAccordion } from './accordion';
import { AndesAccordionContent } from './accordion-content';
import { AndesAccordionItem } from './accordion-item';
import { AndesAccordionLazy } from './accordion-lazy';
import { AndesAccordionTrigger } from './accordion-trigger';

const PARTS = [
  AndesAccordionItem,
  AndesAccordionTrigger,
  AndesAccordionContent,
  AndesAccordionLazy,
];

const WIDTH = 'width: 28rem; max-width: 100%;';

/** The three FAQ panels most stories share. */
const FAQ_ITEMS = `
  <andes-accordion-item value="what-is">
    <andes-accordion-trigger>What is Andes NG?</andes-accordion-trigger>
    <andes-accordion-content>
      A zoneless Angular component library published under the MIT license.
    </andes-accordion-content>
  </andes-accordion-item>
  <andes-accordion-item value="styling">
    <andes-accordion-trigger>How is it styled?</andes-accordion-trigger>
    <andes-accordion-content>
      Entirely through CSS custom properties defined in @andes-ng/tokens - no
      component-specific tokens, no runtime theming library.
    </andes-accordion-content>
  </andes-accordion-item>
  <andes-accordion-item value="a11y">
    <andes-accordion-trigger>Is it accessible?</andes-accordion-trigger>
    <andes-accordion-content>
      Each trigger is a native button with aria-expanded and aria-controls; each panel is
      a role="region" cross-linked back to its trigger via aria-labelledby.
    </andes-accordion-content>
  </andes-accordion-item>
`;

/**
 * Demo text field styled like the library's own fields: one focus indicator (primary
 * border plus a soft 2px ring), never the browser's outline drawn as a second frame.
 */
const FIELD_STYLES = `
  <style>
    .sb-field-input {
      box-sizing: border-box;
      height: 2rem;
      margin-inline-start: var(--andes-space-2);
      padding: 0 0.6875rem;
      border: 1px solid var(--andes-color-input);
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-background);
      color: var(--andes-color-foreground);
      font: inherit;
      line-height: 1.375rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .sb-field-input:hover {
      border-color: color-mix(in srgb, var(--andes-color-primary) 65%, var(--andes-color-input));
    }
    .sb-field-input:focus {
      border-color: var(--andes-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--andes-color-primary) 20%, transparent);
      outline: none;
    }
  </style>
`;

const meta: Meta<AndesAccordion> = {
  title: 'Data Display/Accordion/Basics/Accordion',
  component: AndesAccordion,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['single', 'multiple'] },
    disabled: { control: 'boolean' },
    bordered: { control: 'boolean' },
    ghost: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    collapsible: {
      control: 'select',
      options: ['(whole row)', 'header', 'icon', 'disabled'],
      mapping: { '(whole row)': undefined },
    },
    expandIconPosition: { control: 'select', options: ['start', 'end'] },
    destroyOnHidden: { control: 'boolean' },
    arrowNavigation: { control: 'boolean' },
    headingLevel: { control: 'select', options: [2, 3, 4, 5, 6] },
  },
  args: {
    type: 'single',
    disabled: false,
    bordered: false,
    ghost: false,
    size: 'md',
    expandIconPosition: 'end',
    destroyOnHidden: false,
    arrowNavigation: false,
    headingLevel: 3,
  },
  render: (args) => ({
    moduleMetadata: { imports: PARTS },
    props: args,
    template: `
      <andes-accordion
        [type]="type"
        [disabled]="disabled"
        [bordered]="bordered"
        [ghost]="ghost"
        [size]="size"
        [collapsible]="collapsible"
        [expandIconPosition]="expandIconPosition"
        [destroyOnHidden]="destroyOnHidden"
        [arrowNavigation]="arrowNavigation"
        [headingLevel]="headingLevel"
        style="${WIDTH}"
      >${FAQ_ITEMS}</andes-accordion>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesAccordion>;

/** The playground: every input of the accordion is a control. */
export const Default: Story = {};

/**
 * `type` decides how many panels stay open: `single` (left) closes the open panel when another
 * opens, `multiple` (right) lets several stay open at the same time.
 */
export const Types: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 2rem;">
        <andes-accordion type="single" bordered style="${WIDTH}">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion type="multiple" bordered style="${WIDTH}">${FAQ_ITEMS}</andes-accordion>
      </div>
    `,
  }),
};

/** `disabled` locks the whole accordion (top); an item's own `disabled` locks just that panel (bottom). */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <div style="${WIDTH} display: grid; gap: 1.5rem;">
        <andes-accordion disabled>${FAQ_ITEMS}</andes-accordion>
        <andes-accordion>
          <andes-accordion-item value="one">
            <andes-accordion-trigger>Available section</andes-accordion-trigger>
            <andes-accordion-content>This one can be toggled normally.</andes-accordion-content>
          </andes-accordion-item>
          <andes-accordion-item value="two" disabled>
            <andes-accordion-trigger>Disabled section</andes-accordion-trigger>
            <andes-accordion-content>This content is not reachable while disabled.</andes-accordion-content>
          </andes-accordion-item>
          <andes-accordion-item value="three">
            <andes-accordion-trigger>Another available section</andes-accordion-trigger>
            <andes-accordion-content>More content here.</andes-accordion-content>
          </andes-accordion-item>
        </andes-accordion>
      </div>
    `,
  }),
};

/** The three looks: plain dividers (default), `bordered` and `ghost`. Each starts with a panel open. */
export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <div style="${WIDTH} display: grid; gap: 1.5rem;">
        <andes-accordion [activeKey]="['what-is']">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion bordered type="multiple" [activeKey]="['styling']">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion ghost [activeKey]="['what-is']">${FAQ_ITEMS}</andes-accordion>
      </div>
    `,
  }),
};

/** The `sm`, `md` and `lg` sizes. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <div style="${WIDTH} display: grid; gap: 1.5rem;">
        <andes-accordion bordered size="sm" [activeKey]="['what-is']">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion bordered size="md" [activeKey]="['what-is']">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion bordered size="lg" [activeKey]="['what-is']">${FAQ_ITEMS}</andes-accordion>
      </div>
    `,
  }),
};

/**
 * `activeKey` as an initial value and as two-way state. The first accordion opens "First section"
 * through a one-way binding (an initial value only). The second is controlled with
 * `[(activeKey)]`: the buttons set it from outside and the line below shows its value and how
 * many times `activeKeyChange` fired.
 */
export const ActiveKey: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    props: { keys: ['styling'], changes: 0 },
    template: `
      <div style="${WIDTH} display: grid; gap: 1.5rem;">
        <andes-accordion type="multiple" [activeKey]="['one']">
          <andes-accordion-item value="one">
            <andes-accordion-trigger>First section</andes-accordion-trigger>
            <andes-accordion-content>
              Opened initially through a one-way [activeKey] binding (an initial
              value only). Click any trigger to expand/collapse it independently.
            </andes-accordion-content>
          </andes-accordion-item>
          <andes-accordion-item value="two">
            <andes-accordion-trigger>Second section</andes-accordion-trigger>
            <andes-accordion-content>
              Multiple mode lets several panels stay open at the same time.
            </andes-accordion-content>
          </andes-accordion-item>
        </andes-accordion>
        <div style="display: grid; gap: 0.75rem;">
          <andes-accordion
            type="multiple"
            [(activeKey)]="keys"
            (activeKeyChange)="changes = changes + 1"
          >${FAQ_ITEMS}</andes-accordion>
          <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">
            activeKey: [{{ keys.join(', ') }}] - activeKeyChange fired {{ changes }} time(s)
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" (click)="keys = ['what-is', 'styling', 'a11y']">Open all</button>
            <button type="button" (click)="keys = []">Close all</button>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * `expandIcon` takes a template that receives `isActive` (a plus that turns into a minus, top), and
 * `expandIconPosition="start"` moves the icon to the leading edge (bottom).
 */
export const ExpandIcon: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <ng-template #plusMinus let-active>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          @if (!active) { <line x1="12" y1="5" x2="12" y2="19" /> }
        </svg>
      </ng-template>
      <div style="${WIDTH} display: grid; gap: 1.5rem;">
        <andes-accordion bordered [expandIcon]="plusMinus">${FAQ_ITEMS}</andes-accordion>
        <andes-accordion bordered expandIconPosition="start">${FAQ_ITEMS}</andes-accordion>
      </div>
    `,
  }),
};

/** `collapsible` on an item picks what toggles it: the whole row, the header, the icon or nothing. */
export const CollapsibleModes: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <andes-accordion bordered type="multiple" style="${WIDTH}">
        <andes-accordion-item value="row">
          <andes-accordion-trigger>Default: the whole row toggles</andes-accordion-trigger>
          <andes-accordion-content>Click anywhere on the header row.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="header" collapsible="header">
          <andes-accordion-trigger>header: only the text (and icon) toggle</andes-accordion-trigger>
          <andes-accordion-content>The blank part of the row does nothing.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="icon" collapsible="icon">
          <andes-accordion-trigger>icon: only the icon toggles</andes-accordion-trigger>
          <andes-accordion-content>The icon is the button, named by the header text.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="disabled" collapsible="disabled">
          <andes-accordion-trigger>disabled: cannot be toggled</andes-accordion-trigger>
          <andes-accordion-content>Never reachable.</andes-accordion-content>
        </andes-accordion-item>
      </andes-accordion>
    `,
  }),
};

/** The `extra` slot (projected or via the input) does not toggle the panel; `showArrow` hides the arrow. */
export const ExtraAndArrow: Story = {
  render: () => ({
    moduleMetadata: { imports: [...PARTS, AndesButton] },
    props: { edits: 0 },
    template: `
      <andes-accordion bordered type="multiple" style="${WIDTH}">
        <andes-accordion-item value="projected">
          <andes-accordion-trigger>
            Projected extra
            <andes-button andesAccordionExtra variant="ghost" size="xs" (click)="edits = edits + 1">
              Edit ({{ edits }})
            </andes-button>
          </andes-accordion-trigger>
          <andes-accordion-content>Clicking the extra button does not toggle the panel.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="input">
          <andes-accordion-trigger extra="3 files">Extra via the input</andes-accordion-trigger>
          <andes-accordion-content>Plain text extra, muted.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="no-arrow" [showArrow]="false">
          <andes-accordion-trigger>No arrow (showArrow=false)</andes-accordion-trigger>
          <andes-accordion-content>Still toggles from the whole row.</andes-accordion-content>
        </andes-accordion-item>
      </andes-accordion>
    `,
  }),
};

/** A leading icon projected inside the trigger. */
export const HeaderIcon: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    template: `
      <andes-accordion bordered [activeKey]="['sales']" style="${WIDTH}">
        <andes-accordion-item value="sales">
          <andes-accordion-trigger>
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 3 3 5-6" />
              </svg>
              Sales report
            </span>
          </andes-accordion-trigger>
          <andes-accordion-content>Monthly revenue by branch.</andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="stock">
          <andes-accordion-trigger>
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 8l-9-5-9 5 9 5 9-5z" />
                <path d="M3 8v8l9 5 9-5V8" />
              </svg>
              Stock levels
            </span>
          </andes-accordion-trigger>
          <andes-accordion-content>Units on hand per warehouse.</andes-accordion-content>
        </andes-accordion-item>
      </andes-accordion>
    `,
  }),
};

/** `arrowNavigation` (opt-in) moves focus between the triggers with the arrow keys; Home and End jump to the ends. */
export const ArrowNavigation: Story = {
  args: { arrowNavigation: true, bordered: true },
};

/**
 * Panels that render lazily. The first is projected and always rendered; the second is a
 * `andesAccordionLazy` template rendered on first open and kept after close unless
 * `destroyOnHidden`; the third adds `forceRender` to render up front. Type in a field, close and
 * reopen to see what survives.
 */
export const LazyContent: Story = {
  args: { destroyOnHidden: false },
  render: (args) => ({
    moduleMetadata: { imports: PARTS },
    props: args,
    template: `${FIELD_STYLES}
      <andes-accordion type="multiple" [destroyOnHidden]="destroyOnHidden" style="${WIDTH}">
        <andes-accordion-item value="eager">
          <andes-accordion-trigger>Projected (always rendered)</andes-accordion-trigger>
          <andes-accordion-content>
            <label>Type something, close, reopen: <input class="sb-field-input" aria-label="Eager field" /></label>
          </andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="lazy">
          <andes-accordion-trigger>Lazy template (rendered on first open)</andes-accordion-trigger>
          <andes-accordion-content>
            <ng-template andesAccordionLazy>
              <label>Kept after close unless destroyOnHidden: <input class="sb-field-input" aria-label="Lazy field" /></label>
            </ng-template>
          </andes-accordion-content>
        </andes-accordion-item>
        <andes-accordion-item value="forced" forceRender>
          <andes-accordion-trigger>Lazy + forceRender (rendered up front)</andes-accordion-trigger>
          <andes-accordion-content>
            <ng-template andesAccordionLazy>Rendered before the first open.</ng-template>
          </andes-accordion-content>
        </andes-accordion-item>
      </andes-accordion>
    `,
  }),
};
