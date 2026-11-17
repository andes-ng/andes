import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';

@Component({
  selector: 'andes-test-checkbox-group-touched-host',
  imports: [ReactiveFormsModule, AndesCheckboxGroup, AndesCheckbox],
  template: `<andes-checkbox-group [formControl]="value">
      <andes-checkbox value="a">A</andes-checkbox>
      <andes-checkbox value="b">B</andes-checkbox>
    </andes-checkbox-group>
    <button type="button">After</button>`,
})
class TouchedHost {
  readonly value = new FormControl<string[]>([], Validators.required);
}

describe('AndesCheckboxGroup touched state', () => {
  function setup() {
    const fixture = TestBed.createComponent(TouchedHost);
    fixture.detectChanges();
    const [first, second] = fixture.nativeElement.querySelectorAll('input');
    const after = fixture.nativeElement.querySelector('button');
    return { fixture, first, second, after };
  }

  it('stays untouched while focus moves between its checkboxes', () => {
    const { fixture, first, second } = setup();

    first.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: second }),
    );

    expect(fixture.componentInstance.value.touched).toBe(false);
  });

  it('is touched once focus leaves the group, without a change', () => {
    const { fixture, second, after } = setup();

    second.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: after }),
    );

    expect(fixture.componentInstance.value.touched).toBe(true);
  });
});
