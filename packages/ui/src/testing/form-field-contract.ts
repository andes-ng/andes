import type { WritableSignal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import type { AbstractControl } from '@angular/forms';

/**
 * Shared checks of the control-field contract (`injectAndesFieldBinding()`), run by every
 * control's `*-form-field.spec.ts` against a host shaped like:
 *
 * ```html
 * <form andesForm [formGroup]="group" size="lg" variant="filled" [disabled]="disabled()">
 *   <andes-form-field label="Label">
 *     <andes-<control> formControlName="value" />
 *     <andes-form-description>Hint</andes-form-description>
 *   </andes-form-field>
 * </form>
 * ```
 *
 * with a required validator on `value` and no `andesFormControl` on the control: the control
 * must register with the field and wire itself. Internal to the specs, never published.
 */
export interface FieldContractHost {
  readonly disabled: WritableSignal<boolean>;
  readonly group: { readonly controls: { readonly value: AbstractControl } };
}

export interface FieldContractOptions {
  /** The element that takes the field's id, inside the control host. */
  readonly idTarget: string;
  /** Whether a `<label for>` can reach it (`label.control`); `false` for a `role="group"`,
   *  `role="radiogroup"` or `role="slider"` element, named through `aria-labelledby`. */
  readonly labelable: boolean;
  /** The element named by `aria-labelledby` and described by `aria-describedby`; defaults to
   *  `idTarget`. */
  readonly ariaTarget?: string;
  /** Where the error shows: an element that takes `aria-invalid="true"`, or - for roles that
   *  have no `aria-invalid` - a check of the error status on the control. */
  readonly invalid: string | ((control: HTMLElement) => boolean);
  /** Whether the control announces that it is required. */
  readonly required: (control: HTMLElement) => boolean;
  /** The size the control renders at (`'sm'`, `'md'`, `'lg'`). */
  readonly size: (control: HTMLElement) => string | null;
  /** The variant the control renders, when it shares the form's vocabulary. */
  readonly variant?: (control: HTMLElement) => string | null;
  /** Whether the control is disabled. */
  readonly disabled: (control: HTMLElement) => boolean;
  /** Focuses and leaves the control, so it is touched. */
  readonly touch: (control: HTMLElement) => void;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function ids(element: Element | null, attribute: string): string[] {
  return (element?.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
}

/**
 * Declares the contract's `it` blocks for one control. `create` builds the host; `control`
 * picks the control's host element out of it.
 */
export function itBindsToTheField<T extends FieldContractHost>(
  create: () => ComponentFixture<T>,
  control: string,
  options: FieldContractOptions,
): void {
  async function setup() {
    const fixture = create();
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const host = root.querySelector(control) as HTMLElement;
    const pick = (selector: string): HTMLElement | null =>
      host.matches(selector) ? host : host.querySelector(selector);
    return {
      fixture,
      root,
      host,
      label: root.querySelector('label.andes-form-label') as HTMLLabelElement,
      field: root.querySelector('.andes-form-field') as HTMLElement,
      idTarget: pick(options.idTarget),
      ariaTarget: pick(options.ariaTarget ?? options.idTarget),
    };
  }

  it('takes the field id, and is named by the field label', async () => {
    const { host, label, idTarget, ariaTarget } = await setup();

    expect(idTarget).not.toBeNull();
    expect(idTarget?.id).toBe(label.htmlFor);
    expect(document.querySelectorAll(`[id="${label.htmlFor}"]`)).toHaveLength(
      1,
    );
    if (options.labelable) {
      expect(label.control && host.contains(label.control)).toBe(true);
    }
    expect(ids(ariaTarget, 'aria-labelledby')).toContain(label.id);
  });

  it('is described by the field hint, then by the error message too', async () => {
    const { fixture, host, field, ariaTarget } = await setup();
    const hint = field.querySelector('.andes-form-description') as HTMLElement;

    expect(ids(ariaTarget, 'aria-describedby')).toContain(hint.id);

    options.touch(host);
    await settle(fixture);
    const help = field.querySelector('.andes-form-field__help') as HTMLElement;

    expect(help).not.toBeNull();
    expect(ids(ariaTarget, 'aria-describedby')).toEqual(
      expect.arrayContaining([hint.id, help.id]),
    );
  });

  it('registers with the field and shows its error once touched', async () => {
    const { fixture, host, field } = await setup();
    const invalid = () =>
      typeof options.invalid === 'string'
        ? (host.matches(options.invalid)
            ? host
            : host.querySelector(options.invalid)
          )?.getAttribute('aria-invalid') === 'true'
        : options.invalid(host);

    expect(field.querySelector('.andes-form-label__required')).not.toBeNull();
    expect(invalid()).toBe(false);

    options.touch(host);
    await settle(fixture);

    expect(fixture.componentInstance.group.controls.value.touched).toBe(true);
    expect(field.dataset['status']).toBe('error');
    expect(invalid()).toBe(true);
  });

  it('announces that it is required', async () => {
    const { host } = await setup();

    expect(options.required(host)).toBe(true);
  });

  it('takes the size and variant of the form', async () => {
    const { host } = await setup();

    expect(options.size(host)).toBe('lg');
    if (options.variant) {
      expect(options.variant(host)).toBe('filled');
    }
  });

  it('is disabled with the form, and enabled again', async () => {
    const { fixture, host } = await setup();

    expect(options.disabled(host)).toBe(false);

    fixture.componentInstance.disabled.set(true);
    await settle(fixture);

    expect(options.disabled(host)).toBe(true);

    fixture.componentInstance.disabled.set(false);
    await settle(fixture);

    expect(options.disabled(host)).toBe(false);
  });
}

/** Focus then blur, on the element the user would tab into. */
export function touchFirst(selector: string): (control: HTMLElement) => void {
  return (control) => {
    const target = (
      control.matches(selector) ? control : control.querySelector(selector)
    ) as HTMLElement;
    target.dispatchEvent(new FocusEvent('focus'));
    target.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    target.dispatchEvent(new FocusEvent('blur'));
    target.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  };
}
