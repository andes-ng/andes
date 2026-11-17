import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideCircleX,
  lucideClock,
  lucideLoaderCircle,
  lucideTag,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { ANDES_PALETTE_COLORS } from '../palette/palette';
import { AndesTag, AndesTagCloseEvent } from './tag';

const meta: Meta<AndesTag> = {
  title: 'Data Display/Tag/Basics',
  component: AndesTag,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'default',
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'processing',
        'error',
        ...ANDES_PALETTE_COLORS,
      ],
    },
    icon: { control: false },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'solid'],
    },
    bordered: { control: 'boolean' },
    disabled: { control: 'boolean' },
    closable: { control: 'boolean' },
    hideOnClose: { control: 'boolean' },
    href: { control: 'text' },
    target: { control: 'text' },
    checkable: { control: 'boolean' },
    checked: { control: 'boolean' },
    clickable: { control: 'boolean' },
  },
  args: {
    color: 'default',
    variant: 'outlined',
    bordered: true,
    disabled: false,
    closable: false,
    hideOnClose: false,
    checkable: false,
    checked: false,
    clickable: false,
  },
  render: (args) => ({
    props: args,
    template: `<andes-tag [color]="color" [variant]="variant" [bordered]="bordered" [disabled]="disabled" [closable]="closable" [hideOnClose]="hideOnClose" [href]="href" [target]="target" [checkable]="checkable" [checked]="checked" [clickable]="clickable">Tag</andes-tag>`,
  }),
};

export default meta;

type Story = StoryObj<AndesTag>;

/** The playground: every input is a control (variant, color, closable, link, checkable...). */
export const Default: Story = {};

/**
 * The three `variant`s across the seven theme colors. Use the controls on the playground above
 * for the `bordered`, `closable` and `clickable` switches.
 */
export const Variants: Story = {
  render: () => ({
    props: {
      colors: [
        'default',
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        @for (variant of ['outlined', 'filled', 'solid']; track variant) {
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            @for (color of colors; track color) {
              <andes-tag [color]="color" [variant]="variant">{{ color }}</andes-tag>
            }
          </div>
        }
      </div>
    `,
  }),
};

/**
 * Any CSS color works as `color`. Solid picks black or white text by the background's
 * luminance; outlined/filled keep the hue but clamp its lightness so the text stays readable
 * in both themes. The second block is the named palette hues for categorizing (themed for light
 * and dark), which go through the same readable-text derivation in every variant.
 */
export const Colors: Story = {
  render: () => ({
    props: { palette: ANDES_PALETTE_COLORS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 48rem;">
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          @for (variant of ['outlined', 'filled', 'solid']; track variant) {
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <andes-tag color="#f50" [variant]="variant">#f50</andes-tag>
              <andes-tag color="#2db7f5" [variant]="variant">#2db7f5</andes-tag>
              <andes-tag color="#87d068" [variant]="variant">#87d068</andes-tag>
              <andes-tag color="#108ee9" [variant]="variant">#108ee9</andes-tag>
              <andes-tag color="#fadb14" [variant]="variant">#fadb14</andes-tag>
              <andes-tag color="rebeccapurple" [variant]="variant">rebeccapurple</andes-tag>
            </div>
          }
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          @for (variant of ['outlined', 'filled', 'solid']; track variant) {
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              @for (color of palette; track color) {
                <andes-tag [color]="color" [variant]="variant">{{ color }}</andes-tag>
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};

/**
 * Status tags: the `processing` and `error` aliases sit beside `success`/`warning`/`default`,
 * so the same status value can drive a badge and a tag. The `icon` input takes a template.
 */
export const StatusTags: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [
        provideIcons({
          lucideCircleCheck,
          lucideLoaderCircle,
          lucideCircleX,
          lucideTriangleAlert,
          lucideClock,
        }),
      ],
    },
    template: `
      <ng-template #success><ng-icon name="lucideCircleCheck" /></ng-template>
      <ng-template #processing><ng-icon name="lucideLoaderCircle" /></ng-template>
      <ng-template #error><ng-icon name="lucideCircleX" /></ng-template>
      <ng-template #warning><ng-icon name="lucideTriangleAlert" /></ng-template>
      <ng-template #waiting><ng-icon name="lucideClock" /></ng-template>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        @for (variant of ['outlined', 'filled', 'solid']; track variant) {
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <andes-tag color="success" [variant]="variant" [icon]="success">success</andes-tag>
            <andes-tag color="processing" [variant]="variant" [icon]="processing">processing</andes-tag>
            <andes-tag color="error" [variant]="variant" [icon]="error">error</andes-tag>
            <andes-tag color="warning" [variant]="variant" [icon]="warning">warning</andes-tag>
            <andes-tag color="default" [variant]="variant" [icon]="waiting">waiting</andes-tag>
          </div>
        }
      </div>
    `,
  }),
};

/**
 * Tag states: `disabled`, `bordered=false` (same box size, no visible border) and `clickable`
 * (a button-like tag that is a Tab stop and reacts to Enter and Space).
 */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag color="primary" disabled>Disabled</andes-tag>
          <andes-tag color="primary" variant="filled" disabled>Disabled filled</andes-tag>
          <andes-tag color="primary" clickable>Clickable</andes-tag>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag [bordered]="false">Default</andes-tag>
          <andes-tag [bordered]="false" color="primary" variant="filled">Primary</andes-tag>
          <andes-tag [bordered]="false" color="success" variant="filled">Success</andes-tag>
          <andes-tag [bordered]="false" color="danger" variant="filled">Danger</andes-tag>
          <andes-tag [bordered]="false" color="#722ed1" variant="filled">#722ed1</andes-tag>
          <andes-tag [bordered]="false" color="primary" variant="filled" closable>Borderless closable</andes-tag>
        </div>
      </div>
    `,
  }),
};

/** `href` turns the tag into a link; with `target="_blank"` it opens in a new tab. */
export const AsLink: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <andes-tag color="primary" href="https://andes-ng.dev">Same tab</andes-tag>
        <andes-tag color="primary" href="https://andes-ng.dev" target="_blank">New tab</andes-tag>
      </div>
    `,
  }),
};

/**
 * `checkable` tags toggle on click: unchecked, checked by default (`[checked]="true"`), and a
 * small group of them.
 */
export const Checkable: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag checkable>Unchecked</andes-tag>
          <andes-tag checkable [checked]="true">Checked by default</andes-tag>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag checkable>Movies</andes-tag>
          <andes-tag checkable [checked]="true">Music</andes-tag>
          <andes-tag checkable>Books</andes-tag>
        </div>
      </div>
    `,
  }),
};

