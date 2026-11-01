import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
import {
  type AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  CdkDrag,
  CdkDragHandle,
  type CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSelect } from '../select/select';
import { AndesForm } from './form';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormFieldset } from './form-fieldset';

const moduleMetadata = {
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    AndesForm,
    AndesFormField,
    AndesFormFieldset,
    AndesFormError,
    AndesButton,
    AndesInput,
    AndesInputNumber,
    AndesSelect,
  ],
};

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

/** The look of a dragged row: a faded placeholder and rows that slide out of the way. */
const DRAG_STYLE = `
  <style>
    .demo-row.cdk-drag-placeholder { opacity: 0.35; }
    .demo-row.cdk-drag-animating,
    .demo-list.cdk-drop-list-dragging .demo-row:not(.cdk-drag-placeholder) { transition: transform 200ms cubic-bezier(0, 0, 0.2, 1); }
    .cdk-drag-preview { box-sizing: border-box; border-radius: var(--andes-radius-md); background: var(--andes-color-background); box-shadow: 0 4px 12px rgb(0 0 0 / 20%); }
  </style>
`;

/** These stories take no controls. */
interface ListArgs {
  readonly unused?: never;
}

const meta: Meta<ListArgs> = {
  title: 'Data Entry/Form/Lists',
  parameters: {
    docs: {
      description: {
        component: [
          'Dynamic lists are a plain `FormArray`: a row is a control (or a group) the template adds',
          'with `push()` and drops with `removeAt()`, and `@for ... track control` keeps its state',
          'when the list changes. The form-field parts need nothing else - a row’s field takes its',
          'path (`items.2.name`), and the array’s own errors show with',
          '`<andes-form-error [control]>` or a fieldset.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<ListArgs>;

/** Moves the control at `from` to `to`, keeping its value and state - `moveItemInArray` for a
 *  `FormArray`. */
function moveControl(list: FormArray, from: number, to: number): void {
  if (from === to || to < 0 || to >= list.length) {
    return;
  }
  const control = list.at(from);
  list.removeAt(from, { emitEvent: false });
  list.insert(to, control);
}

/**
 * Nested dynamic lists: a list inside a list. Each team is a group with a name and its own
 * `FormArray` of members, so both levels add and remove rows on their own. A member field's
 * path is `teams.1.members.0.name`; the value keeps the same shape.
 */
export const NestedLists: Story = {
  render: () => {
    const member = (name = '') =>
      new FormGroup({ name: new FormControl(name, Validators.required) });
    const team = (name: string, members: string[]) =>
      new FormGroup({
        name: new FormControl(name, Validators.required),
        members: new FormArray(members.map((m) => member(m))),
      });
    const teams = new FormArray([
      team('Design', ['Ada', 'Grace']),
      team('Platform', ['']),
    ]);
    const form = new FormGroup({ teams });
    const log = signal('');
    return {
      moduleMetadata,
      props: {
        form,
        teams,
        log,
        addTeam: () => teams.push(team('', [''])),
        removeTeam: (index: number) => teams.removeAt(index),
        addMember: (group: FormGroup) =>
          (group.get('members') as FormArray).push(member()),
        removeMember: (group: FormGroup, index: number) =>
          (group.get('members') as FormArray).removeAt(index),
        membersOf: (group: AbstractControl) =>
          (group.get('members') as FormArray).controls,
        onValid: (value: unknown) => log.set(JSON.stringify(value, null, 2)),
      },
      template: `
        <form
          andesForm
          [formGroup]="form"
          (validSubmit)="onValid($event)"
          style="width: min(520px, 100vw - 2rem);"
        >
          <div formArrayName="teams" style="display: flex; flex-direction: column; gap: 1.5rem;">
            @for (team of teams.controls; track team; let i = $index) {
              <div [formGroupName]="i" style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg);">
                <andes-form-field [label]="'Team ' + (i + 1)">
                  <div style="display: flex; gap: 0.5rem;">
                    <andes-input formControlName="name" />
                    <andes-button variant="ghost" size="icon" [aria-label]="'Remove team ' + (i + 1)" (click)="removeTeam(i)">✕</andes-button>
                  </div>
                </andes-form-field>
                <div formArrayName="members" style="display: flex; flex-direction: column; gap: 1rem; padding-inline-start: 1rem;">
                  @for (m of membersOf(team); track m; let j = $index) {
                    <andes-form-field [label]="'Member ' + (j + 1)" [formGroupName]="j">
                      <div style="display: flex; gap: 0.5rem;">
                        <andes-input formControlName="name" />
                        <andes-button variant="ghost" size="icon" [aria-label]="'Remove member ' + (j + 1) + ' of team ' + (i + 1)" (click)="removeMember(team, j)">✕</andes-button>
                      </div>
                    </andes-form-field>
                  }
                  <div><andes-button variant="dashed" size="sm" (click)="addMember(team)">Add member</andes-button></div>
                </div>
              </div>
            }
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <andes-button variant="dashed" (click)="addTeam()">Add team</andes-button>
            <andes-button type="submit">Save</andes-button>
          </div>
          @if (log()) {
            <pre style="${LOG_STYLE}">validSubmit {{ log() }}</pre>
          }
        </form>
      `,
    };
  },
};

/**
 * Drag sorting: rows of a `FormArray` reordered by dragging their handle (CDK drag and drop, the
 * same one the table and the tabs use), or with the arrow buttons for keyboard users - both
 * call the same `move()`, which takes a row's control out and puts it back at the new place.
 * Because the template tracks the control, a row keeps its value, its error and its focus state
 * wherever it lands; the value below follows the order.
 */
export const DragSorting: Story = {
  render: () => {
    const row = (title: string, qty: number) =>
      new FormGroup({
        title: new FormControl(title, Validators.required),
        qty: new FormControl(qty, Validators.min(1)),
      });
    const rows = new FormArray([
      row('Wireframes', 3),
      row('Prototype', 1),
      row('', 2),
      row('Hand-off', 0),
    ]);
    const form = new FormGroup({ rows });
    form.markAllAsTouched();
    return {
      moduleMetadata,
      props: {
        form,
        rows,
        drop: (event: CdkDragDrop<unknown>) =>
          moveControl(rows, event.previousIndex, event.currentIndex),
        move: (from: number, to: number) => moveControl(rows, from, to),
        remove: (index: number) => rows.removeAt(index),
        add: () => rows.push(row('', 1)),
      },
      template: `
        ${DRAG_STYLE}
        <form andesForm [formGroup]="form" style="width: min(560px, 100vw - 2rem);">
          <div formArrayName="rows" class="demo-list" cdkDropList (cdkDropListDropped)="drop($event)" style="display: flex; flex-direction: column; gap: 1rem;">
            @for (control of rows.controls; track control; let i = $index) {
              <div class="demo-row" cdkDrag [formGroupName]="i" style="display: grid; grid-template-columns: auto minmax(0, 1fr) 7rem auto; gap: 0.5rem; align-items: start; padding: 0.5rem; background: var(--andes-color-background);">
                <andes-button variant="ghost" size="icon" cdkDragHandle [aria-label]="'Drag task ' + (i + 1)" style="cursor: grab; margin-block-start: 1.5rem;">⋮⋮</andes-button>
                <andes-form-field [label]="'Task ' + (i + 1)">
                  <andes-input formControlName="title" />
                </andes-form-field>
                <andes-form-field label="Qty" [errorMessages]="{ min: 'At least 1.' }">
                  <andes-input-number formControlName="qty" />
                </andes-form-field>
                <div style="display: flex; margin-block-start: 1.5rem;">
                  <andes-button variant="ghost" size="icon-sm" [aria-label]="'Move task ' + (i + 1) + ' up'" [disabled]="i === 0" (click)="move(i, i - 1)">↑</andes-button>
                  <andes-button variant="ghost" size="icon-sm" [aria-label]="'Move task ' + (i + 1) + ' down'" [disabled]="i === rows.length - 1" (click)="move(i, i + 1)">↓</andes-button>
                  <andes-button variant="ghost" size="icon-sm" [aria-label]="'Remove task ' + (i + 1)" (click)="remove(i)">✕</andes-button>
                </div>
              </div>
            }
          </div>
          <div><andes-button variant="dashed" (click)="add()">Add task</andes-button></div>
          <pre style="${LOG_STYLE}">order = {{ rows.value | json }}</pre>
        </form>
      `,
    };
  },
};

/**
 * A complex dynamic list: order lines. Every line is a fieldset holding a product, a quantity
 * and a price; the line has a rule of its own (a line with a quantity needs a price, shown at
 * the foot of its fieldset), the list has one (at least one line, shown under it) and the total
 * follows every edit. Lines add, remove and keep their state like any `FormArray` row.
 */
export const ComplexList: Story = {
  render: () => {
    const priced = (line: AbstractControl): ValidationErrors | null => {
      const { qty, price } = line.value as { qty: number; price: number };
      return qty > 0 && !(price > 0) ? { unpriced: true } : null;
    };
    const line = (product: string, qty: number, price: number) =>
      new FormGroup(
        {
          product: new FormControl(product, Validators.required),
          qty: new FormControl(qty, [Validators.required, Validators.min(1)]),
          price: new FormControl(price),
        },
        { validators: priced },
      );
    const lines = new FormArray([line('keyboard', 2, 49.9), line('', 1, 0)], {
      validators: Validators.required,
    });
    const form = new FormGroup({ lines });
    const total = signal(0);
    const recount = () =>
      total.set(
        lines.controls.reduce(
          (sum, group) =>
            sum + (group.value.qty ?? 0) * (group.value.price ?? 0),
          0,
        ),
      );
    recount();
    lines.valueChanges.subscribe(recount);
    form.markAllAsTouched();
    return {
      moduleMetadata,
      props: {
        form,
        lines,
        total,
        products: [
          { value: 'keyboard', label: 'Keyboard' },
          { value: 'mouse', label: 'Mouse' },
          { value: 'monitor', label: 'Monitor' },
        ],
        lineTotal: (group: AbstractControl) =>
          (group.value.qty * group.value.price || 0).toFixed(2),
        add: () => lines.push(line('', 1, 0)),
        remove: (index: number) => {
          lines.removeAt(index);
          lines.markAsTouched();
        },
      },
      template: `
        <form andesForm [formGroup]="form" (ngSubmit)="form.markAllAsTouched()" style="width: min(640px, 100vw - 2rem);">
          <div formArrayName="lines" style="display: flex; flex-direction: column; gap: 1.5rem;">
            @for (group of lines.controls; track group; let i = $index) {
              <andes-form-fieldset
                [legend]="'Line ' + (i + 1)"
                [formGroupName]="i"
                [control]="group"
                [errorMessages]="{ unpriced: 'Set a price for this line.' }"
              >
                <div style="display: grid; grid-template-columns: minmax(0, 1fr) 6rem 8rem auto; gap: 0.75rem; align-items: start;">
                  <andes-form-field label="Product">
                    <andes-select formControlName="product" [options]="products" placeholder="Choose" />
                  </andes-form-field>
                  <andes-form-field label="Qty" [errorMessages]="{ min: 'At least 1.' }">
                    <andes-input-number formControlName="qty" [min]="0" />
                  </andes-form-field>
                  <andes-form-field label="Price" [extra]="'Line: ' + lineTotal(group)">
                    <andes-input-number formControlName="price" [min]="0" [precision]="2" />
                  </andes-form-field>
                  <andes-button variant="ghost" size="icon" [aria-label]="'Remove line ' + (i + 1)" (click)="remove(i)" style="margin-block-start: 1.75rem;">✕</andes-button>
                </div>
              </andes-form-fieldset>
            }
          </div>
          <andes-form-error [control]="lines" [errorMessages]="{ required: 'Add at least one line.' }" />
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <andes-button variant="dashed" (click)="add()">Add line</andes-button>
            <andes-button type="submit">Place order</andes-button>
            <strong style="margin-inline-start: auto; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">Total {{ total().toFixed(2) }}</strong>
          </div>
        </form>
      `,
    };
  },
};
