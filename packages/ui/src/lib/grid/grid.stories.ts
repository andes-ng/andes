import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesCol } from './grid-col';
import { AndesRow } from './grid-row';

const CELLS = `
  .cell {
    box-sizing: border-box; min-height: 2.5rem; padding: 0.5rem 0.75rem;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--andes-color-primary) 14%, var(--andes-color-background));
    border: 1px solid color-mix(in srgb, var(--andes-color-primary) 35%, var(--andes-color-background));
    border-radius: var(--andes-radius-md);
    color: var(--andes-color-foreground);
    font: 14px/22px var(--andes-font-family), sans-serif;
  }
  .cell--alt { background: var(--andes-color-muted); border-color: var(--andes-color-border); }
  .cell--tall { min-height: 6rem; }
  .caption { margin: 1rem 0 0.5rem; font: 12px/20px var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); }
  .caption:first-child { margin-top: 0; }
`;

const meta: Meta<AndesRow> = {
  title: 'Layout/Grid/Basics/Grid',
  component: AndesRow,
  subcomponents: { AndesCol },
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AndesCol] })],
  parameters: { layout: 'padded' },
  argTypes: {
    gutter: {
      control: 'object',
      description:
        'Pixels, a CSS length, a `[horizontal, vertical]` pair, or a per-breakpoint map.',
    },
    align: {
      control: 'select',
      options: [undefined, 'top', 'middle', 'bottom', 'stretch'],
    },
    justify: {
      control: 'select',
      options: [
        undefined,
        'start',
        'end',
        'center',
        'space-around',
        'space-between',
        'space-evenly',
      ],
    },
    wrap: { control: 'boolean' },
    breakpointSource: {
      control: 'inline-radio',
      options: ['viewport', 'container'],
    },
  },
  args: {
    gutter: 16,
    align: undefined,
    justify: undefined,
    wrap: true,
    breakpointSource: 'viewport',
  },
  render: (args) => ({
    props: args,
    styles: [CELLS],
    template: `
      <andes-row [gutter]="gutter" [align]="align" [justify]="justify" [wrap]="wrap" [breakpointSource]="breakpointSource">
        <andes-col [span]="8"><div class="cell">span 8</div></andes-col>
        <andes-col [span]="8"><div class="cell cell--alt">span 8</div></andes-col>
        <andes-col [span]="8"><div class="cell">span 8</div></andes-col>
      </andes-row>`,
  }),
};

export default meta;

type Story = StoryObj<AndesRow>;
export const Default: Story = {};

/** Every row is 24 columns wide; the gutter is a `gap`, so rows never overflow their parent. */
export const Spans: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <andes-row [gutter]="8" style="row-gap: 8px">
        <andes-col [span]="24"><div class="cell">24</div></andes-col>
        <andes-col [span]="12"><div class="cell cell--alt">12</div></andes-col>
        <andes-col [span]="12"><div class="cell cell--alt">12</div></andes-col>
        <andes-col [span]="8"><div class="cell">8</div></andes-col>
        <andes-col [span]="8"><div class="cell">8</div></andes-col>
        <andes-col [span]="8"><div class="cell">8</div></andes-col>
        <andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col>
        <andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col>
        <andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col>
        <andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col>
        <andes-col [span]="5"><div class="cell">5</div></andes-col>
        <andes-col [span]="19"><div class="cell">19</div></andes-col>
      </andes-row>`,
  }),
};

/** A number is the horizontal gutter, a pair adds the vertical one, a map changes it per breakpoint. */
export const Gutter: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <p class="caption">gutter = 0</p>
      <andes-row [gutter]="0"><andes-col [span]="6"><div class="cell">6</div></andes-col><andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col><andes-col [span]="6"><div class="cell">6</div></andes-col><andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col></andes-row>
      <p class="caption">gutter = 16</p>
      <andes-row [gutter]="16"><andes-col [span]="6"><div class="cell">6</div></andes-col><andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col><andes-col [span]="6"><div class="cell">6</div></andes-col><andes-col [span]="6"><div class="cell cell--alt">6</div></andes-col></andes-row>
      <p class="caption">gutter = [32, 16] - the second value is the gap between wrapped lines</p>
      <andes-row [gutter]="[32, 16]">
        @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) {
          <andes-col [span]="6"><div class="cell" [class.cell--alt]="n % 2 === 0">{{ n }}</div></andes-col>
        }
      </andes-row>
      <p class="caption">gutter = '2rem' - any CSS length</p>
      <andes-row gutter="2rem"><andes-col [span]="12"><div class="cell">12</div></andes-col><andes-col [span]="12"><div class="cell cell--alt">12</div></andes-col></andes-row>`,
  }),
};

