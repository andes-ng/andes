/**
 * Layout for the stories that lay several fields out side by side (the date and time picker
 * stories first). A field has a width of its own (a date, a range, a time), so a story only
 * places fields: in a wrapping row 1rem apart, on a grid of captioned cells, or in a stack of
 * rows. A field that needs another width says so itself, with `--andes-date-picker-width`.
 *
 * Interpolated into the story templates (`style="${FIELD_ROW}"`). Internal to the stories:
 * excluded from the library build in `tsconfig.lib.json`.
 */

/** A row of fields at their own widths, 1rem apart, wrapping whole fields onto the next row. */
export const FIELD_ROW =
  'display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;';

/** Captioned blocks or rows stacked 1.25rem apart. */
export const FIELD_STACK =
  'display: flex; flex-direction: column; gap: 1.25rem;';

/**
 * Captioned fields on a grid of cells at least `min` wide, 1rem between rows and 1.5rem between
 * columns. A field keeps its own width inside its cell rather than stretching across it.
 */
export function fieldGrid(min: string): string {
  return `display: grid; grid-template-columns: repeat(auto-fill, minmax(${min}, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; justify-items: start;`;
}
