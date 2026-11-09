import { Component, effect, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import type { AndesToastOverflow, AndesToastPosition } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

@Component({
  selector: 'andes-toast-six-placements',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="placementGrid">
      @for (placement of placements; track placement) {
        <andes-button variant="outline" fullWidth (click)="show(placement)">{{
          placement
        }}</andes-button>
      }
    </div>
    <andes-toast-viewport />
  `,
})
class SixPlacementsHost extends ToastDemo {
  constructor() {
    super();
    // Room for one toast per placement.
    this.toasts.config({ maxCount: 6 });
  }

  protected show(placement: AndesToastPosition): void {
    this.toasts.info('Placed with the placement option.', {
      title: `Notification ${placement}`,
      placement,
    });
  }
}

@Component({
  selector: 'andes-toast-viewport-position',
  imports: [AndesButton, AndesSelect, AndesToastViewport],
  template: `
    <div [style]="bar">
      <div [style]="field">
        <span [style]="caption">Viewport position</span>
        <andes-select
          aria-label="Viewport position"
          style="width: 11rem;"
          [options]="placementOptions"
          [(value)]="position"
        />
      </div>
      <andes-button style="align-self: flex-end;" (click)="show()"
        >Show</andes-button
      >
    </div>
    <andes-toast-viewport [position]="current()" />
  `,
})
class ViewportPositionHost extends ToastDemo {
  protected readonly position = signal<unknown>('bottom-right');

  protected current(): AndesToastPosition {
    return this.position() as AndesToastPosition;
  }

  protected show(): void {
    this.toasts.success('Appears where the viewport is anchored.', {
      title: 'Viewport position',
    });
  }
}

@Component({
  selector: 'andes-toast-stack',
  imports: [AndesButton, AndesInputNumber, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-switch [(checked)]="enabled">Enabled</andes-switch>
      <span [style]="text">Threshold</span>
      <andes-input-number
        aria-label="Stack threshold"
        size="sm"
        style="width: 5rem;"
        [min]="1"
        [max]="10"
        [disabled]="!enabled()"
        [(value)]="threshold"
      />
    </div>
    <div [style]="bar + ' margin-top: 1rem;'">
      <andes-button (click)="open()">Show</andes-button>
      <andes-button variant="outline" (click)="clear()"
        >Destroy all</andes-button
      >
    </div>
    <p [style]="muted">
      Past the threshold the notifications collapse into a deck; hover it, or
      Tab into it, to expand.
    </p>
    <andes-toast-viewport />
  `,
})
class StackHost extends ToastDemo {
  protected readonly enabled = signal(true);
  protected readonly threshold = signal<number | string | null>(3);

  constructor() {
    super();
    this.toasts.config({ maxCount: 10 });
    effect(() => {
      const threshold = Number(this.threshold()) || 1;
      this.toasts.config({ stack: this.enabled() ? { threshold } : false });
    });
  }

  protected open(): void {
    const lines = Math.round(Math.random() * 5) + 1;
    this.toasts.info(
      Array.from(
        { length: lines },
        () => 'This is the content of the notification.',
      ).join(' '),
      { title: 'Notification Title', duration: false },
    );
  }
}

@Component({
  selector: 'andes-toast-deck',
  imports: [AndesSelect, AndesToastViewport],
  template: `
    <div [style]="field">
      <span [style]="caption">Viewport position</span>
      <andes-select
        aria-label="Viewport position"
        style="width: 11rem;"
        [options]="placementOptions"
        [(value)]="position"
      />
    </div>
    <p [style]="muted">
      Hover the deck to expand it; drag a toast sideways to swipe it away.
    </p>
    <andes-toast-viewport [position]="current()" />
  `,
})
class DeckHost extends ToastDemo {
  protected readonly position = signal<unknown>('bottom-right');

  constructor() {
    super();
    this.toasts.success('Event has been created', { duration: false });
    this.toasts.error('Event has not been created', { duration: false });
    this.toasts.show({
      title: 'Event has been created',
      message: 'Sunday, December 03, 2023 at 9:00 AM',
      action: { label: 'Undo', onClick: () => undefined },
      duration: false,
    });
  }

  protected current(): AndesToastPosition {
    return this.position() as AndesToastPosition;
  }
}

@Component({
  selector: 'andes-toast-visible-cards',
  imports: [AndesButton, AndesInputNumber, AndesToastViewport],
  template: `
    <div [style]="bar">
      <div [style]="field">
        <span [style]="caption">Visible cards</span>
        <andes-input-number
          aria-label="Visible cards"
          style="width: 6rem;"
          [min]="1"
          [max]="6"
          [(value)]="visible"
        />
      </div>
      <div [style]="field">
        <span [style]="caption">Peek in px</span>
        <andes-input-number
          aria-label="Peek in pixels"
          style="width: 6rem;"
          [min]="2"
          [max]="24"
          [(value)]="peek"
        />
      </div>
    </div>
    <div [style]="bar + ' margin-top: 1rem;'">
      <andes-button (click)="fire()">Show 5 notifications</andes-button>
      <andes-button variant="outline" (click)="clear()"
        >Destroy all</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class VisibleCardsHost extends ToastDemo {
  protected readonly visible = signal<number | string | null>(3);
  protected readonly peek = signal<number | string | null>(8);
  private count = 0;

  constructor() {
    super();
    this.toasts.config({ maxCount: 10 });
    effect(() => {
      this.toasts.config({
        visibleToasts: Number(this.visible()) || 1,
        stackPeek: Number(this.peek()) || 8,
      });
    });
  }

  protected fire(): void {
    for (let i = 0; i < 5; i++) {
      this.count++;
      this.toasts.info(`Build #${this.count} finished.`, {
        title: `Build ${this.count}`,
        duration: false,
      });
    }
  }
}

