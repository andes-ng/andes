/**
 * Shared look of the dynamic list rows in the stories: the row grid that keeps the grip, the
 * arrows and the remove button on the centre line of the input, the quiet icon buttons, and
 * the drag-and-drop motion. A story puts `LIST_ROW_STYLE` at the top of its template and uses
 * the classes below:
 *
 * - `demo-list`: the drop list (a column of rows, 16px apart).
 * - `demo-row`: one draggable row.
 * - `demo-inline`: a control followed by icon buttons, centred on one 32px line.
 * - `demo-actions`: a box one control tall (32px) holding the grip, arrows and remove button;
 *   `demo-actions--labelled` shifts it down by the height of a field label (22px line + 8px
 *   gap), so it still centres on the input when the row shows a label above it - and a row
 *   without one (the second row of a list that labels only the first) needs no shift.
 * - `demo-remove`: the minus-circle remove icon, 24px like Ant's: grey at rest, darker on hover,
 *   with no button background of its own.
 * - `demo-quiet`: the grip and the up/down arrows, grey at rest and darker on hover.
 *
 * The motion is CDK drag and drop's own, tuned with the library's motion tokens: the dragged
 * row lifts with a shadow (the preview), the rows around it slide aside while it moves, the
 * slot it leaves is a faint dashed outline, and on drop the row eases into place.
 */
export const LIST_ROW_STYLE = `
  <style>
    .demo-list { display: flex; flex-direction: column; gap: 1rem; }
    .demo-row {
      box-sizing: border-box;
      border: 1px dashed transparent;
      border-radius: var(--andes-radius-md);
      background: var(--andes-color-background);
    }
    .demo-actions {
      display: flex;
      align-items: center;
      gap: var(--andes-space-1);
      block-size: var(--andes-control-height-md, 2rem);
    }
    /* A control and its trailing icon buttons on one centred line (under a field label). */
    .demo-inline { display: flex; align-items: center; gap: var(--andes-space-2); }
    .demo-inline > :first-child { flex: 1 1 auto; min-width: 0; }
    .demo-actions--labelled { margin-block-start: 1.875rem; }
    .demo-actions andes-form-icon { font-size: 1rem; transition: color var(--andes-motion-duration-fast) var(--andes-motion-ease-out); }
    .demo-quiet andes-form-icon, .demo-remove andes-form-icon { color: var(--andes-color-muted-foreground); }
    .demo-quiet:hover andes-form-icon { color: var(--andes-color-foreground); }
    /* Only the glyph reacts: it gets darker, the button keeps no background of its own. */
    andes-button.demo-remove andes-form-icon { font-size: 1.5rem; }
    andes-button.demo-remove ::ng-deep button:hover:not(:disabled):not([data-disabled]),
    andes-button.demo-remove ::ng-deep button:active:not(:disabled):not([data-disabled]) { background-color: transparent; }
    andes-button.demo-remove:hover andes-form-icon { color: var(--andes-color-foreground); }
    .demo-grip { cursor: grab; }

    /* The slot the dragged row leaves: a faint dashed outline with its content hidden. */
    .demo-row.cdk-drag-placeholder {
      border-color: var(--andes-color-border);
      background: color-mix(in srgb, var(--andes-color-primary) 4%, transparent);
    }
    .demo-row.cdk-drag-placeholder > * { visibility: hidden; }

    /* The row under the pointer: lifted, with a shadow, never clipped by its neighbours. */
    .cdk-drag-preview.demo-row {
      border-style: solid;
      border-color: var(--andes-color-border);
      box-shadow: var(--andes-shadow-lg);
      cursor: grabbing;
    }

    /* The rows around it slide aside as it moves, and it settles with an ease on drop. */
    .demo-row.cdk-drag-animating,
    .demo-list.cdk-drop-list-dragging .demo-row:not(.cdk-drag-placeholder) {
      transition: transform var(--andes-motion-duration-slow) var(--andes-motion-ease-out);
    }
    @media (prefers-reduced-motion: reduce) {
      .demo-row.cdk-drag-animating,
      .demo-list.cdk-drop-list-dragging .demo-row:not(.cdk-drag-placeholder) { transition: none; }
    }
  </style>
`;
