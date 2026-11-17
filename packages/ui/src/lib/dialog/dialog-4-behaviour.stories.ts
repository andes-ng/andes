import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  NOTHING_YET,
  resultLine,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { ANDES_DIALOG_IMPORTS, AndesDialog } from './dialog';

/*
 * What a dialog does while it is open and when it closes: how it can be dismissed, what happens
 * to its content, its events, its focus, and the ways of moving, enlarging and stacking it.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Behaviour',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** Closing from the corner, the keyboard and the mask. */
export const Dismissal: Story = {
  name: 'Dismissal',
  parameters: about(
    'The close button, Escape and a click on the mask are each a switch, so they can be taken away to leave only the dialog’s own actions, and the reason it closed is reported on (closed).',
  ),
  render: () => ({
    props: {
      ...shared,
      closable: signal(true),
      keyboard: signal(true),
      outsideClick: signal(true),
      reason: signal('-'),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 30rem;">
        <div [style]="formRow">
          <andes-switch [checked]="closable()" (checkedChange)="closable.set($event)">Close button</andes-switch>
          <andes-switch [checked]="keyboard()" (checkedChange)="keyboard.set($event)">Escape</andes-switch>
          <andes-switch [checked]="outsideClick()" (checkedChange)="outsideClick.set($event)">Mask click</andes-switch>
        </div>
        <div [style]="formRow">
          <andes-dialog
            [closeOnEscape]="keyboard()"
            [closeOnOutsideClick]="outsideClick()"
            (closed)="reason.set($event)"
          >
            <andes-button andesDialogTrigger>Open</andes-button>

            <andes-dialog-content *andesDialogContent [showCloseButton]="closable()">
              <div andesDialogHeader>
                <h2 andesDialogTitle>Terms of service</h2>
                <p andesDialogDescription>
                  Try each way out; the ones switched off do nothing.
                </p>
              </div>

              <div andesDialogFooter>
                <andes-button variant="secondary" andesDialogClose>Decline</andes-button>
                <andes-button andesDialogClose>Accept</andes-button>
              </div>
            </andes-dialog-content>
          </andes-dialog>
          <span [style]="muted">Closed by: <strong [style]="strong">{{ reason() }}</strong></span>
        </div>
      </div>
    `,
  }),
};

/** The scrim. */
export const MaskOptions: Story = {
  name: 'Mask options and blur',
  parameters: about(
    'The mask dims the page by default, maskBlur frosts it as well and [mask]="false" drops it, and in every case the dialog keeps its focus trap and its scroll lock.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div [style]="row">
        <andes-dialog>
          <andes-button andesDialogTrigger variant="secondary">Dimmed mask</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>The default mask</h2>
              <p andesDialogDescription>The page behind the scrim is dimmed.</p>
            </div>
            <div andesDialogFooter>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [maskBlur]="true">
          <andes-button andesDialogTrigger variant="secondary">Blurred mask</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>A blurred mask</h2>
              <p andesDialogDescription>The page behind the scrim is frosted as well as dimmed.</p>
            </div>
            <div andesDialogFooter>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [mask]="false">
          <andes-button andesDialogTrigger variant="secondary">No mask</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Without a mask</h2>
              <p andesDialogDescription>
                The scrim is gone; focus stays trapped and the page stays locked.
              </p>
            </div>
            <div andesDialogFooter>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/** Content that survives a close. */
export const KeepContentAlive: Story = {
  name: 'Keep content alive',
  parameters: about(
    'With [destroyOnClose]="false" the content is built once and kept, so what you typed is still there when the dialog is opened again, unlike the default dialog next to it.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div [style]="row">
        <andes-dialog footer="default" okText="Close" [showCancel]="false" #dropped (ok)="dropped.hide()">
          <andes-button andesDialogTrigger variant="secondary">Destroyed on close</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Draft message</h2>
              <p andesDialogDescription>Type, close, reopen: the message is gone.</p>
            </div>
            <andes-form-field label="Message">
              <andes-input placeholder="Type, close, reopen" />
            </andes-form-field>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [destroyOnClose]="false" footer="default" okText="Close" [showCancel]="false" #kept (ok)="kept.hide()">
          <andes-button andesDialogTrigger>Kept alive</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Draft message</h2>
              <p andesDialogDescription>What you type survives closing the dialog.</p>
            </div>
            <andes-form-field label="Message">
              <andes-input placeholder="Type, close, reopen" />
            </andes-form-field>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/** Content that is built when it is needed. */
export const DestroyOnHide: Story = {
  name: 'Destroy on hide',
  parameters: about(
    'By default the content is built when the dialog opens and destroyed when it closes, which the counter shows, and forceRender builds it before the first open so it can start loading early.',
  ),
  render: () => ({
    props: { ...shared, lazy: signal(0), eager: signal(0) },
    template: `
      <div [style]="row">
        <andes-dialog footer="default" okText="Close" [showCancel]="false" #lazyDialog (ok)="lazyDialog.hide()">
          <andes-button andesDialogTrigger variant="secondary">Built on open</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader (andesStoryCreated)="lazy.update(n => n + 1)">
              <h2 andesDialogTitle>Built on open</h2>
              <p andesDialogDescription>Closing destroys this content; opening builds it again.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <span [style]="muted">Built <strong [style]="strong">{{ lazy() }}</strong> times</span>
      </div>
      <div [style]="row" style="margin-top: 1rem;">
        <andes-dialog [forceRender]="true" footer="default" okText="Close" [showCancel]="false" #eagerDialog (ok)="eagerDialog.hide()">
          <andes-button andesDialogTrigger variant="secondary">Built before the first open</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader (andesStoryCreated)="eager.update(n => n + 1)">
              <h2 andesDialogTitle>Built up front</h2>
              <p andesDialogDescription>The content already exists when the page loads, and stays.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <span [style]="muted">Built <strong [style]="strong">{{ eager() }}</strong> times</span>
      </div>
    `,
  }),
};

/** A body that is still loading. */
export const LoadingSkeleton: Story = {
  name: 'Loading skeleton',
  parameters: about(
    '[loading] swaps the body for a skeleton while keeping the title, so the dialog is still labelled, and holds the footer back until there is something to act on.',
  ),
  render: () => {
    const loading = signal(false);
    return {
      props: {
        ...shared,
        loading,
        load() {
          loading.set(true);
          setTimeout(() => loading.set(false), 2000);
        },
      },
      template: `
        <andes-dialog [loading]="loading()" [footer]="footer" (opened)="load()" #dialog>
          <andes-button andesDialogTrigger>Load invoice</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Invoice #1042</h2>
            </div>
            <div [style]="stack">
              <span [style]="text">Issued 3 March, due 2 April.</span>
              <span [style]="strong">Total: 1,240.00</span>
              <andes-tag color="success">Paid</andes-tag>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <ng-template #footer>
          <andes-button variant="secondary" (click)="load()">Reload</andes-button>
          <andes-button (click)="dialog.hide()">Close</andes-button>
        </ng-template>
      `,
    };
  },
};

/** What the dialog tells the page. */
export const LifecycleEvents: Story = {
  name: 'Lifecycle events',
  parameters: about(
    'The outputs report opened, afterOpenChange once the entry transition ends, cancelled with the reason when the user backs out, and closed, so the page can follow a dialog from one end to the other.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    return {
      props: {
        ...shared,
        log,
        push: (entry: string) => log.update((l) => [...l.slice(-6), entry]),
      },
      template: `
        <andes-dialog
          footer="default"
          [showCancel]="false"
          #dialog
          (ok)="dialog.hide()"
          (opened)="push('opened')"
          (afterOpenChange)="push('afterOpenChange: ' + $event)"
          (cancelled)="push('cancelled: ' + $event)"
          (closed)="push('closed: ' + $event)"
        >
          <andes-button andesDialogTrigger>Open</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Lifecycle</h2>
              <p andesDialogDescription>Close it any way you like.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
          @for (entry of log(); track $index) {
            <andes-tag>{{ entry }}</andes-tag>
          } @empty {
            <span [style]="muted">Nothing happened yet.</span>
          }
        </div>
      `,
    };
  },
};

@Component({
  selector: 'andes-dialog-focus-demo',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton, AndesInput, AndesSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 34rem;"
    >
      <div class="row">
        <andes-switch
          [checked]="restore()"
          (checkedChange)="restore.set($event)"
          >Return focus on close</andes-switch
        >
        <andes-switch
          [checked]="elsewhere()"
          (checkedChange)="elsewhere.set($event)"
          >Return it to the other button</andes-switch
        >
        <andes-switch [checked]="trap()" (checkedChange)="trap.set($event)"
          >Trap focus</andes-switch
        >
      </div>
      <div class="row">
        <andes-dialog
          [restoreFocus]="restore()"
          [restoreFocusTo]="elsewhere() ? landing() : null"
          [trapFocus]="trap()"
        >
          <andes-button andesDialogTrigger>Open</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Where does focus go?</h2>
              <p andesDialogDescription>
                Tab through the dialog, then close it and see where focus lands.
              </p>
            </div>
            <andes-input aria-label="First field" placeholder="First field" />
            <andes-input aria-label="Second field" placeholder="Second field" />
            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose
                >Cancel</andes-button
              >
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <span #landingHost>
          <andes-button variant="secondary">The other button</andes-button>
        </span>
      </div>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }
  `,
})
class DialogFocusDemo {
  private readonly landingHost =
    viewChild.required<ElementRef<HTMLElement>>('landingHost');
  protected readonly restore = signal(true);
  protected readonly elsewhere = signal(false);
  protected readonly trap = signal(true);
  /** The real button inside the other `andes-button`, which is what focus can return to. */
  protected readonly landing = signal<HTMLElement | null>(null);

  constructor() {
    afterNextRender(() =>
      this.landing.set(
        this.landingHost().nativeElement.querySelector('button'),
      ),
    );
  }
}

/** Where focus goes. */
export const FocusOptions: Story = {
  name: 'Focus options and focus return',
  parameters: about(
    'Focus moves into the dialog when it opens and returns to the trigger when it closes, restoreFocus turns the return off, restoreFocusTo sends it to another element and trapFocus lets Tab leave the surface.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DialogFocusDemo] },
    template: '<andes-dialog-focus-demo />',
  }),
};

/** Moving the surface. */
export const Draggable: Story = {
  name: 'Draggable',
  parameters: about(
    'The surface is ordinary markup, so the CDK’s cdkDrag on it and cdkDragHandle on the header make it movable without any dialog API, and the text and controls in the body stay selectable.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <andes-dialog footer="default" okText="Done" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>Open movable dialog</andes-button>

        <andes-dialog-content *andesDialogContent cdkDrag>
          <div andesDialogHeader cdkDragHandle style="cursor: move; user-select: none;">
            <h2 andesDialogTitle>Drag me by the header</h2>
            <p andesDialogDescription>Move the dialog aside to compare it with the page behind.</p>
          </div>
          <p [style]="text" style="margin: 0;">
            Just don't learn physics at school and your life will be full of magic and miracles.
          </p>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** Filling the screen. */
export const MaximiseFullscreen: Story = {
  name: 'Maximise and fullscreen',
  parameters: about(
    '[maximizable] adds a control beside the close button that fills the viewport edge to edge, and [(fullscreen)] keeps the page in step with it and can open the dialog already maximised.',
  ),
  render: () => ({
    props: {
      ...shared,
      fullscreen: signal(false),
      open: signal(false),
      sections: [1, 2, 3, 4, 5, 6],
    },
    template: `
      <div [style]="row">
        <andes-button (click)="fullscreen.set(false); open.set(true)">Open</andes-button>
        <andes-button variant="secondary" (click)="fullscreen.set(true); open.set(true)">Open fullscreen</andes-button>
        <andes-tag [color]="fullscreen() ? 'primary' : 'default'">{{ fullscreen() ? 'fullscreen' : 'regular' }}</andes-tag>
      </div>

      <andes-dialog [(open)]="open" [(fullscreen)]="fullscreen" [maximizable]="true">
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Quarterly report</h2>
            <p andesDialogDescription>Maximise it to read at full size.</p>
          </div>

          @for (section of sections; track section) {
            <div [style]="stack">
              <span [style]="strong">Section {{ section }}</span>
              <span [style]="muted">The surface grows to the whole viewport and drops its rounded corners.</span>
            </div>
          }

          <div andesDialogFooter>
            <andes-button andesDialogClose>Close</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** A dialog opened from a dialog. */
export const NestedDialogs: Story = {
  name: 'Nested dialogs',
  parameters: about(
    'A dialog opened from inside another stacks above it with its own mask, Escape closes only the top one, and focus returns to the control that opened it.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-dialog>
          <andes-button andesDialogTrigger>Open the first dialog</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Project settings</h2>
              <p andesDialogDescription>Some settings open a dialog of their own.</p>
            </div>

            <andes-dialog size="sm">
              <andes-button andesDialogTrigger variant="secondary">Rename project</andes-button>

              <andes-dialog-content *andesDialogContent>
                <div andesDialogHeader>
                  <h2 andesDialogTitle>Rename project</h2>
                  <p andesDialogDescription>Escape closes this one and leaves the first open.</p>
                </div>
                <andes-form-field label="Name">
                  <andes-input value="acme-web" />
                </andes-form-field>
                <div andesDialogFooter>
                  <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
                  <andes-button andesDialogClose (click)="result.set('Renamed.')">Rename</andes-button>
                </div>
              </andes-dialog-content>
            </andes-dialog>

            <div andesDialogFooter>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};
