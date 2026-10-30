import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectGroup } from './select-group';
import { AndesSelectItem } from './select-item';
import { AndesSelectLabel } from './select-label';
import { AndesSelectSeparator } from './select-separator';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';

const SELECT_IMPORTS = [
  JsonPipe,
  AndesSelect,
  AndesSelectContent,
  AndesSelectGroup,
  AndesSelectItem,
  AndesSelectLabel,
  AndesSelectSeparator,
  AndesSelectTrigger,
  AndesSelectValue,
];

const meta: Meta<AndesSelect> = {
  title: 'Data Entry/Select/Custom content',
  component: AndesSelect,
};

export default meta;

type Story = StoryObj<AndesSelect>;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'grape', label: 'Grape' },
  { value: 'kiwi', label: 'Kiwi' },
];

/**
 * Icons: `prefix` adds a leading icon, `suffixIcon` replaces the chevron (or `null`
 * removes it), `optionSelectedIcon` replaces the check mark (or `null` removes it) and
 * `loadingIcon` replaces the spinner.
 */
export const Icons: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS, picked: ['apple', 'banana'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-select aria-label="Fruit" placeholder="With prefix and custom suffix"
          [prefix]="searchIcon" [suffixIcon]="chevrons" [options]="fruits" />
        <andes-select aria-label="Fruit, no suffix icon" placeholder="No suffix icon" [suffixIcon]="null" [options]="fruits" />
        <andes-select aria-label="Fruit, custom check" mode="multiple" [options]="fruits" [(value)]="picked"
          [optionSelectedIcon]="dot" />
        <andes-select aria-label="Fruit, no check mark" mode="multiple" [options]="fruits" [(value)]="picked"
          [optionSelectedIcon]="null" />
        <andes-select aria-label="Loading fruit" placeholder="Loading" loading [options]="fruits" [loadingIcon]="hourglass" />
      </div>
      <ng-template #searchIcon>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" stroke-linecap="round" />
        </svg>
      </ng-template>
      <ng-template #chevrons>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m7 15 5 5 5-5M7 9l5-5 5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </ng-template>
      <ng-template #dot>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
        </svg>
      </ng-template>
      <ng-template #hourglass>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10" stroke-linecap="round" />
        </svg>
      </ng-template>
    `,
  }),
};

/**
 * `panelFooter` adds content below the options - here a field that adds a new option.
 * Keys typed into it stay in it; the option list's keyboard handling leaves them alone.
 */
export const PanelFooter: Story = {
  render: () => {
    const fruits = signal(FRUITS.slice(0, 4));
    return {
      moduleMetadata: { imports: SELECT_IMPORTS },
      props: {
        fruits,
        add(input: HTMLInputElement) {
          const label = input.value.trim();
          if (!label) {
            return;
          }
          fruits.update((current) => [
            ...current,
            { value: label.toLowerCase(), label },
          ]);
          input.value = '';
        },
      },
      template: `
        <div style="width: 260px;">
          <andes-select aria-label="Fruit" placeholder="Pick or add a fruit" [options]="fruits()" [panelFooter]="footer" />
        </div>
        <ng-template #footer>
          <div style="display: flex; gap: 0.5rem;">
            <input #name class="demo-field" aria-label="New fruit" placeholder="New fruit" (keydown.enter)="add(name)" />
            <button type="button" (click)="add(name)"
              style="height: 1.5rem; padding: 0 0.625rem; border: none; border-radius: var(--andes-radius-sm); cursor: pointer;
                background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); font-family: inherit; font-size: 0.875rem;">
              Add item
            </button>
          </div>
        </ng-template>
      `,
      // A small field drawn like the select's own box: one border, and on focus a primary
      // border with a soft ring instead of the browser's outline around it.
      styles: [
        `
        .demo-field {
          flex: 1;
          min-width: 0;
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
        .demo-field::placeholder {
          color: var(--andes-color-muted-foreground);
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
    };
  },
};

/**
 * `matchTriggerWidth` sizes the panel: `false` fits it to its content (the first select),
 * a number sets it in px (the second one, 360px). `panelClass` (the third) puts classes on
 * the panel, which renders outside the select's own DOM, so page CSS can restyle one
 * select's panel - here a tinted border.
 */
export const PanelWidth: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      terms: [
        {
          value: 'net30',
          label: 'Net 30 - payment due thirty days after invoice',
        },
        {
          value: 'net60',
          label: 'Net 60 - payment due sixty days after invoice',
        },
        { value: 'cod', label: 'Cash on delivery' },
      ],
    },
    template: `
      <div style="display: flex; gap: 1rem; align-items: flex-start;">
        <div style="width: 140px;">
          <andes-select aria-label="Terms, sized to content" placeholder="Content" [options]="terms" [matchTriggerWidth]="false" />
        </div>
        <div style="width: 140px;">
          <andes-select aria-label="Terms, 360px" placeholder="360px" [options]="terms" [matchTriggerWidth]="360" />
        </div>
        <div style="width: 200px;">
          <andes-select aria-label="Terms, custom panel class" placeholder="panelClass" [options]="terms"
            panelClass="story-outlined-panel" />
        </div>
      </div>
    `,
    // The panel is not part of this story's view, so the rule has to reach out of it,
    // and it pairs the class with the panel's own to outweigh the panel's border rule.
    styles: [
      `
      ::ng-deep .andes-select__panel.story-outlined-panel {
        border-color: var(--andes-color-primary);
      }
      `,
    ],
  }),
};
