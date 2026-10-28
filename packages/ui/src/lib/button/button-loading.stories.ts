import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from './button';

const extraIcons = provideIcons({ lucideSearch });

const meta: Meta<AndesButton> = {
  title: 'General/Button/Specialized/Loading',
  component: AndesButton,
};

export default meta;

type Story = StoryObj<AndesButton>;

/** `loading` swaps the icon for a spinner and blocks the click; `loadingDelay` waits before showing it. */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-button [loading]="true">Save</andes-button>
        <andes-button variant="outline" [loading]="true">Save</andes-button>
        <andes-button [loading]="true" [loadingDelay]="1500">Delayed spinner (1.5 s)</andes-button>
      </div>
    `,
  }),
};

/**
 * The spinner is exactly the size of the icon it replaces, so switching `loading` on and off
 * never resizes the button. Each pair below is the same button with loading off, then on.
 */
export const LoadingKeepsSize: Story = {
  render: () => ({
    moduleMetadata: { imports: [NgIcon], providers: [extraIcons] },
    props: {
      sizes: ['xs', 'sm', 'md', 'lg'],
      iconSizes: ['icon-xs', 'icon-sm', 'icon', 'icon-lg'],
      states: [false, true],
      variants: [
        'primary',
        'secondary',
        'danger',
        'outline',
        'dashed',
        'filled',
        'ghost',
      ],
      colors: [undefined, 'primary', 'danger', 'success', 'warning', 'info'],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        @for (size of sizes; track size) {
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            @for (on of states; track on) {
              <andes-button [size]="size" [loading]="on" [attr.data-case]="size + '-icon-' + on"><ng-icon slot="icon-start" name="lucideSearch" />Search</andes-button>
            }
            @for (on of states; track on) {
              <andes-button [size]="size" variant="outline" [loading]="on" [attr.data-case]="size + '-icon-outline-' + on"><ng-icon slot="icon-start" name="lucideSearch" />Search</andes-button>
            }
            @for (on of states; track on) {
              <andes-button [size]="size" [loading]="on" [attr.data-case]="size + '-text-' + on">Save</andes-button>
            }
          </div>
        }
        @for (size of iconSizes; track size) {
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            @for (on of states; track on) {
              <andes-button [size]="size" [loading]="on" aria-label="Search" [attr.data-case]="size + '-' + on"><ng-icon name="lucideSearch" /></andes-button>
            }
            @for (on of states; track on) {
              <andes-button [size]="size" shape="circle" variant="outline" [loading]="on" aria-label="Search" [attr.data-case]="size + '-circle-' + on"><ng-icon name="lucideSearch" /></andes-button>
            }
          </div>
        }
        <div style="display: grid; grid-template-columns: repeat(7, max-content); gap: 0.5rem;">
          @for (color of colors; track $index) {
            @for (variant of variants; track variant) {
              <span style="display: inline-flex; gap: 0.25rem;">
                @for (on of states; track on) {
                  <andes-button [variant]="variant" [color]="color" [loading]="on" [attr.data-case]="'v-' + variant + '-' + (color ?? 'none') + '-' + on"><ng-icon slot="icon-start" name="lucideSearch" />Go</andes-button>
                }
              </span>
            }
          }
        </div>
      </div>
    `,
  }),
};

/** `loadingIcon` takes a template to replace the default spinner. */
export const CustomLoadingIcon: Story = {
  render: () => ({
    moduleMetadata: { imports: [NgIcon] },
    template: `
      <ng-template #spinningLoader>
        <ng-icon name="lucideLoaderCircle" class="spinning-loader" />
      </ng-template>
      <andes-button [loading]="true" [loadingIcon]="spinningLoader">Save</andes-button>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning-loader ::ng-deep svg { animation: spin 0.8s linear infinite; }
      </style>
    `,
  }),
};
