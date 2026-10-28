import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCountdown } from './countdown';

const inMs = (ms: number) => Date.now() + ms;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const meta: Meta<AndesCountdown> = {
  title: 'Data Display/Countdown',
  component: AndesCountdown,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AndesCountdown, AndesButton] })],
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    format: { control: 'text' },
    mode: { control: 'inline-radio', options: ['down', 'up'] },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    autoStart: { control: 'boolean' },
    interval: { control: 'number' },
  },
  args: {
    title: 'Flash sale ends in',
    format: 'HH:mm:ss',
    mode: 'down',
    size: 'default',
    autoStart: true,
    interval: 1000,
  },
  render: (args) => ({
    props: { ...args, deadline: inMs(2 * HOUR + 15 * 60_000) },
    template: `
      <andes-countdown
        [title]="title"
        [value]="deadline"
        [format]="format"
        [mode]="mode"
        [size]="size"
        [autoStart]="autoStart"
        [interval]="interval"
      />`,
  }),
};

export default meta;

type Story = StoryObj<AndesCountdown>;

export const Default: Story = {};

/**
 * Display formats: days with a clock (`D [days] HH:mm:ss`), days and hours only (`D [d] HH [h]`)
 * and milliseconds (`mm:ss.SSS`). Literal text goes in square brackets.
 */
export const Formats: Story = {
  render: () => ({
    props: {
      quarter: inMs(12 * DAY + 5 * HOUR),
      warranty: inMs(3 * DAY + 7 * HOUR),
      auction: inMs(90_000),
    },
    template: `
      <div style="display:flex; gap: 3rem; flex-wrap: wrap">
        <andes-countdown title="Quarter closes in" [value]="quarter" format="D [days] HH:mm:ss" />
        <andes-countdown title="Warranty ends in" [value]="warranty" format="D [d] HH [h]" />
        <andes-countdown title="Auction closes in" [value]="auction" format="mm:ss.SSS" />
      </div>`,
  }),
};

export const CountUp: Story = {
  render: () => ({
    props: { since: inMs(-(3 * HOUR + 25 * 60_000)) },
    template: `<andes-countdown title="Machine running for" [value]="since" mode="up" format="HH:mm:ss" />`,
  }),
};

/**
 * Appearance. A `suffix` and projected extra text under the value, and the three sizes.
 */
export const Appearance: Story = {
  render: () => ({
    props: { reservation: inMs(45 * 60_000), deadline: inMs(DAY) },
    template: `
      <div style="display:flex; flex-direction: column; gap: 2rem">
        <andes-countdown title="Reservation expires in" [value]="reservation" format="mm:ss" suffix="min">
          Seats are released afterwards
        </andes-countdown>
        <div style="display:flex; gap: 3rem; align-items: flex-end">
          <andes-countdown title="Small" [value]="deadline" size="small" />
          <andes-countdown title="Default" [value]="deadline" />
          <andes-countdown title="Large" [value]="deadline" size="large" />
        </div>
      </div>`,
  }),
};

/**
 * What happens at zero. The first countdown has six seconds left and emits `finish`, which
 * updates the message below it; the second is created already past its deadline and shows zero.
 */
export const Finish: Story = {
  render: () => ({
    props: {
      deadline: inMs(6000),
      expired: inMs(-1000),
      message: 'Waiting...',
      done() {
        (this as { message: string }).message =
          'Finished: the offer has expired.';
      },
    },
    template: `
      <andes-countdown title="Offer ends in" [value]="deadline" format="mm:ss" (finish)="done()" />
      <p style="margin: 1rem 0 2rem; font-size: .875rem">{{ message }}</p>
      <andes-countdown title="Promo ended" [value]="expired" />`,
  }),
};

export const StartAndStop: Story = {
  render: () => ({
    props: { since: Date.now() },
    template: `
      <andes-countdown #timer title="Stopwatch" [value]="since" mode="up" format="mm:ss.S" [autoStart]="false" />
      <div style="display:flex; gap: .5rem; margin-top: 1rem">
        <andes-button size="sm" (click)="timer.start()">Start</andes-button>
        <andes-button size="sm" variant="outline" (click)="timer.stop()">Stop</andes-button>
      </div>
      <p style="font-size: .75rem; margin-top: .5rem">Resuming jumps to the real clock: the target is an absolute moment.</p>`,
  }),
};
