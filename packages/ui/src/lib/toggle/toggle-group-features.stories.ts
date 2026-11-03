import { JsonPipe } from '@angular/common';
import { BidiModule } from '@angular/cdk/bidi';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesToggle } from './toggle';
import { AndesToggleGroup } from './toggle-group';

const meta: Meta<AndesToggleGroup> = {
  title: 'Data Entry/Toggle/Group/Features',
  component: AndesToggleGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesToggleGroup>;

const caption =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground); margin: 0 0 0.375rem;';
const column =
  'display: flex; flex-direction: column; gap: 1.25rem; align-items: flex-start;';
const text =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem;';
const btn = 'font: inherit; font-size: 0.875rem;';
const gap = 'margin-inline-start: 0.75rem;';

/**
 * `(selectionChange)` reports every user change as `{ value, added?, removed? }` (never a
 * programmatic write); `[(value)]` keeps working. `focus()` / `blur()` and `(focused)` /
 * `(blurred)` treat the group as one control, and `loop` (default on) decides whether the
 * arrows wrap: try the second group, where they stop at the ends, and Home / End in both.
 */
export const GroupEvents: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, JsonPipe, BidiModule] },
    props: {
      singleValue: 'left',
      multiValue: ['bold'] as string[],
      lastChange: null as unknown,
      focusLog: 'not focused',
    },
    template: `
      <div style="${column}">
        <div>
          <p style="${caption}">single</p>
          <andes-toggle-group aria-label="Alignment" variant="outline" [(value)]="singleValue" (selectionChange)="lastChange = $event">
            <andes-toggle value="left">Left</andes-toggle>
            <andes-toggle value="center">Center</andes-toggle>
            <andes-toggle value="right">Right</andes-toggle>
          </andes-toggle-group>
        </div>
        <div>
          <p style="${caption}">multiple, no loop, with focus API</p>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-toggle-group #api aria-label="Format" type="multiple" variant="outline" [loop]="false" [(value)]="multiValue" (selectionChange)="lastChange = $event" (focused)="focusLog = 'focused'" (blurred)="focusLog = 'blurred'">
              <andes-toggle value="bold">Bold</andes-toggle>
              <andes-toggle value="italic">Italic</andes-toggle>
              <andes-toggle value="underline">Underline</andes-toggle>
            </andes-toggle-group>
            <button type="button" (click)="api.focus()" style="${btn}">focus()</button>
            <button type="button" (click)="api.blur()" style="${btn}">blur()</button>
            <span style="${text}">Group: {{ focusLog }}</span>
          </div>
        </div>
        <div dir="rtl">
          <p style="${caption}">Right-to-left: the arrows mirror, Home is the first toggle</p>
          <andes-toggle-group aria-label="RTL format" type="multiple" variant="outline" [loop]="false" [value]="['b']">
            <andes-toggle value="a">أ</andes-toggle>
            <andes-toggle value="b">ب</andes-toggle>
            <andes-toggle value="c">ت</andes-toggle>
          </andes-toggle-group>
        </div>
        <pre style="${text} margin: 0;">selectionChange: {{ lastChange | json }}
singleValue: {{ singleValue | json }}  multiValue: {{ multiValue | json }}</pre>
      </div>
    `,
  }),
};

/**
 * `required` on a single group: the pressed toggle cannot be released and, under Angular forms,
 * the control is invalid while empty (`data-required` marks the group; `aria-required` is not
 * allowed on its `group` role). `name` posts one hidden input per pressed value, so a native
 * form submits the selection.
 */
