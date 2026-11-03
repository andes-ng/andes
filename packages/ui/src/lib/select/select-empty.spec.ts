import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesEmptyProvider } from '../empty/empty-config';
import { AndesSelect } from './select';

@Component({
  imports: [AndesSelect, AndesEmptyProvider],
  template: `
    <ng-template #slot><b data-test="slot">Nothing here</b></ng-template>
    <section [andesEmptyProvider]="config()">
      <andes-select
        aria-label="Empty"
        [options]="[]"
        [open]="true"
        [notFoundContent]="notFound()"
      />
    </section>
  `,
})
class EmptySelectHost {
  readonly slot = viewChild.required<TemplateRef<unknown>>('slot');
  readonly notFound = signal<string | TemplateRef<unknown> | null | undefined>(
    undefined,
  );
  readonly config = signal<{ description?: string; image?: 'default' }>({});
}

describe('AndesSelect not-found content', () => {
  function setup() {
    const fixture = TestBed.createComponent(EmptySelectHost);
    fixture.detectChanges();
    const status = () =>
      document.querySelector<HTMLElement>('[data-slot="select-empty"]');
    return { fixture, host: fixture.componentInstance, status };
  }

  it('shows an andes-empty of the select preset by default', () => {
    const { status } = setup();
    const empty = status()?.querySelector('andes-empty');

    expect(empty?.getAttribute('data-size')).toBe('small');
    expect(empty?.getAttribute('data-image')).toBe('simple');
    expect(empty?.textContent?.trim()).toBe('No data');
  });

  it('follows the empty state provider', () => {
    const { fixture, host, status } = setup();
    host.config.set({ description: 'Data Not Found', image: 'default' });
    fixture.detectChanges();
    const empty = status()?.querySelector('andes-empty');

    expect(empty?.textContent?.trim()).toBe('Data Not Found');
    expect(empty?.getAttribute('data-image')).toBe('default');
  });

  it('keeps plain text as plain text', () => {
    const { fixture, host, status } = setup();
    host.notFound.set('Nothing matches');
    fixture.detectChanges();

    expect(status()?.querySelector('andes-empty')).toBeNull();
    expect(status()?.textContent?.trim()).toBe('Nothing matches');
  });

  it('renders a template instead', () => {
    const { fixture, host, status } = setup();
    host.notFound.set(host.slot());
    fixture.detectChanges();

    expect(status()?.querySelector('[data-test="slot"]')).not.toBeNull();
    expect(status()?.querySelector('andes-empty')).toBeNull();
  });

  it('shows nothing for null', () => {
    const { fixture, host, status } = setup();
    host.notFound.set(null);
    fixture.detectChanges();

    expect(status()).toBeNull();
  });
});
