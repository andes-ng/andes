import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { declaredValue } from '../../testing/computed-style';
import { AndesCheckbox } from './checkbox';
import type {
  AndesCheckboxSize,
  AndesCheckboxStatus,
  AndesCheckboxVariant,
} from './checkbox-types';

/** The checkbox's styles: its own sheet and the shared check motion holding its keyframes. */
function checkboxStyles(): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  return ['checkbox.css', 'check-motion.css']
    .map((file) => readFileSync(join(dir, file), 'utf-8'))
    .join('\n');
}

@Component({
  imports: [AndesCheckbox],
  template: `<andes-checkbox
    [size]="size()"
    [status]="status()"
    [variant]="variant()"
    [indicator]="indicator()"
    [disabled]="disabled()"
    [aria-invalid]="invalid()"
    [(checked)]="checked"
    [(indeterminate)]="indeterminate"
    >Email me</andes-checkbox
  >`,
})
class FeatureHost {
  readonly size = signal<AndesCheckboxSize | undefined>(undefined);
  readonly status = signal<AndesCheckboxStatus | undefined>(undefined);
  readonly variant = signal<AndesCheckboxVariant | undefined>(undefined);
  readonly indicator = signal<boolean | undefined>(undefined);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
}

function render() {
  const fixture = TestBed.createComponent(FeatureHost);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const label = root.querySelector('.andes-checkbox') as HTMLLabelElement;
  const input = root.querySelector('input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, root, label, input };
}

/** Waits past the post-render tick that arms the motion hook. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AndesCheckbox features', () => {
  describe('default markup', () => {
    it('adds no new classes or attributes when none of the new inputs are set', () => {
      const { label, input } = render();

      expect(label.className).toBe('andes-checkbox');
      expect(label.hasAttribute('data-motion')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
      expect(input.hasAttribute('aria-labelledby')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.getAttribute('value')).toBeNull();
    });

    it('keeps the empty description slot out of the layout', () => {
      const { root } = render();
      const description = root.querySelector(
        '.andes-checkbox__description',
      ) as HTMLElement;

      expect(description.childNodes.length).toBe(0);
      expect(description.hasAttribute('id')).toBe(false);
    });
  });

  describe('size', () => {
    it('defaults to md, which adds no modifier class', () => {
      const { label } = render();

      expect(label.classList.contains('andes-checkbox--sm')).toBe(false);
      expect(label.classList.contains('andes-checkbox--lg')).toBe(false);
    });

    it.each(['sm', 'lg'] as const)('adds the %s modifier', (size) => {
      const { fixture, host, label } = render();
      host.size.set(size);
      fixture.detectChanges();

      expect(label.classList.contains(`andes-checkbox--${size}`)).toBe(true);
    });

    it('treats an explicit md like the default', () => {
      const { fixture, host, label } = render();
      host.size.set('md');
      fixture.detectChanges();

      expect(label.className).toBe('andes-checkbox');
    });
  });

  describe('status', () => {
    it('error paints the invalid look and announces aria-invalid', () => {
      const { fixture, host, label, input } = render();
      host.status.set('error');
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--invalid')).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('warning paints the warning look but is not announced as invalid', () => {
      const { fixture, host, label, input } = render();
      host.status.set('warning');
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--warning')).toBe(true);
      expect(label.classList.contains('andes-checkbox--invalid')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('maps the existing aria-invalid input to the same error look', () => {
      const { fixture, host, label, input } = render();
      host.invalid.set(true);
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--invalid')).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears both again when the status is removed', () => {
      const { fixture, host, label, input } = render();
      host.status.set('error');
      fixture.detectChanges();
      host.status.set(undefined);
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--invalid')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('variants', () => {
    it('card adds the card modifier and keeps the box', () => {
      const { fixture, host, label, root } = render();
      host.variant.set('card');
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--card')).toBe(true);
      expect(label.classList.contains('andes-checkbox--no-indicator')).toBe(
        false,
      );
      expect(root.querySelector('.andes-checkbox__box')).not.toBeNull();
    });

    it('a click anywhere on the card (the label) toggles it', () => {
      const { fixture, host, label } = render();
      host.variant.set('card');
      fixture.detectChanges();

      label.click();
      fixture.detectChanges();

      expect(host.checked()).toBe(true);
    });

    it('a disabled card does not toggle', () => {
      const { fixture, host, label } = render();
      host.variant.set('card');
      host.disabled.set(true);
      fixture.detectChanges();

      label.click();
      fixture.detectChanges();

      expect(host.checked()).toBe(false);
      expect(label.classList.contains('andes-checkbox--disabled')).toBe(true);
    });

    it('button hides the box by default but keeps the native input focusable', () => {
      const { fixture, host, label, input } = render();
      host.variant.set('button');
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--button')).toBe(true);
      expect(label.classList.contains('andes-checkbox--no-indicator')).toBe(
        true,
      );
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('indicator brings the box back on a button, and hides it on a card', () => {
      const { fixture, host, label } = render();
      host.variant.set('button');
      host.indicator.set(true);
      fixture.detectChanges();
      expect(label.classList.contains('andes-checkbox--no-indicator')).toBe(
        false,
      );

      host.variant.set('card');
      host.indicator.set(false);
      fixture.detectChanges();
      expect(label.classList.contains('andes-checkbox--no-indicator')).toBe(
        true,
      );
    });

    it('a standalone button is never a segment', () => {
      const { fixture, host, label } = render();
      host.variant.set('button');
      fixture.detectChanges();

      expect(label.classList.contains('andes-checkbox--segment')).toBe(false);
      expect(label.classList.contains('andes-checkbox--segment-vertical')).toBe(
        false,
      );
    });
  });

  describe('motion hook', () => {
    it('does not animate the initial checked state', async () => {
      const fixture = TestBed.createComponent(FeatureHost);
      fixture.componentInstance.checked.set(true);
      fixture.detectChanges();
      await settle();
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.andes-checkbox');
      expect(label.hasAttribute('data-motion')).toBe(false);
    });

    it('marks a later check, indeterminate and uncheck', async () => {
      const { fixture, host, label, input } = render();
      await settle();

      input.click();
      fixture.detectChanges();
      expect(label.getAttribute('data-motion')).toBe('check');

      host.indeterminate.set(true);
      fixture.detectChanges();
      expect(label.getAttribute('data-motion')).toBe('indeterminate');

      host.indeterminate.set(false);
      host.checked.set(false);
      fixture.detectChanges();
      expect(label.getAttribute('data-motion')).toBe('uncheck');
    });

    it('drops the hook once the ripple ends, so a re-shown box does not replay it', async () => {
      const { fixture, label, input } = render();
      await settle();

      input.click();
      fixture.detectChanges();
      const end = (animationName: string) =>
        label.dispatchEvent(
          Object.assign(new Event('animationend', { bubbles: true }), {
            animationName,
          }),
        );

      // The tick and the pop finish first: the ring is still running, so the hook stays.
      end('andes-checkbox-draw');
      fixture.detectChanges();
      expect(label.hasAttribute('data-motion')).toBe(true);

      end('andes-checkbox-ripple');
      fixture.detectChanges();
      expect(label.hasAttribute('data-motion')).toBe(false);
    });

    it('rings the box on every change, not only when it becomes checked', () => {
      const css = checkboxStyles();

      expect(css).toContain('@keyframes andes-checkbox-ripple');
      expect(css).toContain("[data-motion='uncheck'] .andes-checkbox__box");
      expect(css).toContain(
        "[data-motion='indeterminate'] .andes-checkbox__box",
      );
    });

    it('sets the hook for every size and for the card and button variants', async () => {
      const sizes: AndesCheckboxSize[] = ['sm', 'md', 'lg'];
      const variants: (AndesCheckboxVariant | undefined)[] = [
        undefined,
        'card',
        'button',
      ];

      for (const size of sizes) {
        for (const variant of variants) {
          const { fixture, host, label, input } = render();
          host.size.set(size);
          host.variant.set(variant);
          fixture.detectChanges();
          await settle();

          input.click();
          fixture.detectChanges();
          expect(label.getAttribute('data-motion')).toBe('check');

          input.click();
          fixture.detectChanges();
          expect(label.getAttribute('data-motion')).toBe('uncheck');
          fixture.destroy();
        }
      }
    });

    it('grows the ring with the box: 4px on sm, 6px on md and 8px on lg', () => {
      const css = checkboxStyles();

      expect(
        declaredValue(css, '.andes-checkbox', '--_andes-checkbox-ring'),
      ).toBe('0.375rem');
      expect(
        declaredValue(css, '.andes-checkbox--sm', '--_andes-checkbox-ring'),
      ).toBe('0.25rem');
      expect(
        declaredValue(css, '.andes-checkbox--lg', '--_andes-checkbox-ring'),
      ).toBe('0.5rem');
      // Both ring keyframes read the variable, so no size is left with a fixed spread.
      expect(css).not.toContain('0 0 0 6px');
      expect(css).toContain('var(--_andes-checkbox-ring)');
    });

    it('rings the face itself when no box is drawn (a button, or a card without an indicator)', () => {
      const css = checkboxStyles();

      expect(css).toContain(
        ".andes-checkbox--no-indicator[data-motion='check']",
      );
      expect(css).toContain(
        ".andes-checkbox--no-indicator[data-motion='uncheck']",
      );
    });

    it('restarts the ring on a change that follows another one within its second', async () => {
      const css = checkboxStyles();
      // Checking and unchecking play the ring under two names, so back-to-back clicks differ.
      expect(css).toContain('@keyframes andes-checkbox-ripple-alt');

      const { fixture, label, input } = render();
      await settle();
      input.click();
      fixture.detectChanges();
      label.dispatchEvent(
        Object.assign(new Event('animationend', { bubbles: true }), {
          animationName: 'andes-checkbox-ripple-alt',
        }),
      );
      fixture.detectChanges();
      expect(label.hasAttribute('data-motion')).toBe(false);
    });

    it('ignores changes made before the hook is armed', () => {
      const { fixture, host, label } = render();
      host.checked.set(true);
      fixture.detectChanges();

      expect(label.hasAttribute('data-motion')).toBe(false);
    });
  });
});

describe('AndesCheckbox description', () => {
  @Component({
    imports: [AndesCheckbox],
    template: `<andes-checkbox
      [labelPosition]="position()"
      [aria-describedby]="extraDescribedby()"
      [aria-label]="ariaLabel()"
      >Weekly digest
      @if (showDescription()) {
        <span slot="description">One email every Monday</span>
      }
    </andes-checkbox>`,
  })
  class DescriptionHost {
    readonly showDescription = signal(true);
    readonly position = signal<'start' | 'end'>('end');
    readonly extraDescribedby = signal<string | undefined>(undefined);
    readonly ariaLabel = signal<string | undefined>(undefined);
  }

  async function renderDescribed() {
    const fixture = TestBed.createComponent(DescriptionHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      input: root.querySelector('input') as HTMLInputElement,
    };
  }

  it('projects [slot=description] into the description element, not the label', async () => {
    const { root } = await renderDescribed();

    const description = root.querySelector(
      '.andes-checkbox__description',
    ) as HTMLElement;
    const label = root.querySelector('.andes-checkbox__label') as HTMLElement;
    expect(description.textContent?.trim()).toBe('One email every Monday');
    expect(label.textContent?.trim()).toBe('Weekly digest');
  });

  it('links the description with aria-describedby', async () => {
    const { root, input } = await renderDescribed();
    const description = root.querySelector(
      '.andes-checkbox__description',
    ) as HTMLElement;

    expect(description.id).not.toBe('');
    expect(input.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('names the input by the label text alone, so the description is not read twice', async () => {
    const { root, input } = await renderDescribed();
    const label = root.querySelector('.andes-checkbox__label') as HTMLElement;

    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.id).not.toBe('');
  });

  it('keeps an author aria-describedby and appends the description to it', async () => {
    const { fixture, host, root, input } = await renderDescribed();
    host.extraDescribedby.set('hint');
    fixture.detectChanges();

    const description = root.querySelector(
      '.andes-checkbox__description',
    ) as HTMLElement;
    expect(input.getAttribute('aria-describedby')).toBe(
      `hint ${description.id}`,
    );
  });

  it('leaves the name alone when the author set aria-label', async () => {
    const { fixture, host, input } = await renderDescribed();
    host.ariaLabel.set('Digest');
    fixture.detectChanges();

    expect(input.getAttribute('aria-labelledby')).toBeNull();
    expect(input.getAttribute('aria-label')).toBe('Digest');
  });

  it('removes the wiring when the description goes away', async () => {
    const { fixture, host, input } = await renderDescribed();
    host.showDescription.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('works with labelPosition="start" (same slots, mirrored by CSS)', async () => {
    const { fixture, host, root, input } = await renderDescribed();
    host.position.set('start');
    fixture.detectChanges();

    expect(
      root
        .querySelector('.andes-checkbox')
        ?.classList.contains('andes-checkbox--label-start'),
    ).toBe(true);
    expect(input.getAttribute('aria-describedby')).toContain('andes-checkbox-');
  });

  it('toggles when the description itself is clicked (it lives inside the label)', async () => {
    const { fixture, root, input } = await renderDescribed();
    (root.querySelector('[slot=description]') as HTMLElement).click();
    fixture.detectChanges();

    expect(input.checked).toBe(true);
  });
});

describe('AndesCheckbox custom icons', () => {
  @Component({
    imports: [AndesCheckbox],
    template: `
      <ng-template #star
        ><svg class="star" viewBox="0 0 16 16"><path d="M8 1l2 5h5l-4 3" /></svg
      ></ng-template>
      <ng-template #bar
        ><svg class="bar" viewBox="0 0 16 16"></svg
      ></ng-template>
      <andes-checkbox
        [checkedIcon]="useIcons() ? star : undefined"
        [indeterminateIcon]="useIcons() ? bar : undefined"
        >Favorite</andes-checkbox
      >
    `,
  })
  class IconHost {
    readonly useIcons = signal(true);
  }

  it('renders the templates in place of the default tick and dash', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const check = root.querySelector('.andes-checkbox__icon--check');
    const dash = root.querySelector('.andes-checkbox__icon--indeterminate');
    expect(check?.classList.contains('andes-checkbox__icon--custom')).toBe(
      true,
    );
    expect(check?.querySelector('svg.star')).not.toBeNull();
    expect(dash?.querySelector('svg.bar')).not.toBeNull();
    expect(root.querySelector('path[d="M3.5 8.5L6.5 11.5L12.5 4.5"]')).toBe(
      null,
    );
  });

  it('falls back to the default glyphs when unset', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.componentInstance.useIcons.set(false);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.andes-checkbox__icon--custom')).toBeNull();
    expect(
      root.querySelector('path[d="M3.5 8.5L6.5 11.5L12.5 4.5"]'),
    ).not.toBeNull();
  });

  it('keeps the custom glyph decorative (inside the aria-hidden box)', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('.andes-checkbox__box');

    expect(box.getAttribute('aria-hidden')).toBe('true');
    expect(box.querySelector('svg.star')).not.toBeNull();
  });
});

describe('AndesCheckbox object value', () => {
  it('submits no native value for an object (it has no string form)', () => {
    @Component({
      imports: [AndesCheckbox],
      template: `<andes-checkbox [value]="plan">Pro</andes-checkbox>`,
    })
    class ObjectHost {
      readonly plan = { id: 2 };
    }

    const fixture = TestBed.createComponent(ObjectHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');

    expect(input.getAttribute('value')).toBeNull();
  });
});
