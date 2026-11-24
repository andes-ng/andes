# 8. Own behavior primitives incrementally in `@andes-ng/primitives`

## Status

Accepted

## Context

ADR 0004 accepted a third-party headless behavior package as an implementation dependency of `@andes-ng/ui`, while naming "an isolated behavior package" or "copy-owned primitives under their original license attribution" as fallback options if its cost ever became unacceptable — not a hard fork of a full third-party repository.

Building the first component (`AndesButton`) raised the question directly. The most widely used headless primitives are React-only and not usable from Angular at all, so they were never a real alternative. The Angular option was itself built on Angular CDK (nearly every non-trivial primitive imports `@angular/cdk`), adding ergonomics on top. A full, from-scratch fork of its 35+ primitives was scoped and rejected: it would take months, and take on the ongoing accessibility-maintenance burden of every primitive we forked, most of which nothing in Andes uses yet.

The one primitive `AndesButton` actually depended on is small: a single directive (~20 lines) reflecting `disabled`/`data-disabled`/`tabindex` and preventing navigation on a disabled anchor (native `<a>` has no `disabled` attribute). Small enough to write as Andes's own original implementation, not a copy of anyone's file, using the public Angular API (`HOST_TAG_NAME`).

## Decision

Introduce `@andes-ng/primitives`: Andes-owned, unstyled, accessible Angular directives, replacing third-party primitives one at a time as each is small enough to own outright. `AndesButtonPrimitive` is the first, replacing the third-party button directive for `AndesButton`. The third-party package is removed from `@andes-ng/ui`'s dependencies now that nothing in it uses it.

This is not a fork: primitives here are Andes's own implementation of a documented behavior contract, not copies of third-party source, so no attribution is owed for them. A future primitive complex enough that copying an upstream file is the sane choice would need that attribution, per ADR 0004's own terms — this ADR doesn't change that.

A third-party behavior package remains an option for any future component whose behavior is too complex to justify writing in-house yet (for example, `Combobox` or `Dialog`, which lean on Angular CDK overlay/focus-trap machinery that would take real time to get right). ADR 0004's adapter boundary — consumers only ever program against Andes APIs — already made this swap possible without a public breaking change, which is why this decision costs nothing to defer piece by piece rather than pay for all at once.

## Consequences

- `@andes-ng/ui`'s dependency graph drops the third-party behavior package, `tailwindcss` and `tw-animate-css` entirely — the peer-dependency install overhead ADR 0004 flagged as accepted-but-visible is gone for good, not just for Button.
- Each future component picks its primitive source case by case: write our own in `@andes-ng/primitives` when the behavior is small and well-understood (most form controls); reach for a third-party package when it isn't (overlay-based components, complex keyboard/focus graphs) — ADR 0004's adapter pattern still applies whichever is chosen.
- `@andes-ng/primitives` carries its own accessibility-correctness burden for whatever it contains. Each primitive added here needs real keyboard and screen-reader testing — not just an implementation that visually behaves right.
- `AndesButtonPrimitive` is an implementation dependency of `@andes-ng/ui`, on the same terms a third-party package would be: never re-exported, never a public Andes API.

## Sources

- [ADR 0004](0004-third-party-primitives-behind-andes-adapters.md)
- [Angular `HOST_TAG_NAME`](https://angular.dev/api/core/HOST_TAG_NAME)
