# @andes-ng/ui

Accessible Angular components for the Andes NG design system: standalone, signal-based, `OnPush`, styled only through CSS custom properties.

## Install

```bash
npm install @andes-ng/ui @andes-ng/tokens @ng-icons/core @ng-icons/lucide
```

Peer dependencies: Angular 22 (`@angular/core`, `common`, `forms`, `cdk`), RxJS 7, and `@ng-icons/core` with `@ng-icons/lucide` 36.

The components draw no icons of their own: every glyph (chevrons, checks, the clear "x", status marks, file and folder icons) is a [lucide](https://lucide.dev) icon rendered through `ng-icon`. Each component registers the icons it uses, so there is nothing to set up; the icon packages are peer dependencies, never bundled, so the application shares one copy with its own `ng-icon` usage.

## Use

Load the tokens once in the application's global stylesheet, then import the components you need:

```css
@import '@andes-ng/tokens/fonts.css'; /* optional: Geist */
@import '@andes-ng/tokens/theme.css';
```

```ts
import { Component } from '@angular/core';
import { AndesButton } from '@andes-ng/ui';

@Component({
  selector: 'app-save',
  imports: [AndesButton],
  template: `<andes-button variant="primary">Save</andes-button>`,
})
export class Save {}
```

Dark mode is on when `data-andes-theme="dark"` is set on `<html>` or any ancestor.

## Components

The package exports every component from its single entry point, `@andes-ng/ui`. This release ships `AndesButton` (variants, colors, shapes, the 24 / 32 / 40px sizes, loading state, and `AndesButtonGroup`). New components are added in each release; see the changelog for what changed, and browse every component, state and variant in the [Storybook](https://andes-ng.github.io/andes/).

Components follow the WAI-ARIA authoring practices, support right-to-left layouts and honor `prefers-reduced-motion`.

## Related packages

- [`@andes-ng/tokens`](https://www.npmjs.com/package/@andes-ng/tokens): design tokens as CSS custom properties.
- [`@andes-ng/primitives`](https://www.npmjs.com/package/@andes-ng/primitives): the behavior directives the components are built on.
- [`@andes-ng/testing`](https://www.npmjs.com/package/@andes-ng/testing): helpers for testing applications that use Andes NG.

## License

MIT
