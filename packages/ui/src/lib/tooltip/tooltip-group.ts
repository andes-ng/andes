import { Injectable } from '@angular/core';

/** A tooltip that takes part in a group's "one at a time" handoff. */
export interface AndesTooltipGroupMember {
  /** Closes the tooltip at once, without its exit motion. */
  dismiss(): void;
}

/**
 * Root-scoped so the "instant reopen" grouping window is shared across every
 * independent `<andes-tooltip>` on the page, not only siblings under one
 * parent - e.g. tabbing across a toolbar of icon buttons, each wrapped in its
 * own `<andes-tooltip>`, should feel like one continuous interaction once the
 * first tooltip has opened rather than re-paying the open delay for each one.
 *
 * Needs no provider component wrapped around the app: a single
 * `providedIn: 'root'` service gives every tooltip the same shared clock for
 * free. An `andesTooltipProvider` (or `provideAndesTooltipConfig`) gives the
 * tooltips below it a group of their own.
 *
 * The group also remembers which tooltip is showing and where, so that with `unique`
 * the next one can take over from it: the old one is dismissed on the spot and the new
 * one glides in from where the old one stood.
 */
@Injectable({ providedIn: 'root' })
export class AndesTooltipGroup {
  private lastClosedAt = -Infinity;
  private lastRect: DOMRect | null = null;
  private active: {
    member: AndesTooltipGroupMember;
    rect: DOMRect | null;
  } | null = null;

  /** Whether some tooltip in the group closed within the last `withinMs`. */
  wasRecentlyClosed(withinMs: number): boolean {
    return Date.now() - this.lastClosedAt <= withinMs;
  }

  /** Records that a tooltip in the group just closed, starting the window. */
  notifyClosed(): void {
    this.lastClosedAt = Date.now();
  }

  /** Whether some tooltip in the group is showing. */
  hasOpen(): boolean {
    return this.active !== null;
  }

  /**
   * Makes `member` the group's one showing tooltip. A different tooltip still
   * showing is dismissed. Returns where the previous tooltip stood - the one just
   * dismissed, or one that closed within `withinMs` - so the new one can start
   * there, or `null` when there is nothing to glide from.
   */
  claim(member: AndesTooltipGroupMember, withinMs: number): DOMRect | null {
    const previous = this.active;
    let from: DOMRect | null = null;
    if (previous && previous.member !== member) {
      from = previous.rect;
      this.active = { member, rect: null };
      previous.member.dismiss();
    } else if (!previous && this.wasRecentlyClosed(withinMs)) {
      from = this.lastRect;
    }
    this.active = { member, rect: null };
    return from;
  }

  /** Remembers where `member`'s tooltip currently stands. */
  update(member: AndesTooltipGroupMember, rect: DOMRect): void {
    if (this.active?.member === member) {
      this.active.rect = rect;
    }
  }

  /** `member`'s tooltip is gone; what the group knows of it becomes the last position. */
  release(member: AndesTooltipGroupMember): void {
    if (this.active?.member === member) {
      this.lastRect = this.active.rect;
      this.active = null;
    }
  }
}
