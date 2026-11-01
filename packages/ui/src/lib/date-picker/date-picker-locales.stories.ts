import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';

/**
 * Language and calendar. `locale` sets the month and weekday names, the field's
 * display format and the typed input; `weekStartsOn` sets the first column (the locale
 * does not choose it); an `-u-ca-` extension (or `th-TH`) switches the calendar; and a
 * right-to-left locale under `dir="rtl"` mirrors the field and the panel.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Locales',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;

interface LocaleCase {
  readonly locale: string;
  readonly label: string;
  readonly start: 0 | 1 | 6;
  readonly dir?: 'rtl';
}

const LOCALES: readonly LocaleCase[] = [
  { locale: 'en-US', label: 'English (US)', start: 0 },
  { locale: 'en-GB', label: 'English (UK)', start: 1 },
  { locale: 'es-ES', label: 'Spanish (Spain)', start: 1 },
  { locale: 'es-PE', label: 'Spanish (Peru)', start: 1 },
  { locale: 'fr-FR', label: 'French', start: 1 },
  { locale: 'de-DE', label: 'German', start: 1 },
  { locale: 'pt-BR', label: 'Portuguese (Brazil)', start: 0 },
  { locale: 'it-IT', label: 'Italian', start: 1 },
  { locale: 'ru-RU', label: 'Russian', start: 1 },
  { locale: 'ja-JP', label: 'Japanese', start: 0 },
  { locale: 'zh-CN', label: 'Chinese (Simplified)', start: 1 },
  { locale: 'ko-KR', label: 'Korean', start: 0 },
  { locale: 'hi-IN', label: 'Hindi', start: 0 },
  { locale: 'tr-TR', label: 'Turkish', start: 1 },
  { locale: 'ar', label: 'Arabic', start: 6, dir: 'rtl' },
  { locale: 'he-IL', label: 'Hebrew', start: 0, dir: 'rtl' },
];

/**
 * Sixteen locales as single pickers with a value: the display format, month names and the
 * weekday header follow the locale. The first column of the week follows each region's
 * habit (Monday for most of Europe, Saturday for Arabic) through `weekStartsOn`.
 */
export const LocaleGallery: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { locales: LOCALES, picked: FEB_15, caption: CAPTION },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 24rem;">
      @for (item of locales; track item.locale) {
        <div [attr.dir]="item.dir ?? null">
          <p [style]="caption">{{ item.label }}, {{ item.locale }}</p>
          <andes-date-picker style="width: 100%" [locale]="item.locale" [weekStartsOn]="item.start" [ngModel]="picked" [aria-label]="item.label" />
        </div>
      }
    </div>`,
  }),
};

/**
 * Four locales with their date panels open: Spanish and Russian with Monday first, Japanese
 * and Chinese with the year and month in the caption, and each language's own weekday
 * names.
 */
export const LocalePanels: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      locales: ['es-ES', 'ru-RU', 'ja-JP', 'zh-CN'].map((locale) =>
        LOCALES.find((item) => item.locale === locale),
      ),
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (item of locales; track item.locale) {
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">{{ item.label }}</p>
          <andes-date-picker [locale]="item.locale" [weekStartsOn]="item.start" [ngModel]="picked" [open]="true" [aria-label]="item.label" />
        </div>
      }
    </div>`,
  }),
};

/**
 * Every type in a few locales: week, month, quarter and year display and parse in the
 * language of the field (month names in `month`, the pattern's text in `week` and
 * `quarter`).
 */
export const LocalesAllPickers: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      locales: ['es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'ru-RU'].map(
        (locale) => LOCALES.find((item) => item.locale === locale),
      ),
      types: TYPES,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem; min-height: 30rem;">
      @for (item of locales; track item.locale) {
        <div>
          <p [style]="caption">{{ item.label }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
            @for (type of types; track type) {
              <andes-date-picker style="width: 11rem;" [picker]="type" [locale]="item.locale" [weekStartsOn]="item.start" [ngModel]="picked" [aria-label]="item.label + ' ' + type" />
            }
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * Range pickers per language, with the placeholders and the input names translated
 * (`placeholder` takes a `[start, end]` pair, `startInputLabel` and `endInputLabel` name
 * the inputs for assistive technology). The ranges are filled in so the display format
 * shows.
 */
export const LocalesRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        { locale: 'es-ES', from: 'Desde', to: 'Hasta' },
        { locale: 'fr-FR', from: 'Début', to: 'Fin' },
        { locale: 'de-DE', from: 'Von', to: 'Bis' },
        { locale: 'pt-BR', from: 'De', to: 'Até' },
        { locale: 'ru-RU', from: 'С', to: 'По' },
        { locale: 'ja-JP', from: '開始日', to: '終了日' },
        { locale: 'zh-CN', from: '开始日期', to: '结束日期' },
        { locale: 'ar', from: 'من', to: 'إلى' },
      ],
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 24rem;">
      @for (item of cases; track item.locale) {
        <div>
          <p [style]="caption">{{ item.locale }}, filled</p>
          <andes-date-picker style="width: 100%" mode="range" [locale]="item.locale" [weekStartsOn]="1" [ngModel]="range" [startInputLabel]="item.from" [endInputLabel]="item.to" [aria-label]="item.from + ' - ' + item.to" />
        </div>
        <div>
          <p [style]="caption">{{ item.locale }}, empty</p>
          <andes-date-picker style="width: 100%" mode="range" [locale]="item.locale" [weekStartsOn]="1" [placeholder]="[item.from, item.to]" [startInputLabel]="item.from" [endInputLabel]="item.to" [aria-label]="item.from + ' - ' + item.to + ' empty'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * The panel's own words (`nowLabel`, `okLabel`, `clearLabel`, `presetsLabel`, the time
 * columns' `hoursLabel`, `minutesLabel`, `secondsLabel`, `meridiemLabel`, and the calendar's
 * navigation labels) are inputs, so a panel can speak any language. Open here in Spanish,
 * with a date and time and a preset.
 */
export const LocalizedLabels: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      presets: [
        { label: 'Hoy', value: () => new Date() },
        { label: 'Fin de mes', value: new Date(2024, 1, 29) },
      ],
      picked: new Date(2024, 1, 15, 9, 30),
      caption: CAPTION,
    },
    template: `<div style="width: 38rem; min-height: 28rem;">
      <p [style]="caption">Spanish labels</p>
      <andes-date-picker locale="es-ES" [weekStartsOn]="1" showTime [presets]="presets" nowLabel="Ahora" okLabel="Aceptar" clearLabel="Borrar" presetsLabel="Atajos" hoursLabel="Horas" minutesLabel="Minutos" secondsLabel="Segundos" [ngModel]="picked" [open]="true" aria-label="Fecha y hora" />
    </div>`,
  }),
};

