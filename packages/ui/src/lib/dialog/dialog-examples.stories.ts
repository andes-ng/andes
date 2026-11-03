import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { ANDES_DIALOG_IMPORTS } from './dialog';

/**
 * One story per example on Ant Design's Modal page (https://ant.design/components/modal),
 * in the page's order and under its names, rebuilt from andes-ng parts so the two can be
 * compared side by side. The default surface follows Ant's too: 520px wide, padded 20px
 * by 24px, with a 16px/600 title, a 12px gap above the footer, 32px buttons and a 45%
 * black mask.
 */
const meta: Meta = {
  title: 'Feedback/Dialog/Examples',
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj;

/** A row of buttons, the way Ant's `Space` lays them out. */
const ROW_STYLES = `
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--andes-space-2);
  }
`;

/** Ant's demo paragraphs carry no margin, so the body is exactly one line per `<p>`. */
const BODY_STYLES = `
  .body p {
    margin: 0;
  }
`;

/* ------------------------------------------------------------------ Basic */

@Component({
  selector: 'andes-dialog-example-basic',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)">Open Modal</andes-button>

    <andes-dialog [(open)]="open" footer="default" (ok)="open.set(false)">
      <andes-dialog-content
        *andesDialogContent
        closeLabel="Custom Close Button"
      >
        <div andesDialogHeader>
          <h2 andesDialogTitle>Basic Modal</h2>
        </div>
        <div class="body">
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: BODY_STYLES,
})
class BasicExample {
  protected readonly open = signal(false);
}

/** A basic modal: a title, some content and the built-in OK and Cancel buttons. */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: { imports: [BasicExample] },
    template: '<andes-dialog-example-basic />',
  }),
};

/* ------------------------------------------------------ Asynchronously close */

@Component({
  selector: 'andes-dialog-example-async',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)"
      >Open Modal with async logic</andes-button
    >

    <andes-dialog
      [(open)]="open"
      footer="default"
      [confirmLoading]="confirmLoading()"
      (ok)="handleOk()"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Title</h2>
        </div>
        <p class="body">{{ text() }}</p>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: `
    .body {
      margin: 0;
    }
  `,
})
class AsyncExample {
  protected readonly open = signal(false);
  protected readonly confirmLoading = signal(false);
  protected readonly text = signal('Content of the modal');

  protected handleOk(): void {
    this.text.set('The modal will be closed after two seconds');
    this.confirmLoading.set(true);
    setTimeout(() => {
      this.open.set(false);
      this.confirmLoading.set(false);
    }, 2000);
  }
}

/**
 * `ok` never closes the dialog by itself: switch `confirmLoading` on, finish the work
 * and then set `open` to false.
 */
export const AsynchronouslyClose: Story = {
  name: 'Asynchronously close',
  render: () => ({
    moduleMetadata: { imports: [AsyncExample] },
    template: '<andes-dialog-example-async />',
  }),
};

/* ------------------------------------------------------- Customized Footer */

@Component({
  selector: 'andes-dialog-example-footer',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)"
      >Open Modal with customized footer</andes-button
    >

    <andes-dialog [(open)]="open" [footer]="footer">
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Title</h2>
        </div>
        <div class="body">
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <ng-template #footer>
      <andes-button variant="secondary" (click)="open.set(false)"
        >Return</andes-button
      >
      <andes-button [loading]="loading()" (click)="handleOk()"
        >Submit</andes-button
      >
      <andes-button
        href="https://google.com"
        target="_blank"
        [loading]="loading()"
        (click)="handleOk()"
        >Search on Google</andes-button
      >
    </ng-template>
  `,
  styles: BODY_STYLES,
})
class FooterExample {
  protected readonly open = signal(false);
  protected readonly loading = signal(false);

  protected handleOk(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.open.set(false);
    }, 3000);
  }
}

/**
 * A custom footer is a template: its Submit button spins for three seconds and the
 * dialog then closes, and leaving `footer` unset renders none.
 */
export const CustomizedFooter: Story = {
  name: 'Customized Footer',
  render: () => ({
    moduleMetadata: { imports: [FooterExample] },
    template: '<andes-dialog-example-footer />',
  }),
};

/* ----------------------------------------------------------------- Loading */

@Component({
  selector: 'andes-dialog-example-loading',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="showLoading()">Open Modal</andes-button>

    <andes-dialog [(open)]="open" [loading]="loading()" [footer]="footer">
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Loading Modal</h2>
        </div>
        <div class="body">
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <ng-template #footer>
      <andes-button (click)="showLoading()">Reload</andes-button>
    </ng-template>
  `,
  styles: BODY_STYLES,
})
class LoadingExample {
  protected readonly open = signal(false);
  protected readonly loading = signal(true);

