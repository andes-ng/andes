import { ANDES_OVERLAY_PANE_CLASS } from '@andes-ng/primitives';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  isClosing,
  withElementGeometry,
  withExitAnimations,
} from '../../testing/overlay-exit';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { AndesPopconfirm } from './popconfirm';

@Component({
  imports: [AndesPopconfirm, AndesPopconfirmTrigger],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popconfirm
      title="Delete the task"
      (confirmed)="confirmed = confirmed + 1"
    >
      <button type="button" id="trigger" andesPopconfirmTrigger>Delete</button>
    </andes-popconfirm>
  `,
})
class PopconfirmHost {
  confirmed = 0;
}

describe('AndesPopconfirm - the trigger pressed while it is still leaving', () => {
  withElementGeometry();
  const exits = withExitAnimations();

  async function setup() {
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.detectChanges();
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    };
    const trigger = () =>
      fixture.nativeElement.querySelector('#trigger') as HTMLElement;
    const panes = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(`.${ANDES_OVERLAY_PANE_CLASS}`),
      );
    trigger().focus();
    trigger().click();
    await settle();
    expect(panes()).toHaveLength(1);
    return { fixture, settle, trigger, panes, pane: panes()[0] };
  }

  const dismissals: readonly {
    readonly name: string;
    readonly dismiss: () => void;
  }[] = [
    {
      name: 'Escape',
      dismiss: () =>
        document.body.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true,
            cancelable: true,
          }),
        ),
    },
    {
      name: 'a click outside',
      dismiss: () => {
        const outside = document.querySelector('#outside') as HTMLElement;
        outside.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
        );
        outside.click();
      },
    },
  ];

  for (const { name, dismiss } of dismissals) {
    it(`brings the same confirmation back with one click after ${name}`, async () => {
      const { fixture, settle, trigger, panes, pane } = await setup();
      dismiss();
      fixture.detectChanges();
      expect(isClosing(pane)).toBe(true);

      trigger().click();
      await settle();
      expect(panes()).toEqual([pane]);
      expect(isClosing(pane)).toBe(false);
      expect(trigger().getAttribute('aria-expanded')).toBe('true');

      exits.finishAll();
      await settle();
      expect(panes()).toEqual([pane]);
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });
  }
});
