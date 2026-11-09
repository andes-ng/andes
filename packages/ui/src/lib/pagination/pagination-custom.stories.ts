import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesPagination, AndesPaginationChange } from './pagination';

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Advanced/Customization',
  component: AndesPagination,
  decorators: [moduleMetadata({ imports: [NgTemplateOutlet] })],
};

export default meta;

type Story = StoryObj<AndesPagination>;

/**
 * `itemRender` replaces the content of each control. The pagination keeps the
 * focusable button, its aria-label and aria-current; `originalElement` renders the
 * default content.
 */
export const ItemRender: Story = {
  render: () => ({
    template: `
      <andes-pagination [total]="500" [current]="3" [itemRender]="itemTpl" />
      <ng-template #itemTpl let-page let-type="type" let-originalElement="originalElement">
        @if (type === 'prev') {
          <span>Previous</span>
        } @else if (type === 'next') {
          <span>Next</span>
        } @else {
          <ng-container *ngTemplateOutlet="originalElement; context: { $implicit: page, type: type }" />
        }
      </ng-template>`,
  }),
};

/**
 * `sizeChangerRender` swaps the built-in page-size select for any control. Its
 * `change(size)` applies the size exactly like the built-in one (clamping the page
 * and emitting both events); `size` and `disabled` let it match the pagination.
 */
export const CustomSizeChanger: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    template: `
      <andes-pagination [total]="500" [current]="3" [showSizeChanger]="true" [sizeChangerRender]="sizeTpl" />
      <ng-template
        #sizeTpl
        let-pageSize
        let-options="options"
        let-disabled="disabled"
        let-label="label"
        let-change="change"
      >
        <span role="group" [attr.aria-label]="label" style="display: inline-flex; gap: 0.25rem;">
          @for (option of options; track option) {
            <andes-button
              size="sm"
              [variant]="option === pageSize ? 'primary' : 'outline'"
              [disabled]="disabled"
              [aria-label]="option + ' per page' + (option === pageSize ? ' (current)' : '')"
              (click)="change(option)"
              >{{ option }}</andes-button
            >
          }
        </span>
      </ng-template>`,
  }),
};

/**
 * Fully wired to local state through `[(current)]` / `[(pageSize)]`, so every control
 * (pages, jumpers, size changer, quick jumper) actually moves the state - useful for
 * exercising keyboard/focus behavior and the a11y panel against every reachable state.
 */
@Component({
  selector: 'andes-pagination-demo',
  imports: [AndesPagination, JsonPipe],
  template: `<div style="display: grid; gap: 1rem;">
    <andes-pagination
      [(current)]="page"
      [(pageSize)]="pageSize"
      [total]="500"
      [showSizeChanger]="true"
      [showQuickJumper]="true"
      [showTotal]="totalTpl"
      (pageChange)="lastChange.set($event)"
    />
    <ng-template #totalTpl let-total let-range="range"
      >{{ range[0] }}-{{ range[1] }} of {{ total }}</ng-template
    >
    <output
      style="font-family: monospace; font-size: 0.875rem; color: var(--andes-color-foreground);"
    >
      current={{ page() }} pageSize={{ pageSize() }} lastChange={{
        lastChange() | json
      }}
    </output>
  </div>`,
})
class AndesPaginationDemo {
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly lastChange = signal<AndesPaginationChange | null>(null);
}

export const Interactive: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesPaginationDemo] },
    template: `<andes-pagination-demo />`,
  }),
};
