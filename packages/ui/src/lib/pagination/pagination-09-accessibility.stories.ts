import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  labelled,
  pg,
  scene,
  stack,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import { AndesPagination } from './pagination';

/*
 * Reading and using the control without a mouse: the landmark and its names, the current
 * page, the keys, the announcement after a change, focus that stays put, a right-to-left
 * page, the dark theme, every state side by side, and reduced motion.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Accessibility',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

/** Moves keyboard focus to the current page of the first pagination in the page. */
function focusCurrent(): void {
  const current = document.querySelector<HTMLElement>(
    'andes-pagination [aria-current="page"]',
  );
  current?.focus({ focusVisible: true } as FocusOptions);
}

export const Landmark: Story = {
  name: 'Landmark and names',
  parameters: about(
    'The control is a nav landmark named by aria-label, so two of them on a page need two different names.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Landmark "Search results"',
          pg('[total]="200" [defaultCurrent]="3"', 'Search results'),
        ),
        labelled(
          'Landmark "Comments"',
          pg('[total]="60" [defaultCurrent]="2" size="small"', 'Comments'),
        ),
      ),
    ),
};

export const CurrentPage: Story = {
  name: 'Current page',
  parameters: about(
    'The current page carries aria-current="page" and every page is named "Page 3", so the number is announced with its meaning.',
  ),
  render: () =>
    scene(
      stack(
        pg('[total]="100" [defaultCurrent]="3"', 'Current page'),
        `<span [style]="muted">A screen reader says "Page 3, current page, link" for the marked item.</span>`,
      ),
    ),
};

export const Keyboard: Story = {
  name: 'Keyboard',
  parameters: about(
    'Tab reaches every item; inside the list the left and right arrows move along it, Home and End jump to the ends, and Enter or Space activates.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-button variant="outline" (click)="focusCurrent()"><ng-icon name="lucideKeyboard" /> Focus the current page</andes-button>
        ${pg('[total]="500" [defaultCurrent]="6" [showFirstLast]="true" [showQuickJumper]="true"', 'Keyboard')}
        <span [style]="muted">Try ArrowLeft, ArrowRight, Home, End, Enter and Tab. In the field, Enter jumps.</span>
      </div>`,
      { focusCurrent },
    ),
};

export const KeyboardSimple: Story = {
  name: 'Keyboard in simple mode',
  parameters: about(
    'In the simple input, Enter jumps, the up and down arrows step a page, and text that is not a number reverts.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${pg('[(current)]="page" [total]="500" [simple]="true"', 'Simple keyboard')}
        <span [style]="muted">Current page: {{ page() }}</span>
      </div>`,
      { page: signal(4) },
    ),
};

export const Announcements: Story = {
  name: 'Announcements',
  parameters: about(
    'After every change a polite live region says the page and the item range, so a screen reader user hears where they landed.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${pg('[(current)]="page" [(pageSize)]="perPage" [total]="95" [showSizeChanger]="true"', 'Announcements')}
        <span [style]="muted">Announced: "Page {{ page() }} of {{ pages(perPage()) }}. {{ from(page(), perPage()) }}-{{ to(page(), perPage()) }} of 95"</span>
      </div>`,
      {
        page: signal(1),
        perPage: signal(10),
        pages: (size: number) => Math.ceil(95 / size),
        from: (page: number, size: number) =>
          Math.min((page - 1) * size + 1, 95),
        to: (page: number, size: number) => Math.min(page * size, 95),
      },
    ),
};

export const AnnouncementsLocalised: Story = {
  name: 'Announcements in another language',
  parameters: about(
    'statusLabel and rangeLabel set the words of the announcement, so it can be translated like every other label.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="95" [defaultCurrent]="2" statusLabel="Página {page} de {pages}" rangeLabel="{from} a {to} de {total}" previousLabel="Página anterior" nextLabel="Página siguiente" pageLabel="Página"',
        'Paginación',
      ),
    ),
};

export const FocusKept: Story = {
  name: 'Focus stays inside',
  parameters: about(
    'When the activated Next button becomes disabled on the last page, focus moves to the current page instead of dropping to the page body.',
  ),
  render: () =>
    scene(
      stack(
        pg(
          '[total]="30" [defaultCurrent]="2" [showFirstLast]="true"',
          'Focus kept',
        ),
        `<span [style]="muted">Tab to Next, press Enter twice: focus lands on the current page, not on the body.</span>`,
      ),
    ),
};

export const FocusRing: Story = {
  name: 'Visible focus',
  parameters: about(
    'A two-pixel ring with a two-pixel offset marks the focused item in every variant; the button focuses the current page of each.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-button variant="outline" (click)="focusCurrent()"><ng-icon name="lucideKeyboard" /> Focus the current page</andes-button>
        ${stack(
          pg('[total]="100" [defaultCurrent]="3"', 'Focus ring, default'),
          pg(
            '[total]="100" [defaultCurrent]="3" variant="outline"',
            'Focus ring, outline',
          ),
          pg(
            '[total]="100" [defaultCurrent]="3" variant="filled"',
            'Focus ring, filled',
          ),
        )}
      </div>`,
      { focusCurrent },
    ),
};

