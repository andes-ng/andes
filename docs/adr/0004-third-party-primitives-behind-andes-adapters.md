# 4. Keep third-party behavior primitives behind Andes adapters

## Status

Accepted with constraint — partially superseded by [ADR 0008](0008-own-behavior-primitives-incrementally.md) for components small enough to own outright; this ADR's adapter boundary and evaluation criteria still apply whenever a third-party behavior package is used.

## Context

A third-party headless package can provide accessible Angular behavior, and Andes should benefit from such primitives without exposing their selectors, types or inputs as its public API. Evaluating one candidate package showed a cost that matters here: it declared Angular CDK, Angular packages, RxJS, `clsx`, Tailwind CSS 4 and `tw-animate-css` as peers. `ng-packagr` does not inline a normal dependency, and `allowedNonPeerDependencies` only permits packaging; it does not bundle the dependency.

## Decision

A behavior package, if adopted, is declared as an implementation dependency of `@andes-ng/ui`. Components import only its narrow secondary entry points, wrap the primitives in Andes components/directives, and export only Andes names from `packages/ui/src/index.ts`.

Do not import a third-party styling preset or copied styles. Andes visual CSS remains authored locally against `@andes-ng/tokens`. To make installation deterministic across package managers, the package's non-Angular required peers are direct implementation dependencies; Angular CDK, Angular and RxJS remain peers to avoid duplicate framework runtimes.

Every upgrade of such a package requires compatibility, accessibility and bundle regression tests. If its peer graph makes the install cost unacceptable, the replacement options are an upstream peer split, an isolated behavior package or copy-owned primitives under their original license attribution — not a hard fork of a full third-party repository.

## Current state

The first component, `AndesButton`, did not end up using a third-party package: its one primitive was small enough to own outright, per [ADR 0008](0008-own-behavior-primitives-incrementally.md). No third-party behavior package and none of its Tailwind-related peers are declared in `packages/ui/package.json`. This ADR's decision — treat such a package as an implementation dependency, never re-export it, evaluate the peer-graph cost honestly — remains the standard to apply the day a component needs behavior complex enough to reach for one.

## Consequences

- Consumers program only against Andes APIs, so the behavior layer can be upgraded or replaced internally.
- Tailwind configuration and generated CSS are not required by consumers.
- Whenever a component does depend on a package that declares Tailwind-related peers, they reappear in the installation graph. That cost must not be misrepresented as complete dependency independence.
- `allowedNonPeerDependencies` documents intentional packaging exceptions but provides no bundling or isolation.
- Direct imports of a third-party behavior package outside `packages/ui` are prohibited by convention and review.

## Sources

- [ng-packagr dependency guidance](https://github.com/ng-packagr/ng-packagr/blob/main/docs/dependencies.md)
- [Angular Package Format](https://angular.dev/tools/libraries/angular-package-format)
