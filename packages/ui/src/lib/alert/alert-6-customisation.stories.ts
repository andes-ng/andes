import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  column,
  narrow,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesButton } from '../button/button';
import { AndesAlert, type AndesAlertStyles } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Customisation',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

/*
 * Classes that out-weigh the component's own rules: the alert's stylesheet is encapsulated, so
 * a lone class selector would lose to it. Repeating the class raises the specificity, and
 * `styles` (inline) always wins without that.
 */
@Component({
  selector: 'andes-alert-parts',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="alert-parts-stack">
      <andes-alert
        severity="info"
        title="Object styles"
        description="A class on the root and inline styles on the icon and the text column."
        actionPlacement="end"
        [classNames]="classNames"
        [styles]="objectStyles"
      >
        <andes-button slot="action" size="sm" variant="outline"
          >Action</andes-button
        >
      </andes-alert>
      <andes-alert
        severity="success"
        title="Function styles"
        description="The styles are computed from the alert's own props."
        [classNames]="classNames"
        [styles]="functionStyles"
      />
    </div>
  `,
  styles: `
    .alert-parts-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 40rem;
    }
    .alert-parts-root.alert-parts-root.andes-alert {
      border-style: dashed;
      border-radius: 0.75rem;
    }
  `,
})
class PartsExample {
  protected readonly classNames = { root: 'alert-parts-root' };
  protected readonly objectStyles: AndesAlertStyles = {
    icon: { fontSize: '1.5rem', width: '1.5rem', height: '1.5rem' },
    section: { fontWeight: 500 },
  };
  protected readonly functionStyles = ({
    props: { severity },
  }: {
    props: { severity: string };
  }): AndesAlertStyles =>
    severity === 'success'
      ? {
          root: { backgroundColor: 'rgb(21 128 61 / 12%)' },
          icon: { color: '#15803d' },
        }
      : {};
}

/** Per-part classes and styles. */
export const PartClassesAndStyles: Story = {
  name: 'Classes and styles per part',
  parameters: about(
    'ClassNames and styles take an object, or a function of the alert props, with a value for the root, icon, section, title, description, actions and close parts.',
  ),
  render: () => ({
    moduleMetadata: { imports: [PartsExample] },
    template: '<andes-alert-parts />',
  }),
};

/** Re-colouring through custom properties. */
export const ThemeColours: Story = {
  name: 'Theme colours',
  parameters: about(
    'Setting the custom properties for a severity on the alert or any ancestor re-colours its icon, wash, border and solid colour, here a violet info.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column + ' --andes-alert-info-icon: #7c3aed; --andes-alert-info-bg: #f5f3ff; --andes-alert-info-border: #c4b5fd; --andes-alert-info-solid: #6d28d9; --andes-alert-info-solid-ink: #ffffff;'">
      <andes-alert severity="info" title="Tinted" description="Icon, wash and border come from the custom properties." closable />
      <andes-alert severity="info" variant="outlined" description="Outlined, with the icon in the new colour." />
      <andes-alert severity="info" variant="solid" description="Solid, with the new strong colour." />
    </div>`,
  }),
};

/** Pinning the parts to the first line. */
export const FirstLineAlignment: Story = {
  name: 'First-line alignment',
  parameters: about(
    'A wrapped title centres the icon, action and close button on the row, and the styles input lines them up with the first line instead.',
  ),
  render: () => {
    // Half of the difference between the 20px line and each part: a 16px icon, a 24px small
    // button and the 20px close button.
    const firstLine: AndesAlertStyles = {
      root: { alignItems: 'flex-start' },
      icon: { marginBlockStart: '2px' },
      actions: { marginBlockStart: '-2px' },
    };
    return {
      props: {
        narrow,
        firstLine,
        title:
          'Long alert title wraps to multiple lines when the alert container is narrow enough.',
      },
      template: `<div [style]="narrow">
        <andes-alert severity="info" [title]="title" closable />
        <andes-alert severity="info" [title]="title" closable [styles]="firstLine" />
        <andes-alert severity="success" [title]="title" actionPlacement="end" closable [styles]="firstLine">
          <andes-button slot="action" size="sm" variant="ghost">Action</andes-button>
        </andes-alert>
      </div>`,
    };
  },
};
