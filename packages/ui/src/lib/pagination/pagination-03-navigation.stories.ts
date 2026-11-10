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
 * Moving around: the Previous and Next buttons as icons, text or both, first and last, the
 * jump links, the quick jumper (with a go button, text around it, and validation) and how many
 * pages are listed.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Navigation',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

export const IconArrows: Story = {
  name: 'Icon arrows',
  parameters: about(
    'By default Previous and Next are square chevron buttons, named for a screen reader and for a tooltip.',
  ),
  render: () => scene(pg('[total]="100" [defaultCurrent]="5"', 'Icon arrows')),
};

export const TextLinks: Story = {
  name: 'Previous and next as text',
  parameters: about(
    'Words in place of the chevrons, with the icons switched off.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="100" [defaultCurrent]="5" prevText="Previous" nextText="Next" [showNavIcons]="false"',
        'Text links',
      ),
    ),
};

export const IconAndText: Story = {
  name: 'Previous and next with icon and text',
  parameters: about(
    'A word and a chevron together: the chevron leads Previous and trails Next.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Previous" nextText="Next"',
            'Icon and text',
          ),
        ),
        labelled(
          'Outline',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Previous" nextText="Next" variant="outline"',
            'Icon and text, outline',
          ),
        ),
        labelled(
          'Small',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Previous" nextText="Next" size="small"',
            'Icon and text, small',
          ),
        ),
        labelled(
          'Large',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Previous" nextText="Next" size="large"',
            'Icon and text, large',
          ),
        ),
      ),
    ),
};

export const OtherWords: Story = {
  name: 'Other words for previous and next',
  parameters: about(
    'Any words work, such as Newer and Older for a feed, or a translation.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Newer and older',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Newer" nextText="Older" [showNavIcons]="false"',
            'Newer and older',
          ),
        ),
        labelled(
          'Spanish',
          pg(
            '[total]="100" [defaultCurrent]="5" prevText="Anterior" nextText="Siguiente" previousLabel="Página anterior" nextLabel="Página siguiente" pageLabel="Página"',
            'Paginación',
          ),
        ),
      ),
    ),
};

export const FirstLast: Story = {
  name: 'First and last',
  parameters: about(
    'Double-chevron buttons that go straight to the first and last page, disabled when already there.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'In the middle',
          pg(
            '[total]="200" [defaultCurrent]="8" [showFirstLast]="true"',
            'First and last',
          ),
        ),
        labelled(
          'On the first page',
          pg(
            '[total]="200" [defaultCurrent]="1" [showFirstLast]="true"',
            'First and last, first page',
          ),
        ),
        labelled(
          'On the last page',
          pg(
            '[total]="200" [defaultCurrent]="20" [showFirstLast]="true"',
            'First and last, last page',
          ),
        ),
      ),
    ),
};

export const FirstLastCompact: Story = {
  name: 'First and last without page numbers',
  parameters: about(
    'In simple mode and in the compact layout the first and last buttons frame a short control.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Simple',
          pg(
            '[total]="200" [defaultCurrent]="8" [showFirstLast]="true" [simple]="true"',
            'Simple with first and last',
          ),
        ),
        labelled(
          'Compact',
          pg(
            '[total]="200" [defaultCurrent]="8" [showFirstLast]="true" layout="compact"',
            'Compact with first and last',
          ),
        ),
      ),
    ),
};

export const JumpLinks: Story = {
  name: 'Jump links',
  parameters: about(
    'The ellipses are buttons that move five pages at a time; their tooltip says so, and they show double chevrons on hover.',
  ),
  render: () => scene(pg('[total]="1000" [defaultCurrent]="50"', 'Jump links')),
};

export const JumpLinksLess: Story = {
  name: 'Fewer items and shorter jumps',
  parameters: about(
    'showLessItems lists one fewer neighbour on each side and makes the jump links move three pages.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default',
          pg(
            '[total]="1000" [defaultCurrent]="50" [siblingCount]="2"',
            'Default jumps',
          ),
        ),
        labelled(
          'showLessItems',
          pg(
            '[total]="1000" [defaultCurrent]="50" [siblingCount]="2" [showLessItems]="true"',
            'Shorter jumps',
          ),
        ),
      ),
    ),
};

