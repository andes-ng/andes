import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import { AndesDropdownButton } from './dropdown-button';

/*
 * The line between the halves of a split button, as Ant Design's `Dropdown.Button` draws it
 * (measured live): both halves share one fill, and a 1px lighter tint of the button color
 * sits on the caret's first pixel column. jsdom has no layout, so the seam is asserted where
 * it is declared.
 */

const BUTTON_CSS = readFileSync(
  'packages/ui/src/lib/dropdown-menu/dropdown-button.css',
  'utf8',
);

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await sleep();
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('dropdown-button.css (the line between the halves)', () => {
  const caretOf = (variant: string) =>
    `.andes-dropdown-button[data-variant='${variant}'] .andes-dropdown-button__caret`;
  const seam = (variant: string) =>
    declaredValue(
      BUTTON_CSS,
      `${caretOf(variant)} .andes-button`,
      'box-shadow',
    );

  it.each(['primary', 'danger'])(
    'joins a solid %s split button around one pale 1px line: 25% of the foreground over the fill',
    (variant) => {
      expect(
        declaredValue(BUTTON_CSS, caretOf(variant), 'margin-inline-start'),
      ).toBe('-1px');
      expect(seam(variant)).toBe(
        'inset 1px 0 0 color-mix(in srgb, currentcolor 25%, transparent)',
      );
    },
  );

  it.each(['secondary', 'filled'])(
    'joins a light %s split button around a 1px line of 10% of the foreground',
    (variant) => {
      expect(
        declaredValue(BUTTON_CSS, caretOf(variant), 'margin-inline-start'),
      ).toBe('-1px');
      expect(seam(variant)).toBe(
        'inset 1px 0 0 color-mix(in srgb, currentcolor 10%, transparent)',
      );
    },
  );

  it.each(['outline', 'dashed'])(
    'joins a bordered %s split button on one shared border, with no extra line',
    (variant) => {
      expect(
        declaredValue(BUTTON_CSS, caretOf(variant), 'margin-inline-start'),
      ).toBe('-1px');
      expect(seam(variant)).toBeUndefined();
    },
  );

  it('never gives the caret half a background of its own, so both halves share the fill', () => {
    for (const property of ['background', 'background-color']) {
      expect(
        declaredValue(
          BUTTON_CSS,
          '.andes-dropdown-button .andes-dropdown-button__caret .andes-button',
          property,
        ),
      ).toBeUndefined();
      expect(
        declaredValue(
          BUTTON_CSS,
          '.andes-dropdown-button .andes-dropdown-button__main .andes-button',
          property,
        ),
      ).toBeUndefined();
    }
  });

  it('draws no line between the halves while either of them is loading', () => {
    expect(
      declaredValue(
        BUTTON_CSS,
        '.andes-dropdown-button:has(.andes-button--loading) .andes-dropdown-button__caret .andes-button',
        'box-shadow',
      ),
    ).toBe('none');
  });

  it('rounds only the outer corners of the pair', () => {
    expect(
      declaredValue(
        BUTTON_CSS,
        '.andes-dropdown-button .andes-dropdown-button__main .andes-button',
        'border-end-end-radius',
      ),
    ).toBe('0');
    expect(
      declaredValue(
        BUTTON_CSS,
        '.andes-dropdown-button .andes-dropdown-button__caret .andes-button',
        'border-start-start-radius',
      ),
    ).toBe('0');
  });
});

@Component({
  imports: [AndesDropdownButton],
  template: `
    @for (variant of variants; track variant) {
      <andes-dropdown-button [variant]="variant" [items]="[]" [id]="variant">
        Save
      </andes-dropdown-button>
    }
  `,
})
class VariantsHost {
  readonly variants = ['primary', 'danger', 'outline', 'secondary'] as const;
}

describe('AndesDropdownButton halves', () => {
  it.each(['primary', 'danger', 'outline', 'secondary'])(
    'paints both halves of a %s split button with the same background',
    async (variant) => {
      const fixture = TestBed.createComponent(VariantsHost);
      await settle(fixture);
      const [main, caret] = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          `#${variant} button`,
        ),
      ).map((button) => getComputedStyle(button));

      expect(caret.backgroundColor).toBe(main.backgroundColor);
      expect(caret.color).toBe(main.color);
      fixture.destroy();
    },
  );
});

// ---------------------------------------------------------------------------
// AndesDropdownButton `menuLoading`
// ---------------------------------------------------------------------------

@Component({
  imports: [AndesDropdownButton],
  template: `
    <andes-dropdown-button [menuLoading]="loading()" [items]="[]">
      Save
    </andes-dropdown-button>
  `,
})
class LoadingHost {
  readonly loading = signal(true);
}

describe('AndesDropdownButton menuLoading', () => {
  it('shows the loading state on the caret half only, and stops when turned off', async () => {
    const fixture = TestBed.createComponent(LoadingHost);
    await settle(fixture);
    const busy = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ).map((button) => button.getAttribute('aria-busy'));

    expect(busy()).toEqual([null, 'true']);

    fixture.componentInstance.loading.set(false);
    await settle(fixture);
    expect(busy()).toEqual([null, null]);
    fixture.destroy();
  });
});
