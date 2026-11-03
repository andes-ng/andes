import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideHouse,
  lucidePackage,
  lucideSettings,
  lucideShoppingCart,
  lucideUsers,
} from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSidebar } from './sidebar';
import { AndesSidebarMenuButton } from './sidebar-menu-button';
import {
  AndesSidebarContent,
  AndesSidebarFooter,
  AndesSidebarGroup,
  AndesSidebarGroupLabel,
  AndesSidebarHeader,
  AndesSidebarInset,
  AndesSidebarMenu,
  AndesSidebarMenuBadge,
  AndesSidebarMenuItem,
  AndesSidebarMenuSub,
  AndesSidebarSeparator,
} from './sidebar-parts';
import { AndesSidebarProvider } from './sidebar-provider';
import { AndesSidebarTrigger } from './sidebar-trigger';

/** The demos' icons are lucide, at 16px, through `ng-icon` (each story registers them). */
const ICON = (name: string) => `<ng-icon name="${name}" size="16" />`;
const HOME = ICON('lucideHouse');
const BOX = ICON('lucidePackage');
const CART = ICON('lucideShoppingCart');
const CHART = ICON('lucideChartColumn');
const USERS = ICON('lucideUsers');
const GEAR = ICON('lucideSettings');

const STYLES = `
  .stage { height: 30rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); overflow: hidden; }
  .stage--short { height: 20rem; }
  .brand { display: flex; align-items: center; gap: 0.5rem; height: 2rem; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; font: 600 14px/22px var(--andes-font-family), sans-serif; }
  .brand__mark { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: var(--andes-radius-md); background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); font-size: 12px; }
  .bar { display: flex; align-items: center; gap: 0.5rem; height: 3rem; padding: 0 0.75rem; border-bottom: 1px solid var(--andes-color-border); flex: none; }
  .bar__title { font: 600 16px/24px var(--andes-font-family), sans-serif; }
  .page { padding: 1rem; font: 14px/22px var(--andes-font-family), sans-serif; }
  .who { display: flex; align-items: center; gap: 0.5rem; padding: 0 0.5rem; height: 2.5rem; overflow: hidden; white-space: nowrap; font: 14px/22px var(--andes-font-family), sans-serif; }
  .who__avatar { flex: none; width: 1.5rem; height: 1.5rem; border-radius: 9999px; background: var(--andes-color-muted); border: 1px solid var(--andes-color-border); }
  .who__name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; }
  .card { padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card); color: var(--andes-color-card-foreground); }
  .card__label { color: var(--andes-color-muted-foreground); font-size: 12px; line-height: 20px; }
  .card__value { font: 600 24px/32px var(--andes-font-family), sans-serif; }
  .grow { flex: 1; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: start; border-bottom: 1px solid var(--andes-color-border); }
  th { color: var(--andes-color-muted-foreground); font-weight: 500; font-size: 12px; line-height: 20px; }
`;

const MENU = `
  <andes-sidebar-header>
    <div class="brand"><span class="brand__mark">A</span><span>Acme ERP</span></div>
  </andes-sidebar-header>
  <andes-sidebar-content>
    <andes-sidebar-group>
      <andes-sidebar-group-label>Platform</andes-sidebar-group-label>
      <andes-sidebar-menu>
        <andes-sidebar-menu-item>
          <andes-sidebar-menu-button href="#dashboard" [active]="true" tooltip="Dashboard">${HOME}<span>Dashboard</span></andes-sidebar-menu-button>
        </andes-sidebar-menu-item>
        <andes-sidebar-menu-item>
          <andes-sidebar-menu-button href="#orders" tooltip="Orders">${CART}<span>Orders</span><andes-sidebar-menu-badge>12</andes-sidebar-menu-badge></andes-sidebar-menu-button>
          <andes-sidebar-menu-sub>
            <andes-sidebar-menu-item><andes-sidebar-menu-button href="#open" size="sm"><span>Open</span></andes-sidebar-menu-button></andes-sidebar-menu-item>
            <andes-sidebar-menu-item><andes-sidebar-menu-button href="#shipped" size="sm"><span>Shipped</span></andes-sidebar-menu-button></andes-sidebar-menu-item>
          </andes-sidebar-menu-sub>
        </andes-sidebar-menu-item>
        <andes-sidebar-menu-item>
          <andes-sidebar-menu-button href="#inventory" tooltip="Inventory">${BOX}<span>Inventory</span></andes-sidebar-menu-button>
        </andes-sidebar-menu-item>
      </andes-sidebar-menu>
    </andes-sidebar-group>
    <andes-sidebar-group>
      <andes-sidebar-group-label>Insights</andes-sidebar-group-label>
      <andes-sidebar-menu>
        <andes-sidebar-menu-item>
          <andes-sidebar-menu-button href="#reports" tooltip="Reports">${CHART}<span>Reports</span></andes-sidebar-menu-button>
        </andes-sidebar-menu-item>
        <andes-sidebar-menu-item>
          <andes-sidebar-menu-button href="#customers" tooltip="Customers">${USERS}<span>Customers</span></andes-sidebar-menu-button>
        </andes-sidebar-menu-item>
      </andes-sidebar-menu>
    </andes-sidebar-group>
  </andes-sidebar-content>
  <andes-sidebar-separator />
  <andes-sidebar-footer>
    <andes-sidebar-menu>
      <andes-sidebar-menu-item>
        <andes-sidebar-menu-button tooltip="Settings">${GEAR}<span>Settings</span></andes-sidebar-menu-button>
      </andes-sidebar-menu-item>
    </andes-sidebar-menu>
  </andes-sidebar-footer>`;

