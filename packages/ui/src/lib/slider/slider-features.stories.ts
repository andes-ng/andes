import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesSlider } from './slider';
import {
  AndesSliderMarkTemplate,
  AndesSliderTooltipTemplate,
} from './slider-templates';

const meta: Meta<AndesSlider> = {
  title: 'Data Entry/Slider/Basics/Features',
  component: AndesSlider,
  decorators: [
    moduleMetadata({
      imports: [
        AndesSliderMarkTemplate,
        AndesSliderTooltipTemplate,
        AndesButton,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesSlider>;

const log = (label: string) => (value: unknown) =>
  console.log(label, JSON.stringify(value));

/**
 * Labelled marks, from a list of `{ value, label }` objects or a keyed object whose entries
 * can carry a style (the last one is red). `dots` draws a dot for every mark.
 */
export const Marks: Story = {
  render: () => ({
    props: {
      labelledMarks: [
        { value: 0, label: '0°C' },
        { value: 25, label: '25°C' },
        { value: 50, label: '50°C' },
        { value: 75, label: '75°C' },
        { value: 100, label: '100°C' },
      ],
      keyedMarks: {
        0: '0°C',
        26: '26°C',
        37: '37°C',
        100: {
          label: '100°C',
          style: {
            color: 'var(--andes-color-danger-text, var(--andes-color-danger))',
            fontWeight: 600,
          },
        },
      },
      dotMarks: [0, 20, 40, 60, 80, 100],
    },
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding-bottom: 1.5rem;">
        <andes-slider [value]="50" [marks]="labelledMarks" aria-label="Temperature" />
        <andes-slider [value]="37" [marks]="keyedMarks" aria-label="Keyed marks, styled" />
        <andes-slider [value]="40" dots [marks]="dotMarks" aria-label="Dots on marks" />
      </div>
    `,
  }),
};

/**
 * `step: null` limits the handle to the marks. The second slider adds `included: false`, so
 * the rail is not filled up to the handle.
 */
export const MarksOnly: Story = {
  render: () => ({
    props: {
      levels: [
        { value: 0, label: 'Off' },
        { value: 20, label: 'Low' },
        { value: 60, label: 'Mid' },
        { value: 100, label: 'Max' },
      ],
      pointMarks: { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' },
    },
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding-bottom: 1.5rem;">
        <andes-slider [value]="40" [step]="null" [marks]="levels" aria-label="Level" />
        <andes-slider [value]="37" [included]="false" [marks]="pointMarks" aria-label="Point only" />
      </div>
    `,
  }),
};

export const CustomMarkTemplate: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; padding-bottom: 1.5rem;">
        <andes-slider [value]="50" [step]="null" [marks]="[0, 25, 50, 75, 100]" aria-label="Opacity">
          <ng-template andesSliderMark let-mark let-active="active">
            <span [style.font-weight]="active ? 600 : 400">{{ mark.value }}%</span>
          </ng-template>
        </andes-slider>
      </div>
    `,
  }),
};

/**
 * Tooltip visibility (`hover`, `always`, `never`) and `tooltipPlacement` on horizontal and
 * vertical sliders.
 */
export const Tooltip: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding: 2.5rem 3rem;">
        <andes-slider [value]="55" tooltip="hover" aria-label="Hover (default)" />
        <andes-slider [value]="55" tooltip="always" aria-label="Always visible" />
        <andes-slider [value]="55" tooltip="never" aria-label="Hidden" />
        <andes-slider [value]="30" tooltip="always" tooltipPlacement="top" aria-label="Top" />
        <andes-slider [value]="50" tooltip="always" tooltipPlacement="bottom" aria-label="Bottom" />
        <div style="height: 160px; display: flex; gap: 5rem; justify-content: center;">
          <andes-slider orientation="vertical" [value]="40" tooltip="always" tooltipPlacement="left" aria-label="Left" />
          <andes-slider orientation="vertical" [value]="60" tooltip="always" aria-label="Default (inline end)" />
        </div>
      </div>
    `,
  }),
};

/**
 * Formatting what is shown and read: `valueFormatter` sets the text for `aria-valuetext`,
 * `tooltipFormatter` the tooltip's (returning `null` hides it - drag the first slider to 0), and
 * an `andesSliderTooltip` template replaces the tooltip content altogether.
 */
export const Formatters: Story = {
  render: () => ({
    props: {
      currency: (value: number) => `$${value}`,
      percent: (value: number) => (value === 0 ? null : `${value}%`),
      spoken: (value: number) => `${value} percent`,
    },
    template: `
      <div style="width: 320px; display: grid; gap: 4rem; padding-top: 2.5rem;">
        <andes-slider
          range
          [value]="[200, 800]"
          [min]="0"
          [max]="1000"
          [step]="50"
          [valueFormatter]="currency"
          tooltip="always"
          startAriaLabel="Minimum price"
          endAriaLabel="Maximum price"
        />
        <!-- Tooltip shows "30%", aria-valuetext reads "30 percent"; drag to 0 and it hides. -->
        <andes-slider
          range
          [value]="[0, 30]"
          tooltip="always"
          [tooltipFormatter]="percent"
          [valueFormatter]="spoken"
          startAriaLabel="Start"
          endAriaLabel="End"
        />
        <andes-slider range [value]="[20, 60]" tooltip="always" startAriaLabel="From" endAriaLabel="To">
          <ng-template andesSliderTooltip let-value let-index="index">
            <strong>{{ index === 0 ? 'From' : 'To' }}</strong> {{ value }}h
          </ng-template>
        </andes-slider>
      </div>
    `,
  }),
};

/** `valueChange` fires on every move; `valueCommit` only when the gesture ends (see the console). */
export const ChangeVsChangeComplete: Story = {
  name: 'valueChange vs valueCommit (onChangeComplete)',
  render: () => ({
    props: {
      onChange: log('valueChange'),
      onComplete: log('valueCommit'),
    },
    template: `
      <div style="width: 320px;">
        <andes-slider
          [value]="30"
          (valueChange)="onChange($event)"
          (valueCommit)="onComplete($event)"
          aria-label="Volume"
        />
      </div>
    `,
  }),
};

export const AutoFocus: Story = {
  // Kept off the docs page: it would steal focus from the other stories there.
  tags: ['!autodocs'],
  render: () => ({
    template: `
      <div style="width: 320px;">
        <andes-slider autoFocus [value]="30" aria-label="Volume" />
      </div>
    `,
  }),
};

const caption =
  'font: 0.875rem/1.375rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); margin: 0 0 0.5rem;';
const outputStyle =
  'margin: 0; font: 0.8125rem/1.25rem ui-monospace, monospace; color: var(--andes-color-foreground); white-space: pre-wrap;';

/**
 * `status="error"` paints the slider in the danger color and sets `aria-invalid` on every
 * handle (the same as `aria-invalid="true"`); `warning` only paints it. `readOnly` keeps the
 * value fixed without dimming: the handles stay focusable (Tab to them) and are announced as
 * read-only, but there is no grab cursor or hover growth. The last block shows the three
 * `size`s (the thumb and the rail scale, `md` is the default look) with a range and marks.
 */
export const StatusReadOnlyAndSizes: Story = {
  name: 'Status, read-only and sizes',
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 1.75rem; padding-bottom: 1rem;">
        <div>
          <p style="${caption}">Status</p>
          <div style="display: grid; gap: 1.25rem;">
            <andes-slider status="error" [value]="70" aria-label="Error" />
            <andes-slider status="warning" [value]="45" aria-label="Warning" />
            <andes-slider status="error" range [value]="[20, 60]" startAriaLabel="Low (error)" endAriaLabel="High (error)" />
            <andes-slider status="warning" dots [step]="25" [value]="50" aria-label="Warning with dots" />
          </div>
        </div>
        <div>
          <p style="${caption}">Read-only (Tab onto a handle; the arrows do nothing)</p>
          <div style="display: grid; gap: 1.25rem;">
            <andes-slider readOnly [value]="60" tooltip="always" aria-label="Read-only" />
            <andes-slider readOnly range [value]="[25, 75]" startAriaLabel="Read-only low" endAriaLabel="Read-only high" />
          </div>
        </div>
        <div>
          <p style="${caption}">Sizes: sm, md, lg</p>
          <div style="display: grid; gap: 1.25rem;">
            <andes-slider size="sm" [value]="35" aria-label="Small" />
            <andes-slider size="md" [value]="50" aria-label="Medium (default)" />
            <andes-slider size="lg" [value]="65" aria-label="Large" />
            <andes-slider size="sm" range [value]="[15, 55]" dots [step]="20" startAriaLabel="Small low" endAriaLabel="Small high" />
            <andes-slider size="lg" range [value]="[15, 55]" dots [step]="20" startAriaLabel="Large low" endAriaLabel="Large high" />
          </div>
        </div>
        <div dir="rtl">
          <p style="${caption}">Right-to-left</p>
          <andes-slider status="error" size="lg" [value]="60" aria-label="مستوى" />
        </div>
      </div>
    `,
  }),
};

/**
 * `thumbTemplate` replaces the circle inside every handle. The template gets the `value`, the
 * `index` and whether that handle is being `dragging` or `focused`. The handle keeps its
 * `role="slider"`, position, hit area and focus ring; the content is decorative.
 */
export const CustomThumb: Story = {
  name: 'Custom thumb',
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 2.5rem; padding: 1rem 0;">
        <andes-slider [value]="40" [thumbTemplate]="grip" aria-label="Grip handle" />
        <andes-slider range [value]="[20, 70]" [thumbTemplate]="badge" startAriaLabel="From" endAriaLabel="To" />
      </div>

      <ng-template #grip let-dragging="dragging" let-focused="focused">
        <span
          style="display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 0.375rem;
                 background: var(--andes-color-primary); color: var(--andes-color-primary-foreground);
                 font-size: 0.75rem; line-height: 1; transition: transform 0.12s;"
          [style.transform]="dragging ? 'scale(1.2)' : 'none'"
          [style.outline]="focused ? '2px solid var(--andes-color-focus-ring)' : 'none'"
        >&#x2630;</span>
      </ng-template>

      <ng-template #badge let-value let-index="index" let-dragging="dragging">
        <span
          style="display: grid; place-items: center; min-width: 1.75rem; height: 1.25rem; padding: 0 0.25rem;
                 border-radius: 9999px; font: 600 0.6875rem/1 var(--andes-font-family), sans-serif;
                 background: var(--andes-color-background); color: var(--andes-color-foreground);
                 box-shadow: 0 0 0 2px var(--andes-color-primary);"
          [style.background]="dragging ? 'var(--andes-color-primary-subtle)' : 'var(--andes-color-background)'"
        >{{ index === 0 ? 'A' : 'B' }}{{ value }}</span>
      </ng-template>
    `,
  }),
};