  protected showLoading(): void {
    this.open.set(true);
    this.loading.set(true);
    // Simple loading mock. Clear the timer in real code.
    setTimeout(() => this.loading.set(false), 2000);
  }
}

/** `loading` swaps the body for a skeleton and hides the footer until the data arrives. */
export const Loading: Story = {
  render: () => ({
    moduleMetadata: { imports: [LoadingExample] },
    template: '<andes-dialog-example-loading />',
  }),
};

/* ------------------------------------------ Customized Footer render function */

@Component({
  selector: 'andes-dialog-example-footer-render',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)">Open Modal</andes-button>

    <andes-dialog [(open)]="open" [footer]="footer" (ok)="open.set(false)">
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Title</h2>
        </div>
        <div class="body">
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <ng-template #footer let-buttons="defaultButtons">
      <andes-button variant="secondary">Custom Button</andes-button>
      <ng-container *ngTemplateOutlet="buttons" />
    </ng-template>
  `,
  styles: BODY_STYLES,
})
class FooterRenderExample {
  protected readonly open = signal(false);
}

/**
 * A footer template is handed the built-in buttons as `defaultButtons`, so it can put its
 * own button in front of the OK and Cancel pair instead of rebuilding them.
 */
export const CustomizedFooterRenderFunction: Story = {
  name: 'Customized Footer render function',
  render: () => ({
    moduleMetadata: { imports: [FooterRenderExample] },
    template: '<andes-dialog-example-footer-render />',
  }),
};

/* --------------------------------------------------------- Internationalization */

@Component({
  selector: 'andes-dialog-example-locale',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)">Modal</andes-button>

    <andes-dialog
      [(open)]="open"
      footer="default"
      okText="确认"
      cancelText="取消"
      (ok)="open.set(false)"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Modal</h2>
        </div>
        <div class="body">
          <p>Bla bla ...</p>
          <p>Bla bla ...</p>
          <p>Bla bla ...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: BODY_STYLES,
})
class LocaleExample {
  protected readonly open = signal(false);
}

/** The button labels are plain strings (`okText`, `cancelText`), so they translate freely. */
export const Internationalization: Story = {
  render: () => ({
    moduleMetadata: { imports: [LocaleExample] },
    template: '<andes-dialog-example-locale />',
  }),
};

/* ------------------------------------ To customize the position of modal */

@Component({
  selector: 'andes-dialog-example-position',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <andes-button (click)="top.set(true)"
      >Display a modal dialog at 20px to Top</andes-button
    >
    <br />
    <br />
    <andes-button (click)="centered.set(true)"
      >Vertically centered modal dialog</andes-button
    >

    <andes-dialog
      [(open)]="top"
      [centered]="false"
      footer="default"
      (ok)="top.set(false)"
    >
      <andes-dialog-content *andesDialogContent class="sb-top-20">
        <div andesDialogHeader>
          <h2 andesDialogTitle>20px to Top</h2>
        </div>
        <div class="body">
          <p>some contents...</p>
          <p>some contents...</p>
          <p>some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <andes-dialog
      [(open)]="centered"
      footer="default"
      (ok)="centered.set(false)"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Vertically centered modal dialog</h2>
        </div>
        <div class="body">
          <p>some contents...</p>
          <p>some contents...</p>
          <p>some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: `
    .body p {
      margin: 0;
    }

    /* Ant's example sets \`style.top\`. Here the offset is plain CSS on the pane, since
       the library only offers "centered or near the top". */
    .andes-overlay-pane:has(> .sb-top-20) {
      padding-block-start: 20px;
    }
  `,
})
class PositionExample {
  protected readonly top = signal(false);
  protected readonly centered = signal(false);
}

/** Centred by default; turn `centered` off to park the dialog near the top instead. */
export const ToCustomizeThePositionOfModal: Story = {
  name: 'To customize the position of modal',
  render: () => ({
    moduleMetadata: { imports: [PositionExample] },
    template: '<andes-dialog-example-position />',
  }),
};

/* ------------------------------------ Customize footer buttons props */

@Component({
  selector: 'andes-dialog-example-button-props',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button (click)="open.set(true)"
      >Open Modal with customized button props</andes-button
    >

    <andes-dialog
      [(open)]="open"
      footer="default"
      [okButtonProps]="{ disabled: true }"
      [cancelButtonProps]="{ disabled: true }"
      (ok)="open.set(false)"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Basic Modal</h2>
        </div>
        <div class="body">
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: BODY_STYLES,
})
class ButtonPropsExample {
  protected readonly open = signal(false);
}

/**
 * `okButtonProps` and `cancelButtonProps` reach the built-in buttons (here both are
 * disabled), next to `okType`, `okText`, `cancelText` and `confirmLoading`.
 */
export const CustomizeFooterButtonsProps: Story = {
  name: 'Customize footer buttons props',
  render: () => ({
    moduleMetadata: { imports: [ButtonPropsExample] },
    template: '<andes-dialog-example-button-props />',
  }),
};

/* -------------------------------------------- Custom modal content render */

@Component({
  selector: 'andes-dialog-example-modal-render',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-button variant="secondary" (click)="open.set(true)"
      >Open Draggable Modal</andes-button
    >

    <andes-dialog [(open)]="open" footer="default" (ok)="open.set(false)">
      <andes-dialog-content *andesDialogContent cdkDrag>
        <div andesDialogHeader class="handle" cdkDragHandle>
          <h2 andesDialogTitle>Draggable Modal</h2>
        </div>
        <div class="body">
          <p>
            Just don't learn physics at school and your life will be full of
            magic and miracles.
          </p>
          <br />
          <p>
            Day before yesterday I saw a rabbit, and yesterday a deer, and
            today, you.
          </p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles:
    `
    .handle {
      cursor: move;
      user-select: none;
    }
  ` + BODY_STYLES,
})
class ModalRenderExample {
  protected readonly open = signal(false);
}

/**
 * The surface is ordinary markup, so the CDK's `cdkDrag` on it and `cdkDragHandle` on the
 * header make it draggable without any dialog-specific API.
 */
export const CustomModalContentRender: Story = {
  name: 'Custom modal content render',
  render: () => ({
    moduleMetadata: { imports: [ModalRenderExample] },
    template: '<andes-dialog-example-modal-render />',
  }),
};

/* -------------------------------------- To customize the width of modal */

@Component({
  selector: 'andes-dialog-example-width',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="column">
      <andes-button (click)="open.set(true)"
        >Open Modal of 1000px width</andes-button
      >
      <andes-button (click)="openResponsive.set(true)"
        >Open Modal of responsive width</andes-button
      >
    </div>

    <andes-dialog
      [(open)]="open"
      [width]="1000"
      footer="default"
      (ok)="open.set(false)"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Modal 1000px width</h2>
        </div>
        <div class="body">
          <p>some contents...</p>
          <p>some contents...</p>
          <p>some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <andes-dialog
      [(open)]="openResponsive"
      [width]="responsive"
      footer="default"
      (ok)="openResponsive.set(false)"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Modal responsive width</h2>
        </div>
        <div class="body">
          <p>some contents...</p>
          <p>some contents...</p>
          <p>some contents...</p>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles:
    `
    .column {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--andes-space-4);
    }
  ` + BODY_STYLES,
})
class WidthExample {
  protected readonly open = signal(false);
  protected readonly openResponsive = signal(false);
  protected readonly responsive = {
    xs: '90%',
    sm: '80%',
    md: '70%',
    lg: '60%',
    xl: '50%',
    xxl: '40%',
  };
}

/** `width` takes a number (px), any CSS length or a per-breakpoint object. */
export const ToCustomizeTheWidthOfModal: Story = {
  name: 'To customize the width of modal',
  render: () => ({
    moduleMetadata: { imports: [WidthExample] },
    template: '<andes-dialog-example-width />',
  }),
};

/* ------------------------------------------ Custom semantic dom styling */

@Component({
  selector: 'andes-dialog-example-style-class',
  imports: [ANDES_DIALOG_IMPORTS, AndesButton, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="styled.set(true)"
        >Open Style Modal</andes-button
      >
      <andes-button (click)="functional.set(true)"
        >Open Function Modal</andes-button
      >
    </div>

    <andes-dialog [(open)]="styled" maskClass="sb-gradient-mask">
      <andes-dialog-content *andesDialogContent class="sb-container">
        <div andesDialogHeader>
          <h2 andesDialogTitle>Custom Style Modal</h2>
        </div>
        <ng-container *ngTemplateOutlet="shared" />
      </andes-dialog-content>
    </andes-dialog>

    <andes-dialog [(open)]="functional" [footer]="footer" [maskBlur]="true">
      <andes-dialog-content *andesDialogContent class="sb-fn-container">
        <div andesDialogHeader>
          <h2 andesDialogTitle>Custom Function Modal</h2>
        </div>
        <ng-container *ngTemplateOutlet="shared" />
      </andes-dialog-content>
    </andes-dialog>

    <ng-template #shared>
      <div class="sb-shared">
        <div>
          Following the Ant Design specification, we developed a React UI
          library antd that contains a set of high quality components and demos
          for building rich, interactive user interfaces.
        </div>
        <div>🌈 Enterprise-class UI designed for web applications.</div>
        <div>📦 A set of high-quality React components out of the box.</div>
        <div>🛡 Written in TypeScript with predictable static types.</div>
        <div>⚙️ Whole package of design resources and development tools.</div>
        <div>🌍 Internationalization support for dozens of languages.</div>
        <div>🎨 Powerful theme customization in every detail.</div>
      </div>
    </ng-template>

    <ng-template #footer>
      <andes-button variant="secondary" (click)="functional.set(false)"
        >Cancel</andes-button
      >
      <andes-button (click)="styled.set(true)">Submit</andes-button>
    </ng-template>
  `,
  styles: `
    ${ROW_STYLES}

    .sb-shared {
      line-height: 28px;
    }

    /* The surface is restyled through its custom properties and plain classes (doubled
       with .andes-dialog, so they outrank its own rule whichever sheet loads last). The
       mask takes a class of its own (maskClass), and --andes-dialog-mask is its fill. */
    .sb-gradient-mask {
      --andes-dialog-mask: linear-gradient(
        to top,
        #18181b 0,
        rgb(21 21 22 / 20%) 100%
      );
    }

    .andes-dialog.sb-container {
      --andes-dialog-padding-block: 10px;
      --andes-dialog-padding-inline: 10px;

      border-radius: 10px;
    }

    .andes-dialog.sb-fn-container {
      --andes-dialog-padding-block: 0;
      --andes-dialog-padding-inline: 0;
      --andes-dialog-gap: 0;

      overflow: hidden;
      border: 1px solid #ccc;
      border-radius: 14px;
    }

    .sb-fn-container .andes-dialog__header {
      padding: 16px;
    }

    .sb-fn-container .sb-shared {
      padding: 16px;
    }

    .sb-fn-container .andes-dialog__footer {
      margin: 0;
      padding: 16px 10px;
      background-color: #fafafa;
    }
  `,
})
class StyleClassExample {
  protected readonly styled = signal(false);
  protected readonly functional = signal(false);
}

/**
 * The surface, its parts and the mask are styled with plain classes and custom
 * properties (`maskClass`, `--andes-dialog-padding-*`, `--andes-dialog-mask`).
 */
export const CustomSemanticDomStyling: Story = {
  name: 'Custom semantic dom styling',
  render: () => ({
    moduleMetadata: { imports: [StyleClassExample] },
    template: '<andes-dialog-example-style-class />',
  }),
};