/**
 * Alternative calendars through `locale`. The Thai locale (`th-TH`) and `-u-ca-buddhist`
 * count years in the Buddhist era (2567 for 2024), `-u-ca-japanese` names eras (Reiwa 6),
 * `-u-ca-roc` counts from 1912 (Minguo 113), and the `BBBB` token puts the Buddhist year
 * in any token format. The field and the panel's captions agree, and a year typed in the
 * era is read back as the same date.
 */
export const AlternativeCalendars: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        { locale: 'th-TH', label: 'Thai, Buddhist era' },
        { locale: 'en-US-u-ca-buddhist', label: 'English, Buddhist era' },
        { locale: 'ja-JP-u-ca-japanese', label: 'Japanese eras' },
        { locale: 'zh-TW-u-ca-roc', label: 'Minguo calendar' },
      ],
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 26rem;">
      @for (item of cases; track item.locale) {
        <div>
          <p [style]="caption">{{ item.label }}</p>
          <andes-date-picker style="width: 100%" [locale]="item.locale" [ngModel]="picked" [aria-label]="item.label" />
        </div>
        <div>
          <p [style]="caption">Range, same calendar</p>
          <andes-date-picker style="width: 100%" mode="range" [locale]="item.locale" [ngModel]="range" [aria-label]="item.label + ' range'" />
        </div>
      }
      <div>
        <p [style]="caption">BBBB token in a format</p>
        <andes-date-picker style="width: 100%" locale="en-GB" format="DD/MM/BBBB" [ngModel]="picked" aria-label="Buddhist year token" />
      </div>
      <div>
        <p [style]="caption">Month and year, Buddhist era</p>
        <andes-date-picker style="width: 100%" picker="month" locale="th-TH" [ngModel]="picked" aria-label="Thai month" />
      </div>
    </div>`,
  }),
};

/**
 * Right to left, with every type. The story runs under `dir="rtl"` on the page, as an RTL app
 * does (the panel is an overlay and reads the document's direction). The field mirrors
 * (prefix and icon swap sides), the calendar's chevrons and arrow keys mirror, a range's
 * panel arrow points at the active input, and the panel opens from the edge that follows the
 * reading direction. Arabic and Hebrew; open any field.
 */
export const Rtl: Story = {
  parameters: { dir: 'rtl' },
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      types: TYPES,
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">ar, picker="{{ type }}"</p>
          <andes-date-picker style="width: 100%" [picker]="type" locale="ar" [weekStartsOn]="6" [ngModel]="picked" [aria-label]="'ar ' + type" />
        </div>
      }
      <div>
        <p [style]="caption">ar, range</p>
        <andes-date-picker style="width: 100%" mode="range" locale="ar" [weekStartsOn]="6" [ngModel]="range" aria-label="ar range" />
      </div>
      <div>
        <p [style]="caption">he-IL</p>
        <andes-date-picker style="width: 100%" locale="he-IL" [ngModel]="picked" aria-label="he" />
      </div>
      <div>
        <p [style]="caption">he-IL, range</p>
        <andes-date-picker style="width: 100%" mode="range" locale="he-IL" [ngModel]="range" aria-label="he range" />
      </div>
      <div>
        <p [style]="caption">ar, date and time</p>
        <andes-date-picker style="width: 100%" locale="ar" showTime [weekStartsOn]="6" [ngModel]="picked" aria-label="ar date and time" />
      </div>
      <div>
        <p [style]="caption">ar, time</p>
        <andes-date-picker style="width: 100%" picker="time" locale="ar" aria-label="ar time" />
      </div>
      <div>
        <p [style]="caption">ar, multiple</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="ar" [weekStartsOn]="6" aria-label="ar multiple" />
      </div>
    </div>`,
  }),
};

/**
 * Right to left with the panels open: an Arabic date panel, an Arabic range (the arrow
 * under the field points at the active input) and a Hebrew month grid.
 */
export const RtlPanels: Story = {
  parameters: { dir: 'rtl' },
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 26rem;">
        <p [style]="caption">ar</p>
        <andes-date-picker locale="ar" [weekStartsOn]="6" [ngModel]="picked" [open]="true" aria-label="ar" />
      </div>
      <div style="width: 38rem; min-height: 26rem;">
        <p [style]="caption">ar, range</p>
        <andes-date-picker mode="range" locale="ar" [weekStartsOn]="6" [ngModel]="range" [open]="true" aria-label="ar range" />
      </div>
      <div style="width: 19rem; min-height: 26rem;">
        <p [style]="caption">he-IL, month</p>
        <andes-date-picker picker="month" locale="he-IL" [ngModel]="picked" [open]="true" aria-label="he month" />
      </div>
    </div>`,
  }),
};
