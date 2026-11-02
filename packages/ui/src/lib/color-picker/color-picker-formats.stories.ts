import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColorPicker } from './color-picker';
import { AndesColorPickerPanel } from './color-picker-panel';

const IMPORTS = [AndesColorPicker, AndesColorPickerPanel];

const meta: Meta<AndesColorPicker> = {
  title: 'Data Entry/Color Picker/Basics/Formats and contrast',
  component: AndesColorPicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesColorPicker>;

const caption = (text: string) =>
  `<span style="font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</span>`;

/**
 * The five formats: HEX, RGB, HSB, HSL (read as `hsl(210 50% 40% / 0.5)` or with commas) and
 * OKLCH (`oklch(62.8% 0.2577 29.23)`, lightness / chroma / hue fields on a row of their own).
 * The switch is the library's own select (its list opens over the popup), and every field is
 * the library's text or number field, sized to its content. A bound `format` is controlled;
 * `disabledFormat` hides the switch. The copy button copies
 * the value in the format shown, and the copied text is logged below.
 */
export const Formats: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      hslColor: 'hsl(210 50% 40% / 0.5)',
      oklchColor: 'oklch(62.8% 0.2577 29.23)',
      pickedFormat: 'rgb',
      controlled: '#2f54eb',
      copiedText: '',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          ${caption('Starts in HSL, the user can switch')}
          <andes-color-picker aria-label="HSL color" defaultFormat="hsl" [(value)]="hslColor" showText (copied)="copiedText = $event" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          ${caption('OKLCH')}
          <andes-color-picker aria-label="OKLCH color" defaultFormat="oklch" [(value)]="oklchColor" showText (copied)="copiedText = $event" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          ${caption('Controlled: the format is {{ pickedFormat }}')}
          <andes-color-picker
            aria-label="Controlled format"
            [(value)]="controlled"
            [format]="pickedFormat"
            (formatChange)="pickedFormat = $event"
            showText
          />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          ${caption('Format switch hidden, no copy button')}
          <andes-color-picker aria-label="Fixed RGB" format="rgb" disabledFormat [showCopy]="false" value="#13a8a8" showText />
        </div>
        <code style="font-size: 0.75rem;">copied: {{ copiedText || '-' }}</code>
      </div>
    `,
  }),
};

/**
 * Opacity: shown and editable by default, controls hidden with `[showAlpha]="false"` (the
 * value keeps its opacity), or taken out of the value with `disabledAlpha`.
 */
export const Opacity: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-color-picker aria-label="With opacity" value="#1677ff80" showText />
        <andes-color-picker aria-label="Opacity controls hidden" value="#1677ff80" [showAlpha]="false" showText />
        <andes-color-picker aria-label="Opaque only" value="#1677ff80" disabledAlpha showText />
      </div>
    `,
  }),
};

/**
 * `contrastWith`: the WCAG 2 contrast ratio of the colour against another one, with AA and
 * AAA badges for normal and large text (a failed level is struck through). A translucent
 * colour is first composited onto the background, as the eye sees it. Against white on the
 * left, against a dark surface on the right.
 */
export const Contrast: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { onLight: '#767676', onDark: '#7aa2ff' },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: #ffffff; border-radius: 0.5rem;">
          <span [style.color]="onLight" style="font: 600 1rem/1.5rem var(--andes-font-family), sans-serif;">Text on white</span>
          <andes-color-picker-panel aria-label="Text color on white" [(value)]="onLight" contrastWith="#ffffff" size="sm" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: #0f172a; border-radius: 0.5rem;">
          <span [style.color]="onDark" style="font: 600 1rem/1.5rem var(--andes-font-family), sans-serif;">Text on a dark surface</span>
          <andes-color-picker aria-label="Text color on dark" [(value)]="onDark" contrastWith="#0f172a" showText />
        </div>
      </div>
    `,
  }),
};

/**
 * `name` renders a hidden input carrying the value text, so a plain `<form>` posts it; the
 * form below shows what it would send.
 */
export const NativeForm: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      posted: '',
      post(event: SubmitEvent): string {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        return JSON.stringify(Object.fromEntries(data.entries()));
      },
    },
    template: `
      <form (submit)="posted = post($event)" style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-color-picker aria-label="Theme" name="theme" value="#722ed1" showText />
        <andes-color-picker aria-label="Background" name="background" mode="gradient" value="linear-gradient(90deg, #ff7a45, #ffd666)" showText />
        <button type="submit">Post</button>
        <code style="font-size: 0.75rem;">{{ posted || 'not posted yet' }}</code>
      </form>
    `,
  }),
};
