# 10. Controls read their form field through DI

## Status

Proposed

## Context

`AndesFormField` lays out a label, a control, a description and the messages, and derives the field's status from the Angular forms control. Its `andesFormControl` directive wires a native `<input>`, `<textarea>` or `<select>` completely, because its host bindings land on the very element a `<label for>` and assistive technology read.

A library control is different: `<andes-input>` is not a labelable element and keeps its host out of the accessibility tree, and its real element sits inside its own template. A co-located directive cannot feed another component's inputs, so the field reached a library control only through five bindings the consumer wrote by hand (`id`, `aria-describedby`, `aria-invalid`, `aria-labelledby`, `required`), and the form's `size`, `variant` and `disabled` reached no control at all. An audit of 24 controls measured it: none showed the field's error or announced a required field without those bindings, and none took the form's size or variant. The reference form system passes this context to its controls implicitly.

Three options were considered:

1. Keep the manual bindings and document them. Every form repeats five bindings per control, and a forgotten one fails silently.
2. Make `AndesFormControl` a host directive of every control. Consumers who already write `andesFormControl` on a control would match the directive twice, which Angular rejects: a breaking change for every existing form.
3. Let each control read the field and the form through DI and apply them to its own element.

## Decision

Option 3. The contract is one function, `injectAndesFieldBinding()`, called by a control in its injection context. It returns signals for the field's control id, its description and message ids, its label id, its error and warning status and its required state, and for the form's size, variant and disabled. Each control applies them to the element that matters - the native input, the combobox trigger, the `role="slider"` thumb, the group element - merged with its own inputs, which always win:

- `id`: the control's own, else the field's;
- `aria-labelledby`: its own, else the field label, unless an `aria-label` or the control's own text names it;
- `aria-describedby`: its own ids merged with the field's (`andesIdRefs()`, no repeats);
- error: `aria-invalid` where the role supports it, the control's status styling everywhere;
- required: `required` or `aria-required`, or `data-required` where the role has neither;
- `size` and `variant`: inputs default to `undefined`; the value in effect (`resolvedSize()`, `resolvedVariant()`) is the control's own, else the form's, else the control's default. A control maps the form's variant to its own vocabulary and ignores one it does not have;
- `disabled`: also follows the form, so a control bound to nothing (a submit button) is disabled with it.

Inside a field, the binding also registers the control with the field, through `andesFormControl` when it is present and a state of its own when it is not; `AndesFormControl` looks its `NgControl` up lazily so that a control can inject it from its constructor without a circular dependency. Only the field's first registered control (`primaryControl()`) takes the field's id and ARIA. Items of a group control bind the form only (`{ field: false }`), and a composite control hides the field from the controls in its own template with `provideAndesFieldBoundary()`.

`inject(ANDES_FORM_FIELD, { optional: true })` stays public as the status API for custom controls that want more than the binding gives (`status()`, `hasFeedback()`, the ids).

## Consequences

- A library control in a field needs no binding; the manual pattern keeps working, with the field's ids merged rather than duplicated.
- Every control depends on `form-field/field-binding.ts`. Controls on branches not yet merged follow the same checklist; each control has a `*-form-field.spec.ts` built on the shared `itBindsToTheField()` checks.
- `size` and `variant` inputs read `undefined` when unset; code that read them for the value in effect reads `resolvedSize()` / `resolvedVariant()` instead.
- A third-party control does not read the field by itself; it is wired by hand from `andesFormControl`'s signals, which return `undefined` when there is nothing to bind.
- The overlay trigger primitive no longer binds `aria-describedby` outside its `described-by` mode, so it cannot erase the description a control puts on its trigger.

## Sources

- [ADR 0003](0003-css-custom-properties-as-the-styling-contract.md)
- [ADR 0008](0008-own-behavior-primitives-incrementally.md)
- [Angular dependency injection](https://angular.dev/guide/di)
- [WAI-ARIA 1.2: supported states and properties per role](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
