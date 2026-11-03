/**
 * Layout for the Empty stories. The empty state keeps Ant Design's own margins (8px, and 32px
 * above and below the simple illustration), so a story gives the box that holds it room of its
 * own: 2rem above and below and 1rem at the sides, 1.5rem between sibling boxes, 0.75rem under
 * a caption.
 *
 * Interpolated into the story templates (`style="${EMPTY_BOX}"`). Internal to the stories:
 * excluded from the library build in `tsconfig.lib.json`.
 */

/** Body text of a story, in the library font and the theme's foreground. */
export const EMPTY_SURFACE =
  'font: 14px/22px var(--andes-font-family, system-ui), sans-serif; color: var(--andes-color-foreground);';

/** The border, radius and card background of a box, with no padding (a table, a card). */
export const EMPTY_FRAME =
  'box-sizing: border-box; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-md, 8px); background: var(--andes-color-card, var(--andes-color-background));';

/** A bordered box that holds an empty state with room around it. */
export const EMPTY_BOX = `${EMPTY_FRAME} padding: 2rem 1rem;`;

/** Padding for an empty state that sits inside a frame of its own (under a card header). */
export const EMPTY_ROOM = 'padding: 2rem 1rem;';

/** Boxes in a column, 1.5rem apart. */
export const EMPTY_STACK =
  'display: flex; flex-direction: column; gap: 1.5rem;';

/** Boxes on a grid of cells at least `min` wide, 1.5rem apart both ways. */
export function emptyGrid(min: string): string {
  return `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(${min}, 100%), 1fr)); gap: 1.5rem; align-items: start;`;
}

/** The title of a block, 0.75rem above what it names. */
export const EMPTY_CAPTION =
  'margin: 0 0 0.75rem; font: 600 14px/22px var(--andes-font-family, system-ui), sans-serif;';

/** A muted line of explanation under a block. */
export const EMPTY_NOTE =
  'margin: 0.75rem 0 0; font-size: 12px; line-height: 20px; color: var(--andes-color-muted-foreground);';
