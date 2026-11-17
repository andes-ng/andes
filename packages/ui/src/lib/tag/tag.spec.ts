import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesTag,
  AndesTagCloseEvent,
  AndesTagColor,
  AndesTagVariant,
} from './tag';
import { declaredValue, expectLength } from '../../testing/computed-style';
import {
  AndesTagClassNames,
  AndesTagSemantic,
  AndesTagSemanticInfo,
  AndesTagStyles,
} from './tag-semantic';

@Component({
  imports: [AndesTag],
  template: `<andes-tag
    [color]="color()"
    [variant]="variant()"
    [disabled]="disabled()"
    [closable]="closable()"
    [href]="href()"
    [target]="target()"
    [checkable]="checkable()"
    [checked]="checked()"
    [clickable]="clickable()"
    (closed)="onClosed()"
    (checkedChange)="onCheckedChange($event)"
    (tagClick)="onTagClick()"
    >Beta</andes-tag
  >`,
})
class HostComponent {
  readonly color = signal<AndesTagColor>('default');
  readonly variant = signal<AndesTagVariant>('outlined');
  readonly disabled = signal(false);
  readonly closable = signal(false);
  readonly href = signal<string | undefined>(undefined);
  readonly target = signal<string | undefined>(undefined);
  readonly checkable = signal(false);
  readonly checked = signal(false);
  readonly clickable = signal(false);

  closedCount = 0;
  lastChecked: boolean | undefined;
  clickCount = 0;

  onClosed(): void {
    this.closedCount++;
  }

  onCheckedChange(value: boolean): void {
    this.lastChecked = value;
  }

  onTagClick(): void {
    this.clickCount++;
  }
}

