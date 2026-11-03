import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  loadedSwitch,
  shared,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';

/*
 * Where a skeleton earns its place: compositions of the placeholders in the layouts they stand in
 * for, each next to the real content it gives way to (the Loaded switch). Built from the library's
 * components and plain layout; the library has no card, list or table component yet.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Compositions',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** A profile card: avatar, name, three lines of bio and the two actions. */
export const ProfileCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A profile card: an avatar, a name, three lines of bio and the two actions, as placeholders until the profile loads.',
      },
    },
  },
  name: 'Profile card',
  render: () => ({
    props: { ...shared, loaded: signal(false) },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 22rem;">
        ${loadedSwitch}
        <div [style]="card" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            @if (loaded()) {
              <andes-avatar size="lg"><andes-avatar-fallback>LM</andes-avatar-fallback></andes-avatar>
              <div style="display: flex; flex-direction: column;">
                <span [style]="strong">Lucía Mendoza</span>
                <span [style]="muted">Product designer, Lima</span>
              </div>
            } @else {
              <andes-skeleton-avatar active size="lg" />
              <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                <andes-skeleton-text active width="60%" />
                <andes-skeleton-text active width="40%" />
              </div>
            }
          </div>
          @if (loaded()) {
            <p style="margin: 0;" [style]="text">
              Designs calm interfaces for busy teams. Currently building the design system
              behind the company's mobile apps and the documentation that goes with it.
            </p>
            <div style="display: flex; gap: 0.5rem;">
              <andes-button>Follow</andes-button>
              <andes-button variant="secondary">Message</andes-button>
            </div>
          } @else {
            <andes-skeleton-text active [lines]="3" />
            <div style="display: flex; gap: 0.5rem;">
              <andes-skeleton-button active />
              <andes-skeleton-button active />
            </div>
          }
        </div>
      </div>
    `,
  }),
};

const customers = [
  {
    name: 'Ana Quispe',
    initials: 'AQ',
    email: 'ana@example.com',
    plan: 'Pro',
    color: 'success',
    spend: '$1,280',
  },
  {
    name: 'Diego Flores',
    initials: 'DF',
    email: 'diego@example.com',
    plan: 'Starter',
    color: 'default',
    spend: '$140',
  },
  {
    name: 'Carla Rojas',
    initials: 'CR',
    email: 'carla@example.com',
    plan: 'Enterprise',
    color: 'info',
    spend: '$9,600',
  },
  {
    name: 'Mateo Vega',
    initials: 'MV',
    email: 'mateo@example.com',
    plan: 'Pro',
    color: 'success',
    spend: '$860',
  },
];

/** The body of a data table: rows of an avatar with two lines, a tag and a figure. */
export const TableBody: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The body of a data table: rows of an avatar with two lines, a tag and a figure, with the header already in place while the rows load.',
      },
    },
  },
  name: 'Table body',
  render: () => ({
    props: { ...shared, loaded: signal(false), customers, rows: [1, 2, 3, 4] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 40rem;">
        ${loadedSwitch}
        <table style="width: 100%; border-collapse: collapse; border: 1px solid var(--andes-color-border);" [attr.aria-busy]="!loaded()">
          <thead>
            <tr [style]="muted" style="text-align: start; background: var(--andes-color-muted);">
              <th scope="col" style="padding: 0.75rem 1rem; font-weight: 500; text-align: start;">Customer</th>
              <th scope="col" style="padding: 0.75rem 1rem; font-weight: 500; text-align: start;">Plan</th>
              <th scope="col" style="padding: 0.75rem 1rem; font-weight: 500; text-align: end;">Spend</th>
            </tr>
          </thead>
          <tbody>
            @if (loaded()) {
              @for (customer of customers; track customer.email) {
                <tr [style]="text" style="border-top: 1px solid var(--andes-color-border);">
                  <td style="padding: 0.75rem 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <andes-avatar><andes-avatar-fallback>{{ customer.initials }}</andes-avatar-fallback></andes-avatar>
                      <div style="display: flex; flex-direction: column;">
                        <span [style]="strong">{{ customer.name }}</span>
                        <span [style]="muted">{{ customer.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 0.75rem 1rem;"><andes-tag [color]="customer.color">{{ customer.plan }}</andes-tag></td>
                  <td style="padding: 0.75rem 1rem; text-align: end;">{{ customer.spend }}</td>
                </tr>
              }
            } @else {
              @for (row of rows; track row) {
                <tr style="border-top: 1px solid var(--andes-color-border);">
                  <td style="padding: 0.75rem 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <andes-skeleton-avatar active />
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.375rem;">
                        <andes-skeleton-text active width="55%" />
                        <andes-skeleton-text active width="75%" />
                      </div>
                    </div>
                  </td>
                  <td style="padding: 0.75rem 1rem;"><andes-skeleton-button active size="sm" /></td>
                  <td style="padding: 0.75rem 1rem;"><andes-skeleton-text active width="3rem" style="margin-inline-start: auto;" /></td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    `,
  }),
};

