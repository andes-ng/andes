import { readFileSync } from 'node:fs';

import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AbstractControl,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { atRuleBody, declaredValue } from '../../testing/computed-style';
import { AndesFormControl } from './form-control';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';

const CSS = readFileSync(
  'packages/ui/src/lib/form-field/form-field.css',
  'utf8',
);

const alwaysBad = (): { custom: string } => ({ custom: 'Same text.' });
const alsoBad = (control: AbstractControl): { other: string } | null =>
  control ? { other: 'Same text.' } : null;

@Component({
  selector: 'andes-test-motion-host',
  imports: [
    ReactiveFormsModule,
    AndesFormField,
    AndesFormControl,
    AndesFormError,
  ],
  template: `<andes-form-field label="Name">
      <input andesFormControl [formControl]="name" />
    </andes-form-field>
    <andes-form-field label="Code">
      <input andesFormControl [formControl]="code" />
      <andes-form-error>Wrong code.</andes-form-error>
    </andes-form-field>
    <andes-form-field label="Twice">
      <input andesFormControl [formControl]="twice" />
    </andes-form-field>`,
})
class MotionHost {
  readonly name = new FormControl('', Validators.required);
  readonly code = new FormControl('', Validators.required);
  readonly twice = new FormControl('', [alwaysBad, alsoBad]);
}

function setup(): {
  fixture: ComponentFixture<MotionHost>;
  el: HTMLElement;
} {
  const fixture = TestBed.createComponent(MotionHost);
  fixture.componentInstance.name.markAsTouched();
  fixture.componentInstance.code.markAsTouched();
  fixture.componentInstance.twice.markAsTouched();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement };
}

describe('AndesFormField - message motion', () => {
  it('slides a generated message in, from 4px above and transparent, over 200ms', () => {
    const { el } = setup();
    const item = el.querySelector(
      '.andes-form-field__help-item',
    ) as HTMLElement;
    const style = getComputedStyle(item);

    expect(style.animation).toContain('andes-form-field-message-in');
    expect(style.animation).toContain('200ms');
    expect(style.overflow).toBe('hidden');
    expect(CSS).toMatch(
      /@keyframes andes-form-field-message-in \{\s*from \{\s*height: 0;\s*opacity: 0;\s*transform: translateY\(-4px\);/,
    );
  });

  it('animates an <andes-form-error> in the same way', () => {
    const { el } = setup();
    const error = el.querySelector('p.andes-form-error') as HTMLElement;

    expect(getComputedStyle(error).animation).toContain(
      'andes-form-field-message-in',
    );
  });

  it('folds a leaving message up and fades it, faster, without catching the pointer', () => {
    const { el } = setup();
    const help = el.querySelector('.andes-form-field__help') as HTMLElement;
    // The class `animate.leave` applies while the message is on its way out.
    help.classList.add('andes-form-field__message--leave');
    const style = getComputedStyle(help);

    expect(style.animation).toContain('andes-form-field-message-out');
    expect(style.animation).toContain('150ms');
    expect(style.animation).toContain('forwards');
    expect(style.pointerEvents).toBe('none');
    expect(CSS).toMatch(
      /@keyframes andes-form-field-message-out \{\s*to \{\s*height: 0;\s*opacity: 0;/,
    );
  });

  it('marks the help block and the authored error for animate.leave', () => {
    const template = readFileSync(
      'packages/ui/src/lib/form-field/form-field.html',
      'utf8',
    );
    const errorSource = readFileSync(
      'packages/ui/src/lib/form-field/form-error.ts',
      'utf8',
    );

    expect(template).toContain(
      'animate.leave="andes-form-field__message--leave"',
    );
    expect(errorSource).toContain(
      'animate.leave="andes-form-field__message--leave"',
    );
  });

  it('keeps an empty messages area in the layout so a leaving message stays visible', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.name.setValue('Ada');
    fixture.detectChanges();
    const messages = el.querySelector(
      '.andes-form-field__messages',
    ) as HTMLElement;

    expect(messages.classList).toContain('andes-form-field__messages--empty');
    expect(getComputedStyle(messages).display).toBe('flex');
    expect(
      declaredValue(CSS, '.andes-form-field__messages', 'interpolate-size'),
    ).toBe('allow-keywords');
    // Under jsdom no animation runs, so the message is removed at once.
    expect(messages.querySelector('.andes-form-field__help')).toBeNull();
  });

  it('switches every message animation off for reduced motion', () => {
    const reduced = atRuleBody(CSS, '@media (prefers-reduced-motion: reduce)');
    const selectors = [
      '.andes-form-field__help-item',
      '.andes-form-error',
      '.andes-form-field__message--leave',
    ];

    for (const selector of selectors) {
      expect(declaredValue(reduced, selector, 'animation')).toBe('none');
    }
  });

  it('shows a message text once when two validators resolve to it', () => {
    const { el } = setup();
    const field = el.querySelectorAll('.andes-form-field')[2];

    expect(
      Array.from(
        field.querySelectorAll('.andes-form-field__help-item'),
        (item) => item.textContent,
      ),
    ).toEqual(['Same text.']);
  });
});
