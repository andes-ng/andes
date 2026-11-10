import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  injectStyle,
  labelled,
  pg,
  scene,
  stack,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import type {
  AndesPaginationClassNames,
  AndesPaginationState,
  AndesPaginationStyles,
} from './pagination';
import { AndesPagination } from './pagination';

/*
 * Making it yours: your own content for the items (itemRender), classes and inline styles for
 * each part as objects or functions of the state, the custom properties, icons of your own,
 * links, and every label.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Customisation',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

/** Hands the default content of an item back, from inside an itemRender template. */
const ORIGINAL =
  '<ng-container *ngTemplateOutlet="originalElement; context: { $implicit: page, type: type }" />';

export const ItemRenderPages: Story = {
  name: 'Item render: page content',
  parameters: about(
    'itemRender replaces what is inside an item, never the button itself, so a page can show zero-padded numbers and stay a real, labelled control.',
  ),
  render: () =>
    scene(
      `${pg('[total]="120" [defaultCurrent]="3" [itemRender]="item"', 'Zero-padded pages')}
      <ng-template #item let-page let-type="type" let-originalElement="originalElement">
        @if (type === 'page') {
          <span style="font-variant-numeric: tabular-nums;">{{ page < 10 ? '0' + page : page }}</span>
        } @else {
          ${ORIGINAL}
        }
      </ng-template>`,
    ),
};

export const ItemRenderIcons: Story = {
  name: 'Item render: icons of your own',
  parameters: about(
    'Each kind of control (prev, next, first, last and the two jump links) can take its own icon through the same template.',
  ),
  render: () =>
    scene(
      `${pg('[total]="1000" [defaultCurrent]="50" [showFirstLast]="true" [itemRender]="item"', 'Icons of your own')}
      <ng-template #item let-page let-type="type" let-originalElement="originalElement">
        @switch (type) {
          @case ('prev') { <ng-icon name="lucideArrowLeft" /> }
          @case ('next') { <ng-icon name="lucideArrowRight" /> }
          @case ('first') { <ng-icon name="lucideSkipBack" /> }
          @case ('last') { <ng-icon name="lucideSkipForward" /> }
          @case ('jump-prev') { <ng-icon name="lucideMoveLeft" /> }
          @case ('jump-next') { <ng-icon name="lucideMoveRight" /> }
          @default { ${ORIGINAL} }
        }
      </ng-template>`,
    ),
};

export const ItemRenderText: Story = {
  name: 'Item render: words for the arrows',
  parameters: about(
    'Previous and Next as words with a leading or trailing icon, written in the template instead of the inputs.',
  ),
  render: () =>
    scene(
      `${pg('[total]="120" [defaultCurrent]="3" variant="outline" [itemRender]="item"', 'Words for the arrows')}
      <ng-template #item let-page let-type="type" let-originalElement="originalElement">
        @switch (type) {
          @case ('prev') { <ng-icon name="lucideChevronLeft" /> Back }
          @case ('next') { Forward <ng-icon name="lucideChevronRight" /> }
          @default { ${ORIGINAL} }
        }
      </ng-template>`,
    ),
};

export const ItemRenderDots: Story = {
  name: 'Item render: dots',
  parameters: about(
    'Pages as small dots for a carousel or a story reel, keeping each dot a labelled page button.',
  ),
  render: () =>
    scene(
      `${pg('[total]="6" [pageSize]="1" [defaultCurrent]="2" [itemRender]="item" [showTitle]="false"', 'Dots')}
      <ng-template #item let-page let-type="type" let-originalElement="originalElement">
        @if (type === 'page') {
          <span style="width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: currentColor;"></span>
        } @else {
          ${ORIGINAL}
        }
      </ng-template>`,
    ),
};

export const ItemRenderBadges: Story = {
  name: 'Item render: a mark on some pages',
  parameters: about(
    'A template can decorate chosen pages, here a small star on the pages that hold favourites.',
  ),
  render: () =>
    scene(
      `${pg('[total]="80" [defaultCurrent]="2" [itemRender]="item"', 'Marked pages')}
      <ng-template #item let-page let-type="type" let-originalElement="originalElement">
        @if (type === 'page' && (page === 3 || page === 6)) {
          <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
            {{ page }} <ng-icon name="lucideStar" style="width: 0.75rem; height: 0.75rem;" />
          </span>
        } @else {
          ${ORIGINAL}
        }
      </ng-template>`,
    ),
};