describe('AndesTag', () => {
  function queryTag(fixture: ReturnType<typeof TestBed.createComponent>) {
    return fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;
  }

  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, tag: queryTag(fixture) };
  }

  it('renders a static span with the projected label, default color and outlined variant', () => {
    const { tag } = createHost();

    expect(tag.tagName).toBe('SPAN');
    expect(tag.textContent?.trim()).toBe('Beta');
    expect(tag.classList).toContain('andes-tag--color-default');
    expect(tag.classList).toContain('andes-tag--outlined');
  });

  it.each([
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
  ] as const)('supports the %s color', (color) => {
    const { fixture, tag } = createHost();
    fixture.componentInstance.color.set(color);
    fixture.detectChanges();

    expect(tag.classList).toContain(`andes-tag--color-${color}`);
  });

  it.each(['outlined', 'filled', 'solid'] as const)(
    'supports the %s variant',
    (variant) => {
      const { fixture, tag } = createHost();
      fixture.componentInstance.variant.set(variant);
      fixture.detectChanges();

      expect(tag.classList).toContain(`andes-tag--${variant}`);
    },
  );

  it('renders a close button when closable and emits closed on click', () => {
    const { fixture } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector(
      '.andes-tag__close',
    ) as HTMLButtonElement;

    expect(closeButton).toBeTruthy();
    // Regression guard: closable used to sit in its own `@if` branch with its own copy of
    // `<ng-content>`, and Angular only ever renders the projected label into ONE of several
    // structurally-identical `<ng-content>` copies spread across `@if`/`@else if` branches -
    // silently dropping it in every other branch, even though only one is ever in the DOM at
    // a time. Re-querying the tag here (not the `tag` from `createHost()`, which is a
    // reference to the branch that was live *before* this `set(true)` swapped it out) is
    // what makes this assertion meaningful.
    expect(queryTag(fixture).textContent?.trim()).toBe('Beta');
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('does not render a close button by default', () => {
    const { fixture } = createHost();

    expect(
      fixture.nativeElement.querySelector('.andes-tag__close'),
    ).toBeFalsy();
  });

  it('does not emit closed when disabled', () => {
    const { fixture } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector(
      '.andes-tag__close',
    ) as HTMLButtonElement;

    expect(closeButton.disabled).toBe(true);
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(0);
  });

  it('renders as an anchor when href is set', () => {
    const { fixture } = createHost();
    fixture.componentInstance.href.set('https://andes-ng.dev');
    fixture.componentInstance.target.set('_blank');
    fixture.detectChanges();
    const tag = queryTag(fixture) as HTMLAnchorElement;

    expect(tag.tagName).toBe('A');
    expect(tag.getAttribute('href')).toBe('https://andes-ng.dev');
    expect(tag.getAttribute('target')).toBe('_blank');
    expect(tag.textContent?.trim()).toBe('Beta');

    tag.dispatchEvent(new MouseEvent('click', { cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.clickCount).toBe(1);
  });

  it('removes href from the anchor when disabled', () => {
    const { fixture } = createHost();
    fixture.componentInstance.href.set('https://andes-ng.dev');
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture);

    expect(tag.hasAttribute('href')).toBe(false);
  });

  it('closable wins over href - renders a plain span with a close button', () => {
    const { fixture } = createHost();
    fixture.componentInstance.href.set('https://andes-ng.dev');
    fixture.componentInstance.closable.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture);

    expect(tag.tagName).toBe('SPAN');
    expect(
      fixture.nativeElement.querySelector('.andes-tag__close'),
    ).toBeTruthy();
  });

  it('keeps its own font-family on the native <a>/<button> forms, not the page ambient font', () => {
    // Regression guard: `button.andes-tag, a.andes-tag` used to carry `font: inherit`, meant
    // to override the browser's UA default button font - but at (0,1,1) it outranks the
    // plain `.andes-tag { font-family: ... }` rule at (0,1,0) regardless of source order, so
    // it silently won and reset font-family to whatever's ambient (nothing in particular,
    // e.g. the browser's serif default in Storybook) instead of the design system's font.
    const outlined = createHost();
    const outlinedFont = getComputedStyle(outlined.tag).fontFamily;

    const { fixture } = createHost();
    fixture.componentInstance.href.set('https://andes-ng.dev');
    fixture.detectChanges();
    const linkFont = getComputedStyle(queryTag(fixture)).fontFamily;

    fixture.componentInstance.href.set(undefined);
    fixture.componentInstance.checkable.set(true);
    fixture.detectChanges();
    const buttonFont = getComputedStyle(queryTag(fixture)).fontFamily;

    expect(linkFont).toBe(outlinedFont);
    expect(buttonFont).toBe(outlinedFont);
  });

  it('renders as a native button when checkable, ignoring color/variant', () => {
    const { fixture } = createHost();
    fixture.componentInstance.checkable.set(true);
    fixture.componentInstance.color.set('danger');
    fixture.detectChanges();
    const tag = queryTag(fixture);

    expect(tag.tagName).toBe('BUTTON');
    expect(tag.getAttribute('aria-pressed')).toBe('false');
    expect(tag.classList).toContain('andes-tag--checkable');
    expect(tag.classList).not.toContain('andes-tag--color-danger');
    expect(tag.textContent?.trim()).toBe('Beta');
  });

  it('toggles checked state and emits checkedChange on click', () => {
    const { fixture } = createHost();
    fixture.componentInstance.checkable.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture) as HTMLButtonElement;

    tag.click();
    fixture.detectChanges();

    expect(tag.getAttribute('aria-pressed')).toBe('true');
    expect(tag.classList).toContain('andes-tag--checked');
    expect(fixture.componentInstance.lastChecked).toBe(true);

    tag.click();
    fixture.detectChanges();

    expect(tag.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.componentInstance.lastChecked).toBe(false);
  });

  it('respects an initial checked input', () => {
    const { fixture } = createHost();
    fixture.componentInstance.checkable.set(true);
    fixture.componentInstance.checked.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture);

    expect(tag.getAttribute('aria-pressed')).toBe('true');
    expect(tag.classList).toContain('andes-tag--checked');
  });

  it('renders as a native button when clickable and emits tagClick without aria-pressed', () => {
    const { fixture } = createHost();
    fixture.componentInstance.clickable.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture) as HTMLButtonElement;

    expect(tag.tagName).toBe('BUTTON');
    expect(tag.hasAttribute('aria-pressed')).toBe(false);
    expect(tag.textContent?.trim()).toBe('Beta');

    tag.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.clickCount).toBe(1);
  });

  it('does not toggle or click when the interactive tag is disabled', () => {
    const { fixture } = createHost();
    fixture.componentInstance.checkable.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture) as HTMLButtonElement;

    expect(tag.disabled).toBe(true);
    tag.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.lastChecked).toBeUndefined();
  });

  it('falls back to a plain span with a close button when both closable and checkable are set', () => {
    const { fixture } = createHost();
    fixture.componentInstance.closable.set(true);
    fixture.componentInstance.checkable.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture);

    expect(tag.tagName).toBe('SPAN');
    expect(
      fixture.nativeElement.querySelector('.andes-tag__close'),
    ).toBeTruthy();
  });

  it('reflects disabled with the andes-tag--disabled class and native disabled attribute', () => {
    const { fixture } = createHost();
    fixture.componentInstance.checkable.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const tag = queryTag(fixture) as HTMLButtonElement;

    expect(tag.classList).toContain('andes-tag--disabled');
    expect(tag.disabled).toBe(true);
  });

  it('projects both the icon slot and the default label together when closable', () => {
    @Component({
      imports: [AndesTag],
      template: `<andes-tag closable
        ><span slot="icon">icon</span>Beta</andes-tag
      >`,
    })
    class WithIconHost {}

    const fixture = TestBed.createComponent(WithIconHost);
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('[data-slot="tag"]');

    expect(tag.querySelector('[slot=icon]')?.textContent).toBe('icon');
    expect(tag.textContent?.trim()).toBe('iconBeta');
  });

  it('marks only a processing tag so its icon can spin', () => {
    @Component({
      imports: [AndesTag],
      template: `
        <andes-tag id="processing" color="processing">Running</andes-tag>
        <andes-tag id="success" color="success">Done</andes-tag>
      `,
    })
    class StatusHost {}

    const fixture = TestBed.createComponent(StatusHost);
    fixture.detectChanges();
    const tagOf = (id: string) =>
      fixture.nativeElement.querySelector(`#${id} [data-slot="tag"]`);

    expect(tagOf('processing').classList).toContain('andes-tag--processing');
    expect(tagOf('success').classList).not.toContain('andes-tag--processing');
  });

  it('spins the icon of a processing tag and stops under reduced motion (tag.css)', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    ).replace(/\s+/g, ' ');

    expect(css).toContain(
      '.andes-tag--processing .andes-tag__icon ::ng-deep > * { animation: andes-tag-spin 1s linear infinite; }',
    );
    expect(css).toContain(
      '@keyframes andes-tag-spin { to { transform: rotate(360deg); } }',
    );
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\) \{ \.andes-tag--processing \.andes-tag__icon ::ng-deep > \* \{ animation: none; \}/,
    );
  });

  it('treats bare boolean attributes (no brackets) as true, not the string ""', () => {
    @Component({
      imports: [AndesTag],
      template: `<andes-tag closable disabled>Beta</andes-tag>`,
    })
    class BareAttrHost {}

    const fixture = TestBed.createComponent(BareAttrHost);
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector(
      '.andes-tag__close',
    ) as HTMLButtonElement;

    expect(closeButton).toBeTruthy();
    expect(closeButton.disabled).toBe(true);
  });
});

