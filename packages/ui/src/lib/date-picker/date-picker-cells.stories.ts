import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCalendar } from '../calendar/calendar';
import { AndesDatePicker } from './date-picker';

/**
 * The panel itself: custom cell rendering for days, months, quarters, years and ranges,
 * panel wrappers, icons, default and controlled months, the events the panel reports,
 * and the panel used on its own without the field.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Cells and panels',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const FEB = new Date(2024, 1, 1);
const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;

/**
 * `cellTemplate` for the day grid: here a dot under the paydays (15th and last day) and
 * a small price under the first week of the month. The template receives the cell's date
 * and its state (`cell.selected`, `cell.isToday`, `cell.disabled`...), and the picker keeps
 * the cell's own button, focus ring and selection around it.
 */
export const CellRenderDays: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15, caption: CAPTION },
    template: `
      <ng-template #cell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1;">
          {{ cell.text }}
          @if (date.getDate() === 15 || date.getDate() === 29) {
            <span style="width: 4px; height: 4px; margin-top: 2px; border-radius: 50%; background: var(--andes-color-success);"></span>
          }
        </span>
      </ng-template>
      <ng-template #price let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1;">
          {{ cell.text }}
          @if (date.getDate() <= 7 && !cell.disabled) {
            <span style="font-size: 0.5625rem; opacity: 0.75;">\${{ 40 + date.getDate() * 3 }}</span>
          }
        </span>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Dot under paydays</p>
          <andes-date-picker locale="en-US" [cellTemplate]="cell" [ngModel]="picked" [open]="true" aria-label="Date with paydays" />
        </div>
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Price under the first week</p>
          <andes-date-picker locale="en-US" [cellTemplate]="price" [ngModel]="picked" [open]="true" aria-label="Date with prices" />
        </div>
      </div>
    `,
  }),
};

/**
 * `cellTemplate` reaches the month, quarter and year grids too: `cell.view` says which
 * grid the cell is in and the date is the period's first day. Here months show how many
 * events they hold, quarters their fiscal name, and years a marker for the leap ones.
 */
export const CellRenderPeriods: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15, caption: CAPTION },
    template: `
      <ng-template #monthCell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1.1;">
          {{ cell.text }}
          <span style="font-size: 0.625rem; opacity: 0.75;">{{ (date.getMonth() * 7) % 12 }} ev.</span>
        </span>
      </ng-template>
      <ng-template #quarterCell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1.1;">
          {{ cell.text }}
          <span style="font-size: 0.625rem; opacity: 0.75;">FY{{ date.getFullYear() % 100 }}</span>
        </span>
      </ng-template>
      <ng-template #yearCell let-date let-cell="cell">
        <span>
          {{ cell.text }}
          @if (date.getFullYear() % 4 === 0) {
            <span style="font-size: 0.625rem; vertical-align: super; opacity: 0.75;">leap</span>
          }
        </span>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">Month cells</p>
          <andes-date-picker picker="month" locale="en-US" [cellTemplate]="monthCell" [ngModel]="picked" [open]="true" aria-label="Month with cell template" />
        </div>
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">Quarter cells</p>
          <andes-date-picker picker="quarter" locale="en-US" [cellTemplate]="quarterCell" [ngModel]="picked" [open]="true" aria-label="Quarter with cell template" />
        </div>
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">Year cells</p>
          <andes-date-picker picker="year" locale="en-US" [cellTemplate]="yearCell" [ngModel]="picked" [open]="true" aria-label="Year with cell template" />
        </div>
      </div>
    `,
  }),
};

/**
 * `cellTemplate` in a range: the cell state tells the boundaries (`cell.rangeStart`,
 * `cell.rangeEnd`), the days between them (`cell.inRange`) and the days the pointer would
 * close (`cell.inPreview`), so a template can label them: here "in" and "out" under the
 * boundaries and a night count under the last day. The same template is used on a month
 * range.
 */
