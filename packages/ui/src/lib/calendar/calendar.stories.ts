import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCalendar } from './calendar';

/** Pinned so the docs render the same grid regardless of when they are built. */
const FEBRUARY_2024 = new Date(2024, 1, 1);

const meta: Meta<AndesCalendar> = {
  title: 'Data Display/Calendar',
  component: AndesCalendar,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['single', 'range'] },
    locale: {
      control: 'select',
      options: ['en-US', 'es-PE', 'es-ES', 'fr-FR', 'ja-JP'],
    },
    weekStartsOn: { control: 'select', options: [0, 1, 6] },
    showOutsideDays: { control: 'boolean' },
    fixedWeeks: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    mode: 'single',
    locale: 'en-US',
    weekStartsOn: 0,
    showOutsideDays: true,
    fixedWeeks: false,
    disabled: false,
  },
  render: (args) => ({
    props: { ...args, defaultMonth: FEBRUARY_2024 },
    template: `<andes-calendar
      [mode]="mode"
      [locale]="locale"
      [weekStartsOn]="weekStartsOn"
      [showOutsideDays]="showOutsideDays"
      [fixedWeeks]="fixedWeeks"
      [disabled]="disabled"
      [defaultMonth]="defaultMonth" />`,
  }),
};

export default meta;

type Story = StoryObj<AndesCalendar>;

/** The playground: the `mode` control switches to range selection (see Selection for ranges). */
export const Single: Story = {};

const CAPTION =
  'margin: 0 0 0.5rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const ROW =
  'display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;';

/**
 * Pre-selected values, so the treatments show without clicking through a selection
 * first: a single day, a range (boundary and interior cells), two months side by side as
 * the range picker shows them (with the start picked, hovering or arrowing previews the
 * range the next pick would close), and a range of months picked in the month grid.
 */
export const Selection: Story = {
  render: () => ({
    props: {
      febMonth: FEBRUARY_2024,
      day: new Date(2024, 1, 15),
      range: { start: new Date(2024, 1, 10), end: new Date(2024, 1, 18) },
      twoMonths: { start: new Date(2024, 1, 20), end: null },
      monthRange: { start: new Date(2024, 2, 1), end: new Date(2024, 7, 1) },
      caption: CAPTION,
      row: ROW,
    },
    template: `
      <div [style]="row">
        <div>
          <p [style]="caption">Single day</p>
          <andes-calendar locale="en-US" [value]="day" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Range</p>
          <andes-calendar mode="range" locale="en-US" [value]="range" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Two months, start picked</p>
          <andes-calendar mode="range" locale="en-US" [numberOfMonths]="2" [defaultMonth]="febMonth" [(value)]="twoMonths" />
        </div>
        <div>
          <p [style]="caption">Range of months</p>
          <andes-calendar mode="range" picker="month" locale="en-US" [(value)]="monthRange" />
        </div>
      </div>
    `,
  }),
};

/**
 * Limits on what can be picked: `min`/`max` inside the month, `min`/`max` landing exactly
 * on the visible month's first and last day, a `dateDisabled` predicate (weekends) and
 * the `disabled` calendar.
 */
export const Constraints: Story = {
  render: () => ({
    props: {
      febMonth: FEBRUARY_2024,
      inside: [new Date(2024, 1, 8), new Date(2024, 1, 22)],
      edges: [new Date(2024, 1, 1), new Date(2024, 1, 29)],
      weekends: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
      caption: CAPTION,
      row: ROW,
    },
    template: `
      <div [style]="row">
        <div>
          <p [style]="caption">min = Feb 8, max = Feb 22</p>
          <andes-calendar locale="en-US" [defaultMonth]="febMonth" [min]="inside[0]" [max]="inside[1]" />
        </div>
        <div>
          <p [style]="caption">min and max on the month edges</p>
          <andes-calendar locale="en-US" [defaultMonth]="febMonth" [min]="edges[0]" [max]="edges[1]" />
        </div>
        <div>
          <p [style]="caption">Weekends through dateDisabled</p>
          <andes-calendar locale="en-US" [defaultMonth]="febMonth" [dateDisabled]="weekends" />
        </div>
        <div>
          <p [style]="caption">disabled</p>
          <andes-calendar locale="en-US" disabled [defaultMonth]="febMonth" />
        </div>
      </div>
    `,
  }),
};

