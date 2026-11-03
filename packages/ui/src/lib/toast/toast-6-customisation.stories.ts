import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  SEVERITY_TEXTS,
  SEVERITY_TITLES,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import type {
  AndesToastPart,
  AndesToastSeverity,
  AndesToastStyles,
  AndesToastTemplateContext,
} from './toast.types';
import { AndesToastViewport } from './toast-viewport';

type Template = TemplateRef<AndesToastTemplateContext>;

/** Styles for a severity, picked where the toast is shown. */
function stylesFor(severity: AndesToastSeverity): AndesToastStyles {
  const palette =
    severity === 'error'
      ? { fill: '#fff2f0', line: '#ffccc7', ink: '#cf1322', text: '#5c0011' }
      : { fill: '#f6ffed', line: '#95de64', ink: '#237804', text: '#3f6600' };
  return {
    root: {
      backgroundColor: palette.fill,
      border: `2px solid ${palette.line}`,
      borderRadius: '16px',
      boxShadow: `4px 4px 0 ${palette.line}`,
    },
    icon: { color: palette.ink },
    title: { color: palette.ink, fontWeight: '600' },
    description: { color: palette.text },
  };
}

/** One colour per part, so each one can be told apart in "Every part". */
const PART_COLOURS: Record<AndesToastPart, string> = {
  root: '#2563eb',
  wrapper: '#7c3aed',
  icon: '#db2777',
  content: '#ea580c',
  title: '#ca8a04',
  description: '#16a34a',
  actions: '#0d9488',
  close: '#dc2626',
  progress: '#4f46e5',
};

const PARTS = Object.keys(PART_COLOURS) as AndesToastPart[];

/** An outline in the part's colour for every part. */
const PART_STYLES: AndesToastStyles = Object.fromEntries(
  PARTS.map((part) => [
    part,
    { outline: `2px solid ${PART_COLOURS[part]}`, outlineOffset: '-2px' },
  ]),
);