const PAGE = `
  <div class="bar"><andes-sidebar-trigger /><span class="bar__title">Dashboard</span></div>
  <main class="page">
    <p style="margin:0">Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>B</kbd> or use the button to toggle the sidebar.</p>
  </main>`;

const meta: Meta<AndesSidebar> = {
  title: 'Layout/Layout/Sidebar',
  component: AndesSidebar,
  subcomponents: {
    AndesSidebarProvider,
    AndesSidebarInset,
    AndesSidebarTrigger,
    AndesSidebarMenuButton,
  },
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [
        provideIcons({
          lucideChartColumn,
          lucideHouse,
          lucidePackage,
          lucideSettings,
          lucideShoppingCart,
          lucideUsers,
        }),
      ],
      imports: [
        NgIcon,
        AndesSidebarProvider,
        AndesSidebarInset,
        AndesSidebarTrigger,
        AndesSidebarHeader,
        AndesSidebarContent,
        AndesSidebarFooter,
        AndesSidebarGroup,
        AndesSidebarGroupLabel,
        AndesSidebarMenu,
        AndesSidebarMenuItem,
        AndesSidebarMenuSub,
        AndesSidebarMenuBadge,
        AndesSidebarMenuButton,
        AndesSidebarSeparator,
        AndesButton,
        AndesInput,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    side: { control: 'inline-radio', options: ['start', 'end'] },
    variant: {
      control: 'inline-radio',
      options: ['sidebar', 'floating', 'inset'],
    },
    collapsible: {
      control: 'inline-radio',
      options: ['icon', 'offcanvas', 'none'],
    },
  },
  args: { side: 'start', variant: 'sidebar', collapsible: 'icon' },
  render: (args) => ({
    props: args,
    styles: [STYLES],
    template: `
      <div class="stage">
        <andes-sidebar-provider contained>
          <andes-sidebar [side]="side" [variant]="variant" [collapsible]="collapsible">${MENU}</andes-sidebar>
          <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
        </andes-sidebar-provider>
      </div>`,
  }),
};

export default meta;

type Story = StoryObj<AndesSidebar>;
/** The playground: `side`, `variant` and `collapsible` are controls. */
export const Default: Story = {};

/** The look of the panel: attached to the edge (`sidebar`), `floating`, `inset` (the page becomes a rounded card on the sidebar's background) and on the end side. */
export const Variants: Story = {
  render: () => ({
    styles: [STYLES],
    template: `
      <div style="display:grid;gap:1rem">
        @for (v of ['sidebar', 'floating', 'inset']; track v) {
          <div class="stage stage--short">
            <andes-sidebar-provider contained>
              <andes-sidebar [variant]="v">${MENU}</andes-sidebar>
              <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
            </andes-sidebar-provider>
          </div>
        }
        <div class="stage stage--short">
          <andes-sidebar-provider contained>
            <andes-sidebar side="end">${MENU}</andes-sidebar>
            <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
          </andes-sidebar-provider>
        </div>
      </div>`,
  }),
};

/** `collapsible="icon"` collapses to an icon rail (hover or focus an icon for its tooltip), `offcanvas` slides fully out of view and the page takes the freed space with no jump, `none` is always expanded and needs no trigger. */
export const CollapsibleModes: Story = {
  render: () => ({
    styles: [STYLES],
    template: `
      <div style="display:grid;gap:1rem">
        @for (c of ['icon', 'offcanvas', 'none']; track c) {
          <div class="stage stage--short">
            <andes-sidebar-provider contained>
              <andes-sidebar [collapsible]="c">${MENU}</andes-sidebar>
              <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
            </andes-sidebar-provider>
          </div>
        }
      </div>`,
  }),
};

