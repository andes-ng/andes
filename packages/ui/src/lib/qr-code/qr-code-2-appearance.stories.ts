import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  brandLogo,
  caption,
  cell,
  column,
  controls,
  darkPage,
  onDark,
  PAY_URL,
  row,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import type { AndesQrCode } from './qr-code';

/*
 * How a code looks: colours, the page it sits on, the quiet zone, the frame, a fluid width,
 * and the shapes of the modules and the corner patterns.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Appearance',
  decorators: [withDescription, withQrCodeKit],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

const code = (attributes: string, value = PAY_URL) =>
  `<andes-qr-code value="${value}" ${attributes} />`;

/** Colours. */
export const Colours: Story = {
  name: 'Colours',
  parameters: about(
    'The modules take `color` and the ground takes `bgColor`, either as any CSS colour or as a design token; keep a strong contrast between them.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Default', code('aria-label="Default colours"'))}
        ${cell('Brand', code('color="var(--andes-color-primary)" aria-label="Brand colour"'))}
        ${cell('Green on mint', code('color="#166534" bgColor="#f0fdf4" aria-label="Green on mint"'))}
        ${cell('Plum on cream', code('color="#581c87" bgColor="#fefce8" aria-label="Plum on cream"'))}
        ${cell('Black on white', code('color="#000000" bgColor="#ffffff" aria-label="Black on white"'))}
      </div>`,
  }),
};

/** Follow the theme. */
export const FollowTheTheme: Story = {
  name: 'Follow the theme',
  parameters: about(
    'By default the code stays dark on light on every theme; pass the foreground and background tokens when it should follow the theme instead.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Default: dark on light on any theme', code('aria-label="Default colours"'))}
        ${cell('Follows the theme', code('color="var(--andes-color-foreground)" bgColor="var(--andes-color-background)" aria-label="Themed colours"'))}
      </div>`,
  }),
};

/** On a dark page. */
export const OnADarkPage: Story = {
  name: 'On a dark page',
  parameters: about(
    'Dark modules on a light plate are what every scanner reads, so on a dark page the default keeps its light plate; an inverted code scans on many phones but not all.',
  ),
  render: () => ({
    template: `
      <div style="${darkPage}">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${code('aria-label="Light plate on a dark page"')}
          <span style="${onDark}">Light plate (scans everywhere)</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${code('color="#e2e8f0" bgColor="#0b1220" aria-label="Inverted code"')}
          <span style="${onDark}">Inverted (some scanners fail)</span>
        </div>
      </div>`,
  }),
};

/** Transparent. */
export const TransparentBackground: Story = {
  name: 'Transparent background',
  parameters: about(
    'A transparent `bgColor` lets the page show through the quiet zone and the exported image; keep the surface behind it light and plain.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <div style="padding: 1.25rem; border-radius: 0.5rem; background: #fef9c3;">
          ${code('bgColor="transparent" [bordered]="false" aria-label="Transparent on yellow"')}
        </div>
        <div style="padding: 1.25rem; border-radius: 0.5rem; background: #dbeafe;">
          ${code('bgColor="transparent" color="#1e3a8a" [bordered]="false" aria-label="Transparent on blue"')}
        </div>
      </div>`,
  }),
};

/** Quiet zone. */
export const QuietZone: Story = {
  name: 'Quiet zone',
  parameters: about(
    '`quietZone` is the empty border around the symbol in modules; the specification asks for 4, and 2 is enough for most phone cameras.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${[0, 1, 2, 4]
          .map((modules) =>
            cell(
              `${modules} modules`,
              code(
                `[quietZone]="${modules}" [bordered]="false" aria-label="Quiet zone of ${modules}"`,
              ),
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Frame. */
export const BorderedFrame: Story = {
  name: 'Bordered frame',
  parameters: about(
    'The frame is a soft border with padding and an 8px radius; turn `bordered` off to place the bare symbol in your own surface.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('bordered', code('aria-label="Bordered"'))}
        ${cell('not bordered', code('[bordered]="false" aria-label="Not bordered"'))}
      </div>`,
  }),
};

/** Fluid width. */
export const FluidWidth: Story = {
  name: 'Fluid width',
  parameters: about(
    'With `fluid` the code fills its container up to `size` and scales without blurring; drag the slider to resize the container.',
  ),
  render: () => ({
    props: { width: signal(220) },
    template: `
      <div style="${column} max-width: 28rem;">
        <andes-slider aria-label="Container width" [min]="80" [max]="400" [step]="10" [value]="width()" (valueChange)="width.set($any($event))" />
        <span style="${caption}">Container {{ width() }}px, code up to 320px</span>
        <div [style.width.px]="width()" style="max-width: 100%; border: 1px dashed var(--andes-color-border); border-radius: 0.25rem; padding: 0.5rem; box-sizing: content-box;">
          ${code('[fluid]="true" [size]="320" aria-label="Fluid QR code"')}
        </div>
      </div>`,
  }),
};