describe('AndesTag custom color', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag [color]="color()" [variant]="variant()"
      >Custom</andes-tag
    >`,
  })
  class ColorHost {
    readonly color = signal<AndesTagColor>('#722ed1');
    readonly variant = signal<AndesTagVariant>('outlined');
  }

  it.each(['outlined', 'filled', 'solid'] as const)(
    'applies an arbitrary CSS color via --andes-tag-color in the %s variant',
    (variant) => {
      const fixture = TestBed.createComponent(ColorHost);
      fixture.componentInstance.variant.set(variant);
      fixture.detectChanges();
      const tag = fixture.nativeElement.querySelector(
        '[data-slot="tag"]',
      ) as HTMLElement;

      expect(tag.classList).toContain('andes-tag--color-custom');
      expect(tag.classList).toContain(`andes-tag--${variant}`);
      expect(tag.style.getPropertyValue('--andes-tag-color')).toBe('#722ed1');
      expect(tag.textContent?.trim()).toBe('Custom');
      // Solid gets black/white text; only outlined/filled derive text from the hue.
      expect(tag.classList.contains('andes-tag--custom-tinted')).toBe(
        variant !== 'solid',
      );
    },
  );

  it('switching back to a preset drops the inline custom color', () => {
    const fixture = TestBed.createComponent(ColorHost);
    fixture.detectChanges();
    fixture.componentInstance.color.set('success');
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;

    expect(tag.classList).toContain('andes-tag--color-success');
    expect(tag.classList).not.toContain('andes-tag--color-custom');
    expect(tag.style.getPropertyValue('--andes-tag-color')).toBe('');
  });

  /** tag.css with whitespace collapsed, so Prettier's line wrapping doesn't matter. */
  function normalizedCss(): string {
    return readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    )
      .replace(/\s+/g, ' ')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')');
  }

  it('derives readable text from the custom color in every variant (tag.css)', () => {
    const supports =
      normalizedCss().match(
        /@supports \(color: lch\(from red l c h\)\) {(.*?) } }/,
      )?.[1] ?? '';

    // Outlined/filled (the base rule): hue kept, lightness clamped per theme.
    expect(supports).toContain(
      '.andes-tag--custom-tinted { color: lch(from var(--andes-tag-color) min(l, 40) c h); }',
    );
    expect(supports).toContain(
      ":host-context([data-andes-theme='dark']) .andes-tag--custom-tinted { color: lch(from var(--andes-tag-color) max(l, 65) c h); }",
    );
    // Solid: black/white at the WCAG luminance tie point (CIE L* 49.44 = Y 0.179).
    expect(supports).toContain(
      '.andes-tag--color-custom.andes-tag--solid { color: lch(from var(--andes-tag-color) clamp(0, (49.44 - l) * 1000, 100) 0 0)',
    );
  });

  it('never splits a :host-context compound selector across lines (Angular shim mis-scopes it)', () => {
    const lines = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    ).split('\n');

    for (const line of lines.filter((l) => l.includes(':host-context('))) {
      expect(line.trimEnd()).toMatch(/[{,]$/);
    }
  });
});

describe('AndesTag bordered', () => {
  it('bordered=false adds the borderless class; bordered is the default', () => {
    @Component({
      imports: [AndesTag],
      template: `<andes-tag [bordered]="bordered()" color="primary"
        >Tag</andes-tag
      >`,
    })
    class BorderHost {
      readonly bordered = signal(true);
    }

    const fixture = TestBed.createComponent(BorderHost);
    fixture.detectChanges();
    const query = () =>
      fixture.nativeElement.querySelector('[data-slot="tag"]') as HTMLElement;

    expect(query().classList).not.toContain('andes-tag--borderless');

    fixture.componentInstance.bordered.set(false);
    fixture.detectChanges();

    expect(query().classList).toContain('andes-tag--borderless');
  });

  it('the borderless rule comes after every color x variant rule, so it wins the tie', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );
    const borderless = css.indexOf('.andes-tag.andes-tag--borderless {');
    const lastVariantRule = css.lastIndexOf('.andes-tag--color-');

    expect(borderless).toBeGreaterThan(lastVariantRule);
  });
});

describe('AndesTag closeIcon', () => {
  @Component({
    imports: [AndesTag],
    template: `<ng-template #icon><span class="custom-x">x</span></ng-template>
      <andes-tag [closeIcon]="icon" (closed)="closedCount = closedCount + 1"
        ><span slot="icon">*</span>Beta</andes-tag
      >`,
  })
  class CloseIconHost {
    closedCount = 0;
  }

  it('implies closable, renders the template in the close button and keeps the label', () => {
    const fixture = TestBed.createComponent(CloseIconHost);
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;
    const closeButton = tag.querySelector(
      '.andes-tag__close',
    ) as HTMLButtonElement;

    expect(tag.classList).toContain('andes-tag--closable');
    expect(closeButton.querySelector('.custom-x')).toBeTruthy();
    expect(closeButton.querySelector('svg')).toBeFalsy();
    // The icon slot is decoration - only the label goes into the name.
    expect(closeButton.getAttribute('aria-label')).toBe('Remove Beta');
    expect(tag.querySelector('[slot=icon]')?.textContent).toBe('*');
    expect(tag.textContent).toContain('Beta');

    closeButton.click();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });
});

describe('AndesTag close event / hideOnClose', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag
      closable
      [hideOnClose]="hideOnClose()"
      (closed)="onClosed($event)"
      >Beta</andes-tag
    >`,
  })
  class CloseHost {
    readonly hideOnClose = signal(false);
    veto = false;
    lastEvent: AndesTagCloseEvent | undefined;

    onClosed(event: AndesTagCloseEvent): void {
      this.lastEvent = event;
      if (this.veto) {
        event.preventDefault();
      }
    }
  }

  function setup(apply: (host: CloseHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(CloseHost);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    const clickClose = () => {
      (
        fixture.nativeElement.querySelector(
          '.andes-tag__close',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
    };
    const tag = () => fixture.nativeElement.querySelector('[data-slot="tag"]');
    return { fixture, clickClose, tag };
  }

  it('emits an AndesTagCloseEvent carrying the original click', () => {
    const { fixture, clickClose } = setup();
    clickClose();
    const event = fixture.componentInstance.lastEvent;

    expect(event).toBeInstanceOf(AndesTagCloseEvent);
    expect(event?.originalEvent).toBeInstanceOf(MouseEvent);
    expect(event?.defaultPrevented).toBe(false);
  });

  it('never removes itself by default (controlled mode)', () => {
    const { clickClose, tag } = setup();
    clickClose();

    expect(tag()).toBeTruthy();
    expect(tag().textContent).toContain('Beta');
  });

  it('hides itself after closing with hideOnClose', () => {
    const { clickClose, tag } = setup((host) => host.hideOnClose.set(true));
    clickClose();

    expect(tag()).toBeFalsy();
  });

  it('stays visible when a handler vetoes the close with preventDefault()', () => {
    const { fixture, clickClose, tag } = setup((host) => {
      host.hideOnClose.set(true);
      host.veto = true;
    });
    clickClose();

    expect(fixture.componentInstance.lastEvent?.defaultPrevented).toBe(true);
    expect(tag()).toBeTruthy();
    expect(tag().textContent).toContain('Beta');
  });
});

describe('AndesTag close button accessible name', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag closable [closeAriaLabel]="closeAriaLabel()">{{
      label()
    }}</andes-tag>`,
  })
  class NameHost {
    readonly label = signal('Urgent');
    readonly closeAriaLabel = signal<string | undefined>(undefined);
  }

  function setup(apply: (host: NameHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(NameHost);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    const closeName = () =>
      (
        fixture.nativeElement.querySelector(
          '.andes-tag__close',
        ) as HTMLButtonElement
      ).getAttribute('aria-label');
    return { fixture, closeName };
  }

  it('names the close button after the tag label by default', () => {
    const { closeName } = setup();

    expect(closeName()).toBe('Remove Urgent');
  });

  it('follows the label when its text changes', () => {
    const { fixture, closeName } = setup();
    fixture.componentInstance.label.set('Low priority');
    fixture.detectChanges();

    expect(closeName()).toBe('Remove Low priority');
  });

  it('uses closeAriaLabel verbatim when set', () => {
    const { closeName } = setup((h) => h.closeAriaLabel.set('Quitar filtro'));

    expect(closeName()).toBe('Quitar filtro');
  });

  it('falls back to plain "Remove" when the tag has no label text', () => {
    const { closeName } = setup((h) => h.label.set(''));

    expect(closeName()).toBe('Remove');
  });
});

describe('AndesTag focus after hideOnClose', () => {
  @Component({
    imports: [AndesTag],
    template: `<button type="button" class="before">Before</button>
      @for (label of labels; track label) {
        <andes-tag closable hideOnClose>{{ label }}</andes-tag>
      }`,
  })
  class RowHost {
    readonly labels = ['One', 'Two', 'Three'];
  }

  function setup() {
    const fixture = TestBed.createComponent(RowHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const closeButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.andes-tag__close'),
    );
    const close = (button: HTMLButtonElement) => {
      button.focus();
      button.click();
      fixture.detectChanges();
    };
    return { fixture, root, closeButtons, close };
  }

  it("moves focus to the next tag's close button", () => {
    const { closeButtons, close } = setup();
    close(closeButtons[1]);

    expect(document.activeElement).toBe(closeButtons[2]);
  });

  it('falls back to the previous tabbable element when the last tag closes', () => {
    const { closeButtons, close } = setup();
    close(closeButtons[2]);

    expect(document.activeElement).toBe(closeButtons[1]);
  });

  it('leaves focus alone when it was not on the tag', () => {
    const { fixture, root, closeButtons } = setup();
    const before = root.querySelector('.before') as HTMLButtonElement;
    before.focus();
    closeButtons[1].click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(before);
  });
});

describe('AndesTag checked two-way binding', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag checkable [(checked)]="on">Beta</andes-tag>`,
  })
  class TwoWayHost {
    readonly on = signal(false);
  }

  it('writes toggles back to the bound signal and reflects external writes', () => {
    const fixture = TestBed.createComponent(TwoWayHost);
    fixture.detectChanges();
    const tag = () =>
      fixture.nativeElement.querySelector(
        '[data-slot="tag"]',
      ) as HTMLButtonElement;

    tag().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.on()).toBe(true);
    expect(tag().getAttribute('aria-pressed')).toBe('true');

    fixture.componentInstance.on.set(false);
    fixture.detectChanges();

    expect(tag().getAttribute('aria-pressed')).toBe('false');
    expect(tag().classList).not.toContain('andes-tag--checked');
  });
});

