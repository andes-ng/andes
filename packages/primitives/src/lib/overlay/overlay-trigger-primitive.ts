import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
} from '@angular/core';

import { AndesOverlayPrimitive } from './overlay-primitive';

/**
 * How a trigger advertises its overlay to assistive tech.
 *
 * - `expanded` — `aria-haspopup` + `aria-expanded` + `aria-controls`. Correct for
 *   Dialog, Drawer, Popover and Dropdown Menu, where the trigger opens something
 *   the user then interacts with.
 * - `described-by` — `aria-describedby` pointing at the overlay. Correct for
 *   Tooltip: the overlay describes the trigger, it is not a thing you open.
 * - `none` — the consumer wires its own ARIA.
 */
export type AndesOverlayAriaAttachment = 'expanded' | 'described-by' | 'none';

/**
 * Marks an element as an overlay's trigger. Registers it as the positioning anchor
 * and as the element focus returns to on close, and keeps its ARIA state in sync.
 *
 * In `described-by` mode it adds the overlay's id to the trigger's `aria-describedby` while
 * open and takes it out again on close, keeping any id the trigger was already described by.
 * In the other modes it never touches `aria-describedby`, which stays the component's own
 * (a hint or an error message the trigger's field points it at).
 *
 * It intentionally does *not* bind a click handler: whether the overlay opens on
 * click, hover, focus or context menu is the consuming component's decision (and
 * differs across Dialog, Popover, Tooltip and Dropdown Menu). Call
 * `trigger.overlay.toggle(template)` from wherever that decision is made.
 */
@Directive({
  selector: '[andesOverlayTrigger]',
  exportAs: 'andesOverlayTrigger',
  host: {
    '[attr.aria-haspopup]': 'ariaHasPopup()',
    '[attr.aria-expanded]': 'ariaExpanded()',
    '[attr.aria-controls]': 'ariaControls()',
    '[attr.data-state]': 'overlay.isOpen() ? "open" : "closed"',
  },
})
export class AndesOverlayTriggerPrimitive {
  /** The overlay this trigger belongs to. */
  readonly overlay = inject(AndesOverlayPrimitive);

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Which ARIA relationship to expose. Defaults to `expanded`. */
  readonly ariaAttachment = input<AndesOverlayAriaAttachment>('expanded');

  protected readonly ariaHasPopup = computed(() => {
    if (this.ariaAttachment() !== 'expanded') {
      return undefined;
    }
    const role = this.overlay.config().role;
    switch (role) {
      // `aria-haspopup="alertdialog"` is not a valid token; `dialog` is.
      case 'alertdialog':
        return 'dialog';
      case 'dialog':
      case 'menu':
      case 'listbox':
        return role;
      default:
        return undefined;
    }
  });

  protected readonly ariaExpanded = computed(() =>
    this.ariaAttachment() === 'expanded'
      ? String(this.overlay.isOpen())
      : undefined,
  );

  protected readonly ariaControls = computed(() =>
    this.ariaAttachment() === 'expanded' && this.overlay.isOpen()
      ? this.overlay.contentId
      : undefined,
  );

  protected readonly ariaDescribedBy = computed(() =>
    this.ariaAttachment() === 'described-by' && this.overlay.isOpen()
      ? this.overlay.contentId
      : undefined,
  );

  constructor() {
    this.overlay.registerAnchor(this.elementRef);
    // Not a host binding: one would clear an `aria-describedby` the component binds on the
    // same element in every mode, since the last write of the attribute wins.
    let added: string | undefined;
    effect(() => {
      const id = this.ariaDescribedBy();
      untracked(() => {
        const element = this.elementRef.nativeElement;
        const ids = (element.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter((token) => token !== '' && token !== added);
        if (id) {
          ids.push(id);
        }
        added = id;
        if (ids.length > 0) {
          element.setAttribute('aria-describedby', ids.join(' '));
        } else if (element.hasAttribute('aria-describedby')) {
          element.removeAttribute('aria-describedby');
        }
      });
    });
  }
}
