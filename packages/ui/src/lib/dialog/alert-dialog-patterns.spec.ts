import type { AndesOverlayCloseReason } from '@andes-ng/primitives';
import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';

import { AndesButton } from '../button/button';
import { declaredValue } from '../../testing/computed-style';
import {
  ANDES_ALERT_DIALOG_IMPORTS,
  AndesAlertDialog,
  type AndesAlertDialogInitialFocus,
  type AndesAlertDialogTone,
} from './alert-dialog';
import { matchesConfirmPhrase } from './alert-dialog-confirm-phrase';
import type { AndesAlertDialogImpactItem } from './alert-dialog-impact';
import { ANDES_DIALOG_STATUS_GLYPHS } from './dialog-status-glyph';
import { AndesDialogService } from './dialog.service';

/**
 * jsdom reports zero geometry for every element, which makes CDK's
 * `InteractivityChecker` treat them all as invisible and therefore untabbable.
 * Giving elements a nominal size is the only way to exercise real focus-trap
 * behavior here; it says nothing about the components themselves.
 */
function withElementGeometry() {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );

  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });

  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

function click(element: Element, detail = 1) {
  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, detail }),
  );
}

function press(
  element: Element,
  type: 'keydown' | 'keyup',
  key: string,
  repeat = false,
) {
  const event = new KeyboardEvent(type, {
    key,
    repeat,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  return event;
}

function pointer(element: Element, type: string) {
  element.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0 }),
  );
}

function pressEscape() {
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    }),
  );
}

const surface = () =>
  document.querySelector('[data-slot="alert-dialog-content"]') as HTMLElement;
const inDialog = (selector: string) =>
  surface()?.querySelector(selector) as HTMLElement;
const live = () =>
  surface()?.querySelector('[data-slot="alert-dialog-live"]') as HTMLElement;
const requirements = () =>
  surface()?.querySelector(
    '[data-slot="alert-dialog-requirements"]',
  ) as HTMLElement;

async function openDialog(
  fixture: ComponentFixture<{ open: { set(value: boolean): void } }>,
) {
  fixture.componentInstance.open.set(true);
  fixture.detectChanges();
  await fixture.whenStable();
  await flush();
  fixture.detectChanges();
}

