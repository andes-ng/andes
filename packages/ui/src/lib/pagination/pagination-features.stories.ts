import { NgTemplateOutlet } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesPagination } from './pagination';

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Basics/Features',
  component: AndesPagination,
  decorators: [moduleMetadata({ imports: [NgTemplateOutlet] })],
};

export default meta;

type Story = StoryObj<AndesPagination>;

const CAPTION =
  'margin: 0 0 0.5rem; font: 0.75rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';

/**
 * The optional page controls: the page-size changer (a minimal native `<select>`), the quick
 * jumper, and the quick jumper with a go button.
 */
export const Controls: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <p style="${CAPTION}">Size changer: a native select, also shown automatically when total exceeds totalBoundaryShowSizeChanger (50)</p>
          <andes-pagination [total]="500" [current]="3" [showSizeChanger]="true" aria-label="Size changer" />
        </div>
        <div>
          <p style="${CAPTION}">Quick jumper: type a page, confirm with Enter or blur</p>
          <andes-pagination [total]="500" [showQuickJumper]="true" aria-label="Quick jumper" />
        </div>
        <div>
          <p style="${CAPTION}">Quick jumper with a go button</p>
          <andes-pagination [total]="500" [showQuickJumper]="true" [goButton]="true" aria-label="Quick jumper with go button" />
        </div>
      </div>`,
  }),
};

/** Simple mode: editable (type a page), read-only, and editable with a go button. */
export const SimpleMode: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <p style="${CAPTION}">simple: a page input and the total</p>
          <andes-pagination [total]="500" [current]="2" [simple]="true" aria-label="Simple" />
        </div>
        <div>
          <p style="${CAPTION}">simple: { readOnly: true }</p>
          <andes-pagination [total]="500" [current]="2" [simple]="{ readOnly: true }" aria-label="Simple read only" />
        </div>
        <div>
          <p style="${CAPTION}">Editable simple mode with a go button: it confirms the typed page instead of Enter or blur; blurring keeps the text until the button is pressed</p>
          <andes-pagination [total]="500" [current]="2" [simple]="true" [showQuickJumper]="true" [goButton]="true" aria-label="Simple with go button" />
        </div>
      </div>`,
  }),
};

/** Resize the viewport below 576px to collapse into the small, simple layout. */
export const Responsive: Story = {
  args: {
    totalPages: undefined,
    total: 500,
    current: 4,
    responsive: true,
    showSizeChanger: true,
  },
};

/**
 * `showTotal` takes a template, or a `(total, range) => string` function when plain
 * text is enough.
 */
export const ShowTotal: Story = {
  render: () => ({
    props: {
      totalText: (total: number, range: [number, number]) =>
        `${range[0]}-${range[1]} of ${total} records`,
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-pagination [total]="85" [current]="2" [showTotal]="totalTpl" aria-label="Total" />
        <andes-pagination [total]="85" [current]="2" [showTotal]="rangeTpl" aria-label="Range" />
        <andes-pagination [total]="85" [current]="2" [showTotal]="totalText" aria-label="Function" />
      </div>
      <ng-template #totalTpl let-total>Total {{ total }} items</ng-template>
      <ng-template #rangeTpl let-total let-range="range">{{ range[0] }}-{{ range[1] }} of {{ total }} items</ng-template>`,
  }),
};

/** Every visible and accessible label is its own input, so it can be localized. */
export const CustomLabels: Story = {
  render: () => ({
    template: `<andes-pagination
      [total]="500"
      [current]="10"
      [showSizeChanger]="true"
      [showQuickJumper]="true"
      goButton
      aria-label="Paginación"
      previousLabel="Página anterior"
      nextLabel="Página siguiente"
      pageLabel="Página"
      jumpPrevLabel="{count} páginas anteriores"
      jumpNextLabel="{count} páginas siguientes"
      itemsPerPageLabel="/ página"
      pageSizeLabel="Elementos por página"
      jumpToLabel="Ir a"
      jumpToSuffixLabel="página"
      jumpToConfirmLabel="Ir"
    />`,
  }),
};
