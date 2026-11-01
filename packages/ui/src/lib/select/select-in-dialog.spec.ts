import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesSelect } from './select';

/** The z-index a CDK overlay host was given: a number, or the fallback of a `var()` token. */
function zIndexOf(element: HTMLElement | null | undefined): number {
  const value = element?.style.getPropertyValue('z-index') ?? '';
  const match = /(\d+)\)?$/.exec(value);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

const overlayHost = (inner: Element | null) =>
  inner?.closest<HTMLElement>('.cdk-overlay-container > *') ?? null;

@Component({
  imports: [ANDES_DIALOG_IMPORTS, AndesSelect],
  template: `<andes-dialog [open]="true">
    <andes-dialog-content *andesDialogContent>
      <div andesDialogHeader>
        <h2 andesDialogTitle>New project</h2>
      </div>
      <andes-select
        aria-label="Plan"
        [options]="plans"
        placeholder="Choose a plan"
      />
    </andes-dialog-content>
  </andes-dialog>`,
})
class SelectInDialogHost {
  readonly select = viewChild(AndesSelect);
  readonly plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
  ];
}

describe('AndesSelect inside a dialog', () => {
  async function open() {
    const fixture = TestBed.createComponent(SelectInDialogHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // The select lives in the dialog's content, which is portalled out of the fixture.
    const trigger = document.querySelector<HTMLElement>(
      '.cdk-overlay-container [role="combobox"]',
    );
    expect(trigger).toBeTruthy();
    trigger?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('draws its list above the dialog, not behind it', async () => {
    const fixture = await open();

    const panel = document.querySelector<HTMLElement>(
      '[data-slot="select-panel"]',
    );
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(panel).toBeTruthy();
    expect(dialog).toBeTruthy();
    expect(overlayHost(panel)).not.toBe(overlayHost(dialog));
    expect(zIndexOf(overlayHost(panel))).toBeGreaterThan(
      zIndexOf(overlayHost(dialog)),
    );
    fixture.destroy();
  });
});