/** `align` places the columns on the cross axis and `justify` distributes them on the main axis. */
export const Alignment: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      @for (a of ['top', 'middle', 'bottom', 'stretch']; track a) {
        <p class="caption">align = {{ a }}</p>
        <andes-row [gutter]="16" [align]="a" style="background:var(--andes-color-muted);border-radius:var(--andes-radius-md)">
          <andes-col [span]="6"><div class="cell cell--tall">tall</div></andes-col>
          <andes-col [span]="6"><div class="cell">short</div></andes-col>
          <andes-col [span]="6"><div class="cell cell--tall">tall</div></andes-col>
          <andes-col [span]="6"><div class="cell">short</div></andes-col>
        </andes-row>
      }
      @for (j of ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly']; track j) {
        <p class="caption">justify = {{ j }}</p>
        <andes-row [gutter]="16" [justify]="j">
          <andes-col [span]="4"><div class="cell">4</div></andes-col>
          <andes-col [span]="4"><div class="cell cell--alt">4</div></andes-col>
          <andes-col [span]="4"><div class="cell">4</div></andes-col>
        </andes-row>
      }`,
  }),
};

/**
 * `offset` pushes a column to the right in the flow, `order` reorders columns (also per breakpoint: the
 * sidebar comes first on small screens and last from 768px), and `push` and `pull` shift a column
 * visually without moving its siblings.
 */
export const Placement: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <p class="caption">offset</p>
      <andes-row [gutter]="16" style="row-gap:8px">
        <andes-col [span]="8"><div class="cell">span 8</div></andes-col>
        <andes-col [span]="8" [offset]="8"><div class="cell cell--alt">span 8, offset 8</div></andes-col>
        <andes-col [span]="6" [offset]="6"><div class="cell">span 6, offset 6</div></andes-col>
        <andes-col [span]="6" [offset]="6"><div class="cell cell--alt">span 6, offset 6</div></andes-col>
        <andes-col [span]="8" [offset]="8"><div class="cell">centred: span 8, offset 8</div></andes-col>
      </andes-row>
      <p class="caption">order</p>
      <andes-row [gutter]="16">
        <andes-col [span]="6" [order]="4"><div class="cell">1 (order 4)</div></andes-col>
        <andes-col [span]="6" [order]="3"><div class="cell cell--alt">2 (order 3)</div></andes-col>
        <andes-col [span]="6" [order]="2"><div class="cell">3 (order 2)</div></andes-col>
        <andes-col [span]="6" [order]="1"><div class="cell cell--alt">4 (order 1)</div></andes-col>
      </andes-row>
      <p class="caption">Order per breakpoint: the sidebar comes first on small screens and last from 768px.</p>
      <andes-row [gutter]="16">
        <andes-col [xs]="{ span: 24, order: 1 }" [md]="{ span: 8, order: 2 }"><div class="cell cell--alt">Sidebar</div></andes-col>
        <andes-col [xs]="{ span: 24, order: 2 }" [md]="{ span: 16, order: 1 }"><div class="cell">Content</div></andes-col>
      </andes-row>
      <p class="caption">push and pull</p>
      <andes-row [gutter]="16">
        <andes-col [span]="18" [push]="6"><div class="cell">span 18, push 6</div></andes-col>
        <andes-col [span]="6" [pull]="18"><div class="cell cell--alt">span 6, pull 18</div></andes-col>
      </andes-row>`,
  }),
};

/** `flex` replaces the span: a number grows proportionally, a length is a fixed basis. */
export const FlexColumns: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <andes-row [gutter]="16">
        <andes-col flex="100px"><div class="cell">100px</div></andes-col>
        <andes-col [flex]="1"><div class="cell cell--alt">flex 1</div></andes-col>
        <andes-col [flex]="2"><div class="cell">flex 2</div></andes-col>
        <andes-col flex="0 0 20%"><div class="cell cell--alt">0 0 20%</div></andes-col>
      </andes-row>`,
  }),
};

export const Nested: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <andes-row [gutter]="16">
        <andes-col [span]="12">
          <div class="cell cell--alt" style="display:block">
            Outer 12
            <andes-row [gutter]="8" style="margin-top:8px">
              <andes-col [span]="12"><div class="cell">inner 12</div></andes-col>
              <andes-col [span]="12"><div class="cell">inner 12</div></andes-col>
            </andes-row>
          </div>
        </andes-col>
        <andes-col [span]="12"><div class="cell cell--tall">Outer 12</div></andes-col>
      </andes-row>`,
  }),
};

export const NoWrap: Story = {
  args: { wrap: false },
  render: (args) => ({
    props: args,
    styles: [CELLS],
    template: `
      <andes-row [gutter]="8" [wrap]="wrap">
        @for (n of [1, 2, 3, 4]; track n) {
          <andes-col [span]="12"><div class="cell">{{ n }} (span 12)</div></andes-col>
        }
      </andes-row>`,
  }),
};

/** Logical properties: offsets, pushes and the gutter mirror automatically. */
export const RightToLeft: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <div dir="rtl">
        <andes-row [gutter]="16" style="row-gap:8px">
          <andes-col [span]="8"><div class="cell">1</div></andes-col>
          <andes-col [span]="8" [offset]="8"><div class="cell cell--alt">2 (offset 8)</div></andes-col>
          <andes-col [span]="18" [push]="6"><div class="cell">3 (push 6)</div></andes-col>
          <andes-col [span]="6" [pull]="18"><div class="cell cell--alt">4 (pull 18)</div></andes-col>
        </andes-row>
      </div>`,
  }),
};