describe('AndesTag icon slot in every rendering branch', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag
      [href]="href()"
      [checkable]="checkable()"
      [clickable]="clickable()"
      ><span slot="icon" class="ic">*</span>Label</andes-tag
    >`,
  })
  class IconHost {
    readonly href = signal<string | undefined>(undefined);
    readonly checkable = signal(false);
    readonly clickable = signal(false);
  }

  it.each([
    ['span', () => undefined],
    ['link', (h: IconHost) => h.href.set('https://andes-ng.dev')],
    ['checkable', (h: IconHost) => h.checkable.set(true)],
    ['clickable', (h: IconHost) => h.clickable.set(true)],
  ] as const)('projects icon + label in the %s form', (_name, apply) => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    apply(fixture.componentInstance);
    fixture.detectChanges();
    // Re-query: the @if swap replaced the root element.
    const tag = fixture.nativeElement.querySelector('[data-slot="tag"]');

    expect(tag.querySelector('.ic')?.textContent).toBe('*');
    expect(tag.textContent?.trim()).toBe('*Label');
  });
});

describe('AndesTag solid warning variant contrast (WCAG 2.x AA, 4.5:1 for normal text)', () => {
  // Same relative-luminance/contrast formula the Storybook a11y addon (axe-core) uses.
  function relativeLuminance(hex: string): number {
    const channel = (value: number) => {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function contrastRatio(a: string, b: string): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Hex values as defined in packages/tokens/src/theme.css. `warning`/`warning-foreground`
  // are identical between the light `:root` block and the `.dark` block; `warning-active` and
  // `background` are theme-aware, which is exactly what makes the fix below pass in both.
  const warning = '#f59e0b';
  const warningForeground = '#78350f';
  const light = { warningActive: '#b45309', background: '#ffffff' };
  const dark = { warningActive: '#fcd34d', background: '#0f172a' };

  it('documents that the old warning/warning-foreground pairing fails 4.5:1 (4.22:1) - this is the bug the fix below replaces', () => {
    const ratio = contrastRatio(warning, warningForeground);

    expect(ratio).toBeCloseTo(4.22, 1);
    expect(ratio).toBeLessThan(4.5);
  });

  it('verifies warning-active + background clears 4.5:1 in the light theme (5.02:1)', () => {
    const ratio = contrastRatio(light.warningActive, light.background);

    expect(ratio).toBeCloseTo(5.02, 1);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies warning-active + background clears 4.5:1 in the dark theme (12.38:1)', () => {
    const ratio = contrastRatio(dark.warningActive, dark.background);

    expect(ratio).toBeCloseTo(12.38, 1);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('renders the solid warning variant with the verified warning-active + background tokens, not the failing base pair', () => {
    const cssPath = join(process.cwd(), 'packages/ui/src/lib/tag/tag.css');
    const css = readFileSync(cssPath, 'utf8');
    const rule =
      css.match(
        /\.andes-tag--color-warning\.andes-tag--solid\s*{([^}]*)}/,
      )?.[1] ?? '';

    expect(rule).toContain('var(--andes-color-warning-active)');
    expect(rule).toContain('var(--andes-color-background)');
    expect(rule).not.toContain('var(--andes-color-warning)');
    expect(rule).not.toContain('var(--andes-color-warning-foreground)');
  });
});

describe('AndesTag metrics and tints', () => {
  function render(color: AndesTagColor, variant: AndesTagVariant) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.color.set(color);
    fixture.componentInstance.variant.set(variant);
    fixture.detectChanges();
    return getComputedStyle(
      fixture.nativeElement.querySelector('[data-slot="tag"]') as HTMLElement,
    );
  }

  it('sets its label as a 12px caption on a whole-pixel 20px line, landing on 22px', () => {
    const style = render('default', 'outlined');

    expectLength(style.fontSize, '0.75rem');
    expectLength(style.lineHeight, '1.25rem');
    expectLength(style.getPropertyValue('padding-block'), 0);
  });

  it('eases its hover and checked colours instead of snapping them', () => {
    expect(render('primary', 'filled').transition).toContain(
      'background-color var(--andes-motion-duration-fast',
    );
  });

  it('draws filled as a wash with no border, and outlined as the same wash with a 40% border (the two Ant draws)', () => {
    // jsdom doesn't parse color-mix() colors, so this reads the declared rules.
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );
    const rule = (variant: string) => {
      const selector = `.andes-tag--color-warning.andes-tag--${variant}`;
      for (
        let at = css.indexOf(selector);
        at !== -1;
        at = css.indexOf(selector, at + 1)
      ) {
        const rest = css.slice(at + selector.length).trimStart();
        if (rest.startsWith('{')) {
          return rest.slice(1, rest.indexOf('}'));
        }
      }
      return '';
    };

    expect(rule('filled')).toMatch(/border-color:\s*transparent/);
    expect(rule('filled')).toMatch(
      /background-color:\s*color-mix\([^;]*var\(--andes-color-warning-hover\) 10%/,
    );
    expect(rule('outlined')).toMatch(
      /border-color:\s*color-mix\([^;]*var\(--andes-color-warning-hover\) 40%/,
    );
    expect(rule('outlined')).toMatch(
      /background-color:\s*color-mix\([^;]*var\(--andes-color-warning-hover\) 10%/,
    );
  });
});

describe('AndesTag palette and status colors', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag [color]="color()" [variant]="variant()"
      >Tag</andes-tag
    >`,
  })
  class PaletteHost {
    readonly color = signal<AndesTagColor>('magenta');
    readonly variant = signal<AndesTagVariant>('outlined');
  }

  function create(color: AndesTagColor, variant: AndesTagVariant) {
    const fixture = TestBed.createComponent(PaletteHost);
    fixture.componentInstance.color.set(color);
    fixture.componentInstance.variant.set(variant);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;
  }

  it.each(['outlined', 'filled', 'solid'] as const)(
    'feeds a palette name through the custom-color path as its themed custom property (%s)',
    (variant) => {
      const tag = create('magenta', variant);

      expect(tag.classList).toContain('andes-tag--color-custom');
      expect(tag.style.getPropertyValue('--andes-tag-color')).toBe(
        'var(--_andes-palette-magenta)',
      );
      expect(tag.classList.contains('andes-tag--custom-tinted')).toBe(
        variant !== 'solid',
      );
    },
  );

  it.each([
    ['processing', 'info'],
    ['error', 'danger'],
  ] as const)(
    'styles the %s status alias as the %s preset',
    (alias, preset) => {
      const tag = create(alias, 'filled');

      expect(tag.classList).toContain(`andes-tag--color-${preset}`);
      expect(tag.classList).not.toContain('andes-tag--color-custom');
      expect(tag.style.getPropertyValue('--andes-tag-color')).toBe('');
    },
  );
});

