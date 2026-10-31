import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColorPicker } from './color-picker';
import { AndesColorPickerPanel } from './color-picker-panel';
import type { AndesColorPreset } from './color-picker-types';

const IMPORTS = [AndesColorPicker, AndesColorPickerPanel];

const GROUPS: readonly AndesColorPreset[] = [
  {
    label: 'Recommended',
    colors: [
      '#f5222d',
      '#fa8c16',
      '#fadb14',
      '#8bbb11',
      '#52c41a',
      '#13a8a8',
      '#1677ff',
      '#2f54eb',
      '#722ed1',
      '#eb2f96',
    ],
  },
  {
    label: 'Neutrals',
    collapsible: false,
    colors: ['#000000', '#434343', '#8c8c8c', '#d9d9d9', '#f5f5f5', '#ffffff'],
  },
  {
    label: 'Brand',
    defaultOpen: false,
    colors: ['#0b5cff', '#00b8a9', '#f6416c', '#ffde7d'],
  },
];

const meta: Meta<AndesColorPicker> = {
  title: 'Data Entry/Color Picker/Presets and recent',
  component: AndesColorPicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesColorPicker>;

/**
 * Several preset groups: each heading is a button that expands and collapses its group
 * (`aria-expanded`), "Brand" starts collapsed (`defaultOpen: false`) and "Neutrals" has a
 * plain heading (`collapsible: false`). Each group is a listbox with one Tab stop, walked
 * with the arrow keys.
 */
export const Presets: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { groups: GROUPS, theme: '#1677ff' },
    template: `
      <andes-color-picker aria-label="Theme color" [(value)]="theme" [presets]="groups" showText />
    `,
  }),
};

/**
 * `recentColors` keeps a "Recent" group of the colours committed (a finished drag, a typed
 * value, a preset), newest first and without duplicates, up to `recentColorsMax`. The first
 * picker saves them in `localStorage` under `recentColorsStorageKey` (reload to see them
 * come back); the inline panel binds `[(recent)]` so the app could save them itself.
 */
export const RecentColors: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      groups: GROUPS.slice(0, 1),
      stored: '#fa8c16',
      history: [] as string[],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
        <andes-color-picker
          aria-label="Saved in local storage"
          [(value)]="stored"
          [presets]="groups"
          recentColors
          [recentColorsMax]="6"
          recentColorsStorageKey="andes-story-recent-colors"
          showText
        />
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-color-picker-panel aria-label="Recent bound to the app" recentColors [(recent)]="history" value="#722ed1" />
          <code style="font-size: 0.75rem;">recent: {{ history.join(', ') || '-' }}</code>
        </div>
      </div>
    `,
  }),
};