/**
 * `name` makes the slider a native form field: one hidden input per handle, so a plain
 * `FormData` carries it. A single slider submits one entry; a range repeats the same name
 * once per handle, in handle order. Disabled handles submit nothing; read-only ones still do.
 */
export const FormName: Story = {
  name: 'Form (name)',
  render: () => ({
    props: {
      submitted: '(nothing submitted yet)',
      collect(event: SubmitEvent) {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        const lines: string[] = [];
        data.forEach((value, key) => lines.push(`${key} = ${String(value)}`));
        return lines.join('\n');
      },
    },
    template: `
      <form
        style="width: 320px; display: grid; gap: 1.5rem;"
        (submit)="submitted = collect($event)"
      >
        <andes-slider name="volume" [value]="35" aria-label="Volume" />
        <andes-slider name="price" range [value]="[20, 70]" startAriaLabel="Minimum price" endAriaLabel="Maximum price" />
        <andes-slider name="locked" readOnly [value]="55" aria-label="Read-only (still submitted)" />
        <andes-slider name="skipped" disabled [value]="10" aria-label="Disabled (not submitted)" />
        <andes-button type="submit" size="sm">Submit</andes-button>
        <pre style="${outputStyle}">{{ submitted }}</pre>
      </form>
    `,
  }),
};