export const CellRenderRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      months: [new Date(2024, 0, 1), new Date(2024, 3, 1)],
      caption: CAPTION,
    },
    template: `
      <ng-template #cell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1;">
          {{ cell.text }}
          @if (cell.rangeStart) {
            <span style="font-size: 0.5rem; text-transform: uppercase;">in</span>
          } @else if (cell.rangeEnd) {
            <span style="font-size: 0.5rem; text-transform: uppercase;">out</span>
          } @else if (cell.inRange) {
            <span style="width: 3px; height: 3px; margin-top: 2px; border-radius: 50%; background: currentColor;"></span>
          }
        </span>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 38rem; min-height: 26rem;">
          <p [style]="caption">Date range</p>
          <andes-date-picker mode="range" locale="en-US" [cellTemplate]="cell" [ngModel]="range" [open]="true" aria-label="Range with cell template" />
        </div>
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">Month range</p>
          <andes-date-picker mode="range" picker="month" locale="en-US" [cellTemplate]="cell" [ngModel]="months" [open]="true" aria-label="Month range with cell template" style="width: 100%" />
        </div>
      </div>
    `,
  }),
};

/**
 * The panel used on its own, as `AndesCalendar`: the date picker's panel takes the same
 * `mode`, `picker`, bounds, `dateDisabled` and templates, with the value kept in a model
 * you bind yourself. Every type below is always visible, single and range, with the
 * value it holds shown beneath.
 */
export const ExternalPanelTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCalendar] },
    props: {
      types: TYPES,
      picked: FEB_15,
      range: { start: new Date(2024, 1, 5), end: new Date(2024, 1, 12) },
      multiple: [
        new Date(2024, 1, 2),
        new Date(2024, 1, 14),
        new Date(2024, 1, 20),
      ],
      febMonth: FEB,
      box: 'display: inline-block; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); box-shadow: var(--andes-shadow-popover);',
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">picker="{{ type }}"</p>
          <div [style]="box"><andes-calendar [picker]="type" locale="en-US" [weekStartsOn]="1" [defaultMonth]="febMonth" [value]="picked" [aria-label]="type + ' panel'" /></div>
        </div>
      }
      <div>
        <p [style]="caption">mode="range"</p>
        <div [style]="box"><andes-calendar mode="range" locale="en-US" [weekStartsOn]="1" [numberOfMonths]="2" [defaultMonth]="febMonth" [value]="range" aria-label="Range panel" /></div>
      </div>
      <div>
        <p [style]="caption">mode="multiple"</p>
        <div [style]="box"><andes-calendar mode="multiple" locale="en-US" [weekStartsOn]="1" [defaultMonth]="febMonth" [value]="multiple" aria-label="Multiple panel" /></div>
      </div>
    </div>`,
  }),
};

/**
 * `panelTemplate` wraps the panel's content in anything: here a heading and a "Jump to
 * today" button in a single picker (first), a summary line that follows a range's value
 * (second), and a billing note around a month grid (third). The wrapper renders the
 * panel's own content with `ngTemplateOutlet`.
 */
export const PanelWrappers: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, NgTemplateOutlet, AndesButton] },
    props: {
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)] as Date[] | null,
      month: new Date(2024, 1, 1),
      today: new Date(),
      nights: (range: Date[] | null) =>
        range
          ? Math.round((range[1].getTime() - range[0].getTime()) / 86_400_000)
          : 0,
      caption: CAPTION,
    },
    template: `
      <ng-template #heading let-content>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem 0;">
          <strong style="font-size: 0.875rem;">Delivery date</strong>
          <andes-button size="sm" variant="ghost" (click)="picked = today">Jump to today</andes-button>
        </div>
        <ng-container [ngTemplateOutlet]="content" />
      </ng-template>
      <ng-template #summary let-content>
        <ng-container [ngTemplateOutlet]="content" />
        <div style="padding: 0.5rem 0.75rem; border-top: 1px solid var(--andes-color-border); font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
          {{ range ? nights(range) + ' nights' : 'Pick the check-in and check-out' }}
        </div>
      </ng-template>
      <ng-template #note let-content>
        <div style="padding: 0.5rem 0.75rem 0; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">Billed on the first day of the month</div>
        <ng-container [ngTemplateOutlet]="content" />
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 28rem;">
          <p [style]="caption">Heading and action</p>
          <andes-date-picker locale="en-US" [panelTemplate]="heading" [(ngModel)]="picked" [open]="true" aria-label="Delivery date" />
        </div>
        <div style="width: 38rem; min-height: 28rem;">
          <p [style]="caption">Range summary</p>
          <andes-date-picker mode="range" locale="en-US" [panelTemplate]="summary" [(ngModel)]="range" [open]="true" aria-label="Stay" />
        </div>
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">Month grid with a note</p>
          <andes-date-picker picker="month" locale="en-US" [panelTemplate]="note" [ngModel]="month" [open]="true" aria-label="Billing month" />
        </div>
      </div>
    `,
  }),
};

/**
 * The calendar's navigation icons (`previousIcon`, `nextIcon`, `fastPreviousIcon`,
 * `fastNextIcon`) apply to every grid: the day panel, a month grid (first chevrons step
 * the year) and a year grid (they step the decade), single or range.
 */
export const CustomIcons: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    template: `
      <ng-template #previous><span aria-hidden="true">&#8592;</span></ng-template>
      <ng-template #next><span aria-hidden="true">&#8594;</span></ng-template>
      <ng-template #fastPrevious><span aria-hidden="true">&#8647;</span></ng-template>
      <ng-template #fastNext><span aria-hidden="true">&#8649;</span></ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Date</p>
          <andes-date-picker locale="en-US" [previousIcon]="previous" [nextIcon]="next" [fastPreviousIcon]="fastPrevious" [fastNextIcon]="fastNext" [ngModel]="picked" [open]="true" aria-label="Date with icons" />
        </div>
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Month</p>
          <andes-date-picker picker="month" locale="en-US" [previousIcon]="previous" [nextIcon]="next" [fastPreviousIcon]="fastPrevious" [fastNextIcon]="fastNext" [ngModel]="picked" [open]="true" aria-label="Month with icons" />
        </div>
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Year</p>
          <andes-date-picker picker="year" locale="en-US" [previousIcon]="previous" [nextIcon]="next" [fastPreviousIcon]="fastPrevious" [fastNextIcon]="fastNext" [ngModel]="picked" [open]="true" aria-label="Year with icons" />
        </div>
        <div style="width: 38rem; min-height: 26rem;">
          <p [style]="caption">Range</p>
          <andes-date-picker mode="range" locale="en-US" [previousIcon]="previous" [nextIcon]="next" [fastPreviousIcon]="fastPrevious" [fastNextIcon]="fastNext" [ngModel]="range" [open]="true" aria-label="Range with icons" />
        </div>
      </div>
    `,
  }),
};

/**
 * Where a panel opens when the field is empty, for every type: `defaultMonth` is the month
 * (or the year, or the decade) on show, apart from the value. The day picker opens on
 * July 2030, the month picker on 2030, the quarter picker on 2030, the year picker on the
 * 2030s, and the range on March 2025 with its second month beside it.
 */
export const DefaultPanelMonth: Story = {
  render: () => ({
    props: {
      types: TYPES,
      later: new Date(2030, 6, 1),
      rangeStart: new Date(2025, 2, 1),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of types; track type) {
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">picker="{{ type }}"</p>
          <andes-date-picker [picker]="type" locale="en-US" [weekStartsOn]="1" [defaultMonth]="later" [open]="true" [aria-label]="type + ' opening on 2030'" />
        </div>
      }
      <div style="width: 38rem; min-height: 26rem;">
        <p [style]="caption">mode="range"</p>
        <andes-date-picker mode="range" locale="en-US" [defaultMonth]="rangeStart" [open]="true" aria-label="Range opening on March 2025" />
      </div>
    </div>`,
  }),
};