const PART_CSS = `
.demo-pg-root { padding: 0.5rem; border-radius: 0.75rem; background: var(--andes-color-muted); }
.demo-pg-item { font-weight: 500; }
.demo-pg-active { box-shadow: 0 0 0 3px color-mix(in srgb, var(--andes-color-primary) 25%, transparent); }
.demo-pg-prev, .demo-pg-next { background: var(--andes-color-background); border-color: var(--andes-color-border); }
.demo-pg-jump { letter-spacing: 0.125rem; }
.demo-pg-options { padding-inline-start: 1rem; border-inline-start: 1px solid var(--andes-color-border); }
.demo-pg-total { font-weight: 600; }
`;

export const ClassNames: Story = {
  name: 'classNames for each part',
  parameters: about(
    'classNames adds your own classes to the root, items, the current item, Previous, Next, the jump links, the options, the size changer, the quick jumper and the total.',
  ),
  render: () => {
    injectStyle('pagination-demo-parts', PART_CSS);
    const classNames: AndesPaginationClassNames = {
      root: 'demo-pg-root',
      item: 'demo-pg-item',
      activeItem: 'demo-pg-active',
      prev: 'demo-pg-prev',
      next: 'demo-pg-next',
      jump: 'demo-pg-jump',
      options: 'demo-pg-options',
      total: 'demo-pg-total',
    };
    return scene(
      `<andes-pagination aria-label="Classes per part" style="width: min(56rem, calc(100vw - 2rem));"
        [total]="1000" [defaultCurrent]="50" [showSizeChanger]="true" [showQuickJumper]="true"
        [showTotal]="rangeSummary" [classNames]="demoClasses" />`,
      {
        demoClasses: classNames,
        rangeSummary: (total: number) => `${total} items`,
      },
    );
  },
};

export const ClassNamesFunction: Story = {
  name: 'classNames from the state',
  parameters: about(
    'classNames can be a function of the control state, so a class can follow the page, the size or whether it is busy.',
  ),
  render: () => {
    injectStyle(
      'pagination-demo-state',
      `.demo-pg-first-page { opacity: 0.8; }
       .demo-pg-last-page .andes-pagination__item--next { color: var(--andes-color-muted-foreground); }
       .demo-pg-busy { opacity: 0.6; }
       .demo-pg-late-item { font-style: italic; }`,
    );
    return scene(
      pg(
        '[total]="100" [defaultCurrent]="1" [classNames]="demoClasses"',
        'Classes from the state',
      ),
      {
        demoClasses: (
          state: AndesPaginationState,
        ): AndesPaginationClassNames => ({
          root: [
            state.current === 1 ? 'demo-pg-first-page' : '',
            state.current === state.totalPages ? 'demo-pg-last-page' : '',
            state.loading ? 'demo-pg-busy' : '',
          ]
            .filter(Boolean)
            .join(' '),
          item: state.current > 5 ? 'demo-pg-late-item' : '',
        }),
      },
    );
  },
};

export const StylesPerPart: Story = {
  name: 'styles for each part',
  parameters: about(
    'styles takes an object of inline styles per part, custom properties included.',
  ),
  render: () => {
    const styles: AndesPaginationStyles = {
      root: { '--andes-pagination-gap': '0.625rem' },
      activeItem: { 'font-weight': '700', 'letter-spacing': '0.02em' },
      prev: { 'font-style': 'italic' },
      total: { color: 'var(--andes-color-primary-text)', 'font-weight': '600' },
      sizeChanger: { width: '9rem' },
    };
    return scene(
      `<andes-pagination aria-label="Styles per part" style="width: min(56rem, calc(100vw - 2rem));"
        [total]="1000" [defaultCurrent]="50" [showSizeChanger]="true" [showTotal]="rangeSummary"
        prevText="Back" [styles]="demoStyles" />`,
      { demoStyles: styles, rangeSummary: (total: number) => `${total} items` },
    );
  },
};

