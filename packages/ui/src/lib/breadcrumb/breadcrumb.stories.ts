import { type Meta, type StoryObj } from '@storybook/angular';
import { action } from 'storybook/actions';

import {
  AndesBreadcrumb,
  AndesBreadcrumbEllipsis,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbList,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
} from './breadcrumb';
import type { AndesBreadcrumbItemType } from './breadcrumb-items';

const imports = [
  AndesBreadcrumb,
  AndesBreadcrumbList,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
  AndesBreadcrumbEllipsis,
];

/**
 * The story arg is deliberately NOT named `ariaLabel`: Storybook assigns args whose key matches a
 * component property but not an input name (the input's public name is its `aria-label` alias)
 * straight onto the component instance, which replaced the `ariaLabel` signal with a string and
 * threw `ctx.ariaLabel is not a function` on every change detection.
 */
interface BreadcrumbStoryArgs {
  navLabel: string;
}

const meta: Meta<BreadcrumbStoryArgs> = {
  title: 'Navigation/Breadcrumb/Basics/Trail',
  component: AndesBreadcrumb,
  tags: ['autodocs'],
  argTypes: {
    navLabel: { name: 'aria-label', control: 'text' },
  },
  args: {
    navLabel: 'breadcrumb',
  },
  render: (args) => ({
    moduleMetadata: { imports },
    props: args,
    template: `
      <andes-breadcrumb [aria-label]="navLabel">
        <ol andesBreadcrumbList>
          <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
          <li andesBreadcrumbSeparator></li>
          <li andesBreadcrumbItem><a andesBreadcrumbLink href="/components">Components</a></li>
          <li andesBreadcrumbSeparator></li>
          <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </andes-breadcrumb>
    `,
  }),
};

export default meta;

type Story = StoryObj<BreadcrumbStoryArgs>;

export const Overview: Story = {};

/**
 * The shapes a projected trail can take, stacked: three levels with the default separator, two
 * levels, a single crumb that is only the current page, a custom text separator (`/`), and a
 * localized `aria-label` with translated crumbs.
 */
export const Trails: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Settings</span></li>
          </ol>
        </andes-breadcrumb>
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Home</span></li>
          </ol>
        </andes-breadcrumb>
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
            <li andesBreadcrumbSeparator>/</li>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/docs">Docs</a></li>
            <li andesBreadcrumbSeparator>/</li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
          </ol>
        </andes-breadcrumb>
        <andes-breadcrumb aria-label="Ruta de navegación">
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Inicio</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Componentes</span></li>
          </ol>
        </andes-breadcrumb>
      </div>
    `,
  }),
};

/**
 * Three ways to show a collapsed middle in a projected trail: a plain ellipsis, an ellipsis with
 * `[items]` that turns it into a dropdown trigger so the hidden crumbs stay reachable (Escape,
 * outside click and arrow-key/typeahead navigation come from `AndesDropdownMenu`), and the same
 * with crumbs that have no `href`: they render as plain menu entries, navigation is handled from
 * `(itemSelected)`, `[label]` localizes the trigger's accessible name and `disabled` greys an
 * entry out.
 */
export const Collapsed: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      hiddenCrumbs: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Building Your Application', href: '/docs/building' },
        { label: 'Data Fetching', href: '/docs/building/data-fetching' },
      ],
      hiddenWithoutHrefs: [
        { label: 'Documentación' },
        { label: 'Componentes' },
        { label: 'Archivado', disabled: true },
      ],
      onSelect: (item: { label: string }) => action('itemSelected')(item),
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><andes-breadcrumb-ellipsis></andes-breadcrumb-ellipsis></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <a andesBreadcrumbLink href="/docs/components">Components</a>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
          </ol>
        </andes-breadcrumb>
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <andes-breadcrumb-ellipsis [items]="hiddenCrumbs"></andes-breadcrumb-ellipsis>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <a andesBreadcrumbLink href="/docs/components">Components</a>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
          </ol>
        </andes-breadcrumb>
        <andes-breadcrumb aria-label="Ruta de navegación">
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Inicio</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <andes-breadcrumb-ellipsis
                label="Más"
                [items]="hiddenWithoutHrefs"
                (itemSelected)="onSelect($event)"
              ></andes-breadcrumb-ellipsis>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
          </ol>
        </andes-breadcrumb>
      </div>
    `,
  }),
};

/**
 * A narrow container: the trail wraps onto several lines instead of overflowing. Shown for a
 * projected trail and for a data-driven one that has a crumb with a menu.
 */
export const NarrowContainers: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      narrowItems: [
        { title: 'Home', href: '/' },
        { title: 'Documentation', href: '/docs' },
        {
          title: 'Components',
          menu: {
            items: [
              { label: 'Button', href: '/docs/button' },
              { label: 'Breadcrumb', href: '/docs/breadcrumb' },
            ],
          },
        },
        { title: 'Breadcrumb with a long title' },
      ] satisfies AndesBreadcrumbItemType[],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
        <div style="max-width: 220px; border: 1px dashed var(--andes-color-border); padding: 0.5rem;">
          <andes-breadcrumb>
            <ol andesBreadcrumbList>
              <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Home</a></li>
              <li andesBreadcrumbSeparator></li>
              <li andesBreadcrumbItem><a andesBreadcrumbLink href="/docs">Docs</a></li>
              <li andesBreadcrumbSeparator></li>
              <li andesBreadcrumbItem><a andesBreadcrumbLink href="/docs/components">Components</a></li>
              <li andesBreadcrumbSeparator></li>
              <li andesBreadcrumbItem><span andesBreadcrumbPage>Breadcrumb</span></li>
            </ol>
          </andes-breadcrumb>
        </div>
        <div style="max-width: 220px; border: 1px dashed var(--andes-color-border); padding: 0.5rem;">
          <andes-breadcrumb [items]="narrowItems" />
        </div>
      </div>
    `,
  }),
};