/**
 * What the panel reports. `panelChange` fires as the grid or the period on show changes
 * (page with the chevrons, click the title to zoom out to months and years),
 * `pickerValueChange` follows the period on show, `calendarChange` reports each boundary of
 * a range as it is picked, and `openChange`, `ok` and `clear` report the field. The log
 * shows the latest events first.
 */
export const PanelEvents: Story = {
  render: () => ({
    props: {
      events: [] as string[],
      json: (value: unknown) => JSON.stringify(value),
      iso: (date: Date) => date.toISOString().slice(0, 10),
      record(events: string[], line: string) {
        events.unshift(line);
        events.splice(8);
      },
      febMonth: FEB,
      mono: MONO,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; width: 24rem; min-height: 32rem;">
      <andes-date-picker mode="range" locale="en-US" needConfirm aria-label="Events" [defaultMonth]="febMonth"
        (panelChange)="record(events, 'panelChange ' + $event.view + ' ' + iso($event.date))"
        (pickerValueChange)="record(events, 'pickerValueChange ' + iso($event))"
        (calendarChange)="record(events, 'calendarChange ' + $event.range + ' ' + json($event.text))"
        (openChange)="record(events, 'openChange ' + $event)"
        (ok)="record(events, 'ok')"
        (clear)="record(events, 'clear')" />
      <div [style]="mono">
        @for (line of events; track $index) {
          <div>{{ line }}</div>
        }
      </div>
    </div>`,
  }),
};
