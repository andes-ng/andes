import { NgTemplateOutlet } from '@angular/common';
import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { readFileSync } from 'node:fs';

import {
  AndesMentions,
  type AndesMentionsPopupContext,
  type AndesMentionsResize,
  type AndesMentionsResizeEvent,
} from './mentions';
import type { AndesMentionOption } from './mentions-context';

/** jsdom reports zero geometry; a nominal size lets the overlay attach and position. */
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

const PEOPLE: AndesMentionOption[] = [
  { value: 'ana', label: 'Ana Torres', class: 'vip' },
  { value: 'andres', label: 'Andres Vega', class: ['team', 'remote'] },
  { value: 'maria', label: 'Maria Soto' },
];

@Component({
  imports: [AndesMentions, NgTemplateOutlet],
  template: `
    <andes-mentions
      [(value)]="text"
      [options]="options"
      [type]="type()"
      [allowClear]="allowClear()"
      [clearIcon]="customIcon() ? iconTpl : undefined"
      [clearLabel]="clearLabel()"
      [resize]="resize()"
      [autoSize]="autoSize()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [notFoundContent]="notFound()"
      [popupTemplate]="popup() ? popupTpl : null"
      (cleared)="cleared = cleared + 1"
      (popupScroll)="scrolls.push($event)"
      (resized)="sizes.push($event)"
    />
    <ng-template #iconTpl><span class="custom-clear-icon">x</span></ng-template>
    <ng-template #popupTpl let-body let-query="query" let-prefix="prefix">
      <div class="popup-header">Searching {{ prefix }}{{ query }}</div>
      <ng-container *ngTemplateOutlet="body" />
      <div class="popup-footer">Invite someone new</div>
    </ng-template>
  `,
})
class FeaturesHost {
  readonly text = signal('');
  readonly options = PEOPLE;
  readonly type = signal<'textarea' | 'input'>('textarea');
  readonly allowClear = signal(false);
  readonly customIcon = signal(false);
  readonly clearLabel = signal('Clear');
  readonly resize = signal<AndesMentionsResize>('none');
  readonly autoSize = signal<boolean>(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly notFound = signal<string | TemplateRef<unknown> | null>(
    'No matches found',
  );
  readonly popup = signal(false);
  cleared = 0;
  readonly scrolls: Event[] = [];
  readonly sizes: AndesMentionsResizeEvent[] = [];
  readonly mentions = viewChild.required(AndesMentions);
}

@Component({
  imports: [AndesMentions, ReactiveFormsModule],
  template: `<andes-mentions [formControl]="control" allowClear />`,
})
class FormClearHost {
  readonly control = new FormControl('hello', { nonNullable: true });
}

describe('AndesMentions features', () => {
  withElementGeometry();

  function createHost(configure?: (host: FeaturesHost) => void) {
    const fixture = TestBed.createComponent(FeaturesHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    const field = () =>
      fixture.nativeElement.querySelector('.andes-mentions__control') as
        HTMLTextAreaElement | HTMLInputElement;
    const clearButton = () =>
      fixture.nativeElement.querySelector(
        '.andes-mentions__clear',
      ) as HTMLButtonElement | null;
    const wrapper = () =>
      fixture.nativeElement.querySelector(
        '.andes-mentions-wrapper',
      ) as HTMLElement;
    const panel = () =>
      document.querySelector('.andes-mentions-panel') as HTMLElement | null;
    return {
      fixture,
      host: fixture.componentInstance,
      field,
      clearButton,
      wrapper,
      panel,
    };
  }

  type Ctx = ReturnType<typeof createHost>;

  function type(ctx: Ctx, text: string) {
    const field = ctx.field();
    if (document.activeElement !== field) {
      field.focus();
    }
    field.value = text;
    field.setSelectionRange(text.length, text.length);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    ctx.fixture.detectChanges();
    ctx.fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  describe('allowClear', () => {
    it('renders no clear button unless allowClear is set', () => {
      const ctx = createHost();
      type(ctx, 'hello');
      expect(ctx.clearButton()).toBeNull();
      expect(ctx.wrapper().classList).not.toContain(
        'andes-mentions-wrapper--clearable',
      );
    });

    it('shows an accessible, non-submitting button only while there is text', () => {
      const ctx = createHost((host) => host.allowClear.set(true));
      expect(ctx.clearButton()).toBeNull();

      type(ctx, 'hello');
      const button = ctx.clearButton();
      expect(button).not.toBeNull();
      expect(button?.type).toBe('button');
      expect(button?.getAttribute('aria-label')).toBe('Clear');
      expect(ctx.wrapper().classList).toContain(
        'andes-mentions-wrapper--clearable',
      );

      ctx.host.clearLabel.set('Borrar');
      ctx.fixture.detectChanges();
      expect(ctx.clearButton()?.getAttribute('aria-label')).toBe('Borrar');
    });

    it('empties the value, emits cleared, closes the list and returns focus to the field', () => {
      const ctx = createHost((host) => host.allowClear.set(true));
      type(ctx, 'hi @');
      expect(ctx.panel()).not.toBeNull();

      ctx.field().blur();
      ctx.clearButton()?.click();
      ctx.fixture.detectChanges();

      expect(ctx.host.text()).toBe('');
      expect(ctx.field().value).toBe('');
      expect(ctx.host.cleared).toBe(1);
      expect(document.activeElement).toBe(ctx.field());
      expect(ctx.clearButton()).toBeNull();
    });

    it('does not take focus from the field on mousedown', () => {
      const ctx = createHost((host) => host.allowClear.set(true));
      type(ctx, 'hello');

      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      ctx.clearButton()?.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('renders a custom clearIcon in place of the default glyph', () => {
      const ctx = createHost((host) => {
        host.allowClear.set(true);
        host.customIcon.set(true);
      });
      type(ctx, 'hello');

      expect(
        ctx.clearButton()?.querySelector('.custom-clear-icon'),
      ).not.toBeNull();
      expect(
        ctx.clearButton()?.querySelector('.andes-mentions__clear-glyph'),
      ).toBeNull();
    });

    it('hides the button when disabled or read-only', () => {
      const ctx = createHost((host) => {
        host.allowClear.set(true);
        host.text.set('hello');
      });
      expect(ctx.clearButton()).not.toBeNull();

      ctx.host.readonly.set(true);
      ctx.fixture.detectChanges();
      expect(ctx.clearButton()).toBeNull();

      ctx.host.readonly.set(false);
      ctx.host.disabled.set(true);
      ctx.fixture.detectChanges();
      expect(ctx.clearButton()).toBeNull();
    });

    it('works for a single-line field', () => {
      const ctx = createHost((host) => {
        host.type.set('input');
        host.allowClear.set(true);
      });
      type(ctx, 'hello');
      ctx.clearButton()?.click();
      ctx.fixture.detectChanges();

      expect(ctx.field().value).toBe('');
    });

    it('reports the empty value to a form control and marks it dirty', () => {
      const fixture = TestBed.createComponent(FormClearHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        '.andes-mentions__clear',
      ) as HTMLButtonElement;

      button.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.control.value).toBe('');
    });

    it('reserves room for the button and keeps it a 1em disc in the stylesheet', () => {
      const css = readFileSync(
        'packages/ui/src/lib/mentions/mentions.css',
        'utf8',
      );
      expect(css).toMatch(
        /\.andes-mentions-wrapper--clearable \.andes-mentions__control\s*\{[^}]*padding-inline-end/,
      );
      expect(css).toMatch(
        /\.andes-mentions__clear:focus-visible\s*\{[^}]*outline: 2px solid var\(--andes-color-focus-ring\)/,
      );
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.andes-mentions__clear\s*\{\s*transition: none/,
      );
    });
  });

  describe('resize', () => {
    it('is off by default and applies each mode to the wrapper', () => {
      const ctx = createHost();
      expect(ctx.wrapper().classList).toContain(
        'andes-mentions-wrapper--resize-none',
      );

      for (const mode of ['vertical', 'horizontal', 'both'] as const) {
        ctx.host.resize.set(mode);
        ctx.fixture.detectChanges();
        expect(ctx.wrapper().classList).toContain(
          `andes-mentions-wrapper--resize-${mode}`,
        );
      }
    });

    it('is ignored for autoSize and for a single line', () => {
      const ctx = createHost((host) => host.resize.set('both'));
      ctx.host.autoSize.set(true);
      ctx.fixture.detectChanges();
      expect(ctx.wrapper().classList).toContain(
        'andes-mentions-wrapper--resize-none',
      );

      ctx.host.autoSize.set(false);
      ctx.host.type.set('input');
      ctx.fixture.detectChanges();
      expect(ctx.wrapper().classList).toContain(
        'andes-mentions-wrapper--resize-none',
      );
    });

    it('drops the drag handle while disabled', () => {
      const css = readFileSync(
        'packages/ui/src/lib/mentions/mentions.css',
        'utf8',
      );
      expect(css).toMatch(
        /\.andes-mentions-wrapper--disabled\.andes-mentions-wrapper--resize-both\s*\{\s*resize: none/,
      );
    });

    it('emits resized with the new box when it changes', () => {
      let trigger: () => void = () => undefined;
      class FakeResizeObserver {
        constructor(callback: () => void) {
          trigger = callback;
        }
        observe(): void {
          /* noop */
        }
        disconnect(): void {
          /* noop */
        }
      }
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);

      const ctx = createHost((host) => host.resize.set('both'));
      const field = ctx.field();
      Object.defineProperty(field, 'offsetWidth', {
        configurable: true,
        value: 300,
      });
      Object.defineProperty(field, 'offsetHeight', {
        configurable: true,
        value: 90,
      });
      trigger();
      // Same size again: nothing to report.
      trigger();

      expect(ctx.host.sizes).toEqual([{ width: 300, height: 90 }]);
    });
  });

  describe('popupTemplate', () => {
    it('wraps the default body with the template, handing over the query and trigger', () => {
      const ctx = createHost((host) => host.popup.set(true));
      type(ctx, 'hi @an');

      const panel = ctx.panel();
      expect(panel?.querySelector('.popup-header')?.textContent).toContain(
        'Searching @an',
      );
      expect(
        Array.from(panel?.querySelectorAll('.andes-mentions-option') ?? []).map(
          (row) => row.textContent?.trim(),
        ),
      ).toEqual(['Ana Torres', 'Andres Vega']);
      expect(panel?.querySelector('.popup-footer')).not.toBeNull();
    });

    it('keeps the options navigable and pickable inside the wrapper', () => {
      const ctx = createHost((host) => host.popup.set(true));
      type(ctx, '@');

      ctx.field().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true,
          cancelable: true,
        }),
      );
      ctx.fixture.detectChanges();

      expect(ctx.host.text()).toBe('@ana ');
    });

    it('keeps the list open with nothing to show when notFoundContent is null', () => {
      const ctx = createHost((host) => {
        host.popup.set(true);
        host.notFound.set(null);
      });
      type(ctx, '@zzz');

      expect(ctx.panel()).not.toBeNull();
      expect(ctx.panel()?.querySelector('.popup-footer')).not.toBeNull();
    });

    it('closes the list without it when notFoundContent is null', () => {
      const ctx = createHost((host) => host.notFound.set(null));
      type(ctx, '@zzz');

      expect(ctx.panel()).toBeNull();
    });

    it('keeps the caret in the field when pressing the extra content', () => {
      const ctx = createHost((host) => host.popup.set(true));
      type(ctx, '@');

      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      ctx.panel()?.querySelector('.popup-footer')?.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(ctx.field());
    });

    it('exposes a typed context', () => {
      const context: AndesMentionsPopupContext = {
        $implicit: null as unknown as TemplateRef<void>,
        query: 'a',
        prefix: '@',
      };
      expect(context.prefix).toBe('@');
    });
  });

  describe('popupScroll', () => {
    it('relays scroll events of the list', () => {
      const ctx = createHost();
      type(ctx, '@');

      ctx.panel()?.dispatchEvent(new Event('scroll'));

      expect(ctx.host.scrolls.length).toBe(1);
      expect(ctx.host.scrolls[0].type).toBe('scroll');
    });
  });

  describe('option class', () => {
    it('puts a string or a list of classes on the option row', () => {
      const ctx = createHost();
      type(ctx, '@');

      const rows = Array.from(
        document.querySelectorAll<HTMLElement>('.andes-mentions-option'),
      );
      expect(rows[0].classList).toContain('vip');
      expect(rows[0].classList).toContain('andes-mentions-option');
      expect(rows[1].classList).toContain('team');
      expect(rows[1].classList).toContain('remote');
      expect(rows[2].classList.contains('vip')).toBe(false);
    });
  });
});
