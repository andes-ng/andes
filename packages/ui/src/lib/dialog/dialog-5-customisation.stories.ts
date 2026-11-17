import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  scene,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { ANDES_DIALOG_IMPORTS, AndesDialog } from './dialog';

/*
 * Restyling a dialog without touching the library: a class on the surface and the parts inside
 * it, the custom properties the stylesheet reads, a class on the mask and the close icon.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Customisation',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/*
 * The surface and its parts are plain elements with plain classes, doubled with the surface's
 * own class so that these rules outrank the library's whichever stylesheet loads last. The
 * styles are unencapsulated because the surface is drawn in the overlay layer, outside the
 * component that declares it.
 */
@Component({
  selector: 'andes-dialog-parts-demo',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton, AndesTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <andes-dialog>
      <andes-button andesDialogTrigger>Open the branded dialog</andes-button>

      <andes-dialog-content *andesDialogContent class="sb-branded">
        <div andesDialogHeader>
          <h2 andesDialogTitle>
            Welcome aboard
            <andes-tag color="primary" variant="solid">New</andes-tag>
          </h2>
          <p andesDialogDescription>
            The surface, the header, the title and the footer each take a class
            of their own.
          </p>
        </div>

        <div andesDialogFooter>
          <andes-button variant="ghost" andesDialogClose
            >Maybe later</andes-button
          >
          <andes-button andesDialogClose>Get started</andes-button>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: `
    .andes-dialog.sb-branded {
      border-color: var(--andes-color-primary);
      border-radius: 1.25rem;
    }

    .sb-branded .andes-dialog__header {
      padding-block-end: 0.75rem;
      border-block-end: 1px solid var(--andes-color-border);
    }

    .sb-branded .andes-dialog__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--andes-color-primary);
    }

    .sb-branded .andes-dialog__footer {
      justify-content: space-between;
    }
  `,
})
class DialogPartsDemo {}

/** A class on the surface and on its parts. */
export const ClassNamesAndParts: Story = {
  name: 'Class names and parts',
  parameters: about(
    'The surface takes a class of its own and the header, title, description and footer are elements with andes-dialog__ classes, so each can be restyled with plain CSS, here a coloured border, a rule under the header and a footer that spreads its buttons.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DialogPartsDemo] },
    template: '<andes-dialog-parts-demo />',
  }),
};

/** The measurements the stylesheet reads. */
export const CssCustomProperties: Story = {
  name: 'CSS custom properties',
  parameters: about(
    'The padding, the gap between the parts and the width of the close button are custom properties on the surface, so a compact, a roomy and an edge-to-edge dialog are three inline styles and no new CSS.',
  ),
  render: () => ({
    props: { ...shared, picture: scene(1) },
    template: `
      <div [style]="row">
        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Compact</andes-button>
          <andes-dialog-content
            *andesDialogContent
            style="--andes-dialog-padding-block: 0.75rem; --andes-dialog-padding-inline: 1rem; --andes-dialog-gap: 0.25rem;"
          >
            <div andesDialogHeader>
              <h2 andesDialogTitle>Compact</h2>
              <p andesDialogDescription>Less padding, a tighter gap under the header.</p>
            </div>
            <div andesDialogFooter>
              <andes-button size="sm" andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Roomy</andes-button>
          <andes-dialog-content
            *andesDialogContent
            style="--andes-dialog-padding-block: 2rem; --andes-dialog-padding-inline: 2.5rem; --andes-dialog-gap: 1rem; --andes-dialog-footer-gap: 1.5rem;"
          >
            <div andesDialogHeader>
              <h2 andesDialogTitle>Roomy</h2>
              <p andesDialogDescription>More padding, more air between the parts.</p>
            </div>
            <div andesDialogFooter>
              <andes-button andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog size="lg">
          <andes-button andesDialogTrigger variant="secondary">Edge to edge</andes-button>
          <andes-dialog-content
            *andesDialogContent
            style="--andes-dialog-padding-block: 0px; --andes-dialog-padding-inline: 0px; --andes-dialog-gap: 0px;"
          >
            <andes-image
              [src]="picture"
              alt="A sunrise over three ridges of hills"
              width="100%"
              height="12rem"
              [preview]="false"
            />
            <div [style]="stack" style="padding: 1.25rem 1.5rem 0;">
              <h2 andesDialogTitle>Edge to edge</h2>
              <p andesDialogDescription>The picture runs to the border; the text keeps its own padding.</p>
            </div>
            <div andesDialogFooter style="padding: 1rem 1.5rem 1.25rem;">
              <andes-button andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

// Hosts the mask story: the class is global because the scrim is drawn in the overlay layer.
@Component({
  selector: 'andes-dialog-mask-demo',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <andes-dialog maskClass="sb-gradient-mask">
      <andes-button andesDialogTrigger>Open with a gradient mask</andes-button>

      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>A mask of your own</h2>
          <p andesDialogDescription>
            maskClass adds a class to the scrim, and --andes-dialog-mask is its
            fill.
          </p>
        </div>

        <div andesDialogFooter>
          <andes-button andesDialogClose>Close</andes-button>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: `
    .sb-gradient-mask {
      --andes-dialog-mask: linear-gradient(
        to top,
        rgb(24 24 27 / 85%) 0,
        rgb(24 24 27 / 20%) 100%
      );
    }
  `,
})
class DialogMaskDemo {}

/** A class on the mask. */
export const MaskClass: Story = {
  name: 'Mask class',
  parameters: about(
    'maskClass adds a class to the scrim and --andes-dialog-mask takes any CSS background as its fill, so a flat dim becomes a gradient without replacing the mask.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DialogMaskDemo] },
    template: '<andes-dialog-mask-demo />',
  }),
};

/** The glyph of the close button. */
export const CustomCloseIcon: Story = {
  name: 'Custom close icon',
  parameters: about(
    'closeIcon swaps the glyph of the close button for a template and closeLabel renames it, while the button, its label and its hit area stay the component’s.',
  ),
  render: () => ({
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger>Custom close icon</andes-button>

        <andes-dialog-content *andesDialogContent [closeIcon]="icon" closeLabel="Dismiss">
          <div andesDialogHeader>
            <h2 andesDialogTitle>Custom close icon</h2>
            <p andesDialogDescription>The glyph is yours; the button is still the component’s.</p>
          </div>
        </andes-dialog-content>
      </andes-dialog>

      <ng-template #icon>
        <ng-icon name="lucideCircleX" size="1rem" aria-hidden="true" />
      </ng-template>
    `,
  }),
};
