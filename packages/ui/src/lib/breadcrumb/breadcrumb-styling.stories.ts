import { Component, signal, ViewEncapsulation } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesBreadcrumb } from './breadcrumb';
import type { AndesBreadcrumbItemType } from './breadcrumb-items';

const meta: Meta<AndesBreadcrumb> = {
  title: 'Navigation/Breadcrumb/Specialized/Styling',
  component: AndesBreadcrumb,
};

export default meta;

type Story = StoryObj<AndesBreadcrumb>;

const CRUMBS: AndesBreadcrumbItemType[] = [
  { title: 'Home', href: '/' },
  { title: 'Application Center', href: '/apps' },
  {
    title: 'Application List',
    href: '/apps/list',
    menu: {
      items: [
        { label: 'All applications', href: '/apps/list' },
        { label: 'Archived', href: '/apps/archived' },
      ],
    },
  },
  { title: 'An Application' },
];

const LONG_CRUMBS: AndesBreadcrumbItemType[] = [
  { title: 'Home', href: '/' },
  { title: 'Documentation', href: '/docs' },
  { title: 'Building Your Application', href: '/docs/building' },
  { title: 'Data Fetching', href: '/docs/building/data-fetching' },
  { title: 'Caching', href: '/docs/building/data-fetching/caching' },
  { title: 'Revalidating' },
];

/**
 * The classes are styled from a global stylesheet (`ViewEncapsulation.None`): the dropdown panel
 * renders in the overlay container, outside the demo.
 */
@Component({
  selector: 'andes-story-breadcrumb-parts',
  imports: [AndesBreadcrumb],
  encapsulation: ViewEncapsulation.None,
  // Library classes win a tie of specificity (they are added after this sheet), so the rules
  // below are scoped under a parent.
  styles: `
    .story-crumbs-root {
      display: block;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--andes-color-border);
      border-radius: var(--andes-radius-lg);
      background: var(--andes-color-card);
    }
    .story-crumbs-root .story-crumbs-link {
      font-weight: var(--andes-font-weight-medium);
    }
    .story-crumbs-root .story-crumbs-separator {
      color: var(--andes-color-primary);
    }
    .cdk-overlay-pane .story-crumbs-menu {
      border-color: var(--andes-color-primary);
    }
  `,
  template: `
    <andes-breadcrumb
      separator="/"
      [items]="items"
      [maxItems]="4"
      [classNames]="{
        root: 'story-crumbs-root',
        link: 'story-crumbs-link',
        separator: 'story-crumbs-separator',
        menu: 'story-crumbs-menu',
      }"
      [styles]="{
        list: { 'column-gap': '0.375rem' },
        item: { 'letter-spacing': '0.01em' },
        ellipsis: { color: 'var(--andes-color-primary)' },
        menu: { 'border-width': '2px' },
      }"
    />
  `,
})
class SemanticPartsDemo {
  protected readonly items = LONG_CRUMBS.slice(0, 4).concat(CRUMBS.slice(2, 4));
}

/**
 * `classNames` and `styles` reach every part: `root` (the host), `list`, `item`, `link` (whatever
 * a crumb renders: a link, the current page, a button, plain text or a menu trigger),
 * `separator`, `ellipsis` and `menu` (the dropdown panel). They add to a part's own classes and
 * to an item's `className`, and they reach a hand-written (projected) trail as well. Here a card
 * frame on the root, medium-weight crumbs, tinted separators and ellipsis, and an outlined panel.
 * Open the "..." to see the panel.
 */
export const SemanticStyling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`classNames` and `styles` take the parts `root`, `list`, `item`, `link`, `separator`, `ellipsis` and `menu`. The panel renders outside the trail, so style its class from a global stylesheet; `styles` reaches it from anywhere.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [SemanticPartsDemo] })],
  render: () => ({ template: `<andes-story-breadcrumb-parts />` }),
};

/** Flips the direction of the trail and of the menus it opens. */
@Component({
  selector: 'andes-story-breadcrumb-rtl',
  imports: [AndesBreadcrumb, AndesButton],
  template: `
    <andes-button variant="outline" size="sm" (click)="toggle()">
      Direction: {{ dir() }}
    </andes-button>
    <div
      [attr.dir]="dir()"
      style="display: grid; gap: 1.25rem; margin-block-start: 1rem; padding: 1rem; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg);"
    >
      <andes-breadcrumb [items]="items" />
      <andes-breadcrumb [items]="items" separator="/" />
      <andes-breadcrumb [items]="longItems" [maxItems]="4" />
    </div>
  `,
})
class RtlDemo {
  protected readonly dir = signal<'ltr' | 'rtl'>('rtl');
  protected readonly items = CRUMBS;
  protected readonly longItems = LONG_CRUMBS;

  protected toggle(): void {
    this.dir.update((dir) => (dir === 'rtl' ? 'ltr' : 'rtl'));
  }
}

/**
 * The trail follows the text direction: it starts from the right, the default chevron mirrors to
 * point toward the next crumb, the menu caret and the collapse dots are symmetric, and the dropdown
 * panel takes the trail's direction and opens on the edge the trail starts from. A text
 * separator such as `>` is mirrored by the browser itself; `/` is not a mirrored character. Toggle
 * the button to compare, then open a menu.
 */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    docs: {
      description: {
        story:
          'Set `dir="rtl"` on the page or on any ancestor of the trail. The chevron flips, the crumbs run from the right and the dropdown panels repeat the direction and open on the start edge.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [RtlDemo] })],
  render: () => ({ template: `<andes-story-breadcrumb-rtl />` }),
};
