import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesSpace } from './space';
import { AndesSpaceItem } from './space-item';

const BOX =
  'display:flex;align-items:center;justify-content:center;min-width:3rem;height:2rem;padding:0 0.75rem;background:var(--andes-color-muted);color:var(--andes-color-foreground);border:1px solid var(--andes-color-border);border-radius:var(--andes-radius-md);font:14px/22px var(--andes-font-family),sans-serif;';
const CAPTION =
  'margin:0 0 0.5rem;font:12px/20px var(--andes-font-family),sans-serif;color:var(--andes-color-muted-foreground);';
const LINK =
  'color:var(--andes-color-primary-text, var(--andes-color-primary));font:14px/22px var(--andes-font-family),sans-serif;text-decoration:none;';

const meta: Meta<AndesSpace> = {
  title: 'Layout/Space/Basics/Space',
  component: AndesSpace,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AndesSpaceItem],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: {
      control: 'text',
      description:
        '`sm`, `md`, `lg`, a number of pixels, a CSS length or `[h, v]`.',
    },
    align: {
      control: 'select',
      options: [undefined, 'start', 'end', 'center', 'baseline'],
    },
    wrap: { control: 'boolean' },
    split: {
      control: 'text',
      description: 'Text or a template drawn between items.',
    },
  },
  args: {
    direction: 'horizontal',
    size: 'sm',
    align: undefined,
    wrap: false,
    split: undefined,
  },
  render: (args) => ({
    props: { ...args, box: BOX },
    template: `
      <andes-space [direction]="direction" [size]="size" [align]="align" [wrap]="wrap" [split]="split || null">
        @for (n of [1, 2, 3, 4]; track n) {
          <div andesSpaceItem [style]="box">Item {{ n }}</div>
        }
      </andes-space>`,
  }),
};

export default meta;

type Story = StoryObj<AndesSpace>;
export const Default: Story = {};

/** Gap presets, a number of pixels or any CSS length, in a row and in a column; a pair sets the horizontal and the vertical gap separately (the vertical one shows once items wrap). */
export const Sizes: Story = {
  render: () => ({
    props: {
      box: BOX,
      cap: CAPTION,
      items: Array.from({ length: 12 }, (_, i) => i + 1),
    },
    template: `
      <div style="display:grid;gap:1rem">
        @for (s of ['sm', 'md', 'lg', 4, '2rem']; track s) {
          <div>
            <p [style]="cap">size = {{ s }}</p>
            <andes-space [size]="s"><div [style]="box">A</div><div [style]="box">B</div><div [style]="box">C</div></andes-space>
          </div>
        }
        <div>
          <p [style]="cap">direction = vertical, size = md</p>
          <andes-space direction="vertical" size="md"><div [style]="box">A</div><div [style]="box">B</div><div [style]="box">C</div></andes-space>
        </div>
        <div>
          <p [style]="cap">size = [8, 24], wrapped</p>
          <andes-space [size]="[8, 24]" wrap style="max-width:22rem">
            @for (n of items; track n) {<div [style]="box">Tag {{ n }}</div>}
          </andes-space>
        </div>
      </div>`,
  }),
};

export const Align: Story = {
  render: () => ({
    props: { box: BOX, cap: CAPTION },
    template: `
      <div style="display:grid;gap:1rem">
        @for (a of ['start', 'center', 'end', 'baseline']; track a) {
          <div>
            <p [style]="cap">align = {{ a }}</p>
            <andes-space [align]="a" style="padding:0.5rem;border:1px dashed var(--andes-color-border);border-radius:var(--andes-radius-md)">
              <div [style]="box + 'height:4rem'">Tall</div>
              <div [style]="box">Short</div>
              <div [style]="box">Short</div>
            </andes-space>
          </div>
        }
      </div>`,
  }),
};

export const Wrap: Story = {
  render: () => ({
    props: { box: BOX, items: Array.from({ length: 14 }, (_, i) => i + 1) },
    template: `
      <andes-space wrap size="md" style="max-width:24rem">
        @for (n of items; track n) {<div [style]="box">Tag {{ n }}</div>}
      </andes-space>`,
  }),
};

/**
 * `split` draws a separator between items: text, or a template (a dot, a rule in a column). Mark each
 * child with `andesSpaceItem`: the separator is rendered as a real, `aria-hidden` sibling after every
 * item except the last.
 */
export const Split: Story = {
  render: () => ({
    props: { link: LINK },
    template: `
      <andes-space split="|" size="md">
        <a andesSpaceItem href="#edit" [style]="link">Edit</a>
        <a andesSpaceItem href="#duplicate" [style]="link">Duplicate</a>
        <a andesSpaceItem href="#archive" [style]="link">Archive</a>
      </andes-space>

      <ng-template #dot><span style="display:block;width:4px;height:4px;border-radius:50%;background:var(--andes-color-muted-foreground)"></span></ng-template>
      <andes-space [split]="dot" size="md" style="margin-top:1.5rem">
        <a andesSpaceItem href="#a" [style]="link">Purchase orders</a>
        <a andesSpaceItem href="#b" [style]="link">Goods receipts</a>
        <a andesSpaceItem href="#c" [style]="link">Invoices</a>
      </andes-space>

      <ng-template #rule><div style="height:1px;background:var(--andes-color-border);align-self:stretch;width:12rem"></div></ng-template>
      <andes-space direction="vertical" [split]="rule" size="md" style="margin-top:1.5rem">
        <span andesSpaceItem style="font:14px/22px var(--andes-font-family),sans-serif">First section</span>
        <span andesSpaceItem style="font:14px/22px var(--andes-font-family),sans-serif">Second section</span>
        <span andesSpaceItem style="font:14px/22px var(--andes-font-family),sans-serif">Third section</span>
      </andes-space>`,
  }),
};

/** Items that come and go: the separators always sit between what is currently shown. */
export const SplitWithConditionalItems: Story = {
  render: () => {
    const showArchive = signal(true);
    return {
      props: { showArchive, link: LINK },
      template: `
        <label style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem;font:14px/22px var(--andes-font-family),sans-serif">
          <input type="checkbox" [checked]="showArchive()" (change)="showArchive.set(!showArchive())" />
          Show "Archive"
        </label>
        <andes-space split="/" size="md">
          <a andesSpaceItem href="#edit" [style]="link">Edit</a>
          @if (showArchive()) {
            <a andesSpaceItem href="#archive" [style]="link">Archive</a>
          }
          <a andesSpaceItem href="#delete" [style]="link">Delete</a>
        </andes-space>`,
    };
  },
};