/** Types into the phrase field the way a keyboard does. */
function type(text: string) {
  const field = inDialog('input') as HTMLInputElement;
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('matchesConfirmPhrase', () => {
  it('compares exactly by default, ignoring surrounding whitespace', () => {
    expect(matchesConfirmPhrase('acme-web', 'acme-web')).toBe(true);
    expect(matchesConfirmPhrase('  acme-web\n', 'acme-web')).toBe(true);
    expect(matchesConfirmPhrase('Acme-Web', 'acme-web')).toBe(false);
    expect(matchesConfirmPhrase('acme', 'acme-web')).toBe(false);
  });

  it('can be case-insensitive and whitespace-strict', () => {
    expect(matchesConfirmPhrase('DELETE', 'delete', { ignoreCase: true })).toBe(
      true,
    );
    expect(matchesConfirmPhrase(' delete', 'delete', { trim: false })).toBe(
      false,
    );
  });

  it('treats a composed and a decomposed accent as the same text', () => {
    expect(matchesConfirmPhrase('café', 'café')).toBe(true);
  });

  it('never matches an empty phrase', () => {
    expect(matchesConfirmPhrase('', '')).toBe(false);
    expect(matchesConfirmPhrase('  ', '   ')).toBe(false);
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog
      [(open)]="open"
      [tone]="tone()"
      [initialFocus]="initialFocus()"
      [destroyOnClose]="destroyOnClose()"
      (closed)="reasons.push($event)"
      (cancelled)="cancelled = cancelled + 1"
    >
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <andes-alert-dialog-icon />
          <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
          <p andesAlertDialogDescription>This cannot be undone.</p>
        </div>

        <andes-alert-dialog-confirm-phrase
          phrase="acme-web"
          [ignoreCase]="ignoreCase()"
          [blockPaste]="blockPaste()"
        />

        <div andesAlertDialogFooter>
          <button type="button" id="cancel" andesAlertDialogCancel>
            Cancel
          </button>
          <button
            type="button"
            id="action"
            andesAlertDialogAction
            (click)="confirmed = confirmed + 1"
          >
            Delete
          </button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class PhraseHost {
  readonly dialog = viewChild.required(AndesAlertDialog);
  readonly open = signal(false);
  readonly tone = signal<AndesAlertDialogTone | null>(null);
  readonly initialFocus = signal<AndesAlertDialogInitialFocus | null>(null);
  readonly destroyOnClose = signal(true);
  readonly ignoreCase = signal(false);
  readonly blockPaste = signal(false);
  readonly reasons: AndesOverlayCloseReason[] = [];
  cancelled = 0;
  confirmed = 0;
}

describe('type-to-confirm', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(PhraseHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  it('keeps the action unavailable but focusable until the phrase is typed', async () => {
    await setup();
    const action = inDialog('#action');

    expect(action.getAttribute('aria-disabled')).toBe('true');
    expect(action.hasAttribute('disabled')).toBe(false);
    expect(action.hasAttribute('data-disabled')).toBe(true);
    expect(action.getAttribute('aria-describedby')).toBe(requirements().id);
    expect(requirements().textContent).toBe('Type acme-web to confirm.');
  });

  it('shows the phrase in a chip under a label tied to the field', async () => {
    await setup();
    const label = inDialog('.andes-alert-dialog__phrase-label');
    const chip = inDialog('.andes-alert-dialog__phrase');

    expect(chip.tagName).toBe('CODE');
    expect(chip.textContent).toBe('acme-web');
    expect(label.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Type acme-web to confirm.',
    );
    expect(label.getAttribute('for')).toBe(inDialog('input').id);
  });

  it('refuses an early click: nothing closes, nothing runs, and it says why', async () => {
    const { fixture, host } = await setup();
    const action = inDialog('#action');

    click(action);
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
    expect(surface()).not.toBeNull();
    expect(action.hasAttribute('data-shake')).toBe(true);
    expect(live().textContent).toBe('Type acme-web to confirm.');
  });

  it('unlocks the action once the phrase matches, and confirming closes the dialog', async () => {
    const { fixture, host } = await setup();

    type('acme-web');
    fixture.detectChanges();
    const action = inDialog('#action');
    expect(action.hasAttribute('aria-disabled')).toBe(false);
    expect(action.hasAttribute('data-disabled')).toBe(false);
    expect(action.hasAttribute('aria-describedby')).toBe(false);

    click(action);
    fixture.detectChanges();

    expect(host.confirmed).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
    expect(host.cancelled).toBe(0);
    expect(host.open()).toBe(false);
  });

  it('locks the action again when the text stops matching', async () => {
    const { fixture } = await setup();

    type('acme-web');
    fixture.detectChanges();
    type('acme-we');
    fixture.detectChanges();

    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');
  });

  it('is case-sensitive unless told otherwise', async () => {
    const { fixture, host } = await setup();

    type('ACME-WEB');
    fixture.detectChanges();
    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');

    host.ignoreCase.set(true);
    fixture.detectChanges();
    expect(inDialog('#action').hasAttribute('aria-disabled')).toBe(false);
  });

  it('flags a mismatch only once the text cannot become the phrase any more', async () => {
    const { fixture } = await setup();
    const field = () => inDialog('input');
    const hint = () => inDialog('.andes-alert-dialog__phrase-hint');

    type('acme');
    fixture.detectChanges();
    expect(field().hasAttribute('aria-invalid')).toBe(false);
    expect(hint().textContent?.trim()).toBe('');

    type('acme-x');
    fixture.detectChanges();
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(hint().textContent?.trim()).toBe("That doesn't match yet.");
    expect(hint().getAttribute('data-state')).toBe('mismatch');
  });

  it('flags a partial entry as a mismatch after the field loses focus', async () => {
    const { fixture } = await setup();

    type('acme');
    inDialog('input').dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(inDialog('input').getAttribute('aria-invalid')).toBe('true');
  });

  it('confirms with a status line that a screen reader announces', async () => {
    const { fixture } = await setup();
    const hint = () => inDialog('.andes-alert-dialog__phrase-hint');

    type('acme-web');
    fixture.detectChanges();

    expect(hint().getAttribute('role')).toBe('status');
    expect(hint().textContent?.trim()).toBe('Matches. You can continue.');
    expect(inDialog('input').getAttribute('aria-describedby')).toBe(hint().id);
    expect(hint().getAttribute('data-state')).toBe('matched');
  });

  it('activates the action when Enter is pressed in a matching field', async () => {
    const { fixture, host } = await setup();

    type('acme-web');
    fixture.detectChanges();
    const enter = press(inDialog('input'), 'keydown', 'Enter');
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(host.confirmed).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
  });

  it('answers Enter in a field that does not match yet with the same refusal as a click', async () => {
    const { fixture, host } = await setup();

    type('acme');
    press(inDialog('input'), 'keydown', 'Enter');
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
    expect(inDialog('#action').hasAttribute('data-shake')).toBe(true);
    expect(live().textContent).toBe('Type acme-web to confirm.');
  });

  it('refuses pasted text under blockPaste, and says so', async () => {
    const { fixture, host } = await setup();

    const allowed = new Event('paste', { bubbles: true, cancelable: true });
    inDialog('input').dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);

    host.blockPaste.set(true);
    fixture.detectChanges();
    const refused = new Event('paste', { bubbles: true, cancelable: true });
    inDialog('input').dispatchEvent(refused);
    fixture.detectChanges();

    expect(refused.defaultPrevented).toBe(true);
    expect(live().textContent).toBe(
      'Pasting is turned off. Type the text to continue.',
    );
  });

  it('starts empty and locked on every opening', async () => {
    const { fixture, host } = await setup();

    type('acme-web');
    fixture.detectChanges();
    click(inDialog('#cancel'));
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    await openDialog(fixture);

    expect((inDialog('input') as HTMLInputElement).value).toBe('');
    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');
  });

  it('clears the field on close even when the surface is kept alive', async () => {
    const { fixture, host } = await setup();
    host.destroyOnClose.set(false);
    fixture.detectChanges();
    host.open.set(false);
    fixture.detectChanges();
    await flush();
    await openDialog(fixture);

    type('acme-web');
    fixture.detectChanges();
    host.open.set(false);
    fixture.detectChanges();
    await flush();
    await openDialog(fixture);

    expect((inDialog('input') as HTMLInputElement).value).toBe('');
    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');
  });

  it('lets the opening focus be aimed at the field, Cancel or the action', async () => {
    for (const [target, selector] of [
      ['input', 'input'],
      ['cancel', '#cancel'],
      ['action', '#action'],
    ] as const) {
      const fixture = TestBed.createComponent(PhraseHost);
      fixture.componentInstance.initialFocus.set(target);
      fixture.detectChanges();
      await openDialog(fixture);

      expect(
        inDialog(selector).hasAttribute('cdkfocusinitial'),
        `${target} is the initial focus`,
      ).toBe(true);
      expect(inDialog('[cdkfocusinitial]')).toBe(inDialog(selector));
      fixture.destroy();
    }
  });

  it('marks nothing as the initial focus by default', async () => {
    await setup();
    expect(inDialog('[cdkfocusinitial]')).toBeNull();
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog [(open)]="open" (closed)="reasons.push($event)">
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete this workspace?</h2>
        </div>

        <andes-alert-dialog-acknowledge id="first"
          >I understand the files are removed.</andes-alert-dialog-acknowledge
        >
        <andes-alert-dialog-acknowledge
          id="second"
          requirement="Agree that members lose access."
          >I understand members lose access.</andes-alert-dialog-acknowledge
        >

        <div andesAlertDialogFooter>
          <button type="button" id="action" andesAlertDialogAction>
            Delete
          </button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class AcknowledgeHost {
  readonly open = signal(false);
  readonly reasons: AndesOverlayCloseReason[] = [];
}

describe('acknowledge checkbox', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(AcknowledgeHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  const box = (id: string) =>
    inDialog(`#${id} input[type="checkbox"]`) as HTMLInputElement;

  it('uses the library checkbox, labelled by the projected text', async () => {
    await setup();

    expect(inDialog('#first andes-checkbox')).not.toBeNull();
    expect(inDialog('#first').textContent).toContain(
      'I understand the files are removed.',
    );
  });

  it('keeps the action unavailable until every box is ticked', async () => {
    const { fixture, host } = await setup();
    const action = () => inDialog('#action');

    expect(action().getAttribute('aria-disabled')).toBe('true');
    expect(requirements().textContent).toBe(
      'Tick the box to confirm that you understand. Agree that members lose access.',
    );

    box('first').click();
    fixture.detectChanges();
    expect(action().getAttribute('aria-disabled')).toBe('true');
    expect(requirements().textContent).toBe('Agree that members lose access.');

    box('second').click();
    fixture.detectChanges();
    expect(action().hasAttribute('aria-disabled')).toBe(false);

    click(action());
    fixture.detectChanges();
    expect(host.reasons).toEqual(['close-button']);
  });

  it('asks again on the next opening', async () => {
    const { fixture, host } = await setup();

    box('first').click();
    box('second').click();
    fixture.detectChanges();
    host.open.set(false);
    fixture.detectChanges();
    await flush();
    await openDialog(fixture);

    expect(box('first').checked).toBe(false);
    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog [(open)]="open" (closed)="reasons.push($event)">
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete this database?</h2>
        </div>

        <andes-alert-dialog-countdown [seconds]="seconds()" />

        <div andesAlertDialogFooter>
          <button type="button" id="action" andesAlertDialogAction>
            Delete
          </button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class CountdownHost {
  readonly open = signal(false);
  readonly seconds = signal(3);
  readonly reasons: AndesOverlayCloseReason[] = [];
}

describe('countdown', () => {
  withElementGeometry();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup() {
    const fixture = TestBed.createComponent(CountdownHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  const text = () =>
    inDialog('.andes-alert-dialog__countdown-text').textContent?.trim();
  const fill = () =>
    inDialog('.andes-alert-dialog__countdown-fill') as HTMLElement;

  it('counts down in whole seconds with a progress bar, then unlocks the action', async () => {
    const { fixture, host } = await setup();
    const action = () => inDialog('#action');

    expect(text()).toBe('You can continue in 3s.');
    expect(fill().style.inlineSize).toBe('0%');
    expect(action().getAttribute('aria-disabled')).toBe('true');
    expect(requirements().textContent).toBe('You can continue in 3s.');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(text()).toBe('You can continue in 2s.');
    expect(parseFloat(fill().style.inlineSize)).toBeCloseTo(33.33, 1);

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(text()).toBe('You can continue now.');
    expect(fill().style.inlineSize).toBe('100%');
    expect(action().hasAttribute('aria-disabled')).toBe(false);

    click(action());
    fixture.detectChanges();
    expect(host.reasons).toEqual(['close-button']);
  });

  it('refuses a click before the wait is over', async () => {
    const { fixture, host } = await setup();

    vi.advanceTimersByTime(1000);
    click(inDialog('#action'));
    fixture.detectChanges();

    expect(host.reasons).toEqual([]);
    expect(live().textContent).toBe('You can continue in 2s.');
  });

  it('tells a screen reader about the wait once, not on every tick', async () => {
    const { fixture } = await setup();
    const announcements: string[] = [];
    const observer = new MutationObserver(() =>
      announcements.push(live().textContent ?? ''),
    );
    observer.observe(live(), {
      childList: true,
      characterData: true,
      subtree: true,
    });

    expect(live().textContent).toBe('You can continue in 3 seconds.');
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(live().textContent).toBe('You can continue in 3 seconds.');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(live().textContent).toBe('You can continue now.');
    observer.disconnect();
  });

  it('starts over on every opening', async () => {
    const { fixture, host } = await setup();

    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    host.open.set(false);
    fixture.detectChanges();
    await flush();
    await openDialog(fixture);

    expect(text()).toBe('You can continue in 3s.');
    expect(inDialog('#action').getAttribute('aria-disabled')).toBe('true');
  });

  it('has nothing to wait for with zero seconds', async () => {
    const fixture = TestBed.createComponent(CountdownHost);
    fixture.componentInstance.seconds.set(0);
    fixture.detectChanges();
    await openDialog(fixture);

    expect(inDialog('#action').hasAttribute('aria-disabled')).toBe(false);
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog
      [(open)]="open"
      (closed)="reasons.push($event)"
      (cancelled)="cancelled = cancelled + 1"
    >
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
        </div>

        <andes-alert-dialog-error />

        <div andesAlertDialogFooter>
          <button type="button" id="cancel" andesAlertDialogCancel>
            Cancel
          </button>
          <button
            type="button"
            id="action"
            andesAlertDialogAction
            [confirm]="confirm"
            [errorMessage]="errorMessage()"
            (click)="clicks = clicks + 1"
          >
            Delete
          </button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class AsyncHost {
  readonly open = signal(false);
  readonly errorMessage = signal<string | ((error: unknown) => string) | null>(
    null,
  );
  readonly reasons: AndesOverlayCloseReason[] = [];
  cancelled = 0;
  clicks = 0;
  calls = 0;
  pendingRequest: { resolve(): void; reject(error: unknown): void } | null =
    null;
  mode: 'pending' | 'sync' | 'throw' | 'close' = 'pending';

  readonly confirm = (): unknown => {
    this.calls++;
    if (this.mode === 'throw') {
      throw new Error('Quota exceeded');
    }
    if (this.mode === 'sync') {
      return undefined;
    }
    return new Promise<void>((resolve, reject) => {
      this.pendingRequest = { resolve, reject };
    });
  };
}

describe('asynchronous confirmation', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(AsyncHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  const settle = async (fixture: ComponentFixture<unknown>) => {
    await flush();
    fixture.detectChanges();
  };

  const errorPart = () =>
    inDialog('[data-slot="alert-dialog-error"]') as HTMLElement;

  it('keeps the dialog open with the action busy while the request runs', async () => {
    const { fixture, host } = await setup();
    const action = inDialog('#action');

    click(action);
    fixture.detectChanges();

    expect(host.calls).toBe(1);
    expect(action.hasAttribute('data-pending')).toBe(true);
    expect(action.getAttribute('aria-busy')).toBe('true');
    expect(surface().getAttribute('aria-busy')).toBe('true');
    expect(surface()).not.toBeNull();
    expect(host.reasons).toEqual([]);
  });

  it('closes once the request resolves', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#action'));
    fixture.detectChanges();
    host.pendingRequest?.resolve();
    await settle(fixture);

    expect(host.reasons).toEqual(['close-button']);
    expect(host.cancelled).toBe(0);
  });

  it('ignores a second click while the request is in flight', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#action'));
    click(inDialog('#action'));
    click(inDialog('#action'));
    fixture.detectChanges();

    expect(host.calls).toBe(1);
    expect(host.clicks).toBe(1);
  });

  it('takes the way out away while the request runs: Cancel, Escape and the backdrop', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#action'));
    fixture.detectChanges();

    const cancel = inDialog('#cancel');
    expect(cancel.getAttribute('aria-disabled')).toBe('true');
    click(cancel);
    pressEscape();
    fixture.detectChanges();

    expect(host.reasons).toEqual([]);
    expect(host.cancelled).toBe(0);
    expect(surface()).not.toBeNull();
  });

  it('gives the way out back after a failure', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#action'));
    fixture.detectChanges();
    host.pendingRequest?.reject(new Error('Network down'));
    await settle(fixture);

    expect(inDialog('#cancel').hasAttribute('aria-disabled')).toBe(false);
    pressEscape();
    fixture.detectChanges();
    expect(host.reasons).toEqual(['escape-key']);
  });

  it('stays open on failure, shows the reason and lets the user retry', async () => {
    const { fixture, host } = await setup();
    const action = () => inDialog('#action');

    expect(errorPart().hidden).toBe(true);

    click(action());
    fixture.detectChanges();
    host.pendingRequest?.reject(new Error('Network down'));
    await settle(fixture);

    expect(host.reasons).toEqual([]);
    expect(action().hasAttribute('data-pending')).toBe(false);
    expect(action().hasAttribute('aria-busy')).toBe(false);
    expect(errorPart().hidden).toBe(false);
    expect(errorPart().textContent).toContain('Network down');
    expect(errorPart().textContent).toContain('You can try again.');
    expect(errorPart().querySelector('path')?.getAttribute('d')).toBe(
      ANDES_DIALOG_STATUS_GLYPHS.warning,
    );
    expect(live().textContent).toBe('Network down');

    click(action());
    fixture.detectChanges();
    expect(host.calls).toBe(2);
    expect(errorPart().hidden).toBe(true);

    host.pendingRequest?.resolve();
    await settle(fixture);
    expect(host.reasons).toEqual(['close-button']);
  });

  it('can replace the failure message with its own', async () => {
    const { fixture, host } = await setup();
    host.errorMessage.set('We could not delete the project.');
    fixture.detectChanges();

    click(inDialog('#action'));
    fixture.detectChanges();
    host.pendingRequest?.reject(new Error('ECONNRESET'));
    await settle(fixture);

    expect(errorPart().textContent).toContain(
      'We could not delete the project.',
    );
    expect(errorPart().textContent).not.toContain('ECONNRESET');
  });

  it('builds the failure message from what was rejected', async () => {
    const { fixture, host } = await setup();
    host.errorMessage.set((error) => `Failed: ${String(error)}`);
    fixture.detectChanges();

    click(inDialog('#action'));
    fixture.detectChanges();
    host.pendingRequest?.reject('timeout');
    await settle(fixture);

    expect(errorPart().textContent).toContain('Failed: timeout');
  });

  it('treats a handler that throws like a rejected request', async () => {
    const { fixture, host } = await setup();
    host.mode = 'throw';

    click(inDialog('#action'));
    await settle(fixture);

    expect(host.reasons).toEqual([]);
    expect(errorPart().textContent).toContain('Quota exceeded');
  });

  it('closes at once when the handler is synchronous', async () => {
    const { fixture, host } = await setup();
    host.mode = 'sync';

    click(inDialog('#action'));
    fixture.detectChanges();

    expect(host.reasons).toEqual(['close-button']);
  });

  it('forgets a failure when the dialog closes', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#action'));
    fixture.detectChanges();
    host.pendingRequest?.reject(new Error('Network down'));
    await settle(fixture);
    click(inDialog('#cancel'));
    fixture.detectChanges();
    await openDialog(fixture);

    expect(errorPart().hidden).toBe(true);
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog [(open)]="open" (closed)="reasons.push($event)">
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
        </div>

        @if (withGate()) {
          <andes-alert-dialog-acknowledge
            >I understand.</andes-alert-dialog-acknowledge
          >
        }

        <div andesAlertDialogFooter>
          <button
            type="button"
            id="action"
            andesAlertDialogAction
            [holdDuration]="holdDuration()"
            [armDelay]="armDelay()"
            [holdMessages]="messages()"
            (click)="confirmed = confirmed + 1"
          >
            Delete
          </button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class HoldHost {
  readonly open = signal(false);
  readonly holdDuration = signal(0);
  readonly armDelay = signal(0);
  readonly withGate = signal(false);
  readonly messages = signal<Record<string, string>>({});
  readonly reasons: AndesOverlayCloseReason[] = [];
  confirmed = 0;
}

describe('hold to confirm', () => {
  withElementGeometry();

  async function setup(holdDuration = 1500, withGate = false) {
    const fixture = TestBed.createComponent(HoldHost);
    fixture.componentInstance.holdDuration.set(holdDuration);
    fixture.componentInstance.withGate.set(withGate);
    fixture.detectChanges();
    await openDialog(fixture);
    // Timers are faked only after the dialog is open, so opening runs on real ones.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    return { fixture, host: fixture.componentInstance };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  const action = () => inDialog('#action');

  it('exposes the hold on the action for styling', async () => {
    await setup(1500);

    expect(action().hasAttribute('data-hold')).toBe(true);
    expect(action().style.getPropertyValue('--andes-hold-duration')).toBe(
      '1500ms',
    );
  });

  it('does not treat a plain click as a confirmation', async () => {
    const { fixture, host } = await setup();

    click(action());
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
  });

  it('confirms after the pointer has been held for the whole duration', async () => {
    const { fixture, host } = await setup();

    pointer(action(), 'pointerdown');
    fixture.detectChanges();
    expect(action().hasAttribute('data-holding')).toBe(true);
    expect(live().textContent).toBe('Keep holding to confirm.');

    vi.advanceTimersByTime(1499);
    fixture.detectChanges();
    expect(host.reasons).toEqual([]);

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(host.confirmed).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
  });

  it('cancels when the pointer is released early', async () => {
    const { fixture, host } = await setup();

    pointer(action(), 'pointerdown');
    vi.advanceTimersByTime(700);
    pointer(action(), 'pointerup');
    fixture.detectChanges();

    expect(action().hasAttribute('data-holding')).toBe(false);
    expect(live().textContent).toBe(
      'Released too early. Hold the button to confirm.',
    );

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
  });

  it('cancels when the pointer slides off, is cancelled, or the control loses focus', async () => {
    for (const cancel of [
      () => pointer(action(), 'pointerleave'),
      () => pointer(action(), 'pointercancel'),
      () =>
        action().dispatchEvent(new FocusEvent('focusout', { bubbles: true })),
    ]) {
      const { fixture, host } = await setup();
      pointer(action(), 'pointerdown');
      cancel();
      vi.advanceTimersByTime(5000);
      fixture.detectChanges();
      expect(host.confirmed).toBe(0);
      vi.useRealTimers();
      fixture.destroy();
    }
  });

  it('ignores the secondary mouse buttons', async () => {
    const { fixture, host } = await setup();

    action().dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 2 }),
    );
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
  });

  it('holds with Space and Enter too, without the native click', async () => {
    for (const key of [' ', 'Enter']) {
      const { fixture, host } = await setup(1000);

      const down = press(action(), 'keydown', key);
      expect(down.defaultPrevented).toBe(true);
      fixture.detectChanges();
      expect(action().hasAttribute('data-holding')).toBe(true);

      // Key auto-repeat must not restart the hold.
      vi.advanceTimersByTime(600);
      press(action(), 'keydown', key, true);
      vi.advanceTimersByTime(400);
      fixture.detectChanges();

      expect(host.confirmed, `held ${JSON.stringify(key)}`).toBe(1);
      expect(host.reasons).toEqual(['close-button']);
      vi.useRealTimers();
      fixture.destroy();
    }
  });

  it('cancels a keyboard hold when the key is released early', async () => {
    const { fixture, host } = await setup();

    press(action(), 'keydown', ' ');
    vi.advanceTimersByTime(500);
    const up = press(action(), 'keyup', ' ');
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();

    expect(up.defaultPrevented).toBe(true);
    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
  });

  it('swallows the click a browser sends right after a keyboard hold', async () => {
    const { fixture, host } = await setup();

    press(action(), 'keydown', ' ');
    vi.advanceTimersByTime(300);
    press(action(), 'keyup', ' ');
    click(action(), 0);
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
    expect(live().textContent).toBe(
      'Released too early. Hold the button to confirm.',
    );
  });

  it('gives a screen reader that can only click a cancellable wait instead', async () => {
    const { fixture, host } = await setup(2000);

    click(action(), 0);
    fixture.detectChanges();
    expect(live().textContent).toBe(
      'Confirming in 2 seconds. Activate the button again to cancel.',
    );
    expect(action().hasAttribute('data-holding')).toBe(true);

    click(action(), 0);
    fixture.detectChanges();
    expect(live().textContent).toBe('Cancelled.');
    vi.advanceTimersByTime(5000);
    expect(host.confirmed).toBe(0);

    click(action(), 0);
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(host.confirmed).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
  });

  it('lets the announcements be translated', async () => {
    const { fixture, host } = await setup();
    host.messages.set({ start: 'Sigue presionando para confirmar.' });
    fixture.detectChanges();

    pointer(action(), 'pointerdown');
    fixture.detectChanges();

    expect(live().textContent).toBe('Sigue presionando para confirmar.');
  });

  it('refuses to start while a gate is closed, and says what is missing', async () => {
    const { fixture, host } = await setup(1000, true);

    pointer(action(), 'pointerdown');
    fixture.detectChanges();

    expect(action().hasAttribute('data-holding')).toBe(false);
    expect(action().hasAttribute('data-shake')).toBe(true);
    expect(live().textContent).toBe(
      'Tick the box to confirm that you understand.',
    );

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(host.confirmed).toBe(0);
  });
});

describe('guarding against an accidental answer', () => {
  withElementGeometry();

  it('ignores the action for armDelay milliseconds after opening', async () => {
    const fixture = TestBed.createComponent(HoldHost);
    fixture.componentInstance.armDelay.set(60);
    fixture.detectChanges();
    await openDialog(fixture);

    click(inDialog('#action'));
    press(inDialog('#action'), 'keydown', 'Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.confirmed).toBe(0);
    expect(fixture.componentInstance.reasons).toEqual([]);
    // Ignored silently: it is not a refusal the user has to be told about.
    expect(inDialog('#action').hasAttribute('data-shake')).toBe(false);
    expect(inDialog('#action').hasAttribute('aria-disabled')).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    click(inDialog('#action'));
    fixture.detectChanges();

    expect(fixture.componentInstance.confirmed).toBe(1);
    expect(fixture.componentInstance.reasons).toEqual(['close-button']);
  });

  it('answers immediately without an armDelay', async () => {
    const fixture = TestBed.createComponent(HoldHost);
    fixture.detectChanges();
    await openDialog(fixture);

    click(inDialog('#action'));
    fixture.detectChanges();

    expect(fixture.componentInstance.reasons).toEqual(['close-button']);
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS, AndesButton],
  template: `
    <andes-alert-dialog [(open)]="open" (closed)="reasons.push($event)">
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
        </div>

        <andes-alert-dialog-acknowledge
          >I understand.</andes-alert-dialog-acknowledge
        >

        <div andesAlertDialogFooter>
          <andes-button id="cancel" variant="secondary" andesAlertDialogCancel>
            Cancel
          </andes-button>
          <andes-button
            id="action"
            variant="danger"
            andesAlertDialogAction
            (click)="confirmed = confirmed + 1"
          >
            Delete
          </andes-button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class ButtonHost {
  readonly open = signal(false);
  readonly reasons: AndesOverlayCloseReason[] = [];
  confirmed = 0;
}

describe('on an <andes-button>', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  const control = () => inDialog('#action button') as HTMLButtonElement;

  it('marks the real button inside, which stays focusable', async () => {
    await setup();

    expect(control().getAttribute('aria-disabled')).toBe('true');
    expect(control().hasAttribute('data-disabled')).toBe(true);
    expect(control().disabled).toBe(false);
    expect(control().getAttribute('aria-describedby')).toBe(requirements().id);
    expect(inDialog('#action').getAttribute('aria-disabled')).toBeNull();
  });

  it('blocks a click on the inner button before the consumer handler sees it', async () => {
    const { fixture, host } = await setup();

    click(control());
    fixture.detectChanges();

    expect(host.confirmed).toBe(0);
    expect(host.reasons).toEqual([]);
  });

  it('works once the gate opens', async () => {
    const { fixture, host } = await setup();

    (inDialog('input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(control().hasAttribute('aria-disabled')).toBe(false);

    click(control());
    fixture.detectChanges();

    expect(host.confirmed).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
  });

  it('keeps a button the consumer disabled themselves disabled', async () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    await openDialog(fixture);
    const cancel = inDialog('#cancel button') as HTMLButtonElement;

    // Cancel is never gated; its own state must not be touched by the helper.
    expect(cancel.hasAttribute('aria-disabled')).toBe(false);
    expect(cancel.hasAttribute('data-andes-unavailable')).toBe(false);
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog
      [(open)]="open"
      [tone]="tone()"
      (closed)="reasons.push($event)"
      (cancelled)="cancelled = cancelled + 1"
    >
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <andes-alert-dialog-icon id="icon" />
          <h2 andesAlertDialogTitle>Save your changes?</h2>
          <p andesAlertDialogDescription>You have unsaved edits.</p>
        </div>

        <div andesAlertDialogFooter>
          <button
            type="button"
            id="discard"
            andesAlertDialogSecondary
            (click)="discarded = discarded + 1"
          >
            Discard
          </button>
          <button type="button" id="cancel" andesAlertDialogCancel>
            Keep editing
          </button>
          <button type="button" id="action" andesAlertDialogAction>Save</button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class ThreeWayHost {
  readonly open = signal(false);
  readonly tone = signal<AndesAlertDialogTone | null>(null);
  readonly reasons: AndesOverlayCloseReason[] = [];
  cancelled = 0;
  discarded = 0;
}

describe('three-way answer and tone', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(ThreeWayHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  it('closes from the secondary action without counting as a cancel', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#discard'));
    fixture.detectChanges();

    expect(host.discarded).toBe(1);
    expect(host.reasons).toEqual(['close-button']);
    expect(host.cancelled).toBe(0);
  });

  it('keeps Cancel a real cancel', async () => {
    const { fixture, host } = await setup();

    click(inDialog('#cancel'));
    fixture.detectChanges();

    expect(host.cancelled).toBe(1);
  });

  it('tags the secondary action for the stylesheet', async () => {
    await setup();
    const discard = inDialog('#discard');

    expect(discard.classList).toContain('andes-dialog__secondary');
    expect(discard.getAttribute('data-slot')).toBe('alert-dialog-secondary');
  });

  it('adds no tone styling by default', async () => {
    await setup();

    expect(surface().hasAttribute('data-tone')).toBe(false);
    expect([...surface().classList].some((name) => name.includes('tone'))).toBe(
      false,
    );
    expect(inDialog('#icon svg')).toBeNull();
  });

  it('puts the tone on the surface and draws a matching icon', async () => {
    const { fixture, host } = await setup();

    for (const tone of ['danger', 'warning', 'info', 'success'] as const) {
      host.tone.set(tone);
      fixture.detectChanges();

      expect(surface().getAttribute('data-tone')).toBe(tone);
      expect(surface().classList).toContain(`andes-dialog--tone-${tone}`);
      expect(inDialog('#icon').getAttribute('data-tone')).toBe(tone);
      expect(inDialog('#icon').getAttribute('aria-hidden')).toBe('true');
      expect(inDialog('#icon svg')).not.toBeNull();
    }
  });

  it('draws every tone as a full-size disc, as the alert and the service do', async () => {
    const { fixture, host } = await setup();

    for (const tone of ['danger', 'warning', 'info', 'success'] as const) {
      host.tone.set(tone);
      fixture.detectChanges();

      const svg = inDialog('#icon svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.querySelector('circle')?.getAttribute('r')).toBe('12');
      expect(svg.querySelector('circle')?.getAttribute('cx')).toBe('12');
      expect(svg.querySelector('circle')?.getAttribute('cy')).toBe('12');
      expect(
        svg.querySelector('.andes-alert-dialog__icon-glyph')?.getAttribute('d'),
      ).toBe(ANDES_DIALOG_STATUS_GLYPHS[tone]);
    }
  });

  it('gives each tone its own glyph, so colour is never the only cue', async () => {
    const { fixture, host } = await setup();
    const glyphs = new Set<string>();

    for (const tone of ['danger', 'warning', 'info', 'success'] as const) {
      host.tone.set(tone);
      fixture.detectChanges();
      glyphs.add(
        inDialog('#icon .andes-alert-dialog__icon-glyph').getAttribute('d') ??
          '',
      );
    }

    expect(glyphs.size).toBe(4);
  });

  it('draws the same glyphs as the dialog service icons', async () => {
    const service = TestBed.inject(AndesDialogService);
    const seen = new Map<string, string>();

    for (const kind of ['error', 'warning', 'info', 'success'] as const) {
      service[kind]({ title: 'Title' });
      await TestBed.inject(ApplicationRef).whenStable();
      seen.set(
        kind,
        document
          .querySelector('[data-slot="dialog-method-icon"] path')
          ?.getAttribute('d') ?? '',
      );
      service.destroyAll();
    }

    expect(Object.fromEntries(seen)).toEqual({
      error: ANDES_DIALOG_STATUS_GLYPHS.danger,
      warning: ANDES_DIALOG_STATUS_GLYPHS.warning,
      info: ANDES_DIALOG_STATUS_GLYPHS.info,
      success: ANDES_DIALOG_STATUS_GLYPHS.success,
    });
  });
});

@Component({
  imports: [ANDES_ALERT_DIALOG_IMPORTS],
  template: `
    <andes-alert-dialog [(open)]="open">
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete 4 folders?</h2>
        </div>

        <andes-alert-dialog-impact
          heading="This will permanently delete:"
          [items]="items()"
          [maxVisible]="3"
        />

        <div andesAlertDialogFooter>
          <button type="button" andesAlertDialogAction>Delete</button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class ImpactHost {
  readonly open = signal(false);
  readonly items = signal<AndesAlertDialogImpactItem[]>([
    { label: 'Files', count: 128 },
    { label: 'Folders', count: 4, detail: 'Including shared folders' },
    { label: 'Deployments', count: 12 },
    { label: 'Domains', count: 2 },
    { label: 'Members', count: 7 },
  ]);
}

describe('impact summary', () => {
  withElementGeometry();

  async function setup() {
    const fixture = TestBed.createComponent(ImpactHost);
    fixture.detectChanges();
    await openDialog(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  const rows = () =>
    [...surface().querySelectorAll('.andes-alert-dialog__impact-item')].map(
      (row) =>
        ['label', 'detail', 'count']
          .map(
            (part) =>
              row
                .querySelector(`.andes-alert-dialog__impact-${part}`)
                ?.textContent?.trim() ?? '',
          )
          .filter(Boolean)
          .join(' | '),
    );
  const toggle = () => inDialog('.andes-alert-dialog__impact-toggle button');

  it('lists what is affected with its counts, labelled by the heading', async () => {
    await setup();
    const list = inDialog('.andes-alert-dialog__impact-list');

    expect(rows()[0]).toBe('Files | 128');
    expect(rows()[1]).toBe('Folders | Including shared folders | 4');
    expect(list.getAttribute('aria-labelledby')).toBe(
      inDialog('.andes-alert-dialog__impact-heading').id,
    );
  });

  it('collapses the rows past maxVisible behind a control that reveals them', async () => {
    const { fixture } = await setup();

    expect(rows().length).toBe(3);
    expect(toggle().textContent?.trim()).toBe('Show 2 more');

    toggle().click();
    fixture.detectChanges();
    expect(rows().length).toBe(5);
    expect(toggle().textContent?.trim()).toBe('Show less');

    toggle().click();
    fixture.detectChanges();
    expect(rows().length).toBe(3);
  });

  it('offers no control when everything fits', async () => {
    const { fixture, host } = await setup();
    host.items.set([{ label: 'Files', count: 3 }]);
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(inDialog('.andes-alert-dialog__impact-toggle')).toBeNull();
  });
});

describe('live region and requirements', () => {
  withElementGeometry();

  it('gives every alert dialog a polite status region and a requirements sentence', async () => {
    const fixture = TestBed.createComponent(ThreeWayHost);
    fixture.detectChanges();
    await openDialog(fixture);

    expect(live().getAttribute('role')).toBe('status');
    expect(live().getAttribute('aria-live')).toBe('polite');
    expect(live().getAttribute('aria-atomic')).toBe('true');
    expect(requirements().id).toMatch(/^andes-alert-dialog-requirements-/);
    // Nothing gates this dialog's action, so it is not described as blocked.
    expect(inDialog('#action').hasAttribute('aria-describedby')).toBe(false);
    expect(inDialog('#action').hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('alert-dialog-patterns.css', () => {
  const css = readFileSync(
    'packages/ui/src/lib/dialog/alert-dialog-patterns.css',
    'utf8',
  );

  it('uses logical properties only, so right-to-left needs no overrides', () => {
    expect(css).not.toMatch(/(margin|padding|border)-(left|right)\b/);
    expect(css).not.toMatch(/(^|[\s{;])(left|right|width|height)\s*:/m);
  });

  it('takes its colours from the tokens', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
  });

  it('sizes the tone icon like the service confirm icon: a 22px disc in the tone colour', () => {
    expect(declaredValue(css, '.andes-alert-dialog__icon', 'inline-size')).toBe(
      '1.375rem',
    );
    expect(declaredValue(css, '.andes-alert-dialog__icon', 'block-size')).toBe(
      '1.375rem',
    );
    expect(declaredValue(css, '.andes-alert-dialog__icon-disc', 'fill')).toBe(
      'currentcolor',
    );
    expect(
      declaredValue(css, '.andes-alert-dialog__icon-glyph', 'stroke'),
    ).toBe('var(--andes-color-popover)');
  });

  it('draws the hold fill from the start edge, so it fills the right way in RTL', () => {
    for (const selector of [
      '.andes-dialog__action[data-hold] .andes-button::after',
      '.andes-dialog__action[data-hold]:is(button, a)::after',
    ]) {
      expect(declaredValue(css, selector, 'inset-inline-start')).toBe('0');
    }
  });

  it('turns the shake off and the countdown glide into steps under reduced motion', () => {
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'));

    expect(reduced).toMatch(/\[data-shake\][^{]*\{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/countdown-fill\s*\{[^}]*transition:\s*none/);
    expect(reduced).toMatch(/steps\(5, end\)/);
  });
});
