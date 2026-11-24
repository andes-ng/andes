import { ANDES_OVERLAY_PANE_CLASS } from '@andes-ng/primitives';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesCascader } from '../lib/cascader/cascader';
import { AndesColorPicker } from '../lib/color-picker/color-picker';
import { AndesCombobox } from '../lib/combobox/combobox';
import { AndesComboboxContent } from '../lib/combobox/combobox-content';
import { AndesComboboxInput } from '../lib/combobox/combobox-input';
import { AndesComboboxItem } from '../lib/combobox/combobox-item';
import { AndesDatePicker } from '../lib/date-picker/date-picker';
import { AndesSelect } from '../lib/select/select';
import { AndesTreeSelect } from '../lib/tree-select/tree-select';
import {
  isClosing,
  withElementGeometry,
  withExitAnimations,
} from './overlay-exit';

@Component({
  imports: [
    AndesSelect,
    AndesCascader,
    AndesTreeSelect,
    AndesColorPicker,
    AndesDatePicker,
    AndesCombobox,
    AndesComboboxInput,
    AndesComboboxContent,
    AndesComboboxItem,
  ],
  template: `
    <andes-select aria-label="Select" [options]="options" />
    <andes-cascader aria-label="Cascader" [options]="cascaderOptions" />
    <andes-tree-select aria-label="Tree" [nodes]="nodes" />
    <andes-color-picker aria-label="Colour" />
    <andes-date-picker aria-label="Date" locale="en-US" />
    <andes-combobox [items]="items">
      <input andesComboboxInput />
      <div andesComboboxContent>
        @for (item of items; track item) {
          <div andesComboboxItem [value]="item">{{ item }}</div>
        }
      </div>
    </andes-combobox>
  `,
})
class TriggersHost {
  readonly options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ];
  readonly cascaderOptions = [
    { value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
  ];
  readonly nodes = [
    { key: 'a', title: 'A' },
    { key: 'b', title: 'B' },
  ];
  readonly items = ['x', 'y'];
}

/**
 * Where an overlay opens from the field itself, a press on the field while the panel
 * is still fading out (after Escape) brings that same panel back, the way the popover
 * and the tooltip do: the field decides from what the overlay shows, not from a model
 * that is only told once the panel has gone.
 */
describe('fields opened by their trigger - pressed while the panel is leaving', () => {
  withElementGeometry();
  const exits = withExitAnimations();

  const fields: readonly (readonly [string, string])[] = [
    ['select', 'andes-select [data-slot="select-trigger"]'],
    ['cascader', 'andes-cascader [data-slot="cascader-trigger"]'],
    ['tree select', 'andes-tree-select .andes-tree-select__trigger'],
    ['color picker', 'andes-color-picker button'],
    ['date picker', 'andes-date-picker [data-slot^="date-picker-input"]'],
    ['combobox', 'andes-combobox input'],
  ];

  for (const [name, selector] of fields) {
    it(`brings the ${name} panel back with one press`, async () => {
      const fixture = TestBed.createComponent(TriggersHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const settle = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise((resolve) => setTimeout(resolve, 0));
        fixture.detectChanges();
      };
      const panes = () =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            `.${ANDES_OVERLAY_PANE_CLASS}`,
          ),
        );
      const trigger = fixture.nativeElement.querySelector(
        selector,
      ) as HTMLElement;

      trigger.focus();
      trigger.click();
      await settle();
      const pane = panes()[0];
      expect(pane).toBeTruthy();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        }),
      );
      fixture.detectChanges();
      expect(isClosing(pane)).toBe(true);

      trigger.click();
      await settle();
      expect(panes()).toEqual([pane]);
      expect(isClosing(pane)).toBe(false);
      expect(pane.style.pointerEvents).not.toBe('none');

      exits.finishAll();
      await settle();
      expect(panes()).toEqual([pane]);
      expect(pane.isConnected).toBe(true);
      fixture.destroy();
    });
  }
});
