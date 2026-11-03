import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesForm } from '../form-field/form';
import { AndesFormField } from '../form-field/form-field';
import { AndesButton } from './button';

@Component({
  selector: 'andes-test-button-form-host',
  imports: [AndesForm, AndesFormField, AndesButton],
  template: `<form andesForm size="lg" [disabled]="disabled()">
      <andes-form-field>
        <andes-button type="submit">Save</andes-button>
        <andes-button size="sm">Cancel</andes-button>
      </andes-form-field>
    </form>
    <andes-button class="outside">Outside</andes-button>`,
})
class ButtonFormHost {
  readonly disabled = signal(false);
}

describe('AndesButton in an andesForm', () => {
  it('takes the form size unless it has its own, and never the field id', () => {
    const fixture = TestBed.createComponent(ButtonFormHost);
    fixture.detectChanges();
    const [save, cancel] =
      fixture.nativeElement.querySelectorAll('form button');
    const outside = fixture.nativeElement.querySelector('.outside button');

    expect(save.classList).toContain('andes-button--lg');
    expect(cancel.classList).toContain('andes-button--sm');
    expect(outside.classList).toContain('andes-button--md');
    expect(save.hasAttribute('id')).toBe(false);
  });

  it('is disabled with the form, so a submit button follows the form it submits', () => {
    const fixture = TestBed.createComponent(ButtonFormHost);
    fixture.detectChanges();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const save = fixture.nativeElement.querySelector('form button');

    expect(save.disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.outside button').disabled,
    ).toBe(false);
  });
});
