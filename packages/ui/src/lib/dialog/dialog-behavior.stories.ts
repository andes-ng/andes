import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { ANDES_DIALOG_IMPORTS, AndesDialog } from './dialog';

/**
 * Buttons inside the stories are `AndesButton` wherever the element is not the
 * trigger. The trigger itself is a native `<button>`: the overlay primitive puts
 * `aria-haspopup`/`aria-expanded`/`aria-controls` on the element the directive sits
 * on, and those attributes are only valid on an element with an interactive role -
 * putting the directive on the `<andes-button>` host wrapper would land them on a
 * roleless element and fail axe's `aria-allowed-attr`.
 */
const TRIGGER_STYLES = `
  <style>
    /* Metrics copied from .andes-button--md rather than invented: 2.25rem/0.875rem was a
       step that does not exist in the button scale, so the trigger read as a button from
       a different system than the AndesButtons it opens. */
    .sb-dialog-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--andes-space-2);
      height: 2rem;
      padding: 0 var(--andes-space-4);
      border: 1px solid transparent;
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-primary);
      color: var(--andes-color-primary-foreground);
      font-family: var(--andes-font-family), sans-serif;
      font-weight: var(--andes-font-weight-medium);
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .sb-dialog-trigger:hover { background-color: var(--andes-color-primary-hover); }
    .sb-dialog-trigger:focus-visible {
      outline: 2px solid var(--andes-color-focus-ring);
      outline-offset: 2px;
    }
    .sb-field {
      display: flex;
      flex-direction: column;
      gap: var(--andes-space-1);
      font-family: var(--andes-font-family), sans-serif;
      font-size: 0.875rem;
      color: var(--andes-color-foreground);
    }
  </style>
`;

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Behavior',
  component: AndesDialog,
};

export default meta;

type Story = StoryObj<AndesDialog>;

const LOG_STYLE =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);';

/** Driving `[(open)]` from outside, with no trigger of its own inside the dialog. */
export const ControlledOpenState: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { open: false },
    template: `
      ${TRIGGER_STYLES}
      <button type="button" class="sb-dialog-trigger" (click)="open = true">Open from outside</button>

      <andes-dialog [(open)]="open">
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Controlled dialog</h2>
            <p andesDialogDescription>
              Open state lives in the host component, not in the dialog.
            </p>
          </div>

          <div andesDialogFooter>
            <andes-button variant="primary" andesDialogClose>Done</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** Lifecycle outputs: `opened`, `afterOpenChange` (after the entry transition) and `closed`. */
export const LifecycleEvents: Story = {
  render: () => {
    const log = signal<string[]>([]);
    const push = (entry: string) => log.update((l) => [...l.slice(-5), entry]);
    return {
      moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS] },
      props: { log, push },
      template: `
        ${TRIGGER_STYLES}
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
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Open</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Lifecycle</h2>
              <p andesDialogDescription>Close it any way you like.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <p style="${LOG_STYLE}">{{ log().join(' -> ') || '-' }}</p>
      `,
    };
  },
};

/**
 * `loading` swaps the body for a skeleton: the title stays so the
 * dialog is still labelled, the footer is withheld until there is something to act on.
 */
export const LoadingSkeleton: Story = {
  render: () => {
    const loading = signal(false);
    return {
      moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS] },
      props: {
        loading,
        load() {
          loading.set(true);
          setTimeout(() => loading.set(false), 2000);
        },
      },
      template: `
        ${TRIGGER_STYLES}
        <andes-dialog [loading]="loading()" footer="default" (opened)="load()" #dialog (ok)="dialog.hide()">
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Load invoice</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Invoice #1042</h2>
            </div>
            <p style="margin: 0; font-size: 0.875rem;">
              Issued 3 March, due 2 April. Total: 1,240.00.
            </p>
          </andes-dialog-content>
        </andes-dialog>
      `,
    };
  },
};

/**
 * `[destroyOnClose]="false"` keeps the content alive across a close: type something,
 * close, reopen. The default destroys it, and `forceRender` builds it before the first
 * open.
 */
export const KeepContentAlive: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesInput] },
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog [destroyOnClose]="false" footer="default" okText="Close" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Draft message</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Draft message</h2>
            <p andesDialogDescription>What you type survives closing the dialog.</p>
          </div>

          <label class="sb-field">
            Message
            <andes-input placeholder="Type, close, reopen" />
          </label>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/**
 * The surface is ordinary markup, so the CDK's drag-and-drop directives make it
 * movable without any dialog-specific API: `cdkDrag` on the surface and
 * `cdkDragHandle` on the header, so text and controls in the body stay selectable.
 */
export const Draggable: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [ANDES_DIALOG_IMPORTS, AndesButton, CdkDrag, CdkDragHandle],
    },
    template: `
      ${TRIGGER_STYLES}
      <style>
        .sb-drag-handle { cursor: move; user-select: none; }
      </style>
      <andes-dialog footer="default" okText="Done" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Open movable dialog</button>

        <andes-dialog-content *andesDialogContent cdkDrag>
          <div andesDialogHeader class="sb-drag-handle" cdkDragHandle>
            <h2 andesDialogTitle>Drag me by the header</h2>
            <p andesDialogDescription>Move the dialog aside to compare with the page behind it.</p>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};
