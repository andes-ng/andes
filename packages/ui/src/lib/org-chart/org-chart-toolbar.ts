/**
 * The built-in tools of the floating bar, in the order they can be listed in `controlItems`.
 *
 * - `zoom`: zoom in, the zoom percentage and zoom out.
 * - `fit`: frames the whole chart.
 * - `reset`: back to 100%, on the first root.
 * - `fullscreen`: shows the chart across the screen (hidden where the browser has no
 *   Fullscreen API).
 * - `capture`: saves what is on screen right now, as one click.
 * - `export`: a menu to save the whole chart as PNG, JPG, WebP or SVG.
 * - `print`: prints the whole chart on one page.
 * - `expandAll` / `collapseAll`: open or close every team.
 * - `expandLevel`: a menu to open the chart down to a level.
 * - `search`: a search field with the number of matches and previous / next.
 * - `minimap`: shows or hides the overview of the whole chart.
 * - `divider`: a thin rule between groups of tools.
 */
export type AndesOrgChartControl =
  | 'zoom'
  | 'fit'
  | 'reset'
  | 'fullscreen'
  | 'capture'
  | 'export'
  | 'print'
  | 'expandAll'
  | 'collapseAll'
  | 'expandLevel'
  | 'search'
  | 'minimap'
  | 'divider';

/** The corner of the chart the bar floats in; `start` and `end` follow the text direction. */
export type AndesOrgChartControlsPosition =
  'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** Whether the tools are stacked in a column or laid out in a row. */
export type AndesOrgChartControlsOrientation = 'vertical' | 'horizontal';

/** What the bar shows when `controlItems` is not given. */
export const ANDES_ORG_CHART_DEFAULT_CONTROLS: readonly AndesOrgChartControl[] =
  ['zoom', 'divider', 'fit', 'reset', 'divider', 'export'];

/** Every tool in a sensible reading order, grouped with dividers: the "everything" bar. */
export const ANDES_ORG_CHART_ALL_CONTROLS: readonly AndesOrgChartControl[] = [
  'zoom',
  'divider',
  'fit',
  'reset',
  'fullscreen',
  'minimap',
  'divider',
  'search',
  'expandAll',
  'collapseAll',
  'expandLevel',
  'divider',
  'capture',
  'export',
  'print',
];

const KNOWN: ReadonlySet<string> = new Set<AndesOrgChartControl>([
  'zoom',
  'fit',
  'reset',
  'fullscreen',
  'capture',
  'export',
  'print',
  'expandAll',
  'collapseAll',
  'expandLevel',
  'search',
  'minimap',
  'divider',
]);

/** Which tools the chart can offer right now. */
export interface AndesOrgChartControlAvailability {
  /** `zoomable`: without it the `zoom` tool is left out. */
  readonly zoom: boolean;
  /** `exportable`: without it the `export` tool is left out. */
  readonly export: boolean;
  /** Whether the browser can show an element across the screen. */
  readonly fullscreen: boolean;
}

/**
 * The tools the bar draws: unknown names and repeats are dropped (a divider may repeat), tools
 * that are not available are left out, and a divider that would start the bar, end it or sit next
 * to another one goes too.
 */
export function resolveOrgChartControls(
  items: readonly string[] | null | undefined,
  available: AndesOrgChartControlAvailability,
): readonly AndesOrgChartControl[] {
  const seen = new Set<string>();
  const kept: AndesOrgChartControl[] = [];
  for (const item of items ?? []) {
    if (!KNOWN.has(item) || (item !== 'divider' && seen.has(item))) {
      continue;
    }
    seen.add(item);
    if (
      (item === 'zoom' && !available.zoom) ||
      (item === 'export' && !available.export) ||
      (item === 'fullscreen' && !available.fullscreen)
    ) {
      continue;
    }
    kept.push(item as AndesOrgChartControl);
  }
  const out: AndesOrgChartControl[] = [];
  for (const item of kept) {
    if (item === 'divider' && (out.length === 0 || out.at(-1) === 'divider')) {
      continue;
    }
    out.push(item);
  }
  while (out.at(-1) === 'divider') {
    out.pop();
  }
  return out;
}

/** Fills the `{name}` placeholders of a translated text, as in `'{current} of {total}'`. */
export function fillOrgChartText(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  let out = text;
  for (const name of Object.keys(values)) {
    out = out.split(`{${name}}`).join(String(values[name]));
  }
  return out;
}
