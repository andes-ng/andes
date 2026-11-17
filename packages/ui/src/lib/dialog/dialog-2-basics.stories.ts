import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import type { AndesDialog } from './dialog';

/*
 * Opening and closing a dialog, how wide it is and where it sits, and how its heading and
 * description are written.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Basics',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** The smallest dialog: a trigger, a header and two ways out. */
export const OpenAndClose: Story = {
  name: 'Open and close',
  parameters: about(
    'A trigger opens the dialog, and the close button, Escape, a click on the mask and the actions marked andesDialogClose all close it again, returning focus to the trigger.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger>Edit profile</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Edit profile</h2>
            <p andesDialogDescription>
              Make changes to your profile here. Click save when you are done.
            </p>
          </div>

          <andes-form-field label="Name">
            <andes-input value="Ada Lovelace" />
          </andes-form-field>

          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
            <andes-button andesDialogClose>Save changes</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** Driving the open state from the page. */
export const ControlledOpenState: Story = {
  name: 'Controlled open state',
  parameters: about(
    'The open state lives in the page with [(open)], so a button, a switch or any code can open the dialog without a trigger inside it, and the page sees it close.',
  ),
  render: () => ({
    props: { ...shared, open: signal(false) },
    template: `
      <div [style]="formRow">
        <andes-button (click)="open.set(true)">Open from outside</andes-button>
        <andes-switch [checked]="open()" (checkedChange)="open.set($event)">Open</andes-switch>
        <andes-tag [color]="open() ? 'success' : 'default'">{{ open() ? 'open' : 'closed' }}</andes-tag>
      </div>

      <andes-dialog [(open)]="open">
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Controlled dialog</h2>
            <p andesDialogDescription>
              The open state lives in the page, not in the dialog.
            </p>
          </div>

          <div andesDialogFooter>
            <andes-button andesDialogClose>Done</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** The four steps of the width scale. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'size is sm, md (the default), lg or xl, a step of the width scale, and every step still gives way to the viewport on a narrow screen.',
  ),
  render: () => ({
    props: {
      ...shared,
      sizes: [
        { size: 'sm', width: '384px' },
        { size: 'md', width: '520px' },
        { size: 'lg', width: '640px' },
        { size: 'xl', width: '800px' },
      ],
    },
    template: `
      <div [style]="row">
        @for (item of sizes; track item.size) {
          <andes-dialog [size]="item.size">
            <andes-button andesDialogTrigger variant="secondary">Size {{ item.size }}</andes-button>

            <andes-dialog-content *andesDialogContent>
              <div andesDialogHeader>
                <h2 andesDialogTitle>Size {{ item.size }}</h2>
                <p andesDialogDescription>
                  This surface is at most {{ item.width }} wide.
                </p>
              </div>

              <div andesDialogFooter>
                <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
                <andes-button andesDialogClose>Save changes</andes-button>
              </div>
            </andes-dialog-content>
          </andes-dialog>
        }
      </div>
    `,
  }),
};

/** An explicit width. */
export const ResponsiveWidth: Story = {
  name: 'Responsive width',
  parameters: about(
    'width takes a number of pixels, any CSS length or a map per breakpoint, so a surface can be exactly 1000px, 60% of the screen or a width that steps as the window is resized, and it never outgrows the viewport.',
  ),
  render: () => ({
    props: {
      ...shared,
      steps: { xs: '100%', sm: '90%', md: '80%', lg: 720, xl: 960 },
    },
    template: `
      <div [style]="row">
        <andes-dialog [width]="1000" footer="default" okText="Done" [showCancel]="false" #fixed (ok)="fixed.hide()">
          <andes-button andesDialogTrigger variant="secondary">1000px wide</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>A fixed width</h2>
              <p andesDialogDescription>1000px, or the viewport when that is narrower.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog width="60%" footer="default" okText="Done" [showCancel]="false" #length (ok)="length.hide()">
          <andes-button andesDialogTrigger variant="secondary">60% wide</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>A CSS length</h2>
              <p andesDialogDescription>Any CSS length works: 60% of the viewport here.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [width]="steps" footer="default" okText="Done" [showCancel]="false" #stepped (ok)="stepped.hide()">
          <andes-button andesDialogTrigger variant="secondary">Width per breakpoint</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Responsive width</h2>
              <p andesDialogDescription>
                100% below 576px, 90% up to 768px, 80% up to 992px, 720px up to 1200px and 960px
                beyond; resize the window to watch it step.
              </p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/** Where the surface sits. */
export const CenteredAndTopAligned: Story = {
  name: 'Centered and top aligned',
  parameters: about(
    'The surface is centred vertically by default, and with [centered]="false" it is parked near the top, where it does not jump when its content grows, which the switch inside each dialog shows.',
  ),
  render: () => ({
    props: {
      ...shared,
      centeredMore: signal(false),
      topMore: signal(false),
      lines: [1, 2, 3, 4, 5, 6],
    },
    template: `
      <div [style]="row">
        <andes-dialog (closed)="centeredMore.set(false)">
          <andes-button andesDialogTrigger variant="secondary">Centered</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Vertically centered</h2>
              <p andesDialogDescription>Show more: the surface re-centres and moves.</p>
            </div>
            <andes-switch [checked]="centeredMore()" (checkedChange)="centeredMore.set($event)">Show more</andes-switch>
            @if (centeredMore()) {
              @for (line of lines; track line) {
                <p [style]="text" style="margin: 0;">Another line of content, number {{ line }}.</p>
              }
            }
            <div andesDialogFooter>
              <andes-button andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [centered]="false" (closed)="topMore.set(false)">
          <andes-button andesDialogTrigger variant="secondary">Top aligned</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Near the top</h2>
              <p andesDialogDescription>Show more: the top edge stays where it is.</p>
            </div>
            <andes-switch [checked]="topMore()" (checkedChange)="topMore.set($event)">Show more</andes-switch>
            @if (topMore()) {
              @for (line of lines; track line) {
                <p [style]="text" style="margin: 0;">Another line of content, number {{ line }}.</p>
              }
            }
            <div andesDialogFooter>
              <andes-button andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/** A body longer than the screen. */
export const LongScrollingContent: Story = {
  name: 'Long scrolling content',
  parameters: about(
    'A body longer than the viewport scrolls inside the surface while the page behind stays locked, and the header stays in view with the footer pinned at the bottom.',
  ),
  render: () => ({
    props: {
      ...shared,
      sections: Array.from({ length: 14 }, (_, i) => i + 1),
    },
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger>Release notes</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Release notes</h2>
            <p andesDialogDescription>Everything that changed in version 4.2.</p>
          </div>

          @for (section of sections; track section) {
            <div [style]="stack">
              <span [style]="strong">Section {{ section }}</span>
              <span [style]="muted">
                The surface scrolls, the page behind it does not. Keep going: the footer stays pinned.
              </span>
            </div>
          }

          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Close</andes-button>
            <andes-button andesDialogClose>Got it</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** How the heading and the description are written. */
export const TitlesAndDescriptions: Story = {
  name: 'Titles and descriptions',
  parameters: about(
    'The title names the dialog and the description says what it is for, both are read out when it opens, and either can carry more than text, such as a tag or an icon, or be left out of the header entirely.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div [style]="row">
        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Title only</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Invitation sent</h2>
            </div>
            <div andesDialogFooter>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Title and description</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Share this report</h2>
              <p andesDialogDescription>
                Anyone with the link can read it; they cannot edit it.
              </p>
            </div>
            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
              <andes-button andesDialogClose>Copy link</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Title with an icon and a tag</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle style="display: flex; align-items: center; gap: 0.5rem;">
                <ng-icon name="lucideSparkles" size="1.125rem" aria-hidden="true" />
                Smart suggestions
                <andes-tag color="primary">Beta</andes-tag>
              </h2>
              <p andesDialogDescription>
                Suggestions are drawn from your last 30 days of activity.
              </p>
            </div>
            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Not now</andes-button>
              <andes-button andesDialogClose>Turn on</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">A long title</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>
                Move 128 files from the Quarterly planning workspace to the Archive
              </h2>
              <p andesDialogDescription>A long title wraps and keeps clear of the close button.</p>
            </div>
            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
              <andes-button andesDialogClose>Move files</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};