const comments = [
  {
    initials: 'SP',
    author: 'Sofía Paredes',
    when: '2 hours ago',
    body: 'The new skeletons are a big improvement: the page no longer jumps when the data arrives.',
  },
  {
    initials: 'JT',
    author: 'Jorge Tello',
    when: '1 hour ago',
    body: 'Agreed. Could we also show them for the reply box, or is that too much?',
  },
  {
    initials: 'SP',
    author: 'Sofía Paredes',
    when: '35 minutes ago',
    body: 'Too much, I think. A reply box can render at once; only the thread needs to wait.',
  },
];

/** A comment thread: an avatar, the author line and two lines of body per comment. */
export const CommentThread: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A comment thread: an avatar, the author line and the body of each comment, with the last one a reply that sits indented under its parent.',
      },
    },
  },
  name: 'Comment thread',
  render: () => ({
    props: { ...shared, loaded: signal(false), comments, rows: [0, 1, 2] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 36rem;">
        ${loadedSwitch}
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          @for (comment of comments; track $index) {
            <div style="display: flex; gap: 0.75rem;" [style.margin-inline-start]="$index === 2 ? '2.75rem' : '0'">
              @if (loaded()) {
                <andes-avatar><andes-avatar-fallback>{{ comment.initials }}</andes-avatar-fallback></andes-avatar>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                  <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                    <span [style]="strong">{{ comment.author }}</span>
                    <span [style]="muted" style="font-size: 0.75rem;">{{ comment.when }}</span>
                  </div>
                  <span [style]="text">{{ comment.body }}</span>
                </div>
              } @else {
                <andes-skeleton-avatar active />
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                  <andes-skeleton-text active width="30%" />
                  <andes-skeleton-text active [lines]="2" />
                </div>
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};

const products = [
  { name: 'Alpaca throw', price: '$89.00', hue: 28 },
  { name: 'Ceramic mug set', price: '$34.50', hue: 190 },
  { name: 'Woven basket', price: '$27.00', hue: 95 },
  { name: 'Linen apron', price: '$42.00', hue: 330 },
];

/** A product grid: a picture, a title, a price and a button per card. */
export const ProductGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A product grid: the picture, title, price and button of each card as placeholders, in a grid that keeps its columns while the products load.',
      },
    },
  },
  name: 'Product grid',
  render: () => ({
    props: { ...shared, loaded: signal(false), products },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${loadedSwitch}
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1.5rem;">
          @for (product of products; track product.name) {
            <div [style]="card" style="padding: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
              @if (loaded()) {
                <div role="img" [attr.aria-label]="product.name" style="height: 9rem; border-radius: var(--andes-radius-md);" [style.background]="'hsl(' + product.hue + ' 45% 70%)'"></div>
                <div style="display: flex; flex-direction: column; padding: 0 0.25rem;">
                  <span [style]="strong">{{ product.name }}</span>
                  <span [style]="muted">{{ product.price }}</span>
                </div>
                <andes-button variant="secondary" size="sm">Add to cart</andes-button>
              } @else {
                <andes-skeleton-image active width="100%" height="9rem" />
                <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0 0.25rem;">
                  <andes-skeleton-text active width="70%" />
                  <andes-skeleton-text active width="35%" />
                </div>
                <andes-skeleton-button active size="sm" block />
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};

const stats = [
  { label: 'Revenue', value: '$48,200', delta: '+12.4%', color: 'success' },
  { label: 'Orders', value: '1,284', delta: '+3.1%', color: 'success' },
  { label: 'Refunds', value: '37', delta: '-8.0%', color: 'danger' },
  { label: 'Visitors', value: '21,930', delta: '+0.6%', color: 'default' },
];

/** A dashboard of statistic tiles: a label, a large figure and a change tag. */
export const StatisticTiles: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A dashboard of statistic tiles: a label, a large figure and a change tag per tile, where the figure is a taller bar so the tile keeps its height.',
      },
    },
  },
  name: 'Statistic tiles',
  render: () => ({
    props: { ...shared, loaded: signal(false), stats },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${loadedSwitch}
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: 1rem;">
          @for (stat of stats; track stat.label) {
            <div [style]="card" style="padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; min-height: 6.75rem;">
              @if (loaded()) {
                <span [style]="muted">{{ stat.label }}</span>
                <span style="font-size: 1.75rem; line-height: 2.25rem; font-weight: 600;" [style]="font">{{ stat.value }}</span>
                <span><andes-tag [color]="stat.color">{{ stat.delta }}</andes-tag></span>
              } @else {
                <andes-skeleton-text active width="40%" />
                <andes-skeleton-text active width="65%" [styles]="{ content: { height: 28 } }" />
                <andes-skeleton-button active size="sm" [width]="56" />
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};

/** A form: a label and an input per field, and the submit button. */
export const FormFields: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A form: a short label bar above a full-width input for each field, and the submit button, matching the 32px control height.',
      },
    },
  },
  name: 'Form fields',
  render: () => ({
    props: {
      ...shared,
      loaded: signal(false),
      fields: ['Full name', 'Email', 'Company'],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 24rem;">
        ${loadedSwitch}
        <form [style]="card" style="display: flex; flex-direction: column; gap: 1.25rem;" (submit)="$event.preventDefault()">
          @for (field of fields; track field) {
            @if (loaded()) {
              <label style="display: flex; flex-direction: column; gap: 0.375rem;" [style]="strong">
                {{ field }}
                <andes-input [placeholder]="field" />
              </label>
            } @else {
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <andes-skeleton-text active width="30%" />
                <andes-skeleton-input active block />
              </div>
            }
          }
          @if (loaded()) {
            <andes-button>Save changes</andes-button>
          } @else {
            <andes-skeleton-button active block />
          }
        </form>
      </div>
    `,
  }),
};

/** A media article: a wide picture, a headline and the opening paragraph. */
export const MediaArticle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A media article: a wide picture, a headline and the opening paragraph, drawn with the composite skeleton under a picture placeholder.',
      },
    },
  },
  name: 'Media article',
  render: () => ({
    props: { ...shared, loaded: signal(false) },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 36rem;">
        ${loadedSwitch}
        <article style="display: flex; flex-direction: column; gap: 1.25rem;">
          @if (loaded()) {
            <div role="img" aria-label="Cover" style="height: 14rem; border-radius: var(--andes-radius-lg); background: linear-gradient(135deg, #7c9cbf, #c4a9d4);"></div>
          } @else {
            <andes-skeleton-image active width="100%" height="14rem" />
          }
          <andes-skeleton [loading]="!loaded()" active [paragraph]="{ rows: 4 }" loadingLabel="Loading article" loadedLabel="Article loaded">
            <h3 [style]="heading" style="font-size: 1.5rem; line-height: 2rem; margin-bottom: 0.75rem;">The quiet craft of loading states</h3>
            <p [style]="text" style="margin: 0;">
              A good loading state tells people what is coming and keeps the page still while it
              arrives. It borrows the shape of the content it stands in for, moves gently so it is
              clear the page has not frozen, and gives way to the real thing without a jump.
            </p>
          </andes-skeleton>
        </article>
      </div>
    `,
  }),
};

const chats = [
  {
    initials: 'EC',
    name: 'Elena Castro',
    last: 'Sounds good, see you at ten.',
    time: '09:41',
    unread: 2,
  },
  {
    initials: 'PD',
    name: 'Design team',
    last: 'Rafael: the new tokens are in.',
    time: '09:12',
    unread: 0,
  },
  {
    initials: 'LN',
    name: 'Luis Núñez',
    last: 'Can you send me the file?',
    time: 'Yesterday',
    unread: 0,
  },
  {
    initials: 'MB',
    name: 'Marta Bravo',
    last: 'Thanks!',
    time: 'Mon',
    unread: 0,
  },
];

/** A chat list: an avatar, a name with a preview, and the time. */
export const ChatList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A chat list: an avatar, a name with a one-line preview, and the time, as two short bars beside the avatar and one for the time.',
      },
    },
  },
  name: 'Chat list',
  render: () => ({
    props: { ...shared, loaded: signal(false), chats },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 24rem;">
        ${loadedSwitch}
        <div [style]="card" style="padding: 0.5rem 0;">
          @for (chat of chats; track chat.name) {
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem;">
              @if (loaded()) {
                <andes-avatar size="lg"><andes-avatar-fallback>{{ chat.initials }}</andes-avatar-fallback></andes-avatar>
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                  <span [style]="strong">{{ chat.name }}</span>
                  <span [style]="muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ chat.last }}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                  <span [style]="muted" style="font-size: 0.75rem;">{{ chat.time }}</span>
                  @if (chat.unread) { <andes-tag color="primary" variant="solid">{{ chat.unread }}</andes-tag> }
                </div>
              } @else {
                <andes-skeleton-avatar active size="lg" />
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                  <andes-skeleton-text active width="45%" />
                  <andes-skeleton-text active width="80%" />
                </div>
                <andes-skeleton-text active width="2rem" style="width: 2rem;" />
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};