@Component({
  selector: 'andes-toast-max-count',
  imports: [AndesButton, AndesInputNumber, AndesRadioGroup, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <div [style]="field">
          <span [style]="caption">maxCount</span>
          <andes-input-number
            aria-label="maxCount"
            style="width: 6rem;"
            [min]="1"
            [max]="10"
            [(value)]="maxCount"
          />
        </div>
        <div [style]="field">
          <span [style]="caption">When there are more</span>
          <andes-radio-group
            aria-label="When there are more"
            orientation="horizontal"
            [options]="overflowOptions"
            [(value)]="overflow"
          />
        </div>
      </div>
      <div [style]="bar">
        <andes-button (click)="fire()">Show 8 notifications</andes-button>
        <andes-button variant="outline" (click)="clear()"
          >Destroy all</andes-button
        >
      </div>
      <p [style]="muted">Waiting in the queue: {{ toasts.queuedCount() }}</p>
    </div>
    <andes-toast-viewport />
  `,
})
class MaxCountHost extends ToastDemo {
  protected readonly maxCount = signal<number | string | null>(3);
  protected readonly overflow = signal<AndesToastOverflow | null>('queue');
  protected readonly overflowOptions = [
    { value: 'queue', label: 'Queue them' },
    { value: 'dismiss-oldest', label: 'Close the oldest' },
  ];

  constructor() {
    super();
    effect(() => {
      this.toasts.config({
        maxCount: Number(this.maxCount()) || 1,
        overflow: this.overflow() ?? 'queue',
        stack: false,
      });
    });
  }

  protected fire(): void {
    for (let i = 1; i <= 8; i++) {
      this.toasts.info(`Notification ${i}`, { duration: 20_000 });
    }
  }
}

@Component({
  selector: 'andes-toast-offsets',
  imports: [AndesButton, AndesInputNumber, AndesToastViewport],
  template: `
    <div [style]="bar">
      <div [style]="field">
        <span [style]="caption">Top (px)</span>
        <andes-input-number
          aria-label="Top offset"
          style="width: 6rem;"
          [min]="0"
          [max]="200"
          [(value)]="top"
        />
      </div>
      <div [style]="field">
        <span [style]="caption">Bottom (px)</span>
        <andes-input-number
          aria-label="Bottom offset"
          style="width: 6rem;"
          [min]="0"
          [max]="200"
          [(value)]="bottom"
        />
      </div>
    </div>
    <div [style]="bar + ' margin-top: 1rem;'">
      <andes-button (click)="show('top-right')">Show at the top</andes-button>
      <andes-button (click)="show('bottom-right')"
        >Show at the bottom</andes-button
      >
      <andes-button variant="outline" (click)="clear()"
        >Destroy all</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class OffsetsHost extends ToastDemo {
  protected readonly top = signal<number | string | null>(80);
  protected readonly bottom = signal<number | string | null>(24);

  constructor() {
    super();
    effect(() => {
      this.toasts.config({
        top: Number(this.top()) || 0,
        bottom: Number(this.bottom()) || 0,
      });
    });
  }

  protected show(placement: AndesToastPosition): void {
    this.toasts.info('Kept away from the edge by the offset.', {
      title: 'Offsets',
      placement,
      duration: 20_000,
    });
  }
}

@Component({
  selector: 'andes-toast-narrow',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="column">
      <p [style]="muted">
        On a screen 600px wide or narrower a notification is as wide as the
        screen less a 16px margin on each side, and it keeps its corner. Resize
        the window, or use the viewport toolbar of Storybook, to see it.
      </p>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class NarrowHost extends ToastDemo {
  protected show(): void {
    this.toasts.info('The card takes the width of a phone screen.', {
      title: 'Mobile layout',
      duration: 20_000,
    });
  }
}

@Component({
  selector: 'andes-toast-rtl-option',
  imports: [AndesButton, AndesSelect, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <andes-switch [checked]="rtl()" (checkedChange)="setRtl($event)">
        Right to left
      </andes-switch>
      <div [style]="field">
        <span [style]="caption">Placement</span>
        <andes-select
          aria-label="Placement"
          style="width: 11rem;"
          [options]="placementOptions"
          [(value)]="placement"
        />
      </div>
      <div [style]="bar">
        <andes-button (click)="notify()">Show a notification</andes-button>
        <andes-button variant="outline" (click)="tell()"
          >Show a message</andes-button
        >
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class RtlOptionHost extends ToastDemo {
  protected readonly rtl = signal(true);
  protected readonly placement = signal<unknown>('top-right');

  constructor() {
    super();
    this.setRtl(true);
  }

  protected setRtl(on: boolean): void {
    this.rtl.set(on);
    this.toasts.config({ rtl: on });
    this.messages.config({ rtl: on });
  }

  protected notify(): void {
    this.toasts.success('تم حفظ التغييرات بنجاح.', {
      title: 'تم الحفظ',
      placement: this.placement() as AndesToastPosition,
      duration: 8000,
      action: { label: 'تراجع', onClick: () => undefined },
    });
  }

  protected tell(): void {
    this.messages.info('تم النسخ إلى الحافظة');
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Placement and stacking',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** The six placements. */
export const SixPlacements: Story = {
  name: 'Six placements',
  parameters: about(
    'A notification can come from any corner or from the top or bottom centre, chosen by the placement option on each call.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SixPlacementsHost] },
    template: `<andes-toast-six-placements />`,
  }),
};

/** The viewport position. */
export const ViewportPosition: Story = {
  name: 'Viewport position',
  parameters: about(
    'The position of the viewport is where every notification without a placement of its own appears.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ViewportPositionHost] },
    template: `<andes-toast-viewport-position />`,
  }),
};

/** The stack. */
export const Stack: Story = {
  name: 'Stack',
  parameters: about(
    'Past the threshold the open notifications collapse into a deck that expands on hover, and the Enabled switch turns the deck off.',
  ),
  render: () => ({
    moduleMetadata: { imports: [StackHost] },
    template: `<andes-toast-stack />`,
  }),
};

/** A still deck. */
export const DeckAtAGlance: Story = {
  name: 'Deck at a glance',
  parameters: about(
    'Three toasts that stay open show the deck as it looks at rest in any corner, collapsed until it is hovered or focused.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DeckHost] },
    template: `<andes-toast-deck />`,
  }),
};

/** Visible cards and peek. */
export const VisibleCards: Story = {
  name: 'Visible cards',
  parameters: about(
    'A collapsed deck shows visibleToasts cards, each peeking out by stackPeek pixels from the one in front.',
  ),
  render: () => ({
    moduleMetadata: { imports: [VisibleCardsHost] },
    template: `<andes-toast-visible-cards />`,
  }),
};

/** The maxCount limit. */
export const MaxCount: Story = {
  name: 'Max count',
  parameters: about(
    'At most maxCount notifications are open at once, and the others wait in a queue or push the oldest one out.',
  ),
  render: () => ({
    moduleMetadata: { imports: [MaxCountHost] },
    template: `<andes-toast-max-count />`,
  }),
};

/** Offsets. */
export const Offsets: Story = {
  name: 'Offsets',
  parameters: about(
    'The top and bottom options keep the notifications clear of a fixed header or footer.',
  ),
  render: () => ({
    moduleMetadata: { imports: [OffsetsHost] },
    template: `<andes-toast-offsets />`,
  }),
};

/** Narrow screens. */
export const NarrowScreens: Story = {
  name: 'Narrow screens',
  parameters: about(
    'Under 600px the margin shrinks to 16px and the notification takes the width of the screen.',
  ),
  render: () => ({
    moduleMetadata: { imports: [NarrowHost] },
    template: `<andes-toast-narrow />`,
  }),
};

/** The rtl option. */
export const RightToLeftOption: Story = {
  name: 'Right to left',
  parameters: about(
    'The rtl option lays the content out from the right, with the icon on the right and the close button in the top-right corner, while the placements stay physical.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RtlOptionHost] },
    template: `<andes-toast-rtl-option />`,
  }),
};
