import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesButtonPrimitive } from './button-primitive';

describe('AndesButtonPrimitive', () => {
  describe('on a button element', () => {
    @Component({
      imports: [AndesButtonPrimitive],
      template: `<button andesButtonPrimitive [disabled]="disabled()">
        Save
      </button>`,
    })
    class ButtonHost {
      readonly disabled = signal(false);
    }

    function createHost() {
      const fixture = TestBed.createComponent(ButtonHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      return { fixture, button };
    }

    it('is enabled by default', () => {
      const { button } = createHost();

      expect(button.disabled).toBe(false);
      expect(button.hasAttribute('data-disabled')).toBe(false);
    });

    it('reflects disabled as a native attribute and data-disabled', () => {
      const { fixture, button } = createHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(button.disabled).toBe(true);
      expect(button.getAttribute('data-disabled')).toBe('');
      expect(button.getAttribute('tabindex')).toBe('-1');
    });

    it('never sets aria-disabled, since the native attribute already conveys it', () => {
      const { fixture, button } = createHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(button.hasAttribute('aria-disabled')).toBe(false);
    });
  });

  describe('on an anchor element', () => {
    @Component({
      imports: [AndesButtonPrimitive],
      template: `<a
        andesButtonPrimitive
        href="https://andes-ng.dev"
        [disabled]="disabled()"
        >Save</a
      >`,
    })
    class AnchorHost {
      readonly disabled = signal(false);
    }

    function createHost() {
      const fixture = TestBed.createComponent(AnchorHost);
      fixture.detectChanges();
      const anchor = fixture.nativeElement.querySelector(
        'a',
      ) as HTMLAnchorElement;
      return { fixture, anchor };
    }

    it('never sets the native disabled attribute, since anchors do not support it', () => {
      const { fixture, anchor } = createHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(anchor.hasAttribute('disabled')).toBe(false);
      expect(anchor.getAttribute('data-disabled')).toBe('');
    });

    it('marks aria-disabled only while disabled', () => {
      const { fixture, anchor } = createHost();

      expect(anchor.hasAttribute('aria-disabled')).toBe(false);

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(anchor.getAttribute('aria-disabled')).toBe('true');
      expect(anchor.getAttribute('tabindex')).toBe('-1');
    });

    it('prevents navigation when disabled', () => {
      const { fixture, anchor } = createHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      const event = new MouseEvent('click', { cancelable: true });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('allows navigation when enabled', () => {
      const { anchor } = createHost();

      const event = new MouseEvent('click', { cancelable: true });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });
  describe('on a button kept focusable', () => {
    @Component({
      imports: [AndesButtonPrimitive],
      template: `<button
        andesButtonPrimitive
        [disabled]="disabled()"
        [focusable]="true"
        [tabStop]="tabStop()"
        (click)="clicks = clicks + 1"
      >
        Save
      </button>`,
    })
    class FocusableHost {
      readonly disabled = signal(false);
      readonly tabStop = signal<boolean | undefined>(undefined);
      clicks = 0;
    }

    function createHost() {
      const fixture = TestBed.createComponent(FocusableHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      return { fixture, button };
    }

    it('swaps the native disabled attribute for aria-disabled and stays in the tab order', () => {
      const { fixture, button } = createHost();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('data-disabled')).toBe('');
      expect(button.hasAttribute('tabindex')).toBe(false);
    });

    it('swallows the click while disabled and lets it through otherwise', () => {
      const { fixture, button } = createHost();
      button.click();
      expect(fixture.componentInstance.clicks).toBe(1);

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const event = new MouseEvent('click', {
        cancelable: true,
        bubbles: true,
      });
      button.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.clicks).toBe(1);
    });
  });

  describe('tabStop', () => {
    @Component({
      imports: [AndesButtonPrimitive],
      template: `<button andesButtonPrimitive [tabStop]="tabStop()">
        Save
      </button>`,
    })
    class TabStopHost {
      readonly tabStop = signal<boolean | undefined>(undefined);
    }

    it('takes the button out of the tab sequence only when false', () => {
      const fixture = TestBed.createComponent(TabStopHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      expect(button.hasAttribute('tabindex')).toBe(false);

      fixture.componentInstance.tabStop.set(false);
      fixture.detectChanges();
      expect(button.getAttribute('tabindex')).toBe('-1');

      fixture.componentInstance.tabStop.set(true);
      fixture.detectChanges();
      expect(button.hasAttribute('tabindex')).toBe(false);
    });
  });
});
