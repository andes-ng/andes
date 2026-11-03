import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesLink } from './link';
import { AndesParagraph } from './paragraph';
import { AndesText } from './text';
import { AndesTitle } from './title';

/*
  The copy, copied, edit and external-link glyphs are lucide icons drawn through `<ng-icon>` and
  registered by the components themselves: no test bed here calls `provideIcons`, so an icon
  whose svg is rendered proves the registration is automatic for every selector that shares the
  typography template.
*/

function blank(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') === null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

@Component({
  imports: [AndesText, AndesParagraph, AndesTitle, AndesLink],
  template: `
    <andes-text data-test="text" copyable editable>Text</andes-text>
    <andes-paragraph data-test="paragraph" copyable editable
      >Paragraph</andes-paragraph
    >
    <andes-title data-test="title" copyable editable>Title</andes-title>
    <andes-link href="https://example.com" external externalLabel="Opens a tab"
      >Link</andes-link
    >
  `,
})
class Host {}

describe('typography lucide icons', () => {
  it('draws the copy and edit glyphs in text, paragraph and title', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    for (const part of ['text', 'paragraph', 'title']) {
      const host = el.querySelector(`[data-test="${part}"]`) as HTMLElement;
      const copy = host.querySelector('[data-slot="typography-copy"] ng-icon');
      const edit = host.querySelector('[data-slot="typography-edit"] ng-icon');

      expect(copy?.getAttribute('name')).toBe('lucideCopy');
      expect(copy?.getAttribute('aria-hidden')).toBe('true');
      expect(copy?.querySelector('svg')).not.toBeNull();
      expect(edit?.getAttribute('name')).toBe('lucidePencil');
      expect(edit?.querySelector('svg')).not.toBeNull();
    }
    expect(blank(el)).toEqual([]);
  });

  it('swaps the copy glyph for a check once copied', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector(
      '[data-test="text"] [data-slot="typography-copy"]',
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const icon = button.querySelector('ng-icon');
    expect(icon?.getAttribute('name')).toBe('lucideCheck');
    expect(icon?.querySelector('svg')).not.toBeNull();
  });

  it('draws the external link arrow, announced with its label', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const icon = (fixture.nativeElement as HTMLElement).querySelector(
      '.andes-link__external',
    );

    expect(icon?.tagName).toBe('NG-ICON');
    expect(icon?.getAttribute('name')).toBe('lucideArrowUpRight');
    expect(icon?.getAttribute('role')).toBe('img');
    expect(icon?.getAttribute('aria-label')).toBe('Opens a tab');
    expect(icon?.querySelector('svg')).not.toBeNull();
  });
});
