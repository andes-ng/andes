/**
 * Shared pieces of the org chart stories: the layout styles, the helpers that read and change the
 * sample organization, the translated label sets and the meta every group starts from. Internal:
 * excluded from the library build like the rest of `src/testing`.
 */
import { moduleMetadata } from '@storybook/angular';

import { AndesButton } from '../lib/button/button';
import { AndesCheckbox } from '../lib/checkbox/checkbox';
import { AndesInput } from '../lib/input/input';
import type { AndesOrgChartLabels } from '../lib/org-chart/org-chart-labels';
import type { AndesOrgChartKey } from '../lib/org-chart/org-chart-layout';
import { AndesOrgChartToolbarTemplate } from '../lib/org-chart/org-chart-templates';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSwitch } from '../lib/switch/switch';
import { SAMPLE_ORG, type SamplePerson } from './org-chart-sample';

/** A small line of muted text under a story's controls. */
export const READOUT =
  'font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);';

/** A row of controls above a chart. */
export const ROW =
  'display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;';

/** A column of a story's parts. */
export const STACK = 'display: grid; gap: 0.75rem;';

/** The components a story may use next to the chart. */
export const STORY_IMPORTS = [
  AndesButton,
  AndesCheckbox,
  AndesInput,
  AndesSegmented,
  AndesSwitch,
  AndesOrgChartToolbarTemplate,
];

/** The parameters every org chart story group shares. */
export const ORG_CHART_PARAMETERS = { layout: 'padded' } as const;

/** The decorator that makes the helper components available to a story's template. */
export const ORG_CHART_DECORATOR = moduleMetadata({ imports: STORY_IMPORTS });

/** The sample company without the chief of staff's side branch, for a calmer picture. */
export const COMPANY: SamplePerson = SAMPLE_ORG;

/** The person with the given key, searching the whole tree. */
export function find(
  node: SamplePerson,
  key: AndesOrgChartKey,
): SamplePerson | null {
  if (node.id === key) {
    return node;
  }
  for (const child of node.children ?? []) {
    const hit = find(child, key);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/** Returns a copy of the tree with `update` applied to the node with the given key. */
export function updateNode(
  node: SamplePerson,
  key: AndesOrgChartKey,
  update: (node: SamplePerson) => SamplePerson | null,
): SamplePerson | null {
  if (node.id === key) {
    return update(node);
  }
  if (!node.children) {
    return node;
  }
  return {
    ...node,
    children: node.children
      .map((child) => updateNode(child, key, update))
      .filter((child): child is SamplePerson => child !== null),
  };
}

/** Names of the given keys, for the readouts. */
export function namesOf(keys: readonly AndesOrgChartKey[]): string {
  return keys
    .map((key) => find(SAMPLE_ORG, key)?.name ?? String(key))
    .join(', ');
}

/** The leadership of the sample company: three leads under the founder. */
export const LEADERSHIP: SamplePerson = {
  ...SAMPLE_ORG,
  children: SAMPLE_ORG.children?.filter((child) =>
    ['cto', 'design', 'product'].includes(child.id),
  ),
};

/** Every text of the chart in Spanish. */
export const LABELS_ES: AndesOrgChartLabels = {
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  fit: 'Ajustar a la vista',
  reset: 'Restablecer vista',
  fullscreen: 'Pantalla completa',
  exitFullscreen: 'Salir de pantalla completa',
  minimap: 'Mostrar vista general',
  hideMinimap: 'Ocultar vista general',
  capture: 'Capturar la vista',
  export: 'Exportar organigrama',
  exportPng: 'Imagen PNG',
  exportJpeg: 'Imagen JPG',
  exportWebp: 'Imagen WebP',
  exportSvg: 'Vector SVG',
  print: 'Imprimir organigrama',
  expandAll: 'Expandir todo',
  collapseAll: 'Contraer todo',
  expandLevel: 'Expandir hasta el nivel',
  levelOption: 'Nivel {level}',
  search: 'Buscar',
  searchPlaceholder: 'Buscar personas',
  searchClose: 'Cerrar búsqueda',
  previousMatch: 'Coincidencia anterior',
  nextMatch: 'Coincidencia siguiente',
  matchCount: '{current} de {total}',
  matchTotal: '{total} encontradas',
  noMatches: 'Sin resultados',
  focusAll: 'Todo el organigrama',
  focusTrail: 'Equipo seleccionado',
  focusedTeam: 'Equipo de {name}',
  controls: 'Vista del organigrama',
  empty: 'Sin datos',
  loading: 'Cargando equipo',
};

/** Every text of the chart in Arabic, for the right-to-left stories. */
export const LABELS_AR: AndesOrgChartLabels = {
  zoomIn: 'تكبير',
  zoomOut: 'تصغير',
  fit: 'ملاءمة العرض',
  reset: 'إعادة ضبط العرض',
  fullscreen: 'ملء الشاشة',
  exitFullscreen: 'الخروج من ملء الشاشة',
  minimap: 'إظهار النظرة العامة',
  hideMinimap: 'إخفاء النظرة العامة',
  capture: 'التقاط العرض',
  export: 'تصدير المخطط',
  exportPng: 'صورة PNG',
  exportJpeg: 'صورة JPG',
  exportWebp: 'صورة WebP',
  exportSvg: 'متجه SVG',
  print: 'طباعة المخطط',
  expandAll: 'توسيع الكل',
  collapseAll: 'طي الكل',
  expandLevel: 'توسيع حتى المستوى',
  levelOption: 'المستوى {level}',
  search: 'بحث',
  searchPlaceholder: 'ابحث عن الأشخاص',
  searchClose: 'إغلاق البحث',
  previousMatch: 'النتيجة السابقة',
  nextMatch: 'النتيجة التالية',
  matchCount: '{current} من {total}',
  matchTotal: '{total} نتيجة',
  noMatches: 'لا نتائج',
  focusAll: 'المخطط كاملاً',
  focusTrail: 'الفريق المحدد',
  focusedTeam: 'فريق {name}',
  controls: 'عرض المخطط',
  empty: 'لا توجد بيانات',
  loading: 'جارٍ تحميل الفريق',
};
