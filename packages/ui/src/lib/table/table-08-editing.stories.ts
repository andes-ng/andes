import type { Meta } from '@storybook/angular';

import { withDescription, withTableKit } from '../../testing/table-story-kit';
import { AndesTable } from './table';

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Editing and custom cells',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;
