import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  inject,
  Injectable,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import {
  applicationConfig,
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesAlert,
  type AndesAlertCloseEvent,
  type AndesAlertStyles,
} from './alert';

/**
 * One story per example on Ant Design's Alert page (https://ant.design/components/alert), in
 * the page's order and under its names, rebuilt from andes-ng parts so the two can be compared
 * side by side. Ant's alerts show no icon unless `showIcon` is set, while an andes-ng alert
 * shows one unless `showIcon` is off, so the stories switch it off wherever Ant has none. The
 * measures are Ant's too: a title-only alert is a 40px strip padded 8px by 12px with a 14px
 * icon, an alert with a description is padded 20px by 24px with a 24px icon and a 16px title,
 * and both have an 8px radius.
 */
const meta: Meta = {
  title: 'Feedback/Alert/Examples',
  parameters: { layout: 'padded' },
  decorators: [moduleMetadata({ imports: [AndesAlert, AndesButton] })],
};

export default meta;

type Story = StoryObj;

/** Ant lays its demos out with `<br />`; a flex column with a gap gives the same rhythm. */
const STACK =
  'display: flex; flex-direction: column; gap: 1rem; max-width: 40rem;';

/* ------------------------------------------------------------------ Basic */

/** The simplest usage for short messages. */
export const Basic: Story = {
  render: () => ({
    template: `<andes-alert severity="success" title="Success Text" [showIcon]="false" />`,
  }),
};

/* ----------------------------------------------------------------- Filled */

/** `variant="filled"` hides the border and keeps the wash of the severity. */
export const Filled: Story = {
  render: () => ({
    template: `<andes-alert severity="info" variant="filled" title="Info Text" [showIcon]="false" />`,
  }),
};

/* ------------------------------------------------------------ Description */

/** A `description` adds a second, smaller line under the title and roomier padding. */
export const Description: Story = {
  render: () => ({
    props: { stack: STACK },
    template: `<div [style]="stack">
      <andes-alert severity="success" title="Success Text" description="Success Description Success Description Success Description" [showIcon]="false" />
      <andes-alert severity="info" title="Info Text" description="Info Description Info Description Info Description Info Description" [showIcon]="false" />
      <andes-alert severity="warning" title="Warning Text" description="Warning Description Warning Description Warning Description Warning Description" [showIcon]="false" />
      <andes-alert severity="danger" title="Error Text" description="Error Description Error Description Error Description Error Description" [showIcon]="false" />
    </div>`,
  }),
};

/* ----------------------------------------------------------------- Banner */

/**
 * `banner` shows the alert as a strip at the top of the page: no border, no radius, the icon on
 * and the severity `warning` unless another is set. It can be closable and drop the icon.
 */
export const Banner: Story = {
  render: () => ({
    props: { stack: STACK },
    template: `<div [style]="stack">
      <andes-alert banner title="Warning text" />
      <andes-alert banner closable title="Very long warning text warning text text text text text text text" />
      <andes-alert banner [showIcon]="false" title="Warning text without icon" />
      <andes-alert banner severity="danger" title="Error text" />
    </div>`,
  }),
};

/* ------------------------------------------------------- Smoothly Unmount */

