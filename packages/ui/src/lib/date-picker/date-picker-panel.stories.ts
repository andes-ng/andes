import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCalendar } from '../calendar/calendar';
import { AndesDatePicker } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Panel',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);

/**
 * `presets` list one-click values beside the calendar; functions stay current. Shown
 * open, with a range already picked (February 10 to March 5), so the panel is visible
 * without a click.
 */
export const Presets: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      presetList: [
        { label: 'Today', value: () => [new Date(), new Date()] },
        {
          label: 'Last 7 days',
          value: () => [new Date(Date.now() - 6 * 86_400_000), new Date()],
        },
        {
          label: 'This month',
          value: () => {
            const now = new Date();
            return [
              new Date(now.getFullYear(), now.getMonth(), 1),
              new Date(now.getFullYear(), now.getMonth() + 1, 0),
            ];
          },
        },
        {
          label: 'Q1 2024',
          value: [new Date(2024, 0, 1), new Date(2024, 2, 31)],
        },
      ],
      picked: [new Date(2024, 1, 10), new Date(2024, 2, 5)] as const,
      febMonth: new Date(2024, 1, 1),
    },
    template: `<div style="min-height: 26rem;">
      <andes-date-picker mode="range" locale="en-US" [presets]="presetList" [defaultMonth]="febMonth" [ngModel]="picked" [open]="true" />
    </div>`,
  }),
};

/** `prefix`, `suffixIcon` and `extraFooter` are template hooks. */
export const Slots: Story = {
  render: () => ({
    props: {
      weekends: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
    },
    template: `
      <ng-template #prefix><span style="font-size: 0.875rem;">Due</span></ng-template>
      <ng-template #suffix>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20" /></svg>
      </ng-template>
      <ng-template #footer><span>Weekends are closed.</span></ng-template>
      <div style="min-height: 26rem;">
        <andes-date-picker locale="en-US" showNow [prefix]="prefix" [suffixIcon]="suffix" [extraFooter]="footer" [dateDisabled]="weekends" aria-label="Due date" />
      </div>
    `,
  }),
};

/**
 * `panelTemplate` wraps the panel's content, `clearIcon` and the calendar's
 * `previousIcon`/`nextIcon`/`fastPreviousIcon`/`fastNextIcon` swap the icons,
 * and `panelView` opens the calendar on another grid (months, here).
 */
export const CustomPanel: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, NgTemplateOutlet] },
    props: { picked: FEB_15 },
    template: `
      <ng-template #wrap let-content>
        <div style="padding: 0.5rem 0.75rem 0; font-weight: 600;">Billing period</div>
        <ng-container [ngTemplateOutlet]="content" />
      </ng-template>
      <ng-template #clear>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </ng-template>
      <ng-template #previous><span aria-hidden="true">&#8592;</span></ng-template>
      <ng-template #next><span aria-hidden="true">&#8594;</span></ng-template>
      <ng-template #fastPrevious><span aria-hidden="true">&#8647;</span></ng-template>
      <ng-template #fastNext><span aria-hidden="true">&#8649;</span></ng-template>
      <div style="min-height: 26rem;">
        <andes-date-picker locale="en-US" panelView="month" [ngModel]="picked" [panelTemplate]="wrap" [clearIcon]="clear" [previousIcon]="previous" [nextIcon]="next" [fastPreviousIcon]="fastPrevious" [fastNextIcon]="fastNext" [open]="true" aria-label="Billing period" />
      </div>
    `,
  }),
};

/**
 * `placement` picks the corner the panel opens from, and the panel grows out of the
 * field's edge facing it. It still flips to fit: the picker at the bottom of the short
 * scroller opens upwards, and its panel grows from the bottom edge. Under `dir="rtl"`
 * the corners follow the reading direction, the calendar's arrow keys and chevrons
 * mirror, and a range's panel arrow points at the active input.
 */
export const Placement: Story = {
  render: () => ({
    template: `<div style="min-height: 46rem; display: flex; flex-direction: column; gap: 2rem; align-items: center; justify-content: center;">
      <div style="display: grid; grid-template-columns: repeat(2, 14rem); gap: 1rem;">
        <andes-date-picker placement="topLeft" locale="en-US" placeholder="topLeft" />
        <andes-date-picker placement="topRight" locale="en-US" placeholder="topRight" />
        <andes-date-picker placement="bottomLeft" locale="en-US" placeholder="bottomLeft" />
        <andes-date-picker placement="bottomRight" locale="en-US" placeholder="bottomRight" />
      </div>
      <div style="display: grid; grid-template-columns: 14rem 24rem; gap: 1rem; align-items: start;">
        <div style="height: 9rem; overflow: auto; border: 1px dashed var(--andes-color-border); border-radius: 0.5rem; padding: 0.5rem;">
          <div style="height: 6.5rem;"></div>
          <andes-date-picker locale="en-US" placeholder="Flips upwards" aria-label="Flips upwards" />
        </div>
        <div dir="rtl" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <andes-date-picker mode="range" locale="ar" placeholder="RTL range" aria-label="RTL range" />
        </div>
      </div>
    </div>`,
  }),
};

