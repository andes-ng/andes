import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import { AndesDialog } from './dialog';
import type { AndesDialogSize } from './dialog-base';

/*
 * The playground of the plain Dialog: every behaviour that is a switch can be flipped from a
 * panel built with library components, then tried on one dialog.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Overview',
  component: AndesDialog,
  tags: ['autodocs'],
  decorators: [withDescription, withDialogKit],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A modal surface that traps focus, locks the page behind it and is dismissed by Escape, a click on the mask or its own close button; the parts (`andesDialogTrigger`, `andes-dialog-content`, header, title, description, footer, close) are composed in the template, or the built-in Cancel / OK footer is switched on with `footer="default"`.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** The playground: a panel of controls built from library components, and one dialog. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'A control panel for the inputs that are switches, a size select and a footer choice, and one dialog that follows them: open it and close it with the close button, Escape, a click on the mask or its own actions.',
  ),
  render: () => {
    const sizeChoice = signal<AndesDialogSize>('md');
    const centeredChoice = signal(true);
    const maskChoice = signal(true);
    const closable = signal(true);
    const keyboard = signal(true);
    const outsideClick = signal(true);
    const footerChoice = signal<'default' | 'composed' | 'none'>('composed');
    const dialogOpen = signal(false);
    const reason = signal('-');
    return {
      props: {
        ...shared,
        sizeChoice,
        centeredChoice,
        maskChoice,
        closable,
        keyboard,
        outsideClick,
        footerChoice,
        dialogOpen,
        reason,
        sizes: [
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra large' },
        ],
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 40rem;">
          <div [style]="card" style="display: flex; flex-direction: column; gap: 1rem;">
            <div [style]="formRow">
              <span [style]="formItem">
                Size
                <andes-select
                  aria-label="Size"
                  style="width: 9rem;"
                  [options]="sizes"
                  [value]="sizeChoice()"
                  (valueChange)="sizeChoice.set($event)"
                />
              </span>
              <andes-radio-group
                aria-label="Footer"
                [value]="footerChoice()"
                (valueChange)="footerChoice.set($event)"
              >
                <andes-radio value="composed">Composed footer</andes-radio>
                <andes-radio value="default">Built-in footer</andes-radio>
                <andes-radio value="none">No footer</andes-radio>
              </andes-radio-group>
            </div>
            <div [style]="formRow">
              <andes-switch [checked]="centeredChoice()" (checkedChange)="centeredChoice.set($event)">Centered</andes-switch>
              <andes-switch [checked]="maskChoice()" (checkedChange)="maskChoice.set($event)">Mask</andes-switch>
              <andes-switch [checked]="closable()" (checkedChange)="closable.set($event)">Close button</andes-switch>
              <andes-switch [checked]="keyboard()" (checkedChange)="keyboard.set($event)">Escape closes</andes-switch>
              <andes-switch [checked]="outsideClick()" (checkedChange)="outsideClick.set($event)">Mask click closes</andes-switch>
            </div>
            <hr [style]="divider" />
            <div [style]="formRow">
              <andes-dialog
                [(open)]="dialogOpen"
                [size]="sizeChoice()"
                [centered]="centeredChoice()"
                [mask]="maskChoice()"
                [closeOnEscape]="keyboard()"
                [closeOnOutsideClick]="outsideClick()"
                [footer]="footerChoice() === 'default' ? 'default' : null"
                okText="Save changes"
                (ok)="dialogOpen.set(false)"
                (closed)="reason.set($event)"
              >
                <andes-button andesDialogTrigger>Open</andes-button>

                <andes-dialog-content *andesDialogContent [showCloseButton]="closable()">
                  <div andesDialogHeader>
                    <h2 andesDialogTitle>Edit profile</h2>
                    <p andesDialogDescription>
                      Make changes to your profile here. Save when you are done.
                    </p>
                  </div>

                  <andes-form-field label="Name">
                    <andes-input value="Ada Lovelace" />
                  </andes-form-field>

                  @if (footerChoice() === 'composed') {
                    <div andesDialogFooter>
                      <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
                      <andes-button andesDialogClose>Save changes</andes-button>
                    </div>
                  }
                </andes-dialog-content>
              </andes-dialog>
              <span [style]="muted">Last close reason: <strong [style]="strong">{{ reason() }}</strong></span>
            </div>
          </div>
        </div>
      `,
    };
  },
};
