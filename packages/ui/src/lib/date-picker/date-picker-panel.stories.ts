import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

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

/** `placement` picks the corner the panel opens from; it still flips to fit. */
export const Placement: Story = {
  render: () => ({
    template: `<div style="min-height: 46rem; display: flex; align-items: center; justify-content: center;">
      <div style="display: grid; grid-template-columns: repeat(2, 14rem); gap: 1rem;">
        <andes-date-picker placement="topLeft" locale="en-US" placeholder="topLeft" />
        <andes-date-picker placement="topRight" locale="en-US" placeholder="topRight" />
        <andes-date-picker placement="bottomLeft" locale="en-US" placeholder="bottomLeft" />
        <andes-date-picker placement="bottomRight" locale="en-US" placeholder="bottomRight" />
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
