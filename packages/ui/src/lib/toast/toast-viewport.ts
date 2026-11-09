import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  untracked,
  viewChildren,
} from '@angular/core';

import { AndesMessageService } from './message.service';
import { AndesToastRegion } from './toast-region';
import { AndesToastService } from './toast.service';
import {
  ANDES_TOAST_DEFAULT_STACK_PEEK,
  type AndesToast,
  type AndesToastPosition,
} from './toast.types';

const PLACEMENTS: readonly AndesToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/** Whether `event` is the chord `hotkey` describes - `'Alt+T'`, `'Ctrl+Shift+N'`, `'Meta+/'`... */
function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .toLowerCase()
    .split('+')
    .map((part) => part.trim());
  const key = parts.pop();
  const has = (...names: string[]) =>
    parts.some((part) => names.includes(part));
  // `code` first: with Alt held, macOS reports `key` as a special character instead of "t".
  const keyMatches =
    !!key &&
    (event.code.toLowerCase() === `key${key}` ||
      event.code.toLowerCase() === key ||
      event.key.toLowerCase() === key);
  return (
    keyMatches &&
    event.altKey === has('alt', 'option') &&
    event.ctrlKey === has('ctrl', 'control') &&
    event.shiftKey === has('shift') &&
    event.metaKey === has('meta', 'cmd', 'command')
  );
}

/**
 * Mount this once, e.g. near the root of an app (`app.html`), to render both toast flavors:
 * the notifications `AndesToastService` manages (one fixed stack per placement in use) and
 * the compact messages `AndesMessageService` manages (always top-center). Fixed-position,
 * always-visible, and deliberately *not* built on `AndesOverlayPrimitive` - see the
 * ADR-style note below.
 *
 * ```html
 * <!-- app.html, once -->
 * <router-outlet />
 * <andes-toast-viewport position="bottom-right" />
 * ```
 *
 * ```ts
 * // anywhere else
 * private readonly toasts = inject(AndesToastService);
 * this.toasts.success('Changes saved.');
 * inject(AndesMessageService).success('Copied.');
 * ```
 *
 * Rendering requires this explicit mount point, which keeps toasts inside the app's own
 * component tree (SSR-safe, no `ApplicationRef` side-attachment) - the same
 * trade-off `<router-outlet>` makes. Pass `container` to have the viewport move itself into
 * another element (a shadow root's host, a micro-frontend's mount node) - it still covers the
 * whole screen.
 *
 * Keyboard: the `hotkey` (default `Alt+T`) moves focus to the newest toast, which expands a
 * deck and holds every countdown until focus leaves; Escape dismisses the focused toast and
 * hands focus back to where it was.
 *
 * ## Why not `AndesOverlayPrimitive`
 *
 * The shared overlay primitive is built around one `OverlayRef` per component instance,
 * opened by a trigger and closed with focus restored to it - the shape Dialog, Popover and
 * Dropdown Menu all share. A toast stack doesn't fit that shape on any axis that matters:
 *
 * - It renders an arbitrary-length, independently-timed *list* of items, not one
 *   open/closed piece of content - there's no single `TemplateRef`/`ComponentType` to hand
 *   `open()`, and reusing the primitive would mean one `AndesOverlayPrimitive` (and one CDK
 *   `OverlayRef`, focus trap, scroll strategy) per toast, torn down and recreated constantly.
 * - It must never trap focus, show a backdrop, or lock page scroll - a toast is
 *   non-modal by definition, so most of what the primitive exists to manage
 *   (`ConfigurableFocusTrap`, backdrop styling, `disposeOnNavigation`) is dead weight here.
 * - There's no anchor to position against; the viewport just sits in a fixed corner.
 *   `position: fixed` escapes normal document flow on its own (mounting this deep in an
 *   app's component tree doesn't change where it renders on screen, aside from the same
 *   `transform`-on-an-ancestor caveat any `position: fixed` element has) - CDK's overlay
 *   container buys nothing over that for this shape.
 *
 * `--andes-z-index-toast` still comes from the same token scale the primitive's
 * `AndesOverlayLayer`s use, so a toast still stacks correctly above dialogs/popovers/etc.
 * without either side hard-coding a number.
 */