describe('AndesTag icon input', () => {
  @Component({
    imports: [AndesTag],
    template: `<ng-template #star><i class="tpl-icon">T</i></ng-template>
      <andes-tag [icon]="star" [checkable]="checkable()"
        ><span slot="icon" class="slot-icon">S</span>Label</andes-tag
      >`,
  })
  class IconInputHost {
    readonly checkable = signal(false);
  }

  it.each([false, true])(
    'renders the template icon before any slot=icon content (checkable: %s)',
    (checkable) => {
      const fixture = TestBed.createComponent(IconInputHost);
      fixture.componentInstance.checkable.set(checkable);
      fixture.detectChanges();
      const tag = fixture.nativeElement.querySelector(
        '[data-slot="tag"]',
      ) as HTMLElement;

      expect(tag.querySelector('.andes-tag__icon .tpl-icon')).toBeTruthy();
      expect(tag.textContent?.replace(/\s+/g, '')).toBe('TSLabel');
    },
  );
});

describe('AndesTag motion hooks', () => {
  const css = () =>
    readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );

  it('styles the enter/leave classes on the host for animate.enter/animate.leave', () => {
    expect(css()).toContain(':host(.andes-tag-enter) {');
    expect(css()).toMatch(
      /:host\(\.andes-tag-leave\),\s*\.andes-tag\.andes-tag-leave {/,
    );
  });

  it('enters and leaves as a near-pure fade, never scaling below 95%', () => {
    const scales = [...css().matchAll(/scale: ([\d.]+);/g)].map((m) =>
      Number(m[1]),
    );

    expect(scales.length).toBeGreaterThan(0);
    expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.95);
  });

  it('plays the leave animation when hideOnClose dismisses the tag', () => {
    const html = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.html'),
      'utf8',
    );

    expect(html).toContain('animate.leave="andes-tag-leave"');
  });

  it('drops every tag animation under prefers-reduced-motion', () => {
    const reduced = css().slice(
      css().indexOf('@media (prefers-reduced-motion: reduce)'),
    );

    expect(reduced).toMatch(
      /:host\(\.andes-tag-enter\),\s*:host\(\.andes-tag-leave\),\s*\.andes-tag\.andes-tag-leave {\s*animation: none;/,
    );
  });
});

