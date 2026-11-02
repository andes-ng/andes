import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesButton } from '../button/button';
import { ANDES_ALERT_DIALOG_IMPORTS } from './alert-dialog';
import { ANDES_DIALOG_IMPORTS } from './dialog';

const TRIGGER_ARIA = ['aria-haspopup', 'aria-expanded', 'aria-controls'];

@Component({
  imports: [ANDES_DIALOG_IMPORTS, ANDES_ALERT_DIALOG_IMPORTS, AndesButton],
  template: `
    <andes-dialog>
      <andes-button id="dialog-trigger" andesDialogTrigger [disabled]="off()">
        Open
      </andes-button>
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Edit profile</h2>
        </div>
        <div andesDialogFooter>
          <andes-button andesDialogClose>Close</andes-button>
        </div>
      </andes-dialog-content>
    </andes-dialog>

    <andes-alert-dialog>
      <andes-button id="alert-trigger" andesAlertDialogTrigger>
        Delete
      </andes-button>
      <andes-alert-dialog-content *andesAlertDialogContent>
        <div andesAlertDialogHeader>
          <h2 andesAlertDialogTitle>Delete this project?</h2>
        </div>
        <div andesAlertDialogFooter>
          <andes-button andesAlertDialogCancel>Cancel</andes-button>
        </div>
      </andes-alert-dialog-content>
    </andes-alert-dialog>
  `,
})
class WrapperTriggerHost {
  readonly off = signal(false);
}

describe('dialog triggers on an andes-button', () => {
  // jsdom reports zero geometry for every element, so CDK's focus trap would treat the
  // dialog's controls as invisible and never move focus into it.
  beforeAll(() => {
    for (const prop of ['offsetWidth', 'offsetHeight'] as const) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });

  afterAll(() => {
    for (const prop of ['offsetWidth', 'offsetHeight']) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
        prop
      ];
    }
  });

  function setup() {
    const fixture = TestBed.createComponent(WrapperTriggerHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    const control = (id: string) =>
      host(id).querySelector('button') as HTMLButtonElement;
    const surface = () =>
      document.querySelector<HTMLElement>('.andes-dialog[role]');
    return { fixture, host, control, surface };
  }

  async function flush(fixture: {
    detectChanges(): void;
    whenStable(): Promise<unknown>;
  }) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it.each(['dialog-trigger', 'alert-trigger'])(
    'puts the popup state on the real button of %s, not on the wrapper',
    async (id) => {
      const { fixture, host, control, surface } = setup();
      await flush(fixture);

      for (const name of TRIGGER_ARIA) {
        expect(host(id).hasAttribute(name)).toBe(false);
      }
      expect(control(id).getAttribute('aria-haspopup')).toBe('dialog');
      expect(control(id).getAttribute('aria-expanded')).toBe('false');
      expect(control(id).hasAttribute('aria-controls')).toBe(false);

      control(id).click();
      await flush(fixture);

      expect(control(id).getAttribute('aria-expanded')).toBe('true');
      expect(control(id).getAttribute('aria-controls')).toBe(surface()?.id);
      for (const name of TRIGGER_ARIA) {
        expect(host(id).hasAttribute(name)).toBe(false);
      }
    },
  );

  it.each(['dialog-trigger', 'alert-trigger'])(
    'opens from a click on %s and gives focus back to the real button on close',
    async (id) => {
      const { fixture, control, surface } = setup();
      await flush(fixture);

      control(id).focus();
      control(id).click();
      await flush(fixture);
      expect(surface()).not.toBeNull();
      expect(document.activeElement).not.toBe(control(id));

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      await flush(fixture);

      expect(surface()).toBeNull();
      expect(document.activeElement).toBe(control(id));
    },
  );

  it('does not open from a disabled andes-button', async () => {
    const { fixture, host, control, surface } = setup();
    fixture.componentInstance.off.set(true);
    await flush(fixture);

    expect(control('dialog-trigger').disabled).toBe(true);
    host('dialog-trigger').click();
    control('dialog-trigger').click();
    await flush(fixture);

    expect(surface()).toBeNull();
  });
});
