import {
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  type AndesOverlayAlign,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';

import { AndesSelectGroup } from './select-group';
import { AndesSelectItem } from './select-item';
import { AndesSelectLabel } from './select-label';
import { AndesSelectState, matchTriggerWidthAttribute } from './select-state';

/**
 * The panel holding the options: a `role="listbox"` element, plus the loading and empty
 * states next to it (a listbox may only own options and groups).
 *
 * It renders nothing in place: its content is a template the select hands to the overlay
 * primitive when it opens, so the panel ends up in the overlay container (outside this
 * component's DOM subtree) where it cannot be clipped by an ancestor's `overflow`. That
 * is also why the combobox's `aria-controls` and the listbox's `id` are wired explicitly
 * rather than relying on DOM containment.
 *
 * Besides its projected items it renders the select's `options` array, the typed value
 * offered in `tags` mode, and the `tags`-mode values no option carries.
 */
@Component({
  selector: 'andes-select-content',
  imports: [
    AndesOverlayContentPrimitive,
    AndesSelectGroup,
    AndesSelectItem,
    AndesSelectLabel,
    NgTemplateOutlet,
  ],
  templateUrl: './select-content.html',
  styleUrl: './select-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AndesSelectContent {
  protected readonly select = inject(AndesSelectState);
  private readonly overlay = inject(AndesOverlayPrimitive);
  private readonly directionality = inject(Directionality, { optional: true });

  /** Preferred side of the trigger to render on. Flips when it does not fit. Defaults to the select's `placement`. */
  readonly side = input<AndesOverlaySide | undefined>(undefined);
  /** Alignment along that side. Defaults to the select's `placement`. */
  readonly align = input<AndesOverlayAlign | undefined>(undefined);
  /** Gap in px between trigger and panel. */
  readonly sideOffset = input(4);
  /**
   * Panel width: `true` sizes it to the trigger, as a native `<select>` does; `false`
   * sizes it to its own content; a number sets it in px. Defaults to the select's own
   * `matchTriggerWidth`, and to `true` when neither is set.
   */
  readonly matchTriggerWidth = input<boolean | number | undefined, unknown>(
    undefined,
    { transform: matchTriggerWidthAttribute },
  );

  /** @internal The resolved panel width rule. */
  protected readonly widthRule = computed(
    () => this.matchTriggerWidth() ?? this.select.matchTriggerWidth() ?? true,
  );
  protected readonly matchesTrigger = computed(() => this.widthRule() === true);
  protected readonly fixedWidth = computed(() => {
    const rule = this.widthRule();
    return typeof rule === 'number' ? rule : null;
  });

  /** @internal The template `AndesSelect` opens. */
  readonly panelTemplate = viewChild.required(TemplateRef);

  protected readonly notFoundTemplate = computed(() => {
    const content = this.select.notFoundContent();
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly notFoundText = computed(() => {
    const content = this.select.notFoundContent();
    return typeof content === 'string' ? content : '';
  });

  constructor() {
    effect(() => this.applyPositioning());
  }

  /**
   * Hands the panel's positioning to the overlay. `AndesSelect` also calls it right
   * before opening, so a direction it has just measured applies to the first frame.
   *
   * The panel prefers the side from `placement` (below, by default) and flips to the
   * other one when that side lacks room for the whole list; where neither has room, it
   * takes the larger one and is shortened to fit, its options scrolling inside. It
   * follows the field as the page or a container around it scrolls, flipping again as
   * the room changes.
   *
   * `start`/`end` alignment is the field's own: the overlay resolves them against the
   * document direction, so they are swapped for a field laid out the other way round
   * (inside a `dir="rtl"` container on a left-to-right page, say).
   */
  applyPositioning(): void {
    const align = this.align() ?? this.select.placementAlign();
    const fieldRtl = this.select.panelDirection() === 'rtl';
    const overlayRtl = this.directionality?.value === 'rtl';
    this.overlay.configure({
      positioning: {
        kind: 'anchored',
        side: this.side() ?? this.select.placementSide(),
        align: fieldRtl === overlayRtl ? align : MIRRORED_ALIGN[align],
        sideOffset: this.sideOffset(),
        matchAnchorWidth: this.matchesTrigger(),
        // The list belongs above or below its field, never beside it: when neither side
        // has room for all of it, the panel shrinks to the larger one and its options
        // scroll (the `size.minHeight` set by `AndesSelect` lets CDK shrink the pane).
        crossSideFallback: false,
        flexibleDimensions: true,
      },
    });
  }
}

const MIRRORED_ALIGN: Readonly<Record<AndesOverlayAlign, AndesOverlayAlign>> = {
  start: 'end',
  center: 'center',
  end: 'start',
};
