import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

import {
  about,
  caption,
  column,
  columns,
  SEVERITIES,
  SEVERITY_TEXTS,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Basics',
  component: AndesAlert,
  tags: ['autodocs'],
  decorators: [withDescription, withAlertKit],
  argTypes: {
    severity: {
      control: 'select',
      options: [undefined, ...SEVERITIES],
    },
    variant: {
      control: 'inline-radio',
      options: ['tinted', 'filled', 'outlined', 'solid'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    actionPlacement: { control: 'inline-radio', options: ['bottom', 'end'] },
    closable: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    banner: { control: 'boolean' },
    marquee: { control: 'boolean' },
    marqueeSpeed: { control: { type: 'number', min: 10, step: 10 } },
    duration: { control: { type: 'number', min: 0, step: 500 } },
    role: { control: 'select', options: [undefined, 'alert', 'status'] },
    closeLabel: { control: 'text' },
    closeText: { control: 'text' },
    closeDisabled: { control: 'boolean' },
  },
  args: {
    severity: 'info',
    variant: 'tinted',
    size: 'md',
    closable: true,
    showIcon: true,
    banner: false,
    closeLabel: 'Close',
    closeText: null,
    closeDisabled: false,
    actionPlacement: 'bottom',
    duration: null,
    closing: fn(),
    afterClose: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 40rem;">
      <andes-alert [severity]="severity" [variant]="variant" [size]="size" [closable]="closable" [showIcon]="showIcon" [banner]="banner" [role]="role" [closeLabel]="closeLabel" [closeText]="closeText" [closeDisabled]="closeDisabled" [duration]="duration" (closing)="closing($event)" (afterClose)="afterClose()">
        <span slot="title">Heads up</span>
        This is an alert message with some more detail underneath the title.
      </andes-alert>
    </div>`,
  }),
};

export default meta;

type Story = StoryObj<AndesAlert>;

/** The playground: use the controls to try every input on one alert. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Use the controls to try every input on one alert; the alert is a 66px card with a title and a description, or a 40px strip with a message alone.',
  ),
};

/** Every severity, as a one-line strip and as a title with a description. */
export const Severities: Story = {
  name: 'Severities',
  parameters: about(
    'Neutral, success, info, warning and danger: the icon carries the meaning, the wash carries the tone, and the text stays on the regular ink.',
  ),
  render: () => ({
    props: { severities: SEVERITIES, texts: SEVERITY_TEXTS, column },
    template: `<div [style]="column">
      @for (severity of severities; track severity) {
        <andes-alert [severity]="severity" [title]="texts[severity].title" [description]="texts[severity].description" />
      }
      @for (severity of severities; track severity) {
        <andes-alert [severity]="severity" [description]="texts[severity].message" />
      }
    </div>`,
  }),
};

function variantStory(variant: string, description: string): Story {
  return {
    name: variant[0].toUpperCase() + variant.slice(1),
    parameters: about(description),
    render: () => ({
      props: { severities: SEVERITIES, texts: SEVERITY_TEXTS, column },
      template: `<div [style]="column">
        @for (severity of severities; track severity) {
          <andes-alert variant="${variant}" [severity]="severity" [title]="texts[severity].title" [description]="texts[severity].description" closable />
        }
      </div>`,
    }),
  };
}

/** The default variant. */
export const Tinted: Story = variantStory(
  'tinted',
  'The default: a 9% wash of the severity colour with a 35% border of the same hue.',
);

/** The wash without the border. */
export const Filled: Story = variantStory(
  'filled',
  'The same wash with the border dropped, for alerts that sit on a busy surface where an outline only adds noise.',
);

/** The neutral card with the severity in the icon and the edge. */
export const Outlined: Story = variantStory(
  'outlined',
  'Keeps the neutral card surface and carries the severity only in the icon and a faint tint on the border, so several alerts on one page stay quiet.',
);

/** The strong colour as the surface. */
export const Solid: Story = variantStory(
  'solid',
  'Paints the card in the strong status colour with a light ink (dark on amber), for the one message that must not be missed.',
);

/** The two densities. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'The medium size is 40px for one line and 66px with a title and a description; the small size is 30px and 54px, for toolbars, forms and table headers.',
  ),
  render: () => ({
    props: { column, caption },
    template: `<div [style]="column">
      <span [style]="caption">Medium (default)</span>
      <andes-alert severity="success" description="Your changes have been saved." closable />
      <andes-alert severity="success" title="Saved" description="Your changes have been saved and are visible to the team." closable />
      <span [style]="caption">Small</span>
      <andes-alert size="sm" severity="success" description="Your changes have been saved." closable />
      <andes-alert size="sm" severity="success" title="Saved" description="Your changes have been saved and are visible to the team." closable />
    </div>`,
  }),
};

/** Variants next to each other, to compare. */
export const SideBySide: Story = {
  name: 'Variants side by side',
  parameters: about(
    'The four variants in four columns, one severity per row, to compare the washes, borders and inks.',
  ),
  render: () => ({
    props: {
      variants: ['tinted', 'filled', 'outlined', 'solid'],
      severities: SEVERITIES,
      texts: SEVERITY_TEXTS,
      columns,
      column,
      caption,
    },
    template: `<div [style]="columns">
      @for (variant of variants; track variant) {
        <div [style]="column">
          <span [style]="caption">{{ variant }}</span>
          @for (severity of severities; track severity) {
            <andes-alert [variant]="variant" [severity]="severity" [description]="texts[severity].message" />
          }
        </div>
      }
    </div>`,
  }),
};
