import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesCascader } from '../cascader/cascader';
import { AndesSelect } from '../select/select';
import { AndesTreeSelect } from '../tree-select/tree-select';
import { AndesEmptyProvider, type AndesEmptyConfig } from './empty-config';

@Component({
  imports: [AndesSelect, AndesTreeSelect, AndesCascader, AndesEmptyProvider],
  template: `
    <section [andesEmptyProvider]="config()">
      <andes-select aria-label="Select" [options]="[]" [open]="true" />
      <andes-tree-select aria-label="TreeSelect" [nodes]="[]" [open]="true" />
      <andes-cascader aria-label="Cascader" [options]="[]" [open]="true" />
    </section>
  `,
})
class IntegrationsHost {
  readonly config = signal<AndesEmptyConfig>({});
}

describe('Empty configuration reaching the components', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const slots = [
    'select-empty',
    'tree-select-empty',
    'cascader-empty',
  ] as const;
  const emptyOf = (slot: string) =>
    document.querySelector(`[data-slot="${slot}"] andes-empty`);

  it('changes the empty state of Select, TreeSelect and Cascader at once', () => {
    const fixture = TestBed.createComponent(IntegrationsHost);
    fixture.detectChanges();

    for (const slot of slots) {
      expect(emptyOf(slot)?.getAttribute('data-image'), slot).toBe('simple');
      expect(emptyOf(slot)?.textContent?.trim(), slot).toBe('No data');
    }

    fixture.componentInstance.config.set({
      image: 'default',
      description: 'Data Not Found',
    });
    fixture.detectChanges();

    for (const slot of slots) {
      expect(emptyOf(slot)?.getAttribute('data-image'), slot).toBe('default');
      expect(emptyOf(slot)?.textContent?.trim(), slot).toBe('Data Not Found');
    }
  });
});