@Component({
  selector: 'andes-alert-example-unmount',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      @if (visible()) {
        <andes-alert
          severity="success"
          title="Alert Message Text"
          [showIcon]="false"
          closable
          (afterClose)="visible.set(false)"
        />
      }
      <p class="note">click the close button to see the effect</p>
      <andes-button
        variant="outline"
        size="sm"
        [disabled]="visible()"
        (click)="visible.set(true)"
        >Show the alert again</andes-button
      >
    </div>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      max-width: 40rem;
    }
    .stack > andes-alert {
      align-self: stretch;
    }
    .note {
      margin: 0;
    }
  `,
})
class UnmountExample {
  protected readonly visible = signal(true);
}

/**
 * Closing collapses the alert over 0.3s - its height and opacity together - so what sits below
 * slides up instead of jumping, and `afterClose` fires once it is gone. Under
 * prefers-reduced-motion it disappears at once.
 */
export const SmoothlyUnmount: Story = {
  name: 'Smoothly Unmount',
  render: () => ({
    moduleMetadata: { imports: [UnmountExample] },
    template: '<andes-alert-example-unmount />',
  }),
};

/* ---------------------------------------------------------- Custom action */

/**
 * The `action` slot sits next to the close button when `actionPlacement` is `end`: centred on
 * a title-only alert, at the top edge when there is a description. Anything can go in it.
 */
export const CustomAction: Story = {
  name: 'Custom action',
  render: () => ({
    props: { stack: STACK },
    template: `<div [style]="stack">
      <andes-alert severity="success" title="Success Tips" actionPlacement="end" closable>
        <andes-button slot="action" size="sm" variant="ghost">UNDO</andes-button>
      </andes-alert>
      <andes-alert severity="danger" title="Error Text" description="Error Description Error Description Error Description Error Description" actionPlacement="end">
        <andes-button slot="action" size="sm" variant="outline" danger>Detail</andes-button>
      </andes-alert>
      <andes-alert severity="warning" title="Warning Text" [showIcon]="false" actionPlacement="end" closable>
        <andes-button slot="action" size="sm" variant="ghost">Done</andes-button>
      </andes-alert>
      <andes-alert severity="info" title="Info Text" description="Info Description Info Description Info Description Info Description" [showIcon]="false" actionPlacement="end" closable>
        <div slot="action" style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 5rem;">
          <andes-button size="sm" fullWidth>Accept</andes-button>
          <andes-button size="sm" variant="outline" danger fullWidth>Decline</andes-button>
        </div>
      </andes-alert>
    </div>`,
  }),
};

/* ------------------------------------------- Custom semantic dom styling */

/**
 * Classes that out-weigh the component's own rules: the alert's stylesheet is encapsulated, so
 * a lone class selector would lose to it. Repeating the class raises the specificity, and
 * `styles` (inline) always wins without that.
 */
const SEMANTIC_STYLES = `
  .alert-example-root.alert-example-root.andes-alert {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 12px;
  }
`;

@Component({
  selector: 'andes-alert-example-semantic',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="alert-example-stack">
      <andes-alert
        severity="info"
        title="Object styles"
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
        [classNames]="classNames"
        [styles]="functionStyles"
      />
    </div>
  `,
  styles: `
    .alert-example-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 40rem;
    }
    ${SEMANTIC_STYLES}
  `,
})
class SemanticExample {
  protected readonly classNames = { root: 'alert-example-root' };
  protected readonly objectStyles: AndesAlertStyles = {
    icon: { fontSize: '18px', width: '18px', height: '18px' },
    section: { fontWeight: 500 },
  };
  protected readonly functionStyles = ({
    props: { severity },
  }: {
    props: { severity: string };
  }): AndesAlertStyles => {
    if (severity === 'success') {
      return {
        root: {
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          borderColor: '#b7eb8f',
        },
        icon: { color: '#52c41a' },
      };
    }
    if (severity === 'warning') {
      return {
        root: {
          backgroundColor: 'rgba(250, 173, 20, 0.1)',
          borderColor: '#ffe58f',
        },
        icon: { color: '#faad14' },
      };
    }
    return {};
  };
}

/**
 * `classNames` and `styles` take an object, or a function of the alert's props, with a value
 * for each part: root, icon, section, title, description, actions and close.
 */
export const CustomSemanticDomStyling: Story = {
  name: 'Custom semantic dom styling',
  render: () => ({
    moduleMetadata: { imports: [SemanticExample] },
    template: '<andes-alert-example-semantic />',
  }),
};

/* ------------------------------------------------------------- More types */

/** There are 4 types of alert: `success`, `info`, `warning` and `danger`. */
export const MoreTypes: Story = {
  name: 'More types',
  render: () => ({
    props: { stack: STACK },
    template: `<div [style]="stack">
      <andes-alert severity="success" title="Success Text" [showIcon]="false" />
      <andes-alert severity="info" title="Info Text" [showIcon]="false" />
      <andes-alert severity="warning" title="Warning Text" [showIcon]="false" />
      <andes-alert severity="danger" title="Error Text" [showIcon]="false" />
    </div>`,
  }),
};

/* --------------------------------------------------------------- Closable */