/**
 * Grid layout options (also available as controls on the playground): `weekStartsOn`
 * (Monday first), `showOutsideDays` off, `fixedWeeks` (always six rows) and `showWeek`,
 * the ISO week numbers (Monday-first) in their own row-header column. Then months that stress
 * the grid: February 2024 is a leap February (the grid must run to the 29th), and December
 * 2024 has trailing cells that belong to January *2025*. Last, month and weekday names come
 * from `Intl`, so no locale is hard-coded.
 */
export const Layout: Story = {
  render: () => ({
    props: {
      febMonth: FEBRUARY_2024,
      december: new Date(2024, 11, 1),
      caption: CAPTION,
      row: ROW,
    },
    template: `
      <div [style]="row">
        <div>
          <p [style]="caption">Monday first</p>
          <andes-calendar locale="en-US" [weekStartsOn]="1" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Outside days hidden</p>
          <andes-calendar locale="en-US" [showOutsideDays]="false" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Fixed weeks</p>
          <andes-calendar locale="en-US" fixedWeeks [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Week numbers</p>
          <andes-calendar locale="en-GB" [weekStartsOn]="1" showWeek [defaultMonth]="december" />
        </div>
        <div>
          <p [style]="caption">Leap February</p>
          <andes-calendar locale="en-US" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">Month rollover</p>
          <andes-calendar locale="en-US" [defaultMonth]="december" />
        </div>
        <div>
          <p [style]="caption">es-PE</p>
          <andes-calendar locale="es-PE" [weekStartsOn]="1" [defaultMonth]="febMonth" />
        </div>
        <div>
          <p [style]="caption">ja-JP</p>
          <andes-calendar locale="ja-JP" [defaultMonth]="febMonth" />
        </div>
      </div>
    `,
  }),
};

/**
 * `picker` sets the selection granularity. The caption climbs to the coarser
 * grid (days → months → years); picking there drills back down.
 */
export const PickerModes: Story = {
  render: () => ({
    props: {
      week: new Date(2024, 1, 12),
      month: new Date(2024, 1, 1),
      quarter: new Date(2024, 3, 1),
      year: new Date(2024, 0, 1),
    },
    template: `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
        <andes-calendar locale="en-US" picker="week" [weekStartsOn]="1" [value]="week" aria-label="Week picker" />
        <andes-calendar locale="en-US" picker="month" [value]="month" aria-label="Month picker" />
        <andes-calendar locale="en-US" picker="quarter" [value]="quarter" aria-label="Quarter picker" />
        <andes-calendar locale="en-US" picker="year" [value]="year" aria-label="Year picker" />
      </div>
    `,
  }),
};

/**
 * `cellTemplate` customises each cell. The context carries the date, the
 * resolved cell state and the grid it belongs to.
 */
export const CustomCells: Story = {
  render: () => ({
    props: {
      defaultMonth: FEBRUARY_2024,
      busy: (date: Date) => [5, 12, 13, 21].includes(date.getDate()),
    },
    template: `
      <ng-template #cell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1;">
          {{ cell.text }}
          <span [style.visibility]="busy(date) && !cell.outside ? 'visible' : 'hidden'"
                style="width: 4px; height: 4px; margin-top: 2px; border-radius: 50%; background: currentColor;"></span>
        </span>
      </ng-template>
      <andes-calendar locale="en-US" [defaultMonth]="defaultMonth" [cellTemplate]="cell" />
    `,
  }),
};

/**
 * `fullscreen`: a full-width grid. The first calendar holds `cellTemplate` content under
 * the day number; the second uses `fullCellTemplate`, which draws each cell from scratch,
 * the day number included - here an availability board.
 */