export const StylesFunction: Story = {
  name: 'styles from the state',
  parameters: about(
    'styles can also be a function of the state; here it hands each current page a custom property for how far along the list it is, and one class turns that into a tint.',
  ),
  render: () => {
    injectStyle(
      'pagination-demo-progress',
      `.demo-pg-progress .andes-button { background-color: var(--demo-progress); color: #0f172a; }`,
    );
    return scene(
      pg(
        '[total]="100" [defaultCurrent]="4" [styles]="demoStyles" [classNames]="demoClasses" variant="ghost"',
        'Styles from the state',
      ),
      {
        demoClasses: { activeItem: 'demo-pg-progress' },
        demoStyles: (state: AndesPaginationState): AndesPaginationStyles => ({
          activeItem: {
            '--demo-progress': `hsl(${Math.round((state.current / state.totalPages) * 120)} 70% 85%)`,
          },
        }),
      },
    );
  },
};

export const Tokens: Story = {
  name: 'Custom properties',
  parameters: about(
    'The item size, the gap, the section gap and the radius are custom properties you can set on the element or any ancestor.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Item size 2.75rem',
          `<andes-pagination aria-label="Item size" [total]="100" [defaultCurrent]="3" style="--andes-pagination-item-size: 2.75rem;" />`,
        ),
        labelled(
          'Gap 1rem',
          `<andes-pagination aria-label="Gap" [total]="100" [defaultCurrent]="3" style="--andes-pagination-gap: 1rem;" />`,
        ),
        labelled(
          'Radius 0.25rem',
          `<andes-pagination aria-label="Radius" [total]="100" [defaultCurrent]="3" style="--andes-pagination-radius: 0.25rem;" />`,
        ),
        labelled(
          'Section gap 3rem',
          `<andes-pagination aria-label="Section gap" [total]="100" [defaultCurrent]="3" [showSizeChanger]="true" style="--andes-pagination-section-gap: 3rem;" />`,
        ),
      ),
    ),
};

export const AccentColour: Story = {
  name: 'Accent colour',
  parameters: about(
    'The color input takes any colour of the library palette and marks the current page with it, here as a solid block.',
  ),
  render: () =>
    scene(
      stack(
        ...(['primary', 'success', 'warning', 'danger', 'info'] as const).map(
          (color) =>
            labelled(
              `color="${color}"`,
              pg(
                `[total]="100" [defaultCurrent]="3" color="${color}" variant="filled"`,
                `Accent ${color}`,
              ),
            ),
        ),
      ),
    ),
};

export const PageLinks: Story = {
  name: 'Pages as links',
  parameters: about(
    'linkFor returns the address of a page so each item is a real link, with a plain click still handled by the control and pageChange emitted for the router.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${pg('[(current)]="page" [total]="200" [linkFor]="link" [showFirstLast]="true"', 'Pages as links')}
        <span [style]="muted">Hover a page to see its address; a modified click opens it in a new tab. Current page: {{ page() }}</span>
      </div>`,
      {
        page: signal(4),
        link: (page: number) => `#/results?page=${page}`,
      },
    ),
};

export const AllLabels: Story = {
  name: 'Every label translated',
  parameters: about(
    'Every string the control draws or announces is an input, so it can speak any language.',
  ),
  render: () =>
    scene(
      `<andes-pagination aria-label="Paginación de resultados" style="width: min(60rem, calc(100vw - 2rem));"
        [total]="500" [defaultCurrent]="10" [showSizeChanger]="true" [showQuickJumper]="true" [goButton]="true"
        [showFirstLast]="true" [showTotal]="rangeSummary"
        previousLabel="Página anterior" nextLabel="Página siguiente" firstLabel="Primera página" lastLabel="Última página"
        pageLabel="Página" jumpPrevLabel="Retroceder {count} páginas" jumpNextLabel="Avanzar {count} páginas"
        itemsPerPageLabel="/ página" pageSizeLabel="Elementos por página"
        jumpToLabel="Ir a" jumpToConfirmLabel="Ir" currentPageLabel="Página actual" />`,
      {
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} de ${total}`,
      },
    ),
};

export const NoTooltips: Story = {
  name: 'Without tooltips',
  parameters: about(
    'showTitle off removes the native tooltip from every item, leaving the accessible names in place.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="500" [defaultCurrent]="50" [showTitle]="false"',
        'Without tooltips',
      ),
    ),
};
