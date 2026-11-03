import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { AndesTooltip, AndesTooltipTrigger } from '../tooltip';
import { ANDES_FORM_FIELD, ANDES_FORM_LABEL } from './form-field-tokens';
import { AndesFormIcon } from './form-icons';

/**
 * Label for the control inside an `AndesFormField`. Renders a real `<label for="...">`
 * associated to the control via native HTML semantics, using the id the enclosing
 * `AndesFormField` generated - no manual id coordination required.
 *
 * The `<label>` also carries an id of its own (`AndesFormField.labelId()`), exposed as the
 * field's `labelledBy()`. A control whose focusable element is not labelable (a `role="slider"`
 * thumb, a `role="radiogroup"`) is named through `aria-labelledby` with it, since `for`/`id`
 * cannot reach it. It is registered with the field through `ANDES_FORM_LABEL` so the field only
 * advertises that id when a label was actually authored.
 *
 * Decorations, all resolved by the enclosing field (and its `AndesForm`):
 * - required mark - a leading `*` (a trailing one with `requiredMarkPosition="end"`),
 *   `aria-hidden` because `aria-required` on the control
 *   already says it to assistive technology; or, with `requiredMark="optional"`, a visible
 *   "(optional)" suffix on the fields that are NOT required; or a custom template after the
 *   label text, given whether the field is required.
 * - `tooltip` - a question-circle button after the `<label>` that shows the library's
 *   `AndesTooltip` (dark bubble with an arrow, above the button) on hover or focus, dismissed
 *   with Escape; the tooltip describes the button through `aria-describedby` while it is
 *   open, and `tooltipLabel` is the button's accessible name. It sits *outside* the `<label>`
 *   so its accessible name never gets folded into the control's.
 * - colon - `horizontal` layout only, `aria-hidden`.
 *
 * Clicking the label focuses the control. A control that opens a popup (a select or color
 * picker trigger, a combobox: anything with `aria-haspopup`) is only focused, not opened, as a
 * native `<select>` behaves; a checkbox or switch still toggles, as a native checkbox does.
 *
 * Renders as a plain, unassociated `<label>` when used outside an `AndesFormField` (`for` and
 * `id` are simply omitted, and there are no decorations).
 */
@Component({
  selector: 'andes-form-label',
  imports: [NgTemplateOutlet, AndesTooltip, AndesTooltipTrigger, AndesFormIcon],
  template: `<label
      class="andes-form-label"
      [attr.id]="field?.labelId() ?? null"
      [attr.for]="field?.labelFor() ?? null"
    >
      @if (
        field?.showRequiredMark() &&
        field.resolvedRequiredMarkPosition() !== 'end'
      ) {
        <span class="andes-form-label__required" aria-hidden="true">*</span>
      }
      <ng-content />
      @if (
        field?.showRequiredMark() &&
        field.resolvedRequiredMarkPosition() === 'end'
      ) {
        <span
          class="andes-form-label__required andes-form-label__required--end"
          aria-hidden="true"
          >*</span
        >
      }
      @if (field?.showOptionalMark()) {
        <span class="andes-form-label__optional">{{
          field.optionalText()
        }}</span>
      }
      @if (field?.requiredMarkTemplate(); as markTemplate) {
        <ng-container
          [ngTemplateOutlet]="markTemplate"
          [ngTemplateOutletContext]="{
            $implicit: field.isRequired(),
            required: field.isRequired(),
          }"
        />
      }
    </label>
    @if (field?.tooltip(); as tip) {
      <andes-tooltip
        class="andes-form-label__tooltip"
        [content]="tip"
        variant="inverse"
        side="top"
        [openDelay]="100"
      >
        <button
          type="button"
          andesTooltipTrigger
          class="andes-form-label__tooltip-trigger"
          [attr.aria-label]="field.tooltipLabel()"
        >
          <andes-form-icon name="help" />
        </button>
      </andes-tooltip>
    }
    @if (field?.showColon()) {
      <span class="andes-form-label__colon" aria-hidden="true">:</span>
    }`,
  styleUrl: './form-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `.andes-form-label` lives in this component's template but the stylesheet is owned by
  // `AndesFormField`; see the header comment in form-field.css for why the shared sheet is
  // unscoped rather than split per part.
  encapsulation: ViewEncapsulation.None,
  // On the host rather than the <label>: a label is not focusable, the keyboard reaches the
  // control directly, so this only ever handles a pointer click bubbling up from the label.
  host: { '(click)': 'onLabelClick($event)' },
  providers: [
    {
      provide: ANDES_FORM_LABEL,
      useExisting: forwardRef(() => AndesFormLabel),
    },
  ],
})
export class AndesFormLabel {
  protected readonly field = inject(ANDES_FORM_FIELD, { optional: true });
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected onLabelClick(event: MouseEvent): void {
    if (!(event.target as Element | null)?.closest?.('label')) {
      return;
    }
    const id = this.field?.labelFor();
    const root = this.element.getRootNode() as Document | ShadowRoot;
    const target = id ? root.getElementById?.(id) : null;
    const popup = target?.getAttribute('aria-haspopup');
    if (target && popup && popup !== 'false') {
      // The label's default action would click the control, opening its popup.
      event.preventDefault();
      target.focus();
    }
  }
}