@Component({
  selector: 'andes-toast-class-names',
  imports: [AndesButton, AndesToastViewport],
  encapsulation: ViewEncapsulation.None,
  styles: `
    andes-toast-item.story-toast {
      border: 2px dashed var(--andes-color-primary);
    }
    andes-toast-item .story-toast__icon.andes-toast__icon {
      color: var(--andes-color-primary);
    }
    andes-toast-item .story-toast__title.andes-toast__title {
      color: var(--andes-color-primary-text);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    andes-toast-item .story-toast__description.andes-toast__message {
      font-style: italic;
    }
  `,
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class ClassNamesHost extends ToastDemo {
  protected show(): void {
    this.toasts.info('The classes come from the story, not from the library.', {
      title: 'classNames',
      className: 'story-toast',
      classNames: {
        icon: 'story-toast__icon',
        title: 'story-toast__title',
        description: 'story-toast__description',
      },
    });
  }
}

@Component({
  selector: 'andes-toast-styles-object',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
      <andes-button variant="outline" (click)="tell()"
        >Show a message</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class StylesObjectHost extends ToastDemo {
  protected show(): void {
    this.toasts.info('Each part takes its own inline styles.', {
      title: 'styles',
      duration: false,
      styles: stylesFor('success'),
    });
  }

  protected tell(): void {
    this.messages.success('A message takes them too', {
      styles: {
        root: stylesFor('success').root ?? {},
        icon: stylesFor('success').icon ?? {},
        title: stylesFor('success').title ?? {},
      },
    });
  }
}

@Component({
  selector: 'andes-toast-styles-function',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show('success')">Success</andes-button>
      <andes-button variant="outline" (click)="show('error')"
        >Error</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class StylesFunctionHost extends ToastDemo {
  /** The styles are a function of the severity, called where the toast is shown. */
  protected show(severity: AndesToastSeverity): void {
    this.toasts.show({
      title: SEVERITY_TITLES[severity],
      message: SEVERITY_TEXTS[severity] ?? '',
      severity,
      duration: false,
      styles: stylesFor(severity),
    });
  }
}

@Component({
  selector: 'andes-toast-every-part',
  imports: [AndesButton, AndesTag, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        @for (part of parts; track part) {
          <andes-tag [color]="colours[part]" variant="solid">{{
            part
          }}</andes-tag>
        }
      </div>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class EveryPartHost extends ToastDemo {
  protected readonly parts = PARTS;
  protected readonly colours = PART_COLOURS;

  protected show(): void {
    this.toasts.success(
      'Every part of the notification gets its own outline.',
      {
        title: 'Parts',
        duration: 15_000,
        showProgress: true,
        actions: [{ label: 'Open', onClick: () => undefined }],
        styles: PART_STYLES,
      },
    );
  }
}

@Component({
  selector: 'andes-message-parts',
  imports: [AndesButton, AndesTag, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        @for (part of parts; track part) {
          <andes-tag [color]="colours[part]" variant="solid">{{
            part
          }}</andes-tag>
        }
      </div>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class MessagePartsHost extends ToastDemo {
  protected readonly parts: AndesToastPart[] = [
    'root',
    'wrapper',
    'icon',
    'title',
    'close',
  ];
  protected readonly colours = PART_COLOURS;

  protected show(): void {
    this.messages.success('The five parts of a message', {
      dismissible: true,
      duration: 15_000,
      styles: {
        root: PART_STYLES.root ?? {},
        wrapper: PART_STYLES.wrapper ?? {},
        icon: PART_STYLES.icon ?? {},
        title: PART_STYLES.title ?? {},
        close: PART_STYLES.close ?? {},
      },
    });
  }
}

@Component({
  selector: 'andes-toast-properties',
  imports: [AndesButton, AndesInputNumber, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="vars()">
      <div [style]="column">
        <div [style]="bar">
          <div [style]="field">
            <span [style]="caption">Radius in px</span>
            <andes-input-number
              aria-label="Radius in pixels"
              style="width: 6rem;"
              [min]="0"
              [max]="32"
              [(value)]="radius"
            />
          </div>
          <div [style]="field">
            <span [style]="caption">Width in px</span>
            <andes-input-number
              aria-label="Width in pixels"
              style="width: 7rem;"
              [min]="240"
              [max]="640"
              [step]="20"
              [(value)]="width"
            />
          </div>
          <div [style]="field">
            <span [style]="caption">Motion in ms</span>
            <andes-input-number
              aria-label="Motion in milliseconds"
              style="width: 7rem;"
              [min]="0"
              [max]="1500"
              [step]="100"
              [(value)]="motion"
            />
          </div>
        </div>
        <andes-switch [(checked)]="flat">No shadow</andes-switch>
        <andes-button (click)="show()">Show</andes-button>
      </div>
      <andes-toast-viewport />
    </div>
  `,
})
class PropertiesHost extends ToastDemo {
  protected readonly radius = signal<number | string | null>(16);
  protected readonly width = signal<number | string | null>(420);
  protected readonly motion = signal<number | string | null>(600);
  protected readonly flat = signal(false);
  /** The custom properties are set on an ancestor of the viewport; they inherit down. */
  protected readonly vars = computed(
    () =>
      `--andes-toast-radius: ${Number(this.radius()) || 0}px; --andes-toast-width: ${
        Number(this.width()) || 384
      }px; --andes-toast-duration: ${Number(this.motion()) || 0}ms;${
        this.flat() ? ' --andes-toast-shadow: none;' : ''
      }`,
  );

  protected show(): void {
    this.toasts.success('Set on the toast or on any ancestor.', {
      title: 'Custom properties',
    });
  }
}

@Component({
  selector: 'andes-toast-root-options',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <andes-button variant="outline" (click)="wide()"
          >Inline style (wide)</andes-button
        >
        <andes-button variant="outline" (click)="attributes()"
          >Data attributes</andes-button
        >
      </div>
      <p [style]="muted">{{ status() }}</p>
    </div>
    <andes-toast-viewport />
  `,
})
class RootOptionsHost extends ToastDemo {
  private readonly document = inject(DOCUMENT);

  protected wide(): void {
    this.toasts.info('This notification is wider through the style option.', {
      title: 'Inline style',
      style: { width: '30rem', maxWidth: 'calc(100vw - 2rem)' },
    });
  }

  protected attributes(): void {
    this.toasts.success(
      'The root element carries your data and aria attributes.',
      {
        title: 'Attributes',
        attributes: { 'data-testid': 'export-toast', 'data-source': 'story' },
      },
    );
    setTimeout(() => {
      const found = this.document.querySelector('[data-testid="export-toast"]');
      this.status.set(
        found
          ? `Found data-testid="export-toast" with data-source="${found.getAttribute('data-source')}".`
          : 'Not found.',
      );
    }, 300);
  }
}

@Component({
  selector: 'andes-toast-headless',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()">Show</andes-button>
    </div>
    <ng-template #custom let-toast let-close="close">
      <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
        <strong style="font-size: 1.5rem;" aria-hidden="true">12</strong>
        <span style="flex: 1;">{{ toast.message }}</span>
        <andes-button size="sm" (click)="close()">Got it</andes-button>
      </div>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class HeadlessHost extends ToastDemo {
  private readonly custom = viewChild.required<Template>('custom');

  protected show(): void {
    this.toasts.show({
      message: '12 unread messages.',
      headless: this.custom(),
      duration: false,
    });
  }
}

@Component({
  selector: 'andes-toast-container',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
      <andes-button variant="outline" (click)="clear()"
        >Dismiss all</andes-button
      >
    </div>
    <div #frame [style]="frameStyle">
      <span [style]="muted">The viewport was moved into this frame.</span>
    </div>
    <andes-toast-viewport [container]="frame" />
  `,
})
class ContainerHost extends ToastDemo {
  /** A transformed element is the containing block of fixed-position children. */
  protected readonly frameStyle =
    'position: relative; transform: translateZ(0); box-sizing: border-box; width: 26rem; max-width: 100%; height: 18rem; margin-top: 1.5rem; padding: 1rem; overflow: hidden; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg); --andes-toast-width: 18rem;';

  protected show(): void {
    this.toasts.info('Drawn inside the frame, not the page.', {
      title: 'Container',
      duration: 15_000,
    });
  }
}

@Component({
  selector: 'andes-toast-rich-colors',
  imports: [AndesButton, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <andes-switch [checked]="rich()" (checkedChange)="set($event)"
        >Rich colors</andes-switch
      >
      <div [style]="bar">
        @for (severity of severities; track severity) {
          <andes-button variant="outline" (click)="show(severity)">{{
            severity
          }}</andes-button>
        }
        <andes-button
          variant="outline"
          (click)="messages.success('Copied to clipboard')"
        >
          message
        </andes-button>
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class RichColorsHost extends ToastDemo {
  protected readonly rich = signal(true);

  constructor() {
    super();
    this.set(true);
  }

  protected set(on: boolean): void {
    this.rich.set(on);
    this.toasts.config({ richColors: on });
    this.messages.config({ richColors: on });
  }

  protected show(severity: AndesToastSeverity): void {
    this.toasts.show({
      title: SEVERITY_TITLES[severity],
      message: SEVERITY_TEXTS[severity] ?? '',
      severity,
    });
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Customisation',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** Extra classes. */
export const ClassNames: Story = {
  name: 'Class names',
  parameters: about(
    'The className option and classNames per part add your own classes to the card and to the icon, title and description.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ClassNamesHost] },
    template: `<andes-toast-class-names />`,
  }),
};

/** Inline styles per part. */
export const StylesAsAnObject: Story = {
  name: 'Styles as an object',
  parameters: about(
    'The styles option takes an object of inline styles per part, for a notification and for a message.',
  ),
  render: () => ({
    moduleMetadata: { imports: [StylesObjectHost] },
    template: `<andes-toast-styles-object />`,
  }),
};

/** Styles that depend on the severity. */
export const StylesFromAFunction: Story = {
  name: 'Styles from a function',
  parameters: about(
    'The styles can be built by a function of the severity, called where the toast is shown, so each severity gets its own look.',
  ),
  render: () => ({
    moduleMetadata: { imports: [StylesFunctionHost] },
    template: `<andes-toast-styles-function />`,
  }),
};

/** Every notification part. */
export const EveryPart: Story = {
  name: 'Every part',
  parameters: about(
    'A notification has nine parts, root, wrapper, icon, content, title, description, actions, close and progress, and each one is outlined here in its own colour.',
  ),
  render: () => ({
    moduleMetadata: { imports: [EveryPartHost] },
    template: `<andes-toast-every-part />`,
  }),
};

/** Every message part. */
export const MessageParts: Story = {
  name: 'Message parts',
  parameters: about(
    'A message has five parts, root, wrapper, icon, title and close, and its text is the title part.',
  ),
  render: () => ({
    moduleMetadata: { imports: [MessagePartsHost] },
    template: `<andes-message-parts />`,
  }),
};

/** Custom properties. */
export const ColourAndSizeProperties: Story = {
  name: 'Custom properties',
  parameters: about(
    'The radius, width, motion time, shadow and progress colour of every toast below an element are set with custom properties on that element.',
  ),
  render: () => ({
    moduleMetadata: { imports: [PropertiesHost] },
    template: `<andes-toast-properties />`,
  }),
};

/** Root style, class and attributes. */
export const RootStyleAndAttributes: Story = {
  name: 'Root style and attributes',
  parameters: about(
    'The style option sizes the card, and attributes puts data and aria attributes on its root element, for tests and for hooks.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RootOptionsHost] },
    template: `<andes-toast-root-options />`,
  }),
};

/** Headless. */
export const Headless: Story = {
  name: 'Headless',
  parameters: about(
    'A headless template replaces the whole content of the toast and keeps its card, motion, swiping and timer.',
  ),
  render: () => ({
    moduleMetadata: { imports: [HeadlessHost] },
    template: `<andes-toast-headless />`,
  }),
};

/** A custom container. */
export const CustomContainer: Story = {
  name: 'Custom container',
  parameters: about(
    'The container input moves the viewport into another element, here a frame, so the toasts are drawn inside it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ContainerHost] },
    template: `<andes-toast-container />`,
  }),
};

/** Rich colours. */
export const RichColors: Story = {
  name: 'Rich colors',
  parameters: about(
    'With richColors the whole card takes a soft tint of its severity colour, and the switch turns it on and off for every toast.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RichColorsHost] },
    template: `<andes-toast-rich-colors />`,
  }),
};