/**
 * `dragStart` and `dragEnd` fire for pointer drags only (not the keyboard or a mark click):
 * `dragStart` on the press, before its `valueChange`, and `dragEnd` on release, before
 * `valueCommit`. The payload is `{ index, value }`; a `draggableTrack` range reports index
 * -1 with the whole range. `trackClick="false"` makes the rail ignore presses - only the
 * handles (and the keyboard) move.
 */
export const DragEventsAndTrackClick: Story = {
  name: 'Drag events and track click',
  render: () => ({
    props: {
      entries: [] as string[],
      note(name: string, payload: unknown): string[] {
        return [`${name} ${JSON.stringify(payload)}`];
      },
    },
    template: `
      <div style="width: 320px; display: grid; gap: 1.75rem;">
        <div>
          <p style="${caption}">Default: dragging a handle, or pressing the rail</p>
          <andes-slider
            [value]="30"
            aria-label="Position"
            (dragStart)="entries = note('dragStart', $event).concat(entries).slice(0, 6)"
            (dragEnd)="entries = note('dragEnd', $event).concat(entries).slice(0, 6)"
          />
        </div>
        <div>
          <p style="${caption}">draggableTrack: index -1 is the whole range</p>
          <andes-slider
            [range]="{ draggableTrack: true }"
            [value]="[20, 50]"
            startAriaLabel="Start"
            endAriaLabel="End"
            (dragStart)="entries = note('dragStart', $event).concat(entries).slice(0, 6)"
            (dragEnd)="entries = note('dragEnd', $event).concat(entries).slice(0, 6)"
          />
        </div>
        <div>
          <p style="${caption}">trackClick off: pressing the rail does nothing</p>
          <andes-slider [trackClick]="false" [value]="30" aria-label="Handle only" />
        </div>
        <pre style="${outputStyle}">{{ entries.length ? entries.join('\\n') : '(drag a handle to log events)' }}</pre>
      </div>
    `,
  }),
};
