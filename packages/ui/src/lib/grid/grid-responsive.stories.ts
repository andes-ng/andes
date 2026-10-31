import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesBreakpointService, ANDES_BREAKPOINTS } from './breakpoints';
import { AndesCol } from './grid-col';
import { AndesRow } from './grid-row';

/** Shows the viewport breakpoint the service reports, live. */
@Component({
  selector: 'andes-story-breakpoint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="line">
      Viewport breakpoint: <strong>{{ breakpoint.current() }}</strong> · at
      least <code>lg</code>: <strong>{{ desktop() }}</strong>
    </p>
  `,
  styles: [
    `
      .line {
        margin: 0;
        font:
          14px/22px var(--andes-font-family),
          sans-serif;
        color: var(--andes-color-foreground);
      }
    `,
  ],
})
class StoryBreakpoint {
  protected readonly breakpoint = inject(AndesBreakpointService);
  protected readonly desktop = this.breakpoint.atLeast('lg');
}

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
  title: 'Layout/Grid/Responsive/Breakpoints',
  component: AndesRow,
  subcomponents: { AndesCol },
  decorators: [moduleMetadata({ imports: [AndesCol, StoryBreakpoint] })],
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
/**
 * Props set per breakpoint; they are cumulative and apply from the named width up. Objects set several
 * props at once and span 0 hides the column at that width. The gutter can be a per-breakpoint map too:
 * resize the window to see 8px below 768px, 24px from 768px, 40px from 1200px (horizontal).
 */
export const Responsive: Story = {
  render: () => ({
    styles: [CELLS],
    props: {
      gutter: [
        { xs: 8, md: 24, xl: 40 },
        { xs: 8, md: 24 },
      ],
    },
    template: `
      <andes-story-breakpoint />
      <andes-row [gutter]="16" style="margin-top:1rem;row-gap:16px">
        <andes-col [xs]="24" [sm]="12" [md]="8" [lg]="6" [xl]="4" [xxl]="3"><div class="cell">xs 24 · sm 12 · md 8 · lg 6 · xl 4 · xxl 3</div></andes-col>
        <andes-col [xs]="24" [sm]="12" [md]="8" [lg]="6" [xl]="4" [xxl]="3"><div class="cell cell--alt">same</div></andes-col>
        <andes-col [xs]="24" [sm]="12" [md]="8" [lg]="6" [xl]="4" [xxl]="3"><div class="cell">same</div></andes-col>
        <andes-col [xs]="24" [sm]="12" [md]="8" [lg]="6" [xl]="4" [xxl]="3"><div class="cell cell--alt">same</div></andes-col>
      </andes-row>
      <p class="caption">Objects set several props at once; span 0 hides the column at that width.</p>
      <andes-row [gutter]="16">
        <andes-col [xs]="24" [md]="{ span: 10, offset: 2 }"><div class="cell">offset 2 from md</div></andes-col>
        <andes-col [xs]="0" [md]="12"><div class="cell cell--alt">hidden below md</div></andes-col>
      </andes-row>
      <p class="caption">Responsive gutter: [{ xs: 8, md: 24, xl: 40 }, { xs: 8, md: 24 }]</p>
      <andes-row [gutter]="gutter">
        @for (n of [1, 2, 3, 4, 5, 6]; track n) {
          <andes-col [xs]="24" [sm]="12" [lg]="8"><div class="cell" [class.cell--alt]="n % 2 === 0">{{ n }}</div></andes-col>
        }
      </andes-row>`,
  }),
};

/**
 * In a resizable panel the viewport says nothing about the space a row really has. With
 * `breakpointSource="container"` the breakpoints follow the row's own width: drag the corner.
 */
export const ContainerBreakpoints: Story = {
  render: () => ({
    styles: [CELLS],
    template: `
      <div style="resize:horizontal;overflow:auto;width:min(42rem,100%);min-width:12rem;max-width:100%;padding:1rem;border:1px solid var(--andes-color-border);border-radius:var(--andes-radius-lg);">
        <andes-row #row breakpointSource="container" [gutter]="{ xs: 8, md: 24 }" style="row-gap:8px">
          <andes-col [xs]="24" [sm]="12" [md]="8"><div class="cell">A</div></andes-col>
          <andes-col [xs]="24" [sm]="12" [md]="8"><div class="cell cell--alt">B</div></andes-col>
          <andes-col [xs]="24" [sm]="24" [md]="8"><div class="cell">C</div></andes-col>
        </andes-row>
        <p class="caption">Row breakpoint: <strong>{{ row.breakpoint() }}</strong> (drag the bottom-right corner; the page width does not matter)</p>
      </div>`,
  }),
};

/** The breakpoint thresholds and the live signal are exported for your own code. */
export const BreakpointService: Story = {
  render: () => ({
    props: { thresholds: Object.entries(ANDES_BREAKPOINTS) },
    template: `
      <andes-story-breakpoint />
      <ul style="font:14px/22px var(--andes-font-family),sans-serif;color:var(--andes-color-foreground);padding-inline-start:1.25rem">
        @for (t of thresholds; track t[0]) {<li><code>{{ t[0] }}</code>: from {{ t[1] }}px</li>}
      </ul>`,
  }),
};