/** Module shapes. */
export const ModuleShapes: Story = {
  name: 'Module shapes',
  parameters: about(
    'The data modules can be square, rounded or dots; the symbol holds the same data, only the drawing changes.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${(['square', 'rounded', 'dots'] as const)
          .map((shape) =>
            cell(
              shape,
              code(
                `shape="${shape}" [size]="176" aria-label="${shape} modules"`,
              ),
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Corner shapes. */
export const CornerShapes: Story = {
  name: 'Corner shapes',
  parameters: about(
    'The three corner patterns have a shape of their own, square, rounded or circle, apart from the modules.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${(['square', 'rounded', 'circle'] as const)
          .map((shape) =>
            cell(
              shape,
              code(
                `finderShape="${shape}" [size]="176" aria-label="${shape} corners"`,
              ),
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Corner colour. */
export const CornerColours: Story = {
  name: 'Corner colours',
  parameters: about(
    '`finderColor` paints the three corner patterns apart from the modules; keep it dark enough to read.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Blue corners', code('finderColor="#1d4ed8" aria-label="Blue corners"'))}
        ${cell('Red corners, rounded', code('finderColor="#b91c1c" finderShape="rounded" aria-label="Red rounded corners"'))}
        ${cell('Green corners, dots', code('finderColor="#166534" finderShape="circle" shape="dots" aria-label="Green circle corners"'))}
      </div>`,
  }),
};

/** Quiet-zone colour. */
export const QuietZoneColour: Story = {
  name: 'Quiet-zone colour',
  parameters: about(
    '`quietZoneColor` fills the symbol and its quiet zone while `bgColor` colours the frame around it.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Light grey inside a white frame', code('quietZoneColor="#f1f5f9" aria-label="Grey quiet zone"'))}
        ${cell('Cream inside a blue frame', code('quietZoneColor="#fffbeb" bgColor="#dbeafe" aria-label="Cream quiet zone"'))}
      </div>`,
  }),
};

/** A branded style. */
export const BrandedStyle: Story = {
  name: 'Branded style',
  parameters: about(
    'Rounded modules, circle corners, a brand colour and a logo together make a code that still scans: the data is the same.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `
      <div style="${row}">
        ${cell(
          'Rounded',
          code(
            'shape="rounded" finderShape="rounded" color="#1e3a8a" finderColor="#2563eb" [icon]="logo" [size]="200" aria-label="Rounded branded code"',
          ),
        )}
        ${cell(
          'Dots',
          code(
            'shape="dots" finderShape="circle" color="#7c2d12" finderColor="#c2410c" bgColor="#fff7ed" [icon]="logo" [size]="200" aria-label="Dotted branded code"',
          ),
        )}
      </div>`,
  }),
};

/** A lab. */
export const AppearanceLab: Story = {
  name: 'Appearance lab',
  parameters: about(
    'Change the shapes, the colour, the size and the frame with library controls and watch one code follow.',
  ),
  render: () => ({
    props: {
      shape: signal('rounded'),
      finder: signal('rounded'),
      colour: signal('#1e3a8a'),
      size: signal(176),
      quiet: signal(2),
      bordered: signal(true),
      shapes: ['square', 'rounded', 'dots'],
      finders: ['square', 'rounded', 'circle'],
    },
    template: `
      <div style="${row}">
        <div style="${controls}">
          <andes-segmented aria-label="Module shape" [options]="shapes" [(value)]="shape" />
          <andes-segmented aria-label="Corner shape" [options]="finders" [(value)]="finder" />
          <andes-color-picker aria-label="Module colour" defaultFormat="hex" [(value)]="colour" />
          <span style="${caption}">Size {{ size() }}px</span>
          <andes-slider aria-label="Size" [min]="96" [max]="256" [step]="8" [value]="size()" (valueChange)="size.set($any($event))" />
          <span style="${caption}">Quiet zone {{ quiet() }} modules</span>
          <andes-slider aria-label="Quiet zone" [min]="0" [max]="6" [step]="1" [value]="quiet()" (valueChange)="quiet.set($any($event))" />
          <andes-switch [(checked)]="bordered">Framed</andes-switch>
        </div>
        <andes-qr-code value="${PAY_URL}" [shape]="shape()" [finderShape]="finder()" [color]="colour()" [finderColor]="colour()" [size]="size()" [quietZone]="quiet()" [bordered]="bordered()" aria-label="Styled QR code" />
      </div>`,
  }),
};