export const Fullscreen: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    props: {
      febMonth: FEBRUARY_2024,
      picked: new Date(2024, 1, 14),
      events: {
        '2024-02-05': ['Sprint planning'],
        '2024-02-14': ['Design review', 'Release 2.4'],
        '2024-02-21': ['Retro'],
      } as Record<string, string[]>,
      key: (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      seats: (date: Date) => (date.getDate() * 7) % 13,
    },
    template: `
      <ng-template #cell let-date let-cell="cell">
        @if (cell.view === 'date') {
          @for (event of events[key(date)] ?? []; track event) {
            <div style="overflow: hidden; margin-top: 2px; padding: 1px 4px; border-radius: 4px; background: var(--andes-color-accent); color: var(--andes-color-accent-foreground); white-space: nowrap; text-overflow: ellipsis;">{{ event }}</div>
          }
        }
      </ng-template>
      <ng-template #full let-date let-cell="cell">
        <span style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <strong style="font-size: 1rem;">{{ cell.text }}</strong>
          @if (!cell.outside) {
            <span style="font-size: 0.75rem;" [style.color]="seats(date) ? 'var(--andes-color-muted-foreground)' : 'var(--andes-color-danger)'">
              {{ seats(date) ? seats(date) + ' seats left' : 'Full' }}
            </span>
          }
        </span>
      </ng-template>
      <div style="padding: 1rem; display: flex; flex-direction: column; gap: 2rem;">
        <andes-calendar fullscreen locale="en-US" [defaultMonth]="febMonth" [(value)]="picked" [cellTemplate]="cell" />
        <andes-calendar fullscreen locale="en-US" [defaultMonth]="febMonth" [fullCellTemplate]="full" />
      </div>
    `,
  }),
};

/**
 * `headerTemplate` replaces the navigation header. The context exposes the
 * visible month plus `goTo` and `setView`.
 */
export const CustomHeader: Story = {
  render: () => ({
    props: {
      defaultMonth: FEBRUARY_2024,
      months: Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
          new Date(2024, month, 1),
        ),
      ),
      years: [2022, 2023, 2024, 2025, 2026],
      toDate: (year: string | number, month: string | number) =>
        new Date(Number(year), Number(month), 1),
    },
    template: `
      <ng-template #header let-month let-goTo="goTo">
        <div style="display: flex; gap: 0.5rem; font: 0.875rem var(--andes-font-family), sans-serif;">
          <select class="demo-field" aria-label="Month" (change)="goTo(toDate(month.getFullYear(), $any($event.target).value))">
            @for (name of months; track $index) { <option [value]="$index" [selected]="$index === month.getMonth()">{{ name }}</option> }
          </select>
          <select class="demo-field" aria-label="Year" (change)="goTo(toDate($any($event.target).value, month.getMonth()))">
            @for (year of years; track year) { <option [value]="year" [selected]="year === month.getFullYear()">{{ year }}</option> }
          </select>
        </div>
      </ng-template>
      <andes-calendar locale="en-US" [defaultMonth]="defaultMonth" [headerTemplate]="header" />
    `,
    // Small fields drawn like the library's own: one border, and on focus a primary
    // border with a soft ring instead of the browser's outline around it.
    styles: [
      `
      .demo-field {
        height: 1.5rem;
        box-sizing: border-box;
        padding: 0 0.4375rem;
        border: 1px solid var(--andes-color-input);
        border-radius: var(--andes-radius-md);
        background: var(--andes-color-background);
        color: var(--andes-color-foreground);
        font: 0.875rem/1.375rem var(--andes-font-family), sans-serif;
        outline: none;
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }
      .demo-field:hover {
        border-color: color-mix(in srgb, var(--andes-color-primary) 65%, var(--andes-color-input));
      }
      .demo-field:focus {
        border-color: var(--andes-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--andes-color-primary) 20%, transparent);
      }
      `,
    ],
  }),
};

/**
 * `panelView` picks the grid to show (here the year grid of a day picker);
 * `cellSelect` reports each pick with the grid it came from, so a year or
 * month on the way down to a day can be told apart from the day itself.
 */
export const PanelViewAndSelectSource: Story = {
  render: () => ({
    props: {
      defaultMonth: FEBRUARY_2024,
      panelView: 'year',
      log: [] as string[],
      record(info: { date: Date; source: string }) {
        this['log'] = [
          ...(this['log'] as string[]),
          `${info.source}: ${info.date.toDateString()}`,
        ];
      },
    },
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
        <andes-calendar locale="en-US" [defaultMonth]="defaultMonth" [panelView]="panelView" (cellSelect)="record($event)" aria-label="Pick a day" />
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" (click)="panelView = 'year'">Years</button>
            <button type="button" (click)="panelView = 'month'">Months</button>
            <button type="button" (click)="panelView = 'date'">Days</button>
          </div>
          <div style="font: 0.75rem/1.5 ui-monospace, monospace;">
            @for (line of log; track $index) {
              <div>{{ line }}</div>
            }
          </div>
        </div>
      </div>
    `,
  }),
};
