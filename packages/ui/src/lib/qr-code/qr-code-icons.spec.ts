import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesQrCode, type AndesQrCodeStatus } from './qr-code';

/*
  The refresh and scanned marks are lucide icons drawn through `<ng-icon>` and registered by the
  component itself: this test bed does not call `provideIcons`, so an icon whose svg is rendered
  proves the registration is automatic. The QR symbol is a drawing and stays an svg.
*/
@Component({
  imports: [AndesQrCode],
  template: `<andes-qr-code value="https://andes.example" [status]="status()" />`,
})
class Host {
  readonly status = signal<AndesQrCodeStatus>('active');
}

function glyph(root: HTMLElement): Element | null {
  return root.querySelector('[data-slot="qr-code-cover"] ng-icon');
}

describe('AndesQrCode lucide icons', () => {
  it('draws no icon while the code is active, and keeps the symbol an svg', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('ng-icon')).toBeNull();
    expect(el.querySelector('.andes-qr-code__svg')).not.toBeNull();
  });

  it('draws the refresh arrow in the expired state, hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.status.set('expired');
    fixture.detectChanges();
    const icon = glyph(fixture.nativeElement as HTMLElement);

    expect(icon?.getAttribute('name')).toBe('lucideRotateCw');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('svg')).not.toBeNull();
  });

  it('draws the success circle-check in the scanned state', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.status.set('scanned');
    fixture.detectChanges();
    const icon = glyph(fixture.nativeElement as HTMLElement);

    expect(icon?.getAttribute('name')).toBe('lucideCircleCheckBig');
    expect(icon?.classList).toContain('andes-qr-code__glyph--success');
    expect(icon?.querySelector('svg')).not.toBeNull();
  });
});