export const RequiredAndForm: Story = {
  name: 'Required and form (name)',
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, JsonPipe, ReactiveFormsModule] },
    props: {
      sizeControl: new FormControl<string | null>(null),
      extrasControl: new FormControl<string[]>(['gift']),
      submitted: 'nothing yet',
      readForm: (event: Event): string =>
        Array.from(
          new FormData(event.target as HTMLFormElement).entries(),
          ([field, value]) => field + '=' + String(value),
        ).join('&') || 'nothing',
    },
    template: `
      <form style="${column}" (submit)="$event.preventDefault(); submitted = readForm($event)">
        <div>
          <p style="${caption}">Size (required, single): starts empty, then cannot be emptied</p>
          <andes-toggle-group aria-label="Size" required name="size" variant="outline" [formControl]="sizeControl">
            <andes-toggle value="s">S</andes-toggle>
            <andes-toggle value="m">M</andes-toggle>
            <andes-toggle value="l">L</andes-toggle>
          </andes-toggle-group>
          <span style="${text} ${gap}">errors: {{ sizeControl.errors | json }}</span>
        </div>
        <div>
          <p style="${caption}">Extras (multiple, name="extras")</p>
          <andes-toggle-group aria-label="Extras" type="multiple" name="extras" variant="outline" [formControl]="extrasControl">
            <andes-toggle value="gift">Gift wrap</andes-toggle>
            <andes-toggle value="express">Express</andes-toggle>
            <andes-toggle value="insure">Insurance</andes-toggle>
          </andes-toggle-group>
        </div>
        <button type="submit" style="${btn}">Submit native form</button>
        <span style="${text}">Posted: {{ submitted }}</span>
      </form>
    `,
  }),
};

/**
 * `maxCount` disables the unpressed toggles once the limit is reached (until one is released)
 * and `(limitReached)` fires with `{ limit, count, value }`; `minCount` refuses to release below
 * the minimum. They mirror CheckboxGroup.
 */
export const Limits: Story = {
  name: 'Limits (min/max)',
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: [AndesToggle] },
    props: {
      upToTwo: ['Ham'] as string[],
      atLeastOne: ['Peppers'] as string[],
      between: ['Ham', 'Onion'] as string[],
      lastLimit: 'none yet',
    },
    template: `
      <div style="${column}">
        <div>
          <p style="${caption}">At most 2</p>
          <andes-toggle-group aria-label="Toppings, at most 2" type="multiple" variant="outline" [spacing]="8" [maxCount]="2" [(value)]="upToTwo" (limitReached)="lastLimit = $event.limit + ' ' + $event.count + ' ' + $event.value.join('+')">
            <andes-toggle value="Ham">Ham</andes-toggle>
            <andes-toggle value="Olives">Olives</andes-toggle>
            <andes-toggle value="Peppers">Peppers</andes-toggle>
            <andes-toggle value="Onion">Onion</andes-toggle>
          </andes-toggle-group>
          <span style="${text} ${gap}">{{ upToTwo.join(', ') || 'none' }}</span>
        </div>
        <div>
          <p style="${caption}">At least 1</p>
          <andes-toggle-group aria-label="Toppings, at least 1" type="multiple" variant="outline" [minCount]="1" [(value)]="atLeastOne" (limitReached)="lastLimit = $event.limit + ' ' + $event.count + ' ' + $event.value.join('+')">
            <andes-toggle value="Ham">Ham</andes-toggle>
            <andes-toggle value="Olives">Olives</andes-toggle>
            <andes-toggle value="Peppers">Peppers</andes-toggle>
            <andes-toggle value="Onion">Onion</andes-toggle>
          </andes-toggle-group>
          <span style="${text} ${gap}">{{ atLeastOne.join(', ') || 'none' }}</span>
        </div>
        <div>
          <p style="${caption}">Between 1 and 3 (joined)</p>
          <andes-toggle-group aria-label="Toppings, 1 to 3" type="multiple" variant="outline" [minCount]="1" [maxCount]="3" [(value)]="between" (limitReached)="lastLimit = $event.limit + ' ' + $event.count + ' ' + $event.value.join('+')">
            <andes-toggle value="Ham">Ham</andes-toggle>
            <andes-toggle value="Olives">Olives</andes-toggle>
            <andes-toggle value="Peppers">Peppers</andes-toggle>
            <andes-toggle value="Onion">Onion</andes-toggle>
            <andes-toggle value="Mushrooms">Mushrooms</andes-toggle>
          </andes-toggle-group>
          <span style="${text} ${gap}">{{ between.join(', ') || 'none' }}</span>
        </div>
        <span style="${text}">Last limitReached: {{ lastLimit }}</span>
      </div>
    `,
  }),
};