export const JumpLinksOff: Story = {
  name: 'Plain ellipses',
  parameters: about(
    'With the jump links off, a collapsed range is just a decorative ellipsis that is not a control.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="1000" [defaultCurrent]="50" [showPrevNextJumpers]="false"',
        'No jump links',
      ),
    ),
};

export const QuickJumper: Story = {
  name: 'Quick jumper',
  parameters: about(
    'Type a page number and press Enter (or leave the field) to go there; numbers outside the range are held to it.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${pg('[(current)]="page" [total]="500" [showQuickJumper]="true"', 'Quick jumper')}
        <span [style]="muted">Current page: {{ page() }}</span>
      </div>`,
      { page: signal(1) },
    ),
};

export const QuickJumperGo: Story = {
  name: 'Quick jumper with a go button',
  parameters: about(
    'A confirm button next to the field; with it, leaving the field no longer jumps, only the button or Enter does.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default label',
          pg(
            '[total]="500" [showQuickJumper]="true" [goButton]="true"',
            'Go button',
          ),
        ),
        labelled(
          'Custom label',
          pg(
            '[total]="500" [showQuickJumper]="true" goButton="Jump"',
            'Jump button',
          ),
        ),
      ),
    ),
};

export const QuickJumperIcon: Story = {
  name: 'Quick jumper with an icon',
  parameters: about(
    'An arrow beside the go label, or a button template of your own with any icon.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${labelled('Arrow in the go button', pg('[total]="500" [showQuickJumper]="true" [goButton]="true" [jumperIcon]="true"', 'Go with an arrow'))}
        ${labelled('A button template', pg('[total]="500" [showQuickJumper]="true" [goButton]="goTemplate"', 'Go with a template'))}
        <ng-template #goTemplate>
          <andes-button variant="primary" size="md" aria-label="Go to the page"><ng-icon name="lucideCornerDownLeft" /> Go</andes-button>
        </ng-template>
      </div>`,
    ),
};

export const QuickJumperText: Story = {
  name: 'Quick jumper with text around it',
  parameters: about(
    'The words before and after the field are labels you set, so the jumper reads naturally in any language.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Before and after',
          pg(
            '[total]="200" [showQuickJumper]="true" jumpToLabel="Page" jumpToSuffixLabel="of 20"',
            'Page of twenty',
          ),
        ),
        labelled(
          'Spanish',
          pg(
            '[total]="200" [showQuickJumper]="true" jumpToLabel="Ir a la página" jumpToSuffixLabel="de 20" [goButton]="true" jumpToConfirmLabel="Ir"',
            'Ir a la página',
          ),
        ),
      ),
    ),
};

export const QuickJumperValidation: Story = {
  name: 'Quick jumper validation',
  parameters: about(
    'Text that is not a page number is kept and marked invalid until you edit it, and a number past the end lands on the last page.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        ${pg('[(current)]="page" [total]="200" [showQuickJumper]="true" [goButton]="true"', 'Validation')}
        <span [style]="muted">Try "abc", "0", "-3" or "999". Current page: {{ page() }}</span>
      </div>`,
      { page: signal(3) },
    ),
};

export const SiblingBoundary: Story = {
  name: 'Sibling and boundary counts',
  parameters: about(
    'siblingCount sets how many pages sit beside the current one and boundaryCount how many stay at each end.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'siblingCount 0',
          pg(
            '[total]="300" [defaultCurrent]="15" [siblingCount]="0"',
            'No siblings',
          ),
        ),
        labelled(
          'siblingCount 1 (default)',
          pg('[total]="300" [defaultCurrent]="15"', 'One sibling'),
        ),
        labelled(
          'siblingCount 2',
          pg(
            '[total]="300" [defaultCurrent]="15" [siblingCount]="2"',
            'Two siblings',
          ),
        ),
        labelled(
          'boundaryCount 2',
          pg(
            '[total]="300" [defaultCurrent]="15" [boundaryCount]="2"',
            'Two boundary pages',
          ),
        ),
        labelled(
          'boundaryCount 0',
          pg(
            '[total]="300" [defaultCurrent]="15" [boundaryCount]="0"',
            'No boundary pages',
          ),
        ),
      ),
    ),
};
