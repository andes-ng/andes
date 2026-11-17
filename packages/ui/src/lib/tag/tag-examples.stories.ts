import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Directive, afterNextRender, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBriefcase,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideClock,
  lucideMessageSquare,
  lucidePlus,
  lucideRefreshCw,
  lucideTrash2,
  lucideUsers,
  lucideVideo,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesCheckableTagGroup } from './checkable-tag-group';
import { AndesTag, AndesTagCloseEvent } from './tag';

/** Focuses the `andes-input` it sits on as soon as it is rendered (the "New Tag" field). */
@Directive({ selector: 'andes-input[andesStoryFocus]' })
class AndesStoryFocus {
  constructor() {
    const input = inject(AndesInput);
    afterNextRender(() => input.focus());
  }
}

const ICONS = provideIcons({
  lucideBriefcase,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideClock,
  lucideMessageSquare,
  lucidePlus,
  lucideRefreshCw,
  lucideTrash2,
  lucideUsers,
  lucideVideo,
});

/** A row of tags: 8px apart, like Ant Design's `Flex gap="small"`. */
const ROW = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';
/** A section title, like the dividers between Ant's example groups. */
const TITLE =
  'margin: 1.25rem 0 0.75rem; font: 500 0.875rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TITLE_FIRST = `${TITLE} margin-top: 0;`;

const PRESETS = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];
const CUSTOMS = ['#f50', '#2db7f5', '#87d068', '#108ee9'];
const VARIANTS = ['filled', 'solid', 'outlined'];