describe('AndesTag custom-color tints', () => {
  const css = () =>
    readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    ).replace(/\s+/g, ' ');

  it('gives custom/palette colors the same wash and border strengths as the presets', () => {
    expect(css()).toContain(
      '.andes-tag--color-custom.andes-tag--outlined { background-color: color-mix( in srgb, var(--andes-tag-color) 10%, var(--andes-color-background) ); border-color: color-mix( in srgb, var(--andes-tag-color) 40%, var(--andes-color-background) ); }',
    );
    expect(css()).toContain(
      '.andes-tag--color-custom.andes-tag--filled { border-color: transparent; background-color: color-mix( in srgb, var(--andes-tag-color) 10%, var(--andes-color-background) ); }',
    );
  });

  it('keeps a raw CSS color outlined at full strength, as Ant does, and a palette hue soft', () => {
    expect(css()).toContain(
      '.andes-tag--color-raw.andes-tag--outlined { border-color: var(--andes-tag-color); }',
    );
  });
});

describe('AndesTag closeIcon as a flag', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag
      [closeIcon]="flag()"
      (closed)="closedCount = closedCount + 1"
      >Beta</andes-tag
    >`,
  })
  class FlagHost {
    readonly flag = signal<boolean | '' | null | undefined>(true);
    closedCount = 0;
  }

  function setup(flag: boolean | '' | null | undefined) {
    const fixture = TestBed.createComponent(FlagHost);
    fixture.componentInstance.flag.set(flag);
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;
    return { fixture, tag, close: tag.querySelector('.andes-tag__close') };
  }

  it('closeIcon=true makes the tag closable with the default glyph', () => {
    const { fixture, tag, close } = setup(true);

    expect(tag.classList).toContain('andes-tag--closable');
    expect(close?.querySelector('svg')).toBeTruthy();

    (close as HTMLButtonElement).click();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('reads a bare closeIcon attribute (an empty string) as true', () => {
    expect(setup('').close).toBeTruthy();
  });

  it.each([false, null, undefined])(
    'closeIcon=%s leaves the tag without a close button',
    (flag) => {
      expect(setup(flag).close).toBeNull();
    },
  );

  it("draws lucide's x at 10px: the close button's font size, the icon's 1em", () => {
    const tag = setup(true).tag;
    const icon = tag.querySelector('.andes-tag__close ng-icon');

    expect(icon?.getAttribute('name')).toBe('lucideX');
    expect(icon?.querySelector('svg')).toBeTruthy();
    expect(
      declaredValue(
        readFileSync(
          join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
          'utf8',
        ),
        '.andes-tag__close',
        'font-size',
      ),
    ).toBe('0.625rem');
  });
});

describe('AndesTag classNames and styles', () => {
  @Component({
    imports: [AndesTag],
    template: `<andes-tag
      [variant]="variant()"
      [classNames]="classNames()"
      [styles]="styles()"
      [closable]="closable()"
      ><span slot="icon">*</span>Beta</andes-tag
    >`,
  })
  class SemanticHost {
    readonly variant = signal<AndesTagVariant>('outlined');
    readonly closable = signal(false);
    readonly classNames = signal<
      AndesTagSemantic<AndesTagClassNames> | undefined
    >(undefined);
    readonly styles = signal<AndesTagSemantic<AndesTagStyles> | undefined>(
      undefined,
    );
  }

  function setup(apply: (host: SemanticHost) => void) {
    const fixture = TestBed.createComponent(SemanticHost);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;
    return { fixture, tag };
  }

  it('adds root, icon and content classes from an object', () => {
    const { tag } = setup((host) =>
      host.classNames.set({ root: 'r1 r2', icon: 'i1', content: 'c1' }),
    );

    expect(tag.classList).toContain('andes-tag');
    expect(tag.classList).toContain('r1');
    expect(tag.classList).toContain('r2');
    expect(tag.querySelector('.andes-tag__icon')?.classList).toContain('i1');
    expect(tag.querySelector('.andes-tag__content')?.classList).toContain('c1');
  });

  it('applies root, icon and content styles, kebab-casing keys and adding px to numbers', () => {
    const { tag } = setup((host) =>
      host.styles.set({
        root: {
          backgroundColor: 'rgb(230, 247, 255)',
          paddingInline: 6,
          opacity: 0.5,
        },
        icon: { color: 'rgb(82, 196, 26)' },
        content: { '--story-token': '1', fontWeight: 600 },
      }),
    );
    const icon = tag.querySelector('.andes-tag__icon') as HTMLElement;
    const content = tag.querySelector('.andes-tag__content') as HTMLElement;

    expect(tag.style.backgroundColor).toBe('rgb(230, 247, 255)');
    expect(tag.style.paddingInline).toBe('6px');
    expect(tag.style.opacity).toBe('0.5');
    expect(icon.style.color).toBe('rgb(82, 196, 26)');
    expect(content.style.getPropertyValue('--story-token')).toBe('1');
    expect(content.style.fontWeight).toBe('600');
  });

  it('resolves a function against the tag props, and does nothing when it returns nothing', () => {
    const seen: unknown[] = [];
    const fn = (info: AndesTagSemanticInfo) => {
      seen.push(info.props.variant);
      return info.props.variant === 'filled'
        ? { root: { backgroundColor: 'rgb(245, 239, 255)' } }
        : undefined;
    };
    const { fixture, tag } = setup((host) => host.styles.set(fn));

    expect(tag.style.backgroundColor).toBe('');

    fixture.componentInstance.variant.set('filled');
    fixture.detectChanges();

    expect(seen).toContain('filled');
    expect(
      (fixture.nativeElement.querySelector('[data-slot="tag"]') as HTMLElement)
        .style.backgroundColor,
    ).toBe('rgb(245, 239, 255)');
  });

  it('passes closable and the other props to the function', () => {
    const props: unknown[] = [];
    setup((host) => {
      host.closable.set(true);
      host.classNames.set((info) => {
        props.push(info.props);
        return undefined;
      });
    });

    expect(props.at(-1)).toMatchObject({
      closable: true,
      variant: 'outlined',
      color: 'default',
      disabled: false,
      bordered: true,
    });
  });

  it('keeps the inline custom color next to a root style', () => {
    const fixture = TestBed.createComponent(AndesTag);
    fixture.componentRef.setInput('color', '#f50');
    fixture.componentRef.setInput('styles', { root: { opacity: 0.8 } });
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '[data-slot="tag"]',
    ) as HTMLElement;

    expect(tag.style.getPropertyValue('--andes-tag-color')).toBe('#f50');
    expect(tag.style.opacity).toBe('0.8');
  });
});

describe('AndesTag icon, content and avatar parts', () => {
  @Component({
    imports: [AndesTag],
    template: `<ng-template #tpl><i class="tpl">t</i></ng-template>
      <andes-tag [icon]="withIcon() ? tpl : undefined" [avatar]="avatar()"
        >Label</andes-tag
      >`,
  })
  class PartsHost {
    readonly withIcon = signal(false);
    readonly avatar = signal<string | undefined>(undefined);
  }

  function setup(apply: (host: PartsHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(PartsHost);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    return {
      fixture,
      tag: fixture.nativeElement.querySelector(
        '[data-slot="tag"]',
      ) as HTMLElement,
    };
  }

  it('wraps the label in andes-tag__content and leaves the icon wrapper empty without an icon', () => {
    const { tag } = setup();

    expect(tag.querySelector('.andes-tag__content')?.textContent?.trim()).toBe(
      'Label',
    );
    expect(tag.querySelector('.andes-tag__icon')?.childElementCount).toBe(0);
  });

  it('puts the icon template in the icon wrapper', () => {
    const { tag } = setup((host) => host.withIcon.set(true));

    expect(tag.querySelector('.andes-tag__icon .tpl')).toBeTruthy();
  });

  it('shows a decorative avatar picture before the label', () => {
    const { tag } = setup((host) => host.avatar.set('/me.png'));
    const img = tag.querySelector('.andes-tag__avatar') as HTMLImageElement;

    expect(img.getAttribute('src')).toBe('/me.png');
    expect(img.getAttribute('alt')).toBe('');
    expect(tag.firstElementChild).toBe(img);
  });

  it('renders no avatar by default', () => {
    expect(setup().tag.querySelector('.andes-tag__avatar')).toBeNull();
  });

  it('spaces the icon from the label by 7px and hides an empty icon wrapper', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );

    expect(declaredValue(css, '.andes-tag__icon', 'margin-inline-end')).toBe(
      '0.4375rem',
    );
    expect(declaredValue(css, '.andes-tag__icon:empty', 'display')).toBe(
      'none',
    );
  });

  it('puts the close button 3px after a label and 7px after an icon', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );

    expect(declaredValue(css, '.andes-tag__close', 'margin-inline-start')).toBe(
      '0.1875rem',
    );
    expect(
      declaredValue(
        css,
        '.andes-tag__icon:not(:empty) ~ .andes-tag__close',
        'margin-inline-start',
      ),
    ).toBe('0.4375rem');
  });

  it('lets an svg with its own size keep it, and sizes the others at 1em', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );

    expect(
      declaredValue(
        css,
        '.andes-tag ::ng-deep svg:not([width]):not([height])',
        'width',
      ),
    ).toBe('1em');
  });
});

describe('AndesTag adding and removing tags from a list', () => {
  @Component({
    imports: [AndesTag],
    template: `@for (tag of tags(); track tag) {
      <andes-tag
        closable
        animate.enter="andes-tag-enter"
        animate.leave="andes-tag-leave"
        (closed)="remove(tag)"
        >{{ tag }}</andes-tag
      >
    }`,
  })
  class ListHost {
    readonly tags = signal(['One', 'Two', 'Three']);

    remove(tag: string): void {
      this.tags.update((all) => all.filter((t) => t !== tag));
    }
  }

  function setup() {
    const fixture = TestBed.createComponent(ListHost);
    fixture.detectChanges();
    const labels = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('[data-slot="tag"]'),
      ).map((tag) => (tag as HTMLElement).textContent?.trim());
    return { fixture, labels };
  }

  it('renders one tag per item and appends a new one', () => {
    const { fixture, labels } = setup();

    expect(labels()).toEqual(['One', 'Two', 'Three']);

    fixture.componentInstance.tags.update((all) => [...all, 'Four']);
    fixture.detectChanges();

    expect(labels()).toEqual(['One', 'Two', 'Three', 'Four']);
  });

  it('removes exactly the tag whose close button was clicked', () => {
    const { fixture, labels } = setup();
    const close = fixture.nativeElement.querySelectorAll(
      '.andes-tag__close',
    )[1] as HTMLButtonElement;

    close.click();
    fixture.detectChanges();

    expect(labels()).toEqual(['One', 'Three']);
  });

  it('names each close button after its own tag', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const names = Array.from(
      fixture.nativeElement.querySelectorAll('.andes-tag__close'),
    ).map((button) => (button as HTMLElement).getAttribute('aria-label'));

    expect(names).toEqual(['Remove One', 'Remove Two', 'Remove Three']);
  });
});

describe('AndesTag disabled and checkable surfaces', () => {
  const css = () =>
    readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/tag/tag.css'),
      'utf8',
    );

  it('greys a disabled tag out in every color instead of fading it', () => {
    const rule = css().match(/\.andes-tag--disabled\s*{([^}]*)}/)?.[1] ?? '';

    expect(rule).toContain('cursor: not-allowed');
    expect(rule).toMatch(/border-color:\s*color-mix\(/);
    expect(rule).toMatch(/background-color:\s*color-mix\(/);
    expect(rule).toMatch(/color:\s*color-mix\(/);
    expect(rule.match(/!important/g)).toHaveLength(3);
    expect(rule).not.toContain('opacity');
  });

  it('drops the border of a disabled filled or borderless tag, and the surface of an unchecked checkable one', () => {
    const css_ = css();

    expect(
      declaredValue(
        css_,
        '.andes-tag--disabled.andes-tag--borderless',
        'border-color',
      ),
    ).toBe('transparent !important');
    expect(
      declaredValue(
        css_,
        '.andes-tag--checkable.andes-tag--disabled:not(.andes-tag--checked)',
        'background-color',
      ),
    ).toBe('transparent !important');
  });

  it('leaves an unchecked checkable tag bare until it is hovered or checked', () => {
    const css_ = css();

    expect(
      declaredValue(css_, '.andes-tag--checkable', 'background-color'),
    ).toBe('transparent');
    expect(declaredValue(css_, '.andes-tag--checkable', 'border-color')).toBe(
      'transparent',
    );
    expect(
      declaredValue(
        css_,
        '.andes-tag--checkable:not(.andes-tag--checked):hover:not(:disabled)',
        'color',
      ),
    ).toBe('var(--andes-color-primary-text)');
  });

  it('gives a pressed checkable tag the active primary surface', () => {
    expect(
      declaredValue(
        css(),
        '.andes-tag--checkable:active:not(:disabled)',
        'background-color',
      ),
    ).toBe('var(--andes-color-primary-active)');
  });

  it('sets the close glyph at 10px and half strength until hovered', () => {
    expect(declaredValue(css(), '.andes-tag__close', 'font-size')).toBe(
      '0.625rem',
    );
    expect(declaredValue(css(), '.andes-tag__close', 'opacity')).toBe('0.5');
    expect(
      declaredValue(css(), '.andes-tag__close:hover:not(:disabled)', 'opacity'),
    ).toBe('1');
  });
});

describe('AndesTag palette hues Ant also names', () => {
  it.each(['volcano', 'gold', 'geekblue'])(
    'colors a %s tag from the themed palette hue',
    (hue) => {
      const fixture = TestBed.createComponent(AndesTag);
      fixture.componentRef.setInput('color', hue);
      fixture.detectChanges();
      const tag = fixture.nativeElement.querySelector(
        '[data-slot="tag"]',
      ) as HTMLElement;

      expect(tag.style.getPropertyValue('--andes-tag-color')).toBe(
        `var(--_andes-palette-${hue})`,
      );
      // A palette hue keeps the soft outline; only a raw CSS color gets the full-strength one.
      expect(tag.classList).not.toContain('andes-tag--color-raw');
    },
  );

  it('marks a raw CSS color so its outline stays full strength', () => {
    const fixture = TestBed.createComponent(AndesTag);
    fixture.componentRef.setInput('color', '#f50');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('[data-slot="tag"]') as HTMLElement)
        .classList,
    ).toContain('andes-tag--color-raw');
  });
});