/** `[(open)]` drives the panel from outside; `openChange` reports its own closes. */
export const ControlledOpen: Story = {
  render: () => ({
    props: { panelOpen: false },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
      <button type="button" (click)="panelOpen = !panelOpen">{{ panelOpen ? 'Close' : 'Open' }} the picker</button>
      <andes-date-picker locale="en-US" [(open)]="panelOpen" aria-label="Controlled" />
      <span style="font: 0.75rem ui-monospace, monospace;">open: {{ panelOpen }}</span>
    </div>`,
  }),
};

/**
 * `pickerValue` controls the month on show apart from the value: `[(pickerValue)]` follows
 * the arrows and the buttons below move it. A range takes a `[start, end]` pair and shows
 * its first month on the left.
 */
export const ControlledPanelMonth: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, DatePipe] },
    props: {
      month: new Date(2024, 5, 1),
      picked: FEB_15,
      jan: new Date(2025, 0, 1),
      dec: new Date(2023, 11, 1),
    },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
      <div style="display: flex; gap: 0.5rem;">
        <button type="button" (click)="month = dec">December 2023</button>
        <button type="button" (click)="month = jan">January 2025</button>
      </div>
      <andes-date-picker locale="en-US" [(pickerValue)]="month" [(ngModel)]="picked" aria-label="Controlled month" />
      <span style="font: 0.75rem ui-monospace, monospace;">pickerValue: {{ month | date: 'MMMM y' }}</span>
    </div>`,
  }),
};

/**
 * A calendar used without the field, as an always-visible panel: here it opens under a
 * button, and the button shows what was picked. `AndesCalendar` is the date picker's own
 * panel, so it takes the same `mode`, `picker`, `min`/`max`, `dateDisabled` and
 * templates.
 */
export const ExternalPanel: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCalendar, AndesButton, DatePipe] },
    props: { shown: false, picked: null as Date | null },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
      <andes-button variant="outline" (click)="shown = !shown" [attr.aria-expanded]="shown">
        {{ picked ? (picked | date: 'mediumDate') : 'Choose a date' }}
      </andes-button>
      @if (shown) {
        <andes-calendar
          locale="en-US"
          [(value)]="picked"
          (daySelected)="shown = false"
          style="border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); box-shadow: var(--andes-shadow-popover);"
        />
      }
    </div>`,
  }),
};

/**
 * Cell and header hooks. `cellTemplate` marks paydays under the day number and
 * `timeCellTemplate` tags the hours of the working day; `headerTemplate` replaces the
 * navigation with a custom one, and `extraFooter` receives the grid on show, so its text
 * follows the panel from days to years.
 */
export const CustomCells: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, DatePipe] },
    props: {
      picked: new Date(2024, 1, 15, 10, 0),
      month: FEB_15,
      previous: (month: Date) =>
        new Date(month.getFullYear(), month.getMonth() - 1, 1),
      next: (month: Date) =>
        new Date(month.getFullYear(), month.getMonth() + 1, 1),
    },
    template: `
      <ng-template #cell let-date let-cell="cell">
        <span style="display: inline-flex; flex-direction: column; align-items: center; line-height: 1;">
          {{ cell.text }}
          @if (cell.view === 'date' && (date.getDate() === 15 || date.getDate() === 30)) {
            <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--andes-color-success);"></span>
          }
        </span>
      </ng-template>
      <ng-template #timeCell let-shown let-unit="unit" let-text="text">
        <span [style.font-weight]="unit === 'hour' && shown >= 9 && shown <= 17 ? 600 : 400">{{ text }}</span>
      </ng-template>
      <ng-template #header let-month let-goTo="goTo" let-setView="setView">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <button type="button" (click)="goTo(previous(month))" aria-label="Previous month">&#8592;</button>
          <button type="button" (click)="setView('year')">{{ month | date: 'MMMM y' }}</button>
          <button type="button" (click)="goTo(next(month))" aria-label="Next month">&#8594;</button>
        </div>
      </ng-template>
      <ng-template #footer let-mode>
        <span>Picking a {{ mode === 'date' ? 'day' : mode }}</span>
      </ng-template>
      <div style="min-height: 28rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
        <andes-date-picker locale="en-US" showTime [defaultMonth]="month" [cellTemplate]="cell" [timeCellTemplate]="timeCell" [(ngModel)]="picked" aria-label="Paydays" />
        <andes-date-picker locale="en-US" [defaultMonth]="month" [headerTemplate]="header" [extraFooter]="footer" aria-label="Custom header" />
      </div>
    `,
  }),
};

/**
 * Styling one picker's parts from page CSS. Each part carries a `data-slot`
 * (`date-picker-trigger`, `-input`, `-prefix`, `-panel`, `-presets`, `-footer`, the
 * calendar's `calendar-grid`...), and `panelClass` reaches the panel, which renders
 * outside the picker. Colours come from the theme's custom properties, set on the parts,
 * so the light and dark themes still apply.
 */
export const SemanticStyling: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15, extra: ['story-tinted-panel'] },
    styles: [
      `.story-tinted ::ng-deep [data-slot='date-picker-trigger'] {
        --andes-color-primary: var(--andes-color-success);
        border-radius: var(--andes-radius-full, 999px);
      }`,
      `::ng-deep .story-tinted-panel {
        --andes-color-primary: var(--andes-color-success);
        --andes-color-primary-text: var(--andes-color-success);
      }`,
      `::ng-deep .story-tinted-panel [data-slot='date-picker-footer'] {
        background-color: var(--andes-color-muted);
      }`,
    ],
    template: `
      <ng-template #prefix><span>Due</span></ng-template>
      <div style="min-height: 26rem;" class="story-tinted">
        <andes-date-picker locale="en-US" showNow [prefix]="prefix" [panelClass]="extra" [(ngModel)]="picked" aria-label="Tinted" />
      </div>
    `,
  }),
};
