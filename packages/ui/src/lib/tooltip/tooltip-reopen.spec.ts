import { ANDES_OVERLAY_PANE_CLASS } from '@andes-ng/primitives';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  isClosing,
  withElementGeometry,
  withExitAnimations,
} from '../../testing/overlay-exit';
import { AndesTooltip } from './tooltip';
import { ANDES_TOOLTIP_HOVERABLE_GRACE } from './tooltip-hover-intent';
import { AndesTooltipTrigger } from './tooltip-trigger';

@Component({
  imports: [AndesTooltip, AndesTooltipTrigger],
  template: `
    <andes-tooltip
      content="Hint"
      [(open)]="open"
      (openChangeDetail)="changes.push($event.source + ':' + $event.open)"
    >
      <button type="button" id="trigger" andesTooltipTrigger>Hover me</button>
    </andes-tooltip>
  `,
})
class TooltipHost {
  readonly open = signal(false);
  readonly changes: string[] = [];
}

describe('AndesTooltip - hovering back while it fades out', () => {
  withElementGeometry();
  const exits = withExitAnimations();

  afterEach(() => vi.useRealTimers());

  function setup() {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '#trigger',
    ) as HTMLElement;
    const pointer = (type: 'pointerenter' | 'pointerleave') =>
      trigger.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse' }));
    const panes = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(`.${ANDES_OVERLAY_PANE_CLASS}`),
      );
    /** Hovers for as long as the default open delay asks. */
    const hover = () => {
      pointer('pointerenter');
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();
    };
    /** Leaves and waits out the grace: the exit animation is now running. */
    const leave = () => {
      pointer('pointerleave');
      vi.advanceTimersByTime(ANDES_TOOLTIP_HOVERABLE_GRACE);
      fixture.detectChanges();
    };
    return { fixture, pointer, panes, hover, leave };
  }

  it('brings the same tooltip back at once instead of waiting out the open delay', () => {
    const { fixture, pointer, panes, hover, leave } = setup();
    hover();
    const pane = panes()[0];
    expect(pane).toBeTruthy();

    leave();
    expect(isClosing(pane)).toBe(true);

    pointer('pointerenter');
    fixture.detectChanges();

    expect(panes()).toEqual([pane]);
    expect(isClosing(pane)).toBe(false);
    expect(pane.style.pointerEvents).not.toBe('none');
  });

  it('keeps it when the cancelled exit animation and its cap run out', () => {
    const { fixture, panes, pointer, hover, leave } = setup();
    hover();
    const pane = panes()[0];
    leave();
    pointer('pointerenter');

    exits.finishAll();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(panes()).toEqual([pane]);
    expect(isClosing(pane)).toBe(false);
  });

  it('still opens a tooltip that has finished leaving after the open delay', () => {
    const { fixture, panes, pointer, hover, leave } = setup();
    hover();
    leave();
    exits.finishAll();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(panes()).toHaveLength(0);

    pointer('pointerenter');
    fixture.detectChanges();
    expect(panes()).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(panes()).toHaveLength(1);
  });

  it('does not report the undone close as the reason it closes later', () => {
    const { fixture, panes, pointer, hover, leave } = setup();
    hover();
    leave();
    pointer('pointerenter');
    fixture.detectChanges();
    expect(panes()).toHaveLength(1);

    fixture.componentInstance.changes.length = 0;
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
    exits.finishAll();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(panes()).toHaveLength(0);
    expect(fixture.componentInstance.changes).toHaveLength(1);
    expect(fixture.componentInstance.changes[0]).not.toContain('hover');
  });
});
