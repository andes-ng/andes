import type { Meta, StoryObj } from '@storybook/angular';

import { AndesToggle } from './toggle';
import { AndesToggleGroup } from './toggle-group';

const bold = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2.5h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.5h4.5a2.5 2.5 0 0 1 0 5H4.5z"/></svg>`;
const italic = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5H6.5M9.5 13.5H6M9.8 2.5 6.2 13.5"/></svg>`;
const star = `<ng-template #starIcon><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/></svg></ng-template>`;
const caret = `<ng-template #caretIcon><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></ng-template>`;

const meta: Meta<AndesToggle> = {
  title: 'Data Entry/Toggle/Basics/Features',
  component: AndesToggle,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesToggle>;

const caption =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground); margin: 0 0 0.375rem;';
const column =
  'display: flex; flex-direction: column; gap: 1.25rem; align-items: flex-start;';
const row =
  'display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;';

/**
 * Icons sit beside the label as `iconStart` / `iconEnd` templates or projected
 * `[slot=icon-start]` / `[slot=icon-end]` elements, and are decorative. A toggle with no text
 * needs an accessible name (`aria-label`, `aria-labelledby` or `tooltip`); without one, a
 * development console warning says so, once per toggle.
 */
export const Icons: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, AndesToggleGroup] },
    template: `
      ${star}${caret}
      <div style="${column}">
        <div>
          <p style="${caption}">Template inputs, with text</p>
          <div style="${row}">
            <andes-toggle [iconStart]="starIcon">Favorite</andes-toggle>
            <andes-toggle variant="outline" [iconStart]="starIcon" [pressed]="true">Favorited</andes-toggle>
            <andes-toggle variant="outline" [iconEnd]="caretIcon">Options</andes-toggle>
            <andes-toggle size="sm" [iconStart]="starIcon">Small</andes-toggle>
            <andes-toggle size="lg" [iconStart]="starIcon" [iconEnd]="caretIcon">Large</andes-toggle>
          </div>
        </div>
        <div>
          <p style="${caption}">Projected slots</p>
          <div style="${row}">
            <andes-toggle variant="outline"><span slot="icon-start" style="display: inline-flex;">${bold}</span>Bold</andes-toggle>
            <andes-toggle variant="outline"><span slot="icon-start" style="display: inline-flex;">${italic}</span>Italic<span slot="icon-end" style="display: inline-flex;">${bold}</span></andes-toggle>
          </div>
        </div>
        <div>
          <p style="${caption}">Icon-only: square, named by aria-label / tooltip</p>
          <div style="${row}">
            <andes-toggle aria-label="Bold" tooltip="Bold" [iconStart]="starIcon" />
            <andes-toggle variant="outline" aria-label="Italic" tooltip="Italic"><span slot="icon-start" style="display: inline-flex;">${italic}</span></andes-toggle>
            <andes-toggle variant="outline" tooltip="Named by its tooltip only" [iconStart]="starIcon" />
            <andes-toggle size="lg" aria-label="Bold, large" variant="outline">${bold}</andes-toggle>
          </div>
        </div>
        <div>
          <p style="${caption}">Inside a group</p>
          <andes-toggle-group aria-label="Text style" type="multiple" variant="outline" [value]="['bold']">
            <andes-toggle value="bold" [iconStart]="starIcon">Bold</andes-toggle>
            <andes-toggle value="italic" aria-label="Italic"><span slot="icon-start" style="display: inline-flex;">${italic}</span></andes-toggle>
            <andes-toggle value="more" [iconEnd]="caretIcon">More</andes-toggle>
          </andes-toggle-group>
        </div>
      </div>
    `,
  }),
};

/**
 * `status` paints the border and the focus ring (`error` danger, `warning` amber) on both
 * variants, pressed or not, alone or in a group. `readOnly` keeps a toggle focusable and
 * looking normal but stops it from changing, with no hover feedback; `disabled` dims it. None
 * of them use an ARIA attribute the `button` role does not allow (`data-status`,
 * `data-readonly`); link an error message with `aria-describedby`.
 */
export const StatusAndReadOnly: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, AndesToggleGroup] },
    props: {
      statusPressed: true,
      lockValue: ['bold'],
    },
    template: `
      <div style="${column}">
        <div>
          <p style="${caption}">Default variant: none, warning, error (unpressed and pressed)</p>
          <div style="${row}">
            <andes-toggle aria-label="No status">Plain</andes-toggle>
            <andes-toggle status="warning" aria-label="Warning">Warning</andes-toggle>
            <andes-toggle status="error" aria-label="Error">Error</andes-toggle>
            <andes-toggle status="warning" [pressed]="true" aria-label="Warning pressed">Warning</andes-toggle>
            <andes-toggle status="error" [pressed]="true" aria-label="Error pressed">Error</andes-toggle>
          </div>
        </div>
        <div>
          <p style="${caption}">Outline variant</p>
          <div style="${row}">
            <andes-toggle variant="outline" aria-label="No status">Plain</andes-toggle>
            <andes-toggle variant="outline" status="warning" aria-label="Warning">Warning</andes-toggle>
            <andes-toggle variant="outline" status="error" aria-label="Error">Error</andes-toggle>
            <andes-toggle variant="outline" status="error" [pressed]="true" aria-label="Error pressed">Error</andes-toggle>
          </div>
        </div>
        <div>
          <p style="${caption}">Group status (joined and spaced)</p>
          <div style="${row}">
            <andes-toggle-group aria-label="Joined error" variant="outline" status="error" type="multiple" [value]="['a']">
              <andes-toggle value="a">One</andes-toggle>
              <andes-toggle value="b">Two</andes-toggle>
              <andes-toggle value="c">Three</andes-toggle>
            </andes-toggle-group>
            <andes-toggle-group aria-label="Spaced warning" variant="outline" status="warning" [spacing]="8" type="multiple" [value]="['b']">
              <andes-toggle value="a">One</andes-toggle>
              <andes-toggle value="b">Two</andes-toggle>
              <andes-toggle value="c">Three</andes-toggle>
            </andes-toggle-group>
          </div>
        </div>
        <div>
          <p style="${caption}">Read-only vs disabled (try Tab, Space and the arrow keys)</p>
          <div style="${row}">
            <andes-toggle readOnly aria-label="Read-only" [(pressed)]="statusPressed">Read-only</andes-toggle>
            <andes-toggle disabled aria-label="Disabled" [pressed]="true">Disabled</andes-toggle>
            <andes-toggle-group aria-label="Read-only group" readOnly type="multiple" variant="outline" [(value)]="lockValue">
              <andes-toggle value="bold">Bold</andes-toggle>
              <andes-toggle value="italic">Italic</andes-toggle>
              <andes-toggle value="underline">Underline</andes-toggle>
            </andes-toggle-group>
          </div>
        </div>
      </div>
    `,
  }),
};