@Component({
  selector: 'andes-toast-viewport',
  imports: [AndesToastRegion],
  templateUrl: './toast-viewport.html',
  styleUrl: './toast-viewport.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-toast-viewport',
    '[attr.data-position]': 'defaultPlacement()',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class AndesToastViewport {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  protected readonly toastService = inject(AndesToastService);
  protected readonly messageService = inject(AndesMessageService);

  private readonly regionList = viewChildren(AndesToastRegion);
  /** Where focus was when the hotkey pulled it into a toast. */
  private returnFocusTo: HTMLElement | null = null;

  /**
   * Where notifications without their own `placement` go. Default: the global `placement`
   * from `provideAndesToastConfig()` (built-in `'bottom-right'`).
   */
  readonly position = input<AndesToastPosition | undefined>(undefined);

  /**
   * Chord that focuses the newest toast, e.g. `'Alt+T'` or `'Ctrl+Shift+N'`. `false` turns it
   * off. Default `'Alt+T'`.
   */
  readonly hotkey = input<string | false>('Alt+T');

  /**
   * An element (or a selector for one) the viewport moves itself into, so toasts render inside
   * it rather than where the viewport is declared. The toasts are still fixed to the screen.
   */
  readonly container = input<HTMLElement | string | null>(null);

  protected readonly defaultPeek = ANDES_TOAST_DEFAULT_STACK_PEEK;

  protected readonly defaultPlacement = computed(
    () => this.position() ?? this.toastService.defaults().placement,
  );

  /** Visible notifications grouped by resolved placement. */
  private readonly groups = computed(() => {
    const fallback = this.defaultPlacement();
    const groups = new Map<AndesToastPosition, AndesToast[]>();
    for (const toast of this.toastService.visibleToasts()) {
      const placement = toast.placement ?? fallback;
      const group = groups.get(placement);
      if (group) {
        group.push(toast);
      } else {
        groups.set(placement, [toast]);
      }
    }
    return groups;
  });

  /**
   * Every placement that has shown a toast so far. A region stays mounted (empty, and
   * invisible) after its last toast closes: tearing it down at that moment would cut that
   * toast's exit animation off.
   */
  private readonly usedPlacements = linkedSignal<
    ReadonlyMap<AndesToastPosition, AndesToast[]>,
    ReadonlySet<AndesToastPosition>
  >({
    source: this.groups,
    computation: (groups, previous) => {
      const used = previous?.value ?? new Set<AndesToastPosition>();
      return [...groups.keys()].every((placement) => used.has(placement))
        ? used
        : new Set([...used, ...groups.keys()]);
    },
  });

  /** One entry per used placement, in a stable placement order. */
  protected readonly regions = computed(() => {
    const groups = this.groups();
    const used = this.usedPlacements();
    return PLACEMENTS.filter((placement) => used.has(placement)).map(
      (placement) => ({ placement, toasts: groups.get(placement) ?? [] }),
    );
  });

  protected readonly toastConfig = this.toastService.defaults;
  protected readonly messageConfig = this.messageService.defaults;
  protected readonly messages = this.messageService.visibleToasts;

  constructor() {
    effect(() => {
      const container = this.container();
      untracked(() => {
        const target =
          typeof container === 'string'
            ? this.document.querySelector<HTMLElement>(container)
            : container;
        const host = this.host.nativeElement;
        if (target && host.parentElement !== target) {
          target.appendChild(host);
        }
      });
    });
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const hotkey = this.hotkey();
    if (!hotkey || event.defaultPrevented || !matchesHotkey(event, hotkey)) {
      return;
    }
    // The newest toast of the first region holding any: notifications, then messages.
    const regions = this.regionList().filter((region) => region.hasToasts());
    const active = this.document.activeElement;
    for (const region of regions) {
      if (region.focusFront()) {
        event.preventDefault();
        if (
          active instanceof HTMLElement &&
          !this.host.nativeElement.contains(active)
        ) {
          this.returnFocusTo = active;
        }
        return;
      }
    }
  }

  protected onEscaped(): void {
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target?.isConnected) {
      target.focus();
    }
  }

  /** Same as `usedPlacements`, for the message region. */
  protected readonly messagesUsed = linkedSignal<boolean, boolean>({
    source: () => this.messages().length > 0,
    computation: (hasMessages, previous) =>
      hasMessages || (previous?.value ?? false),
  });
}
