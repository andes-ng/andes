import { ANDES_OVERLAY_PANE_CLASS } from '@andes-ng/primitives';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  isClosing,
  withElementGeometry,
  withExitAnimations,
} from '../../testing/overlay-exit';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverClose } from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';

/**
 * The panel is the composed `<andes-popover-content>` the consumer writes inside the
 * popover, so it belongs to the consumer's view: every open moves the very same element
 * into a new overlay pane. Whatever a close leaves on it is still there the next time.
 */
@Component({
  imports: [
    AndesPopover,
    AndesPopoverTrigger,
    AndesPopoverContent,
    AndesPopoverClose,
  ],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popover>
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
      <andes-popover-content data-popover="projected">
        <button
          type="button"
          id="action"
          (click)="actions.update((n) => n + 1)"
        >
          Action
        </button>
        <button type="button" id="done" andesPopoverClose>Done</button>
      </andes-popover-content>
    </andes-popover>
  `,
})
class ProjectedPopoverHost {
  readonly actions = signal(0);
}

describe('AndesPopover - opening again after a close', () => {
  withElementGeometry();
  const exits = withExitAnimations();

  let fixture: ComponentFixture<ProjectedPopoverHost>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectedPopoverHost);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    // Deferred focus moves, and the exit animations' `finished` continuations.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  const byId = (id: string) =>
    document.querySelector<HTMLElement>(`#${id}`) as HTMLElement;
  /** The projected panel, if it is currently inside an attached pane. */
  const shownPanel = () =>
    document.querySelector<HTMLElement>(
      `.${ANDES_OVERLAY_PANE_CLASS} [data-popover="projected"]`,
    );
  const paneOf = (panel: HTMLElement) =>
    panel.closest<HTMLElement>(`.${ANDES_OVERLAY_PANE_CLASS}`) as HTMLElement;

  function pressEscape() {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function clickOn(element: Element) {
    element.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
    );
    (element as HTMLElement).click();
  }

  /** Opens through the trigger and checks the panel is really there to use. */
  async function open() {
    byId('trigger').click();
    await settle();
    const panel = shownPanel();
    expect(panel).not.toBeNull();
    expect(byId('trigger').getAttribute('aria-expanded')).toBe('true');
    // A leftover closing mark replays the exit on the re-opened panel, which leaves it
    // faded out; the overlay's pointer-events override leaves it unable to be clicked.
    expect(isClosing(panel)).toBe(false);
    expect(isClosing(paneOf(panel as HTMLElement))).toBe(false);
    expect(paneOf(panel as HTMLElement).style.pointerEvents).not.toBe('none');
    return panel as HTMLElement;
  }

  /** Lets the animated close run to its end and checks the pane detached. */
  async function finishClose() {
    fixture.detectChanges();
    expect(byId('trigger').getAttribute('aria-expanded')).toBe('false');
    exits.finishAll();
    await settle();
    expect(shownPanel()).toBeNull();
  }

  const closePaths: readonly {
    readonly name: string;
    readonly close: () => void;
  }[] = [
    { name: 'an outside click', close: () => clickOn(byId('outside')) },
    { name: 'Escape', close: pressEscape },
    { name: 'clicking the trigger', close: () => byId('trigger').click() },
    { name: 'its close part', close: () => byId('done').click() },
  ];

  for (const { name, close } of closePaths) {
    it(`shows the same panel usable every time after ${name}`, async () => {
      let first: HTMLElement | null = null;
      for (let cycle = 0; cycle < 3; cycle++) {
        const panel = await open();
        // Projected content: every open shows the very same element.
        first ??= panel;
        expect(panel).toBe(first);

        close();
        fixture.detectChanges();
        // The exit really is animated, so the reused element was marked.
        expect(isClosing(panel)).toBe(true);
        await finishClose();
        // Detached, and nothing of the exit is left behind on the reused element.
        expect(isClosing(panel)).toBe(false);
      }
    });
  }

  it('reacts to a click on its content every time it is shown', async () => {
    for (let cycle = 1; cycle <= 3; cycle++) {
      await open();
      byId('action').click();
      expect(fixture.componentInstance.actions()).toBe(cycle);

      pressEscape();
      await finishClose();
    }
  });

  it('measures where it grows from again every time it is shown', async () => {
    let triggerLeft = 300;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const box =
          this.id === 'trigger'
            ? { left: triggerLeft, top: 100, width: 100, height: 30 }
            : this.classList.contains(ANDES_OVERLAY_PANE_CLASS)
              ? { left: 200, top: 138, width: 240, height: 80 }
              : { left: 0, top: 0, width: 0, height: 0 };
        return {
          ...box,
          x: box.left,
          y: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          toJSON: () => ({}),
        } as DOMRect;
      },
    );
    const originOf = (panel: HTMLElement) =>
      panel
        .querySelector<HTMLElement>('.andes-popover-content')
        ?.style.getPropertyValue('--andes-popover-origin');

    // Trigger centre 350 - panel left 200.
    const first = await open();
    expect(originOf(first)).toBe('150px');
    pressEscape();
    await finishClose();

    // The trigger has moved while the panel was closed.
    triggerLeft = 340;
    const second = await open();
    expect(second).toBe(first);
    expect(originOf(second)).toBe('190px');
  });
});
