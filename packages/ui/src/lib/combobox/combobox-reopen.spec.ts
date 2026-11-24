import { ANDES_OVERLAY_PANE_CLASS } from '@andes-ng/primitives';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import {
  isClosing,
  withElementGeometry,
  withExitAnimations,
} from '../../testing/overlay-exit';
import { AndesCombobox } from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxEmpty } from './combobox-empty';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry'] as const;

/**
 * The popup is the `<div andesComboboxContent>` the consumer writes inside the combobox,
 * so it belongs to the consumer's view: every open moves the very same element into a
 * new overlay pane. Whatever a close leaves on it is still there the next time.
 */
@Component({
  imports: [
    AndesCombobox,
    AndesComboboxInput,
    AndesComboboxContent,
    AndesComboboxItem,
    AndesComboboxEmpty,
    FormsModule,
  ],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-combobox #comboboxRef [items]="items" [(ngModel)]="value">
      <input andesComboboxInput placeholder="Search fruit" />
      <div andesComboboxContent data-combobox="projected">
        @for (item of comboboxRef.filteredItems(); track item) {
          <div andesComboboxItem [value]="item">{{ item }}</div>
        } @empty {
          <div andesComboboxEmpty>No results found.</div>
        }
      </div>
    </andes-combobox>
  `,
})
class ProjectedComboboxHost {
  readonly items = FRUITS;
  readonly value = signal<string | null>(null);
}

describe('AndesCombobox - opening again after a close', () => {
  withElementGeometry();
  const exits = withExitAnimations();

  let fixture: ComponentFixture<ProjectedComboboxHost>;
  let input: HTMLInputElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectedComboboxHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  afterEach(() => {
    fixture.destroy();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => el.remove());
  });

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    // Deferred focus moves, and the exit animations' `finished` continuations.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  /** The projected popup, if it is currently inside an attached pane. */
  const shownPopup = () =>
    document.querySelector<HTMLElement>(
      `.${ANDES_OVERLAY_PANE_CLASS} [data-combobox="projected"]`,
    );
  const options = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  const paneOf = (popup: HTMLElement) =>
    popup.closest<HTMLElement>(`.${ANDES_OVERLAY_PANE_CLASS}`) as HTMLElement;

  function press(key: 'Escape' | 'ArrowDown') {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'keyCode', {
      get: () => ({ Escape: 27, ArrowDown: 40 })[key],
    });
    input.dispatchEvent(event);
  }

  /** Opens by focusing the input and checks the popup is really there to use. */
  async function open() {
    input.dispatchEvent(new Event('focus'));
    await settle();
    const popup = shownPopup();
    expect(popup).not.toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    // A leftover closing mark replays the exit on the re-opened popup, which leaves it
    // faded out; the overlay's pointer-events override leaves it unable to be clicked.
    expect(isClosing(popup)).toBe(false);
    expect(isClosing(paneOf(popup as HTMLElement))).toBe(false);
    expect(paneOf(popup as HTMLElement).style.pointerEvents).not.toBe('none');
    expect(options()).toHaveLength(FRUITS.length);
    return popup as HTMLElement;
  }

  /** Lets the animated close run to its end and checks the pane detached. */
  async function finishClose() {
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    exits.finishAll();
    await settle();
    expect(shownPopup()).toBeNull();
  }

  const closePaths: readonly {
    readonly name: string;
    readonly close: () => void;
  }[] = [
    { name: 'Escape', close: () => press('Escape') },
    {
      name: 'picking an option',
      close: () =>
        options()[1].dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
        ),
    },
  ];

  for (const { name, close } of closePaths) {
    it(`shows the same popup usable every time after ${name}`, async () => {
      let first: HTMLElement | null = null;
      for (let cycle = 0; cycle < 3; cycle++) {
        const popup = await open();
        // Projected content: every open shows the very same element.
        first ??= popup;
        expect(popup).toBe(first);

        close();
        fixture.detectChanges();
        // The exit really is animated, so the reused element was marked.
        expect(isClosing(popup)).toBe(true);
        await finishClose();
        // Detached, and nothing of the exit is left behind on the reused element.
        expect(isClosing(popup)).toBe(false);
      }
    });
  }

  it('commits the option that is clicked every time it is shown', async () => {
    for (const fruit of ['Apricot', 'Banana', 'Cherry']) {
      await open();
      const option = options().find((o) => o.textContent?.trim() === fruit);
      option?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );
      await settle();
      expect(fixture.componentInstance.value()).toBe(fruit);
      await finishClose();
    }
  });
});