/** `storageKey` remembers the state: collapse it, reload the story and it stays collapsed. */
export const Persisted: Story = {
  render: () => ({
    styles: [STYLES],
    template: `
      <div class="stage">
        <andes-sidebar-provider contained storageKey="andes-story-sidebar">
          <andes-sidebar collapsible="icon">${MENU}</andes-sidebar>
          <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
        </andes-sidebar-provider>
      </div>`,
  }),
};

/** Two-way `open` lets the app drive the state. */
export const Controlled: Story = {
  render: () => {
    const open = signal(true);
    return {
      styles: [STYLES],
      props: { open },
      template: `
        <p class="page" style="padding:0 0 0.5rem">open = {{ open() }}
          <andes-button variant="outline" size="sm" style="margin-inline-start:0.5rem" (click)="open.set(!open())">Toggle from outside</andes-button>
        </p>
        <div class="stage">
          <andes-sidebar-provider contained [(open)]="open">
            <andes-sidebar collapsible="icon">${MENU}</andes-sidebar>
            <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
          </andes-sidebar-provider>
        </div>`,
    };
  },
};

/**
 * Below `mobileBreakpoint` the sidebar is a modal overlay: scrim, focus trap, Escape closes. Here the
 * breakpoint is raised so the overlay shows at any width - open it with the button.
 */
export const MobileOverlay: Story = {
  render: () => ({
    styles: [STYLES],
    template: `
      <div class="stage">
        <andes-sidebar-provider contained [mobileBreakpoint]="100000">
          <andes-sidebar>${MENU}</andes-sidebar>
          <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
        </andes-sidebar-provider>
      </div>`,
  }),
};

export const RightToLeft: Story = {
  render: () => ({
    styles: [STYLES],
    template: `
      <div dir="rtl" class="stage">
        <andes-sidebar-provider contained>
          <andes-sidebar collapsible="icon">${MENU}</andes-sidebar>
          <andes-sidebar-inset>${PAGE}</andes-sidebar-inset>
        </andes-sidebar-provider>
      </div>`,
  }),
};

/**
 * A complete admin shell: header with the trigger and search, a collapsible sidebar with groups,
 * badges and a submenu, and a page of cards and a table. Resize below 768px for the overlay.
 */
export const AdminLayout: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, iframeHeight: 640 } },
  },
  render: () => ({
    styles: [STYLES],
    template: `
      <andes-sidebar-provider storageKey="andes-story-admin-sidebar">
        <andes-sidebar collapsible="icon" label="Main navigation">
          ${MENU.replace(
            /<andes-sidebar-footer>[\s\S]*<\/andes-sidebar-footer>/,
            `
          <andes-sidebar-footer>
            <div class="who"><span class="who__avatar" aria-hidden="true"></span><span class="who__name">Rosa Quispe</span></div>
          </andes-sidebar-footer>`,
          )}
        </andes-sidebar>
        <andes-sidebar-inset>
          <header class="bar">
            <andes-sidebar-trigger />
            <span class="bar__title">Dashboard</span>
            <span class="grow"></span>
            <andes-input type="search" size="sm" placeholder="Search orders" aria-label="Search orders" style="min-width: 12rem;" />
          </header>
          <main class="page">
            <div class="cards">
              <div class="card"><div class="card__label">Revenue</div><div class="card__value">S/ 84,200</div></div>
              <div class="card"><div class="card__label">Open orders</div><div class="card__value">128</div></div>
              <div class="card"><div class="card__label">Low stock</div><div class="card__value">14</div></div>
              <div class="card"><div class="card__label">Customers</div><div class="card__value">2,310</div></div>
            </div>
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                <tr><td>#1042</td><td>Minera Andina</td><td>Shipped</td><td>S/ 4,820</td></tr>
                <tr><td>#1041</td><td>Textiles del Sur</td><td>Open</td><td>S/ 1,260</td></tr>
                <tr><td>#1040</td><td>Café Selva</td><td>Open</td><td>S/ 9,075</td></tr>
                <tr><td>#1039</td><td>Constructora Inti</td><td>Shipped</td><td>S/ 2,340</td></tr>
              </tbody>
            </table>
          </main>
        </andes-sidebar-inset>
      </andes-sidebar-provider>`,
  }),
};
