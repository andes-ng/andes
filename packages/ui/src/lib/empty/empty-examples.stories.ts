import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSmile } from '@ng-icons/lucide';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  EMPTY_BOX,
  EMPTY_CAPTION,
  EMPTY_FRAME,
  EMPTY_NOTE,
  EMPTY_STACK,
  EMPTY_SURFACE,
  emptyGrid,
} from '../../testing/empty-story-layout';
import { AndesButton } from '../button/button';
import { AndesCascader } from '../cascader/cascader';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesSelect } from '../select/select';
import { AndesTreeSelect } from '../tree-select/tree-select';
import { AndesEmpty } from './empty';
import { AndesEmptyProvider } from './empty-config';
import type { AndesEmptyStyleInfo } from './empty-types';

/**
 * Every example of Ant Design's Empty page, in Ant's order and under Ant's names, built with
 * Andes components. Ant's "ConfigProvider" example shows Select, TreeSelect, Cascader, Transfer
 * and Table; `Component integrations` opens the real Select, TreeSelect and Cascader with no
 * data, and shows the listbox and table-body patterns Transfer and Table use.
 */
const meta: Meta<AndesEmpty> = {
  title: 'Data Display/Empty/Examples',
  component: AndesEmpty,
  decorators: [
    moduleMetadata({
      imports: [
        AndesButton,
        AndesCascader,
        AndesCheckbox,
        AndesEmptyProvider,
        AndesSelect,
        AndesTreeSelect,
        NgIcon,
      ],
      providers: [provideIcons({ lucideSmile })],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesEmpty>;

const surface = EMPTY_SURFACE;
const panel = EMPTY_BOX;
const heading = EMPTY_CAPTION;

/** Ant's `empty.svg`, redrawn as a data URI so the story needs no network. */
const CUSTOM_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="156" height="100" viewBox="0 0 156 100" fill="none"><ellipse cx="78" cy="88" rx="62" ry="8" fill="#94a3b8" fill-opacity=".18"/><rect x="26" y="18" width="104" height="62" rx="8" fill="#94a3b8" fill-opacity=".14" stroke="#94a3b8" stroke-width="3"/><path d="M26 38l52 24 52-24" stroke="#94a3b8" stroke-width="3" stroke-linejoin="round"/></svg>',
  );

/** The default illustration and the default message, `No data`. */
export const Basic: Story = {
  render: () => ({
    template: `<div style="${surface} ${panel}"><andes-empty /></div>`,
  }),
};

/**
 * `image` chooses the built-in illustration: `default` (a bare `<andes-empty />`) or `simple`,
 * the compact one that fits a table body or a dropdown.
 */
export const ChooseImage: Story = {
  name: 'Choose image',
  render: () => ({
    template: `
      <div style="${surface} ${EMPTY_STACK}">
        <div style="${panel}"><andes-empty image="default" /></div>
        <div style="${panel}"><andes-empty image="simple" /></div>
      </div>`,
  }),
};

/**
 * A custom image source (a URL or a data URI) sized through `styles.image`, a description with
 * a link, and extra content - a button - projected under the message.
 */
export const Customize: Story = {
  render: () => ({
    props: { art: CUSTOM_IMAGE },
    template: `
      <div style="${surface} ${panel}">
        <andes-empty [image]="art" imageAlt="An empty mailbox" [styles]="{ image: { height: '60px' } }" [description]="text">
          <ng-template #text>Customize <a href="#api" style="color: var(--andes-color-primary-text, var(--andes-color-primary));">Description</a></ng-template>
          <andes-button size="md">Create Now</andes-button>
        </andes-empty>
      </div>`,
  }),
};

/** `description` takes text, or a template for rich content such as a link; `false` hides it. */
export const CustomizeDescription: Story = {
  name: 'Customize Description',
  render: () => ({
    template: `
      <div style="${surface} ${emptyGrid('16rem')}">
        <div style="${panel}"><andes-empty description="No invoices match your filters" /></div>
        <div style="${panel}">
          <andes-empty [description]="rich">
            <ng-template #rich>
              No members yet. <a href="#invite" style="color: var(--andes-color-primary-text, var(--andes-color-primary));">Learn how to invite people</a>
            </ng-template>
          </andes-empty>
        </div>
        <div style="${panel}"><andes-empty heading="No projects" description="Create a project to start collecting your work." /></div>
      </div>`,
  }),
};

/**
 * One setting for every empty state: `[andesEmptyProvider]` (or `provideAndesEmpty()` in the
 * application providers) sets the image and message of each `andes-empty` below it, and of the
 * "no data" areas of the components in it - this Select, TreeSelect and Cascader, which you open
 * to see. Toggle it to compare.
 */
export const ConfigProvider: Story = {
  name: 'ConfigProvider',
  render: () => ({
    props: { customize: true, noOptions: [] },
    template: `
      <div style="${surface} max-width: 20rem;">
        <andes-checkbox [(checked)]="customize">Customize</andes-checkbox>
        <ng-template #smile><ng-icon name="lucideSmile" size="20" aria-hidden="true" /></ng-template>
        <div style="${EMPTY_STACK} margin-top: 1.5rem; min-height: 22rem;" [andesEmptyProvider]="customize
            ? { image: smile, description: 'Data Not Found', styles: { image: { height: 'auto' } } }
            : {}">
          <div>
            <h4 style="${heading}">Select</h4>
            <andes-select aria-label="Select" style="width: 200px;" [options]="noOptions" />
          </div>
          <div>
            <h4 style="${heading}">TreeSelect</h4>
            <andes-tree-select aria-label="TreeSelect" style="width: 200px;" [nodes]="noOptions" />
          </div>
          <div>
            <h4 style="${heading}">Cascader</h4>
            <andes-cascader aria-label="Cascader" style="width: 200px;" [options]="noOptions" />
          </div>
          <div>
            <h4 style="${heading}">Empty</h4>
            <div style="${panel}"><andes-empty preset="table" /></div>
          </div>
          <div>
            <h4 style="${heading}">List</h4>
            <div style="${panel}"><andes-empty preset="list" /></div>
          </div>
        </div>
      </div>`,
  }),
};

/**
 * Where an empty state belongs inside other components. Select, TreeSelect and Cascader are the
 * real components, opened with no data: each shows an `andes-empty` (the `select` preset) in its
 * not-found area, here with the message `Data Not Found` set through `[andesEmptyProvider]`.
 * Their `notFoundContent` accepts text, a template, or nothing (`null`) to hide the state.
 * Table, Transfer and List adopt `andes-empty` on their own branches; until then the listbox and
 * table-body patterns below are what they use.
 */
export const ComponentIntegrations: Story = {
  name: 'Component integrations',
  render: () => ({
    props: { noOptions: [] },
    template: `
      <div style="${surface}">
        <div style="${emptyGrid('14rem')} min-height: 12rem;" [andesEmptyProvider]="{ description: 'Data Not Found' }">
          <div>
            <h4 style="${heading}">Select</h4>
            <p style="${EMPTY_NOTE} margin: 0 0 0.75rem;">Select with no options.</p>
            <andes-select aria-label="Select" [options]="noOptions" [open]="true" />
          </div>
          <div>
            <h4 style="${heading}">TreeSelect</h4>
            <p style="${EMPTY_NOTE} margin: 0 0 0.75rem;">TreeSelect with no nodes.</p>
            <andes-tree-select aria-label="TreeSelect" [nodes]="noOptions" [open]="true" />
          </div>
          <div>
            <h4 style="${heading}">Cascader</h4>
            <p style="${EMPTY_NOTE} margin: 0 0 0.75rem;">Cascader with no options.</p>
            <andes-cascader aria-label="Cascader" [options]="noOptions" [open]="true" />
          </div>
        </div>
        <div style="${emptyGrid('14rem')} min-height: 14rem; margin-top: 1.5rem;">
          <div>
            <h4 style="${heading}">Select (text)</h4>
            <andes-select aria-label="Text" [options]="noOptions" [open]="true" notFoundContent="Data Not Found" />
          </div>
          <div>
            <h4 style="${heading}">Select (template)</h4>
            <andes-select aria-label="Template" [options]="noOptions" [open]="true" [notFoundContent]="slot" />
            <ng-template #slot>
              <andes-empty image="simple" size="small" description="Data Not Found">
                <andes-button size="sm" variant="outline">Add option</andes-button>
              </andes-empty>
            </ng-template>
          </div>
          <div>
            <h4 style="${heading}">Select (none)</h4>
            <andes-select aria-label="None" [options]="noOptions" [open]="true" [notFoundContent]="null" />
          </div>
        </div>
        <div style="${emptyGrid('16rem')} margin-top: 1.5rem;">
          <div>
            <h4 style="${heading}">Transfer: listbox pattern</h4>
            <div style="${panel}"><andes-empty preset="list" description="Data Not Found" /></div>
          </div>
          <div>
            <h4 style="${heading}">Table: body pattern</h4>
            <div style="${EMPTY_FRAME} overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--andes-color-muted);">
                    <th style="padding: 10px 16px; font-weight: 600; text-align: start;">Name</th>
                    <th style="padding: 10px 16px; font-weight: 600; text-align: start;">Age</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="2" style="padding: 0; border-top: 1px solid var(--andes-color-border);"><andes-empty preset="table" description="Data Not Found" /></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p style="${EMPTY_NOTE}">Table, Transfer and List adopt <code>andes-empty</code> on their own branches.</p>
      </div>`,
  }),
};

const stylesObject = {
  root: {
    backgroundColor: 'var(--andes-color-muted)',
    borderRadius: '8px',
  },
  image: { filter: 'grayscale(100%)' },
  description: {
    color: 'var(--andes-color-primary-text, var(--andes-color-primary))',
    fontWeight: 700,
  },
  footer: { marginTop: '16px' },
};

const stylesFunction = ({ props }: AndesEmptyStyleInfo) =>
  props.description
    ? {
        root: {
          backgroundColor: 'var(--andes-color-muted)',
          border: '1px solid var(--andes-color-primary)',
        },
        description: {
          color: 'var(--andes-color-primary-text, var(--andes-color-primary))',
          fontWeight: 700,
        },
        image: { filter: 'hue-rotate(180deg)' },
      }
    : {};

/**
 * `classNames` and `styles` reach each part (`root`, `image`, `heading`, `description`,
 * `footer`), as objects or as functions of the resolved state (`{ props }`).
 */
export const CustomSemanticDomStyling: Story = {
  name: 'Custom semantic dom styling',
  render: () => ({
    props: {
      classNames: { root: 'empty-example-root' },
      stylesObject,
      stylesFunction,
    },
    styles: [
      '.empty-example-root { border: 1px dashed var(--andes-color-muted-foreground); padding: 2rem 1rem; }',
    ],
    template: `
      <div style="${surface} ${EMPTY_STACK}">
        <andes-empty image="simple" description="Object styles" [classNames]="classNames" [styles]="stylesObject">
          <andes-button size="md">Create Now</andes-button>
        </andes-empty>
        <andes-empty image="simple" description="Function styles" [classNames]="classNames" [styles]="stylesFunction">
          <andes-button size="md">Create Now</andes-button>
        </andes-empty>
      </div>`,
  }),
};

/** `description` set to `false` leaves only the picture. */
export const NoDescription: Story = {
  name: 'No description',
  render: () => ({
    template: `<div style="${surface} ${panel}"><andes-empty [description]="false" /></div>`,
  }),
};