@Component({
  selector: 'andes-alert-example-closable',
  imports: [AndesAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      <andes-alert
        severity="warning"
        title="Warning Title"
        [showIcon]="false"
        closable
        closeLabel="close"
        (closing)="onClose($event)"
      />
      <andes-alert
        severity="success"
        title="Success Title"
        [showIcon]="false"
        closable
        closeLabel="close"
        (closing)="onClose($event)"
      />
      <andes-alert
        severity="info"
        title="Info Title"
        [showIcon]="false"
        closable
        closeLabel="close"
        (closing)="onClose($event)"
      />
      <andes-alert
        severity="danger"
        title="Error Title"
        [showIcon]="false"
        closable
        closeLabel="close"
        (closing)="onClose($event)"
      />
      <p class="log" aria-live="polite">{{ log() }}</p>
    </div>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 40rem;
    }
    .log {
      margin: 0;
      min-height: 1.375rem;
    }
  `,
})
class ClosableExample {
  protected readonly log = signal('');

  protected onClose(event: AndesAlertCloseEvent): void {
    const title = event.source.title();
    this.log.set(`"${title}" was closed.`);
  }
}

/**
 * `closable` adds the close button. `closing` fires first and can be cancelled with
 * `preventDefault()`; `closeLabel` names the button for assistive technology.
 */
export const Closable: Story = {
  render: () => ({
    moduleMetadata: { imports: [ClosableExample] },
    template: '<andes-alert-example-closable />',
  }),
};

/* ------------------------------------------------------------------- Icon */

/**
 * A relevant icon makes the message clearer: `showIcon` (on by default) shows the glyph of the
 * severity, and `icon` replaces it with any template.
 */
export const Icon: Story = {
  render: () => ({
    props: { stack: STACK },
    template: `<div [style]="stack">
      <andes-alert severity="success" title="Success Tips" />
      <andes-alert severity="info" title="Informational Notes" />
      <andes-alert severity="warning" title="Warning" closable />
      <andes-alert severity="danger" title="Error" />
      <andes-alert severity="success" title="Success Tips" description="Detailed description and advice about successful copywriting." />
      <andes-alert severity="info" title="Informational Notes" description="Additional description and information about copywriting." />
      <andes-alert severity="warning" title="Warning" description="This is a warning notice about copywriting." closable />
      <andes-alert severity="danger" title="Error" description="This is an error message about copywriting." />
    </div>`,
  }),
};

/* ------------------------------------------------------------ Loop Banner */

/**
 * `marquee` scrolls the text of a banner in a loop; hovering or focusing it pauses the loop,
 * and under prefers-reduced-motion the text simply wraps. `marqueeSpeed` sets the pace.
 */
export const LoopBanner: Story = {
  name: 'Loop Banner',
  render: () => ({
    template: `<andes-alert banner marquee>
      I can be a template, several elements, or just some text.
    </andes-alert>`,
  }),
};

/* ----------------------------------------------------------- ErrorBoundary */

/**
 * Angular has no render-time error boundary like React's, and its errors do not stop at a
 * component: whatever a listener, an effect or change detection throws goes to the app's
 * `ErrorHandler`. The idiomatic boundary is therefore a handler that keeps the error in a
 * signal, with an alert that renders it. This one is provided for the story only; a real app
 * provides it once (`{ provide: ErrorHandler, useClass: ... }`) and reads the signal wherever
 * it wants to show the failure.
 */
@Injectable()
class ErrorBoundaryHandler extends ErrorHandler {
  readonly error = signal<Error | null>(null);

  override handleError(error: unknown): void {
    this.error.set(error instanceof Error ? error : new Error(String(error)));
  }
}

@Component({
  selector: 'andes-alert-example-error-boundary',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      @if (boundary.error(); as error) {
        <andes-alert
          severity="danger"
          [title]="error.message"
          [description]="error.stack ?? ''"
          role="alert"
        />
      } @else {
        <andes-button variant="outline" danger (click)="throwError()"
          >Click to throw an error</andes-button
        >
      }
    </div>
  `,
  styles: `
    .stack {
      max-width: 40rem;
    }
    andes-alert {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  `,
})
class ErrorBoundaryExample {
  protected readonly boundary = inject(ErrorHandler) as ErrorBoundaryHandler;

  protected throwError(): never {
    throw new Error('An Uncaught Error');
  }
}

/** An uncaught error reaches the `ErrorHandler`, which hands it to an alert. */
export const ErrorBoundary: Story = {
  name: 'ErrorBoundary',
  decorators: [
    applicationConfig({
      providers: [{ provide: ErrorHandler, useClass: ErrorBoundaryHandler }],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [ErrorBoundaryExample] },
    template: '<andes-alert-example-error-boundary />',
  }),
};

/* ------------------------------------------------------- Long title wraps */

const LONG_TITLE =
  'Long alert title wraps to multiple lines when the alert container is narrow enough.';

/**
 * In a narrow container a long title wraps. Without a description the icon, the content, the
 * action and the close button stay vertically centred on the row as a group.
 */
export const LongTitleWraps: Story = {
  name: 'Long title wraps',
  render: () => ({
    props: {
      narrow: 'display: flex; flex-direction: column; gap: 1rem; width: 360px;',
      title: LONG_TITLE,
    },
    template: `<div [style]="narrow">
      <andes-alert severity="info" [title]="title" closable />
      <andes-alert severity="success" [title]="title" actionPlacement="end" closable>
        <andes-button slot="action" size="sm" variant="ghost">Action</andes-button>
      </andes-alert>
    </div>`,
  }),
};

/* --------------------------------------------------- Custom title alignment */

/**
 * The same long titles, with the icon, the action and the close button lined up with the first
 * line through `styles` - the recipe for when the group should not be centred. The offsets are
 * half of the difference between the 22px title line and each part (14px icon, 24px small
 * button, 12px close glyph).
 */
const FIRST_LINE_STYLES: AndesAlertStyles = {
  root: { alignItems: 'flex-start' },
  icon: { marginBlockStart: '4px' },
  actions: { marginBlockStart: '-1px' },
  close: { marginBlockStart: '5px' },
};

/** When there is no description, Alert centres the icon, content, action and close button. */
export const CustomTitleAlignment: Story = {
  name: 'Custom title alignment',
  render: () => ({
    props: {
      narrow: 'display: flex; flex-direction: column; gap: 1rem; width: 360px;',
      title: LONG_TITLE,
      firstLine: FIRST_LINE_STYLES,
    },
    template: `<div [style]="narrow">
      <andes-alert severity="info" [title]="title" closable [styles]="firstLine" />
      <andes-alert severity="success" [title]="title" actionPlacement="end" closable [styles]="firstLine">
        <andes-button slot="action" size="sm" variant="ghost">Action</andes-button>
      </andes-alert>
    </div>`,
  }),
};