/**
 * `closable` tags: a single one, a list of them, and `closeIcon` - a custom close-button
 * template (setting it implies `closable`) with its own `closeAriaLabel`.
 */
export const Closable: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [provideIcons({ lucideCircleX })],
    },
    template: `
      <ng-template #closeIcon><ng-icon name="lucideCircleX" /></ng-template>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag color="primary" closable>Angular</andes-tag>
          <andes-tag color="success" closable>TypeScript</andes-tag>
          <andes-tag color="info" closable>Storybook</andes-tag>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-tag color="primary" [closeIcon]="closeIcon">Custom icon</andes-tag>
          <andes-tag color="danger" variant="filled" [closeIcon]="closeIcon" closeAriaLabel="Delete filter">Filter</andes-tag>
        </div>
      </div>
    `,
  }),
};

/**
 * `hideOnClose` - uncontrolled mode: the tag hides itself after `closed`, unless the handler
 * calls `event.preventDefault()`. The second tag vetoes every close.
 */
export const HideOnClosePreventable: Story = {
  render: () => ({
    props: {
      veto: (event: AndesTagCloseEvent) => event.preventDefault(),
    },
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <andes-tag color="primary" closable hideOnClose>Closes itself</andes-tag>
        <andes-tag color="warning" closable hideOnClose (closed)="veto($event)">Vetoed - stays</andes-tag>
      </div>
    `,
  }),
};

/**
 * The `slot=icon` leading icon: an emoji in a closable tag, then an icon in every rendering form
 * (static, closable, link, checkable).
 */
export const Icons: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [provideIcons({ lucideTag })],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-tag closable>
            <span slot="icon">⭐</span>
            Starred
          </andes-tag>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <andes-tag color="primary"><ng-icon slot="icon" name="lucideTag" />Static</andes-tag>
          <andes-tag color="success" closable><ng-icon slot="icon" name="lucideTag" />Closable</andes-tag>
          <andes-tag color="info" href="https://andes-ng.dev"><ng-icon slot="icon" name="lucideTag" />Link</andes-tag>
          <andes-tag checkable [checked]="true"><ng-icon slot="icon" name="lucideTag" />Checkable</andes-tag>
        </div>
      </div>
    `,
  }),
};

/**
 * Add and remove tags at runtime. Each tag opts into the built-in motion with Angular's
 * native animation API - `animate.enter="andes-tag-enter"` and
 * `animate.leave="andes-tag-leave"` on the host - so it fades in when added and out when
 * closed (instantly under `prefers-reduced-motion`). The first tag is not closable.
 */
export const AddAndRemove: Story = {
  render: () => {
    const tags = signal(['Unremovable', 'Invoices', 'Q3 close']);
    const draft = signal('');
    return {
      moduleMetadata: { imports: [AndesButton, AndesInput] },
      props: {
        tags,
        remove: (tag: string) =>
          tags.update((all) => all.filter((t) => t !== tag)),
        draft,
        add: () => {
          const value = draft().trim();
          if (value && !tags().includes(value)) {
            tags.update((all) => [...all, value]);
          }
          draft.set('');
        },
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 32rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; min-height: 1.5rem;">
            @for (tag of tags(); track tag; let first = $first) {
              <andes-tag
                color="primary"
                variant="filled"
                [closable]="!first"
                animate.enter="andes-tag-enter"
                animate.leave="andes-tag-leave"
                (closed)="remove(tag)"
              >{{ tag }}</andes-tag>
            }
          </div>
          <form style="display: flex; gap: 0.5rem;" (submit)="$event.preventDefault(); add()">
            <andes-input
              aria-label="New tag"
              placeholder="New tag"
              [(value)]="draft"
            />
            <andes-button type="submit" variant="outline">Add</andes-button>
          </form>
        </div>
      `,
    };
  },
};

/**
 * Reordering by drag and drop, composed from the CDK drag-drop directives on the tag hosts -
 * the tag itself needs nothing special. Story-only: drag-drop belongs to the list, not to
 * the tag.
 */
export const Draggable: Story = {
  render: () => {
    const tags = signal(['Accounts', 'Payables', 'Receivables', 'Ledger']);
    return {
      moduleMetadata: { imports: [CdkDropList, CdkDrag] },
      props: {
        tags,
        drop: (event: CdkDragDrop<string[]>) =>
          tags.update((all) => {
            const next = [...all];
            moveItemInArray(next, event.previousIndex, event.currentIndex);
            return next;
          }),
      },
      template: `
        <div
          cdkDropList
          cdkDropListOrientation="horizontal"
          (cdkDropListDropped)="drop($event)"
          style="display: flex; align-items: center; gap: 0.5rem;"
        >
          @for (tag of tags(); track tag) {
            <andes-tag cdkDrag style="cursor: grab;">{{ tag }}</andes-tag>
          }
        </div>
      `,
    };
  },
};
