import type { Meta, StoryObj } from '@storybook/angular';

import { AndesBackTop } from './back-top';

/** Fixed elements are positioned against this stage (a transformed box), not the whole viewport,
 *  so several examples can share a page. */
const styles = [
  `
  .stage { position: relative; transform: translateZ(0); width: 28rem; height: 18rem; overflow: hidden; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-md); background: var(--andes-color-background); color: var(--andes-color-muted-foreground); font-size: 0.875rem; line-height: 1.375rem; }
  .stage p { margin: 0; padding: 0.75rem 1rem; }
  .row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
  `,
];

const meta: Meta<AndesBackTop> = {
  title: 'General/FloatButton/Features/BackTop',
  component: AndesBackTop,
};

export default meta;

type Story = StoryObj<AndesBackTop>;

/** Appears after `visibilityHeight` of scroll inside the target and eases back to the top (450ms by default). The second box shows the custom look, an instant jump (`duration` 0) and the `(clicked)` event. */
export const BackTop: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesBackTop] },
    styles: [
      ...styles,
      `.scroller { height: 100%; overflow: auto; } .scroller p { padding: 0.5rem 1rem; }`,
    ],
    props: { rows: Array.from({ length: 40 }, (_, i) => i + 1), count: 0 },
    template: `
      <div class="row">
        <div class="stage">
          <div class="scroller" #scroller tabindex="0" role="region" aria-label="Long list">
            @for (row of rows; track row) { <p>Row {{ row }} - scroll down</p> }
          </div>
          <andes-back-top [target]="scroller" [visibilityHeight]="150" tooltip="Back to top" />
        </div>
        <div class="stage">
          <div class="scroller" #customScroller tabindex="0" role="region" aria-label="Long list, custom button">
            @for (row of rows; track row) { <p>Row {{ row }} - scroll down</p> }
          </div>
          <andes-back-top [target]="customScroller" [visibilityHeight]="80" [duration]="0" type="primary" shape="square" size="lg" aria-label="Jump to the top" (clicked)="count = count + 1" />
          <span style="position: absolute; inset-block-start: 0.25rem; inset-inline-end: 0.75rem; font-size: 0.75rem;">clicks: {{ count }}</span>
        </div>
      </div>
    `,
  }),
};