export const Rtl: Story = {
  name: 'Right to left',
  parameters: {
    ...about(
      'In a right-to-left page the control mirrors: the pages run right to left, the chevrons point the other way and the arrow keys follow the reading direction.',
    ),
    dir: 'rtl',
  },
  render: () =>
    scene(
      stack(
        labelled(
          'Pages',
          pg(
            '[total]="500" [defaultCurrent]="6" [showFirstLast]="true" [showSizeChanger]="true" [showQuickJumper]="true"',
            'RTL pages',
          ),
        ),
        labelled(
          'Simple',
          pg(
            '[total]="500" [defaultCurrent]="6" [simple]="true"',
            'RTL simple',
          ),
        ),
        labelled(
          'Table footer',
          pg(
            '[total]="500" [defaultCurrent]="6" layout="table"',
            'RTL table footer',
          ),
        ),
        labelled(
          'Text arrows',
          pg(
            '[total]="500" [defaultCurrent]="6" prevText="Previous" nextText="Next"',
            'RTL text arrows',
          ),
        ),
      ),
    ),
};

export const Dark: Story = {
  name: 'Dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'On the dark theme every variant keeps its text and its marker readable, with the current page, hover, disabled and fields all above contrast minimums.',
  ),
  render: () =>
    scene(
      stack(
        ...(['default', 'outline', 'ghost', 'filled'] as const).map((variant) =>
          labelled(
            variant,
            pg(
              `[total]="500" [defaultCurrent]="6" variant="${variant}" [showSizeChanger]="true" [showQuickJumper]="true"`,
              `Dark ${variant}`,
            ),
          ),
        ),
        labelled(
          'Disabled',
          pg(
            '[total]="500" [defaultCurrent]="6" [disabled]="true"',
            'Dark disabled',
          ),
        ),
        labelled(
          'Table footer',
          pg(
            '[total]="500" [defaultCurrent]="6" layout="table"',
            'Dark table footer',
          ),
        ),
      ),
    ),
};

export const AllStates: Story = {
  name: 'Every state',
  parameters: about(
    'The current and disabled items beside plain ones, in each variant, for checking the states against each other.',
  ),
  render: () =>
    scene(
      stack(
        ...(['default', 'outline', 'ghost', 'filled'] as const).flatMap(
          (variant) => [
            labelled(
              `${variant}: first page (Previous disabled)`,
              pg(`[total]="100" variant="${variant}"`, `${variant} first`),
            ),
            labelled(
              `${variant}: disabled`,
              pg(
                `[total]="100" [defaultCurrent]="3" [disabled]="true" variant="${variant}"`,
                `${variant} disabled`,
              ),
            ),
          ],
        ),
      ),
    ),
};

export const TouchTargets: Story = {
  name: 'Touch targets',
  parameters: about(
    'The large size gives 40px items, 6px more than the default, for a touch screen.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Large, with text',
          pg(
            '[total]="100" [defaultCurrent]="3" size="large" prevText="Previous" nextText="Next"',
            'Touch',
          ),
        ),
        labelled(
          'Large, simple',
          pg(
            '[total]="100" [defaultCurrent]="3" size="large" [simple]="true"',
            'Touch simple',
          ),
        ),
      ),
    ),
};

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'With the system reduced-motion setting on, the hover transitions and the loading spinner stop moving.',
  ),
  render: () =>
    scene(
      stack(
        pg(
          '[total]="100" [defaultCurrent]="3" [loading]="true"',
          'Reduced motion',
        ),
        `<span [style]="muted">Turn on "Reduce motion" in your system settings and the spinner above stays still.</span>`,
      ),
    ),
};
