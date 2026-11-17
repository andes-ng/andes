## 0.3.0 (2026-11-15)

### 🚀 Features

- Upgrade `andes-button` and `andes-button-group`. ([1044bf94f](https://github.com/andes-ng/andes/commit/1044bf94f))

  Press feedback: while pressed a button scales a little (`--andes-button-press-scale`, 0.98 by default; above 1 it grows) with a short ease (`--andes-button-press-duration`, `--andes-button-press-ease`). Disabled and loading buttons, link-style buttons and users who prefer reduced motion get none, and the new `pressScale` input turns it off. The new `elevation` input (`low`, `medium`, `high`) raises a floating button on the shadow tokens.

  Async and focus: `clickAction` runs on the click and keeps the button loading until the promise it returns settles (rejections go to `ErrorHandler`), `interruptible` keeps it clickable meanwhile so only the newest action ends the loading state, and `focusableWhenDisabled` keeps a disabled or loading button in the tab order with `aria-disabled` while clicks stay blocked. A loading button announces `loadingLabel` through a polite status region, an icon-only button without an accessible name warns in development, and `focus()` moves focus to the real button. Form and link attributes: `form`, `name`, `value` and `rel`.

  `andes-button-group` gains `disabled` (every button at once), `elevation` (the joined buttons share one shadow) and `roving` (one tab stop, arrow keys along the orientation, Home and End, right-to-left aware). The button stories are regrouped by topic, and the button primitive gains `focusable` and `tabStop` inputs.

- An anchored overlay reports the side of its anchor it was actually placed on, after any flip: `AndesOverlayPrimitive.placedSide()` and a `data-placed-side` attribute on the pane and its direct children, so a panel can grow out of the edge that touches its trigger. ([fcd58b1e7](https://github.com/andes-ng/andes/commit/fcd58b1e7))
- Let an anchored overlay shrink to the room beside its anchor with `flexibleDimensions`, so a list that fits neither above nor below scrolls inside the pane instead of covering its field. ([cddc4140c](https://github.com/andes-ng/andes/commit/cddc4140c))
- AndesCombobox uses the shared control scale (32px md input, 14px text, 32px options, 8px panel with a slide-up entrance, border plus ring focus on every variant) and its popup no longer opens beside the input; the overlay primitive gains `crossSideFallback` and `flexibleDimensions` positioning options. ([c80379d5c](https://github.com/andes-ng/andes/commit/c80379d5c))
- AndesSelect uses a denser look (32px md trigger, 14px text, 24px tags, 32px options, 8px panel with a slide-up entrance) and its panel no longer opens beside the field; the overlay primitive gains `crossSideFallback` and `flexibleDimensions` positioning options. ([291edbbd5](https://github.com/andes-ng/andes/commit/291edbbd5))

### 🩹 Fixes

- Keep the `left` and `right` sides of an anchored overlay on the physical side that was asked for in a right-to-left layout, instead of letting them swap with the CDK's `start` and `end` and overlap the anchor. ([bdd06c590](https://github.com/andes-ng/andes/commit/bdd06c590))
- Overlay: a click on the page's root element, which is all there is below a body shorter than the window, now closes an overlay that closes on outside clicks. The CDK only listens on `body`, so such clicks used to leave it open. ([6f1b71f5e](https://github.com/andes-ng/andes/commit/6f1b71f5e))
- An anchored overlay (a select or picker panel, a menu, a popover, a tooltip) whose anchor has scrolled out of view, past the top or bottom of the viewport or out of a scrolling container, now scrolls away with it on the side it was on, instead of being pushed into the viewport and pinned to its edge over unrelated content. While the anchor is at least partly visible it still flips, shrinks to the room and shifts into view as before, and near the left or right edge it keeps its horizontal place as it leaves. It does not close: when the anchor scrolls back the overlay is next to it again, with focus and ARIA state untouched. ([0719a0ea4](https://github.com/andes-ng/andes/commit/0719a0ea4))
- `andesOverlayTrigger` no longer clears an `aria-describedby` the component binds on the trigger (a hint or an error message): it only adds the overlay's id in `described-by` mode while open, keeping the trigger's own ids, and takes it out on close. ([2184cb959](https://github.com/andes-ng/andes/commit/2184cb959))
- An overlay opened from inside another overlay (a select, combobox or menu list opened in a dialog or a drawer) now stacks above the overlay it was opened from, whatever its own layer, instead of being drawn behind it. ([628426fef](https://github.com/andes-ng/andes/commit/628426fef))
- An anchored overlay that re-positions on scroll now also follows its anchor while an element containing the anchor scrolls (an `overflow: auto` container, a dialog body), not only the document, so it no longer stays behind and covers other content. ([dadcc5274](https://github.com/andes-ng/andes/commit/dadcc5274))
- Fix overlays whose content is projected from the consumer's view (Dropdown Menu, Dropdown Button) opening invisible after the first animated close: the `data-andes-closing` attribute is now removed from every element it was set on when the pane detaches, not only when a close is cancelled, so content reused by the next pane no longer replays the exit animation. ([eeb6625b5](https://github.com/andes-ng/andes/commit/eeb6625b5))

### ❤️ Thank You

- Gutierrez Soto Jhosepmyr Orlando @jhosepmyr

## 0.2.0 (2026-10-19)

### 🩹 Fixes

- Rewrite the package pages shown on npm (README of ui, primitives and testing) and add the repository, homepage, bugs and keywords fields to the four package manifests. ([a2b91719](https://github.com/andes-ng/andes/commit/a2b91719))

### ❤️ Thank You

- Gutierrez Soto Jhosepmyr Orlando @jhosepmyr

## 0.1.0 (2026-10-18)

### 🚀 Features

- Add AndesTreeNavigation, the shared keyboard model for hierarchical widgets: visible-node ordering that skips collapsed subtrees (from items or from a node source, so windowed trees work), the active node, controlled or uncontrolled expanded keys, the TreeView keys with RTL mirroring and typeahead across levels, roving-tabindex and active-descendant focus, and per-item aria-level, aria-posinset, aria-setsize and aria-expanded signals. ([2b8b5583](https://github.com/andes-ng/andes/commit/2b8b5583))
- Add the shared form-control base: a value accessor that updates a component's value signal and notifies Angular forms once per real change, never echoes form writes back, merges the `disabled` input with the form's disabled state, and exposes the bound control's validity as signals for reactive forms, template-driven forms and signal forms. ([dd702106](https://github.com/andes-ng/andes/commit/dd702106))
- Add `AndesSelectionModel`, a signal-based single/multiple selection with a maximum, per-item locking, key-based identity, `{added, removed}` change reporting, shift-click ranges and the tri-state select-all summary, plus `AndesCheckedTree`, hierarchical checked and half-checked state with parent/child propagation (or none in strict mode) over thousands of nodes. ([9021c47f](https://github.com/andes-ng/andes/commit/9021c47f))
- Add AndesChoiceGroup and AndesChoiceItem, the shared single/multiple-selection primitive behind radio groups, segmented controls, tabs, toggle-button groups and listbox pickers - roving-tabindex arrow navigation with selection that follows focus or waits for Space/Enter, RTL, wrap, disabled items, and a configurable ARIA role mapping (radiogroup, tablist, toolbar/group, listbox). ([7381d9a9](https://github.com/andes-ng/andes/commit/7381d9a9))
- Add viewport primitives: `andesElementSize` and `andesContainerBreakpoint` (element and container-width signals on one shared, frame-coalesced `ResizeObserver`), `andesMediaQuery` with reduced-motion, dark and contrast helpers, and an `AndesBreakpoints` service with `active`, `up`, `down` and `between` signals. All are server-safe and clean up with their injector. ([cbeaf2dc](https://github.com/andes-ng/andes/commit/cbeaf2dc))
- Anchored overlays gain a `crossSideFallback` positioning option (default `true`): turned off, an overlay that fits neither on its preferred side nor the opposite one stays on that axis and is shifted into view, instead of moving to one of the perpendicular sides. ([f738f898](https://github.com/andes-ng/andes/commit/f738f898))
- Add AndesListNavigation, the shared roving-tabindex / aria-activedescendant list-navigation primitive (arrow keys in either orientation, Home/End, configurable wrap, typeahead, disabled-item skipping), plus the AndesListNavigationItem and AndesListNavigationKeys directives - wrapping Angular CDK's own ListKeyManager family. ([928f98a2](https://github.com/andes-ng/andes/commit/928f98a2))
- Add a shared overlay behavior primitive (`AndesOverlayPrimitive` plus trigger/content/close directives) that Dialog, Drawer/Sheet, Popover, Tooltip and Dropdown Menu build on: portal rendering, anchored/centered/edge positioning with collision handling, optional focus trap and focus restoration, independently toggleable Escape and click-outside dismissal, scroll lock, and z-index/scrim wired to the `--andes-z-index-*` and `--andes-color-overlay` tokens. Closing supports exit animations: the pane, its direct element children and any backdrop get a `data-andes-closing` attribute (exported as `ANDES_OVERLAY_CLOSING_ATTRIBUTE`) and stop receiving pointer events, and the overlay detaches once the animations that attribute starts have finished, at most 300ms later (`ANDES_OVERLAY_EXIT_TIMEOUT_MS`); without an exit animation, under reduced motion or without animation support the close stays synchronous. `isOpen()` turns false immediately, focus restoration (skipped if the user moved focus elsewhere on the page during the exit) and `closed` follow the detach, and re-opening during the exit cancels it on the same pane. ([552eb31a](https://github.com/andes-ng/andes/commit/552eb31a))
- First release: AndesButtonPrimitive, Andes-owned button behavior (disabled state, anchor click prevention), owned by Andes and used by AndesButton. ([4e71f27c](https://github.com/andes-ng/andes/commit/4e71f27c))

### 🩹 Fixes

- Make overlays already open beneath a modal overlay (an outer dialog, a drawer) inert while it is open, so only the topmost modal is reachable by assistive tech and the keyboard. ([e7aeedb1](https://github.com/andes-ng/andes/commit/e7aeedb1))
- Set aria-disabled on the disabled link-form button (anchors have no native disabled state) and aria-busy on it while loading, so screen readers announce both. ([407c49cc](https://github.com/andes-ng/andes/commit/407c49cc))

### ❤️ Thank You

- Gutierrez Soto Jhosepmyr Orlando @jhosepmyr