const meta: Meta<AndesTag> = {
  title: 'Data Display/Tag/Examples',
  component: AndesTag,
  decorators: [
    moduleMetadata({
      imports: [
        AndesTag,
        AndesCheckableTagGroup,
        AndesButton,
        AndesInput,
        NgIcon,
        CdkDropList,
        CdkDrag,
        AndesStoryFocus,
      ],
      providers: [ICONS],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'One story for each example of the Ant Design Tag, in the same order and with the same names.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesTag>;

/**
 * Plain, link, closable (default and custom `closeIcon`) tags; `closed` can be vetoed with
 * `preventDefault()` and `hideOnClose` makes the tag remove itself.
 */
export const Basic: Story = {
  render: () => ({
    props: {
      log: (event: AndesTagCloseEvent) => console.log('closed', event),
      preventDefault: (event: AndesTagCloseEvent) => {
        event.preventDefault();
        console.log('Clicked! But prevent default.');
      },
    },
    template: `
      <ng-template #circle><ng-icon name="lucideCircleX" /></ng-template>
      <ng-template #trash><ng-icon name="lucideTrash2" /></ng-template>
      <div style="${ROW}">
        <andes-tag>Tag 1</andes-tag>
        <andes-tag>
          <a href="https://github.com/ant-design/ant-design/issues/1862" target="_blank" rel="noopener noreferrer" aria-label="Ant Design issue">Link</a>
        </andes-tag>
        <andes-tag closeIcon hideOnClose (closed)="preventDefault($event)">Prevent Default</andes-tag>
        <andes-tag [closeIcon]="circle" hideOnClose (closed)="log($event)">Tag 2</andes-tag>
        <andes-tag [closeIcon]="trash" closeAriaLabel="Close Button" hideOnClose (closed)="log($event)">Tag 3</andes-tag>
      </div>
    `,
  }),
};

/** The preset colors and four custom hex colors, each in `filled`, `solid` and `outlined`. */
export const ColorfulTag: Story = {
  render: () => ({
    props: { presets: PRESETS, customs: CUSTOMS, variants: VARIANTS },
    template: `
      @for (variant of variants; track variant) {
        <p style="${TITLE}">Presets ({{ variant }})</p>
        <div style="${ROW}">
          @for (color of presets; track color) {
            <andes-tag [color]="color" [variant]="variant">{{ color }}</andes-tag>
          }
        </div>
      }
      @for (variant of variants; track variant) {
        <p style="${TITLE}">Custom ({{ variant }})</p>
        <div style="${ROW}">
          @for (color of customs; track color) {
            <andes-tag [color]="color" [variant]="variant">{{ color }}</andes-tag>
          }
        </div>
      }
    `,
  }),
};

/**
 * A list of tags built from an array: remove one with its close button, add one through the
 * "New Tag" input (Enter or blur confirms), and double-click a tag to rename it.
 */
export const AddAndRemoveDynamically: Story = {
  render: () => {
    const tags = signal(['Unremovable', 'Tag 2', 'Tag 3']);
    const adding = signal(false);
    const draft = signal('');
    const editing = signal(-1);
    const edit = signal('');
    return {
      props: {
        tags,
        adding,
        draft,
        editing,
        edit,
        remove: (tag: string) =>
          tags.update((all) => all.filter((t) => t !== tag)),
        confirmAdd: () => {
          const value = draft().trim();
          if (value && !tags().includes(value)) {
            tags.update((all) => [...all, value]);
          }
          adding.set(false);
          draft.set('');
        },
        startEdit: (index: number, tag: string) => {
          if (index !== 0) {
            editing.set(index);
            edit.set(tag);
          }
        },
        confirmEdit: () => {
          const value = edit().trim();
          const index = editing();
          if (index >= 0 && value) {
            tags.update((all) => all.map((t, i) => (i === index ? value : t)));
          }
          editing.set(-1);
          edit.set('');
        },
      },
      template: `
        <div style="${ROW}">
          @for (tag of tags(); track tag; let index = $index) {
            @if (editing() === index) {
              <andes-input andesStoryFocus size="sm" style="width: 4rem" aria-label="Rename tag" [(value)]="edit" (pressEnter)="confirmEdit()" (blurred)="confirmEdit()" />
            } @else {
              <andes-tag [closable]="index !== 0" style="user-select: none" (closed)="remove(tag)">
                <span (dblclick)="startEdit(index, tag)">{{ tag }}</span>
              </andes-tag>
            }
          }
          @if (adding()) {
            <andes-input andesStoryFocus size="sm" style="width: 4rem" aria-label="New tag" [(value)]="draft" (pressEnter)="confirmAdd()" (blurred)="confirmAdd()" />
          } @else {
            <ng-template #plus><ng-icon name="lucidePlus" /></ng-template>
            <andes-tag clickable [icon]="plus" [styles]="{ root: { borderStyle: 'dashed', background: 'transparent' } }" (tagClick)="adding.set(true)">New Tag</andes-tag>
          }
        </div>
      `,
    };
  },
};

/**
 * `checked` tags and a `CheckableTagGroup` in single and multiple mode; bind the state with
 * `[(checked)]` / `[(value)]` and the parent owns it.
 */
export const Checkable: Story = {
  render: () => {
    const checked = signal(true);
    const single = signal<string | number | null>('Books');
    const multiple = signal<readonly (string | number)[]>(['Movies', 'Music']);
    return {
      props: {
        checked,
        single,
        multiple,
        options: ['Movies', 'Books', 'Music', 'Sports'],
      },
      template: `
        <div style="display: grid; grid-template-columns: 6rem auto; align-items: center; gap: 1rem 0.5rem; max-width: 32rem; font: 0.875rem/1.25rem var(--andes-font-family), sans-serif;">
          <span>Checkable</span>
          <div><andes-tag checkable [(checked)]="checked">Yes</andes-tag></div>
          <span>Single</span>
          <andes-checkable-tag-group aria-label="Single" [options]="options" [(value)]="single" />
          <span>Multiple</span>
          <andes-checkable-tag-group aria-label="Multiple" multiple [options]="options" [(value)]="multiple" />
        </div>
      `,
    };
  },
};

/**
 * Tags that animate in when added and out when removed with Angular's `animate.enter` and
 * `animate.leave`, which a `prefers-reduced-motion` visitor skips.
 */
export const Animate: Story = {
  render: () => {
    const tags = signal(['Tag 1', 'Tag 2', 'Tag 3']);
    const adding = signal(false);
    const draft = signal('');
    return {
      props: {
        tags,
        adding,
        draft,
        remove: (tag: string) =>
          tags.update((all) => all.filter((t) => t !== tag)),
        confirmAdd: () => {
          const value = draft().trim();
          if (value && !tags().includes(value)) {
            tags.update((all) => [...all, value]);
          }
          adding.set(false);
          draft.set('');
        },
      },
      template: `
        <div style="${ROW} margin-bottom: 0.5rem;">
          @for (tag of tags(); track tag) {
            <andes-tag closable animate.enter="andes-tag-enter" animate.leave="andes-tag-leave" (closed)="remove(tag)">{{ tag }}</andes-tag>
          }
        </div>
        @if (adding()) {
          <andes-input andesStoryFocus size="sm" style="width: 4.875rem" aria-label="New tag" [(value)]="draft" (pressEnter)="confirmAdd()" (blurred)="confirmAdd()" />
        } @else {
          <ng-template #plus><ng-icon name="lucidePlus" /></ng-template>
          <andes-tag clickable [icon]="plus" [styles]="{ root: { borderStyle: 'dashed', background: 'transparent' } }" (tagClick)="adding.set(true)">New Tag</andes-tag>
        }
      `,
    };
  },
};

/**
 * Tags with an `icon` (a template or a projected `slot=icon` element), checkable tags with an
 * icon, and bare third-party `<svg>` icons sized in `em` and in `px` that stay centred.
 */
export const Icon: Story = {
  render: () => ({
    props: {
      checked: signal([true, false, false, false]),
      toggle(checked: ReturnType<typeof signal<boolean[]>>, index: number) {
        checked.update((all) => all.map((c, i) => (i === index ? !c : c)));
      },
    },
    template: `
      <ng-template #chat><ng-icon name="lucideMessageSquare" /></ng-template>
      <ng-template #video><ng-icon name="lucideVideo" /></ng-template>
      <ng-template #users><ng-icon name="lucideUsers" /></ng-template>
      <ng-template #work><ng-icon name="lucideBriefcase" /></ng-template>
      <p style="${TITLE_FIRST}">Tag with icon</p>
      <div style="${ROW}">
        <andes-tag [icon]="chat" color="#55acee">Twitter</andes-tag>
        <andes-tag [icon]="video" color="#cd201f">Youtube</andes-tag>
        <andes-tag [icon]="users" color="#3b5999">Facebook</andes-tag>
        <andes-tag [icon]="work" color="#55acee">LinkedIn</andes-tag>
      </div>
      <p style="${TITLE}">CheckableTag with icon</p>
      <div style="${ROW}">
        <andes-tag checkable [icon]="chat" [checked]="checked()[0]" (checkedChange)="toggle(checked, 0)">Twitter</andes-tag>
        <andes-tag checkable [icon]="video" [checked]="checked()[1]" (checkedChange)="toggle(checked, 1)">Youtube</andes-tag>
        <andes-tag checkable [icon]="users" [checked]="checked()[2]" (checkedChange)="toggle(checked, 2)">Facebook</andes-tag>
        <andes-tag checkable [icon]="work" [checked]="checked()[3]" (checkedChange)="toggle(checked, 3)">LinkedIn</andes-tag>
      </div>
      <p style="${TITLE}">Tag with third-party icon</p>
      <div style="${ROW}">
        <andes-tag color="#f50">
          <svg slot="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg>
          Star (em)
        </andes-tag>
        <andes-tag color="#eb2f96">
          <svg slot="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 20.7l-1.4-1.3C5.4 14.8 2 11.7 2 8a5 5 0 0 1 10-1.7A5 5 0 0 1 22 8c0 3.7-3.4 6.8-8.6 11.4L12 20.7z" /></svg>
          Heart (px)
        </andes-tag>
        <andes-tag closable>
          <svg slot="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 20.7l-1.4-1.3C5.4 14.8 2 11.7 2 8a5 5 0 0 1 10-1.7A5 5 0 0 1 22 8c0 3.7-3.4 6.8-8.6 11.4L12 20.7z" /></svg>
          Closable
        </andes-tag>
      </div>
    `,
  }),
};

/** The five status colors (`success`, `processing`, `warning`, `error`, `default`) in each variant. */
export const StatusTag: Story = {
  render: () => ({
    props: { variants: VARIANTS },
    template: `
      <ng-template #success><ng-icon name="lucideCircleCheck" /></ng-template>
      <ng-template #processing><ng-icon name="lucideRefreshCw" /></ng-template>
      <ng-template #warning><ng-icon name="lucideCircleAlert" /></ng-template>
      <ng-template #error><ng-icon name="lucideCircleX" /></ng-template>
      <ng-template #waiting><ng-icon name="lucideClock" /></ng-template>
      @for (variant of variants; track variant) {
        <p style="${TITLE}">Status ({{ variant }})</p>
        <div style="${ROW}">
          <andes-tag color="success" [variant]="variant" [icon]="success">success</andes-tag>
          <andes-tag color="processing" [variant]="variant" [icon]="processing">processing</andes-tag>
          <andes-tag color="warning" [variant]="variant" [icon]="warning">warning</andes-tag>
          <andes-tag color="error" [variant]="variant" [icon]="error">error</andes-tag>
          <andes-tag color="default" [variant]="variant" [icon]="waiting">default</andes-tag>
        </div>
      }
    `,
  }),
};

/** Tags that can be dragged into a new order, with the `@angular/cdk/drag-drop` directives. */
export const DraggableTag: Story = {
  render: () => {
    const tags = signal(['Tag 1', 'Tag 2', 'Tag 3']);
    return {
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
        <div cdkDropList cdkDropListOrientation="mixed" style="${ROW}" (cdkDropListDropped)="drop($event)">
          @for (tag of tags(); track tag) {
            <andes-tag cdkDrag style="cursor: move;">{{ tag }}</andes-tag>
          }
        </div>
      `,
    };
  },
};

/**
 * `classNames` and `styles` restyle the `root`, `icon` and `content` of a tag (and the `root`
 * and `item` of a checkable tag group), as objects or as functions of the tag's props.
 */
export const CustomSemanticDomStyling: Story = {
  render: () => ({
    props: {
      classNames: { root: 'story-tag-root' },
      objectStyles: {
        root: { backgroundColor: '#e6f7ff' },
        icon: { color: '#52c41a' },
        content: { color: '#262626' },
      },
      functionStyles: (info: { props: { variant: string } }) =>
        info.props.variant === 'filled'
          ? {
              root: { backgroundColor: '#F5EFFF' },
              icon: { color: '#8F87F1' },
              content: { color: '#8F87F1' },
            }
          : undefined,
      groupStyles: {
        root: {
          gap: 12,
          padding: '8px 12px',
          backgroundColor: 'rgba(82, 196, 26, 0.08)',
          borderRadius: 8,
        },
        item: {
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          borderColor: 'rgba(82, 196, 26, 0.3)',
          color: '#52c41a',
        },
      },
      groupStylesFn: (info: { props: { multiple: boolean } }) =>
        info.props.multiple
          ? {
              root: {
                gap: 16,
                padding: '8px 12px',
                backgroundColor: 'rgba(143, 135, 241, 0.08)',
                borderRadius: 8,
              },
              item: {
                backgroundColor: 'rgba(143, 135, 241, 0.1)',
                borderColor: 'rgba(143, 135, 241, 0.3)',
                color: '#8F87F1',
                fontWeight: 500,
              },
            }
          : {},
    },
    styles: [
      ':host ::ng-deep .story-tag-root { padding: 2px 6px; border-radius: 4px; }',
    ],
    template: `
      <ng-template #ok><ng-icon name="lucideCircleCheck" /></ng-template>
      <ng-template #bad><ng-icon name="lucideCircleX" /></ng-template>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="${ROW} gap: 1rem;">
          <andes-tag variant="filled" [classNames]="classNames" [styles]="objectStyles" [icon]="ok">Object</andes-tag>
          <andes-tag variant="filled" [classNames]="classNames" [styles]="functionStyles" [icon]="bad">Function</andes-tag>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;">
          <andes-checkable-tag-group aria-label="Object styles" [classNames]="{ root: 'story-tag-root' }" [styles]="groupStyles" [options]="['React', 'Vue', 'Angular']" />
          <andes-checkable-tag-group aria-label="Function styles" multiple [classNames]="{ root: 'story-tag-root' }" [styles]="groupStylesFn" [options]="['meet-student', 'thinkasany']" />
        </div>
      </div>
    `,
  }),
};

/** A disabled tag in each form: plain, link, colored, with an icon, closable, borderless and checkable. */
export const Disabled: Story = {
  render: () => ({
    props: { checked: signal(['Books']) },
    template: `
      <ng-template #ok><ng-icon name="lucideCircleCheck" /></ng-template>
      <ng-template #bad><ng-icon name="lucideCircleX" /></ng-template>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="${ROW}">
          <andes-tag disabled>Basic Tag</andes-tag>
          <andes-tag disabled><a href="https://ant.design">Link Tag</a></andes-tag>
          <andes-tag disabled href="https://ant.design">Href Tag</andes-tag>
          <andes-tag disabled color="success" [icon]="ok">Icon Tag</andes-tag>
        </div>
        <div style="${ROW}">
          <andes-tag disabled color="red">Preset Color Red</andes-tag>
          <andes-tag disabled color="#f50">Custom Color #f50 Outlined</andes-tag>
          <andes-tag disabled color="#f50" variant="solid">Custom Color #f50 Solid</andes-tag>
          <andes-tag disabled color="#f50" variant="filled">Custom Color #f50 Filled</andes-tag>
          <andes-tag disabled color="success">Preset Status Success</andes-tag>
        </div>
        <div style="${ROW}">
          <andes-checkable-tag-group aria-label="Disabled" multiple disabled [value]="checked()" [options]="['Books', 'Movies', 'Music']" />
        </div>
        <div style="${ROW}">
          <andes-tag disabled closable>Closable Tag</andes-tag>
          <andes-tag disabled closable color="success" [icon]="ok">Closable with Icon</andes-tag>
          <andes-tag disabled [closeIcon]="bad">Closable with Custom Icon</andes-tag>
        </div>
        <div style="${ROW}">
          <andes-tag disabled variant="filled">Borderless Basic</andes-tag>
          <andes-tag disabled variant="filled" color="success" [icon]="ok">Borderless with Icon</andes-tag>
          <andes-tag disabled variant="filled" closable>Borderless Closable</andes-tag>
        </div>
      </div>
    `,
  }),
};
