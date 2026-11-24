/**
 * Every text the chart shows or announces itself, for translation. Pass any of them through the
 * `labels` input; the rest keep their English default. A few take `{name}` placeholders, which
 * are filled in: `levelOption` (`{level}`), `matchCount` (`{current}`, `{total}`), `matchTotal` (`{total}`) and
 * `focusedTeam` (`{name}`).
 */
export interface AndesOrgChartLabels {
  // View
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly fit: string;
  readonly reset: string;
  readonly fullscreen: string;
  readonly exitFullscreen: string;
  readonly minimap: string;
  readonly hideMinimap: string;
  // Save and print
  readonly capture: string;
  readonly export: string;
  readonly exportPng: string;
  readonly exportJpeg: string;
  readonly exportWebp: string;
  readonly exportSvg: string;
  readonly print: string;
  // Expansion
  readonly expandAll: string;
  readonly collapseAll: string;
  readonly expandLevel: string;
  readonly levelOption: string;
  // Search
  readonly search: string;
  readonly searchPlaceholder: string;
  readonly searchClose: string;
  readonly previousMatch: string;
  readonly nextMatch: string;
  readonly matchCount: string;
  readonly matchTotal: string;
  readonly noMatches: string;
  // Focus on a team
  readonly focusAll: string;
  readonly focusTrail: string;
  readonly focusedTeam: string;
  // Group and states
  readonly controls: string;
  readonly empty: string;
  readonly loading: string;
}

export const DEFAULT_ORG_CHART_LABELS: AndesOrgChartLabels = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fit: 'Fit to view',
  reset: 'Reset view',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  minimap: 'Show overview',
  hideMinimap: 'Hide overview',
  capture: 'Capture view',
  export: 'Export chart',
  exportPng: 'PNG image',
  exportJpeg: 'JPG image',
  exportWebp: 'WebP image',
  exportSvg: 'SVG vector',
  print: 'Print chart',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  expandLevel: 'Expand to level',
  levelOption: 'Level {level}',
  search: 'Search',
  searchPlaceholder: 'Search people',
  searchClose: 'Close search',
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  matchCount: '{current} of {total}',
  matchTotal: '{total} found',
  noMatches: 'No matches',
  focusAll: 'Whole chart',
  focusTrail: 'Focused team',
  focusedTeam: 'Focused on {name}',
  controls: 'Chart view',
  empty: 'No data',
  loading: 'Loading reports',
};
