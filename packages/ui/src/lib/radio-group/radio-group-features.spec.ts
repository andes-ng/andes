import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';
import type {
  AndesRadioChange,
  AndesRadioOptionInput,
  AndesRadioStatus,
  AndesRadioVariant,
} from './radio-group';

/** A macrotask: lets the radio arm its one-shot animation hook after the first render. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Two passes: the first renders, the second lets the description wiring (read after render)
 *  reach the template. */
function render(fixture: { detectChanges(): void }): void {
  fixture.detectChanges();
  fixture.detectChanges();
}

function inputsOf(root: HTMLElement): HTMLInputElement[] {
  return Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type=radio]'),
  );
}

function itemsOf(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('andes-radio'));
}

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
    aria-label="Plan"
    [labelPlacement]="placement()"
    [optionType]="optionType()"
  >
    <andes-radio value="free">
      Free
      <span slot="description">For hobby projects.</span>
    </andes-radio>
    <andes-radio value="pro" aria-describedby="extra-hint">Pro</andes-radio>
    <andes-radio value="team" aria-label="Team plan">
      Team
      <span slot="description">Shared workspaces.</span>
    </andes-radio>
  </andes-radio-group>`,
})
class DescriptionHost {
  readonly placement = signal<'start' | 'end'>('end');
  readonly optionType = signal<'default' | 'button'>('default');
}

@Component({
  imports: [AndesRadioGroup],
  template: `<andes-radio-group aria-label="Plan" [options]="options" />`,
})
class DescribedOptionsHost {
  readonly options: readonly AndesRadioOptionInput[] = [
    { label: 'Free', value: 'free', description: 'For hobby projects.' },
    { label: 'Pro', value: 'pro' },
  ];
}

describe('AndesRadioGroup features', () => {
  describe('description', () => {
    it('links the description with aria-describedby and keeps the name to the label text', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      render(fixture);
      const [free] = inputsOf(fixture.nativeElement);
      const label = fixture.nativeElement.querySelector(
        '.andes-radio__text',
      ) as HTMLElement;
      const description = fixture.nativeElement.querySelector(
        '.andes-radio__description',
      ) as HTMLElement;

      expect(description.textContent?.trim()).toBe('For hobby projects.');
      expect(free.getAttribute('aria-describedby')).toBe(description.id);
      expect(free.getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.textContent?.trim()).toBe('Free');
      expect(label.id).not.toBe('');
      expect(description.id).not.toBe('');
    });

    it('adds no wiring to a radio without a description', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      render(fixture);
      const pro = inputsOf(fixture.nativeElement)[1];
      const text = fixture.nativeElement.querySelectorAll(
        '.andes-radio__text',
      )[1] as HTMLElement;

      expect(pro.hasAttribute('aria-labelledby')).toBe(false);
      expect(text.hasAttribute('id')).toBe(false);
      // The consumer's own aria-describedby is still forwarded, alone.
      expect(pro.getAttribute('aria-describedby')).toBe('extra-hint');
    });

    it('merges its own id after a consumer aria-describedby and respects aria-label', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      render(fixture);
      const team = inputsOf(fixture.nativeElement)[2];
      const description = fixture.nativeElement.querySelectorAll(
        '.andes-radio__description',
      )[2] as HTMLElement;

      expect(team.getAttribute('aria-label')).toBe('Team plan');
      expect(team.hasAttribute('aria-labelledby')).toBe(false);
      expect(team.getAttribute('aria-describedby')).toBe(description.id);
    });

    it('keeps the host free of the forwarded aria attributes', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      render(fixture);

      for (const item of itemsOf(fixture.nativeElement)) {
        expect(item.hasAttribute('aria-labelledby')).toBe(false);
        expect(item.hasAttribute('aria-describedby')).toBe(false);
      }
    });

    it('renders a group option description into the slot', () => {
      const fixture = TestBed.createComponent(DescribedOptionsHost);
      render(fixture);
      const [free, pro] = inputsOf(fixture.nativeElement);
      const description = fixture.nativeElement.querySelector(
        '.andes-radio__description',
      ) as HTMLElement;

      expect(description.textContent?.trim()).toBe('For hobby projects.');
      expect(free.getAttribute('aria-describedby')).toBe(description.id);
      expect(pro.hasAttribute('aria-describedby')).toBe(false);
    });

    it('follows labelPlacement through the item class the stylesheet keys off', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      fixture.componentInstance.placement.set('start');
      render(fixture);

      for (const item of itemsOf(fixture.nativeElement)) {
        expect(item.classList).toContain('andes-radio--label-start');
      }
    });

    it('draws no description in a button segment', () => {
      const fixture = TestBed.createComponent(DescriptionHost);
      fixture.componentInstance.optionType.set('button');
      render(fixture);

      expect(
        fixture.nativeElement.querySelector('.andes-radio__description'),
      ).toBeNull();
      expect(
        inputsOf(fixture.nativeElement)[0].hasAttribute('aria-describedby'),
      ).toBe(false);
    });
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
      aria-label="Plan"
      [variant]="variant()"
      [optionType]="optionType()"
      [options]="options"
      [(value)]="selected"
    />
    <andes-radio class="alone" [variant]="aloneVariant()" value="x"
      >Alone</andes-radio
    >`,
})
class VariantHost {
  readonly variant = signal<AndesRadioVariant>('default');
  readonly aloneVariant = signal<AndesRadioVariant | undefined>(undefined);
  readonly optionType = signal<'default' | 'button'>('default');
  readonly selected = signal<string | null>(null);
  readonly options: readonly AndesRadioOptionInput[] = [
    { label: 'Free', value: 'free', description: 'For hobby projects.' },
    { label: 'Pro', value: 'pro', variant: 'card' },
  ];
}

describe('AndesRadioGroup variant="card"', () => {
  function create() {
    const fixture = TestBed.createComponent(VariantHost);
    render(fixture);
    const group = fixture.nativeElement.querySelector(
      'andes-radio-group',
    ) as HTMLElement;
    return { fixture, host: fixture.componentInstance, group };
  }

  it('is the plain look by default, with no card classes', () => {
    const { fixture, group } = create();

    expect(group.classList).not.toContain('andes-radio-group--card');
    expect(itemsOf(fixture.nativeElement)[0].classList).not.toContain(
      'andes-radio--card',
    );
  });

  it('turns every item of the group into a card', () => {
    const { fixture, host, group } = create();
    host.variant.set('card');
    render(fixture);

    expect(group.classList).toContain('andes-radio-group--card');
    const items = itemsOf(fixture.nativeElement).slice(0, 2);
    for (const item of items) {
      expect(item.classList).toContain('andes-radio--card');
    }
  });

  it('lets one option be a card inside a plain group', () => {
    const { fixture } = create();
    const [free, pro] = itemsOf(fixture.nativeElement);

    expect(free.classList).not.toContain('andes-radio--card');
    expect(pro.classList).toContain('andes-radio--card');
  });

  it('supports a standalone card radio', () => {
    const { fixture, host } = create();
    host.aloneVariant.set('card');
    render(fixture);

    expect(
      fixture.nativeElement.querySelector('andes-radio.alone').classList,
    ).toContain('andes-radio--card');
  });

  it('makes the whole card the label, so clicking its text selects the radio', () => {
    const { fixture, host } = create();
    host.variant.set('card');
    render(fixture);
    const [first] = itemsOf(fixture.nativeElement);
    const label = first.querySelector('label') as HTMLLabelElement;
    const input = first.querySelector('input') as HTMLInputElement;

    expect(label.contains(first.querySelector('.andes-radio__text'))).toBe(
      true,
    );
    expect(
      label.contains(first.querySelector('.andes-radio__description')),
    ).toBe(true);
    expect(label.htmlFor).toBe(input.id);
    first.querySelector<HTMLElement>('.andes-radio__description')?.click();
    render(fixture);

    expect(host.selected()).toBe('free');
    expect(first.classList).toContain('andes-radio--checked');
  });

  it('keeps the button look when optionType="button" is also set (button wins)', () => {
    const { fixture, host, group } = create();
    host.variant.set('card');
    host.optionType.set('button');
    render(fixture);

    expect(group.classList).not.toContain('andes-radio-group--card');
    for (const item of itemsOf(fixture.nativeElement).slice(0, 2)) {
      expect(item.classList).toContain('andes-radio--button');
      expect(item.classList).not.toContain('andes-radio--card');
    }
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
      aria-label="Plan"
      [status]="groupStatus()"
      [aria-invalid]="ariaInvalid()"
    >
      <andes-radio value="a">A</andes-radio>
      <andes-radio value="b" [status]="ownStatus()">B</andes-radio>
    </andes-radio-group>
    <andes-radio class="alone" [status]="aloneStatus()">Alone</andes-radio>`,
})
class StatusHost {
  readonly groupStatus = signal<AndesRadioStatus | undefined>(undefined);
  readonly ownStatus = signal<AndesRadioStatus | undefined>(undefined);
  readonly aloneStatus = signal<AndesRadioStatus | undefined>(undefined);
  readonly ariaInvalid = signal(false);
}

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
    aria-label="Day"
    optionType="button"
    status="warning"
  >
    <andes-radio value="a">Day</andes-radio>
    <andes-radio value="b">Week</andes-radio>
  </andes-radio-group>`,
})
class ButtonStatusHost {}

describe('AndesRadioGroup status', () => {
  function create() {
    const fixture = TestBed.createComponent(StatusHost);
    render(fixture);
    const group = fixture.nativeElement.querySelector(
      'andes-radio-group',
    ) as HTMLElement;
    return { fixture, host: fixture.componentInstance, group };
  }

  it('is neutral by default', () => {
    const { fixture, group } = create();

    expect(group.hasAttribute('aria-invalid')).toBe(false);
    expect(group.classList).not.toContain('andes-radio-group--invalid');
    expect(group.classList).not.toContain('andes-radio-group--warning');
    for (const item of itemsOf(fixture.nativeElement)) {
      expect(item.classList).not.toContain('andes-radio--invalid');
      expect(item.classList).not.toContain('andes-radio--warning');
    }
  });

  it('error paints every item and sets aria-invalid on the radiogroup', () => {
    const { fixture, host, group } = create();
    host.groupStatus.set('error');
    render(fixture);

    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.classList).toContain('andes-radio-group--invalid');
    const [a, b] = itemsOf(fixture.nativeElement);
    expect(a.classList).toContain('andes-radio--invalid');
    expect(b.classList).toContain('andes-radio--invalid');
    // Never on the individual radios: the role does not support it.
    for (const input of inputsOf(fixture.nativeElement).slice(0, 2)) {
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    }
  });

  it('warning paints without announcing the group as invalid', () => {
    const { fixture, host, group } = create();
    host.groupStatus.set('warning');
    render(fixture);

    expect(group.hasAttribute('aria-invalid')).toBe(false);
    expect(group.classList).toContain('andes-radio-group--warning');
    const [a] = itemsOf(fixture.nativeElement);
    expect(a.classList).toContain('andes-radio--warning');
    expect(a.classList).not.toContain('andes-radio--invalid');
  });

  it('keeps aria-invalid working, and lets it win over a warning', () => {
    const { fixture, host, group } = create();
    host.ariaInvalid.set(true);
    host.groupStatus.set('warning');
    render(fixture);

    expect(group.getAttribute('aria-invalid')).toBe('true');
    const [a] = itemsOf(fixture.nativeElement);
    expect(a.classList).toContain('andes-radio--invalid');
    expect(a.classList).not.toContain('andes-radio--warning');
  });

  it('lets an item override the group status', () => {
    const { fixture, host } = create();
    host.groupStatus.set('error');
    host.ownStatus.set('warning');
    render(fixture);
    const [a, b] = itemsOf(fixture.nativeElement);

    expect(a.classList).toContain('andes-radio--invalid');
    expect(b.classList).toContain('andes-radio--warning');
    expect(b.classList).not.toContain('andes-radio--invalid');
  });

  it('sets aria-invalid on the native input of a radio with its own error status', () => {
    const { fixture, host } = create();
    host.ownStatus.set('error');
    host.aloneStatus.set('error');
    render(fixture);
    const inputs = inputsOf(fixture.nativeElement);

    expect(inputs[0].hasAttribute('aria-invalid')).toBe(false);
    expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
    expect(inputs[2].getAttribute('aria-invalid')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('andes-radio.alone').classList,
    ).toContain('andes-radio--invalid');
  });

  it('paints the segments of a button group with a warning', () => {
    const fixture = TestBed.createComponent(ButtonStatusHost);
    render(fixture);

    for (const item of itemsOf(fixture.nativeElement)) {
      expect(item.classList).toContain('andes-radio--button');
      expect(item.classList).toContain('andes-radio--warning');
    }
  });

  it('paints a standalone warning', () => {
    const { fixture, host } = create();
    host.aloneStatus.set('warning');
    render(fixture);

    expect(
      fixture.nativeElement.querySelector('andes-radio.alone').classList,
    ).toContain('andes-radio--warning');
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio, ReactiveFormsModule],
  template: `<andes-radio-group
      aria-label="Letter"
      [readOnly]="readOnly()"
      [formControl]="control"
      [(value)]="selected"
      (selectionChange)="changes.push($event)"
    >
      <andes-radio value="a">A</andes-radio>
      <andes-radio value="b">B</andes-radio>
    </andes-radio-group>
    <andes-radio class="alone" readOnly [(checked)]="aloneChecked"
      >Alone</andes-radio
    >`,
})
class ReadOnlyHost {
  readonly readOnly = signal(true);
  readonly control = new FormControl<string | null>('a');
  readonly selected = signal<string | null>('a');
  readonly aloneChecked = signal(false);
  readonly changes: AndesRadioChange<unknown>[] = [];
}

describe('AndesRadioGroup readOnly', () => {
  function create() {
    const fixture = TestBed.createComponent(ReadOnlyHost);
    render(fixture);
    const group = fixture.nativeElement.querySelector(
      'andes-radio-group',
    ) as HTMLElement;
    return { fixture, host: fixture.componentInstance, group };
  }

  it('is announced as read-only on the radiogroup and marks the items', () => {
    const { fixture, group } = create();

    expect(group.getAttribute('aria-readonly')).toBe('true');
    expect(group.hasAttribute('data-readonly')).toBe(true);
    expect(group.classList).toContain('andes-radio-group--readonly');
    for (const item of itemsOf(fixture.nativeElement).slice(0, 2)) {
      expect(item.classList).toContain('andes-radio--readonly');
      expect(item.hasAttribute('data-readonly')).toBe(true);
    }
  });

  it('does not announce read-only by default', () => {
    const { fixture, host, group } = create();
    host.readOnly.set(false);
    render(fixture);

    expect(group.hasAttribute('aria-readonly')).toBe(false);
    expect(group.classList).not.toContain('andes-radio-group--readonly');
  });

  it('stays focusable and enabled, unlike disabled', () => {
    const { fixture, group } = create();
    const inputs = inputsOf(fixture.nativeElement);

    expect(inputs[0].disabled).toBe(false);
    expect(inputs[1].disabled).toBe(false);
    expect(group.hasAttribute('aria-disabled')).toBe(false);
    expect(itemsOf(fixture.nativeElement)[0].classList).not.toContain(
      'andes-radio--disabled',
    );
  });

  it('refuses a click: no change, no events, the checked item stays checked', () => {
    const { fixture, host } = create();
    const inputs = inputsOf(fixture.nativeElement);

    inputs[1].click();
    render(fixture);

    expect(inputs[1].checked).toBe(false);
    expect(inputs[0].checked).toBe(true);
    expect(host.selected()).toBe('a');
    expect(host.control.value).toBe('a');
    expect(host.changes).toEqual([]);
  });

  it('still takes programmatic writes', () => {
    const { fixture, host } = create();
    host.control.setValue('b');
    render(fixture);

    expect(host.selected()).toBe('b');
    expect(inputsOf(fixture.nativeElement)[1].checked).toBe(true);
  });

  it('selects again once readOnly is switched off', () => {
    const { fixture, host } = create();
    host.readOnly.set(false);
    render(fixture);
    inputsOf(fixture.nativeElement)[1].click();
    render(fixture);

    expect(host.selected()).toBe('b');
    expect(host.changes).toHaveLength(1);
  });

  it('applies to a standalone radio too', () => {
    const { fixture, host } = create();
    const alone = fixture.nativeElement.querySelector(
      'andes-radio.alone',
    ) as HTMLElement;
    const input = alone.querySelector('input') as HTMLInputElement;

    expect(alone.classList).toContain('andes-radio--readonly');
    expect(input.disabled).toBe(false);
    input.click();
    render(fixture);

    expect(input.checked).toBe(false);
    expect(host.aloneChecked()).toBe(false);
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
    aria-label="Letter"
    [columns]="columns()"
    [optionType]="optionType()"
  >
    <andes-radio value="a">A</andes-radio>
    <andes-radio value="b">B</andes-radio>
    <andes-radio value="c">C</andes-radio>
  </andes-radio-group>`,
})
class ColumnsHost {
  readonly columns = signal<unknown>(undefined);
  readonly optionType = signal<'default' | 'button'>('default');
}

describe('AndesRadioGroup columns', () => {
  function create(columns?: unknown) {
    const fixture = TestBed.createComponent(ColumnsHost);
    fixture.componentInstance.columns.set(columns);
    render(fixture);
    const group = fixture.nativeElement.querySelector(
      'andes-radio-group',
    ) as HTMLElement;
    return { fixture, host: fixture.componentInstance, group };
  }

  it('is not a grid by default', () => {
    const { group } = create();

    expect(group.classList).not.toContain('andes-radio-group--columns');
    expect(group.style.getPropertyValue('--andes-radio-group-columns')).toBe(
      '',
    );
  });

  it('exposes the column count to the stylesheet', () => {
    const { group } = create(3);

    expect(group.classList).toContain('andes-radio-group--columns');
    expect(group.style.getPropertyValue('--andes-radio-group-columns')).toBe(
      '3',
    );
  });

  it('accepts a string and floors a fraction', () => {
    expect(
      create('2').group.style.getPropertyValue('--andes-radio-group-columns'),
    ).toBe('2');
    TestBed.resetTestingModule();
    expect(
      create(2.9).group.style.getPropertyValue('--andes-radio-group-columns'),
    ).toBe('2');
  });

  it('ignores 0, negative and non-numeric values', () => {
    for (const bad of [0, -2, 'many', '', null]) {
      TestBed.resetTestingModule();
      const { group } = create(bad);
      expect(group.classList).not.toContain('andes-radio-group--columns');
    }
  });

  it('keeps orientation for the simple cases', () => {
    const { group } = create();

    expect(group.getAttribute('data-orientation')).toBe('vertical');
  });

  it('draws button items as separate buttons, not a segmented bar', () => {
    const { fixture, host } = create();
    host.optionType.set('button');
    host.columns.set(2);
    render(fixture);

    for (const item of itemsOf(fixture.nativeElement)) {
      expect(item.classList).toContain('andes-radio--grid');
      expect(item.classList).not.toContain('andes-radio--horizontal');
      expect(item.classList).not.toContain('andes-radio--vertical');
    }
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
      aria-label="Letter"
      [indicator]="groupIndicator()"
      [showIndicator]="groupShow()"
      [optionType]="optionType()"
      value="a"
    >
      <andes-radio value="a">A</andes-radio>
      <andes-radio value="b" [indicator]="own" [showIndicator]="ownShow()"
        >B</andes-radio
      >
    </andes-radio-group>
    <ng-template #tick><b class="tick">ok</b></ng-template>
    <ng-template #own><i class="own">own</i></ng-template>`,
})
class IndicatorHost {
  readonly tick = viewChild.required<TemplateRef<unknown>>('tick');
  readonly groupIndicator = signal<TemplateRef<unknown> | undefined>(undefined);
  readonly groupShow = signal<boolean | undefined>(undefined);
  readonly ownShow = signal<boolean | undefined>(undefined);
  readonly optionType = signal<'default' | 'button'>('default');
}

describe('AndesRadioGroup indicator', () => {
  function create() {
    const fixture = TestBed.createComponent(IndicatorHost);
    render(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  it('draws the default dot without a template', () => {
    const { fixture } = create();

    expect(
      fixture.nativeElement.querySelectorAll('.andes-radio__dot'),
    ).toHaveLength(2);
    const [a] = itemsOf(fixture.nativeElement);
    expect(a.querySelector('.andes-radio__dot--custom')).toBeNull();
  });

  it('replaces the dot with the group template in every radio that has none of its own', () => {
    const { fixture, host } = create();
    host.groupIndicator.set(host.tick());
    render(fixture);
    const [a, b] = itemsOf(fixture.nativeElement);

    expect(a.querySelector('.andes-radio__dot--custom .tick')).not.toBeNull();
    // The radio's own template wins over the group's.
    expect(b.querySelector('.andes-radio__dot--custom .own')).not.toBeNull();
    expect(b.querySelector('.tick')).toBeNull();
    // Still inside the aria-hidden decorative circle.
    expect(a.querySelector('.andes-radio__control .tick')).not.toBeNull();
  });

  it('hides every circle with showIndicator=false, keeping the native input', () => {
    const { fixture, host } = create();
    host.groupShow.set(false);
    render(fixture);
    const [a, b] = itemsOf(fixture.nativeElement);

    expect(a.querySelector('.andes-radio__control')).toBeNull();
    expect(a.classList).toContain('andes-radio--no-indicator');
    expect(a.querySelector('input[type=radio]')).not.toBeNull();
    expect(b.querySelector('.andes-radio__control')).toBeNull();
  });

  it('lets one radio show its circle in a group that hides them', () => {
    const { fixture, host } = create();
    host.groupShow.set(false);
    host.ownShow.set(true);
    render(fixture);
    const [a, b] = itemsOf(fixture.nativeElement);

    expect(a.querySelector('.andes-radio__control')).toBeNull();
    expect(b.querySelector('.andes-radio__control')).not.toBeNull();
    expect(b.classList).not.toContain('andes-radio--no-indicator');
  });

  it('never draws a circle on a button segment', () => {
    const { fixture, host } = create();
    host.optionType.set('button');
    host.ownShow.set(true);
    render(fixture);

    expect(
      fixture.nativeElement.querySelector('.andes-radio__control'),
    ).toBeNull();
  });
});

interface Plan {
  id: number;
  name: string;
}

@Component({
  imports: [AndesRadioGroup, ReactiveFormsModule],
  template: `<andes-radio-group
      aria-label="Plan"
      [options]="plans"
      [compareWith]="compare()"
      [optionLabel]="label"
      [formControl]="control"
      (selectionChange)="changes.push($event)"
    />
    <ng-template #label let-option let-checked="checked"
      ><span class="lbl">{{ option.label }}:{{ checked }}</span></ng-template
    >`,
})
class CompareHost {
  readonly plans: readonly AndesRadioOptionInput<Plan>[] = [
    { label: 'Free', value: { id: 1, name: 'Free' } },
    { label: 'Pro', value: { id: 2, name: 'Pro' } },
  ];
  readonly control = new FormControl<Plan | null>(null);
  readonly compare = signal<((a: Plan, b: Plan) => boolean) | undefined>(
    (a, b) => a.id === b.id,
  );
  readonly changes: AndesRadioChange<unknown>[] = [];
}

describe('AndesRadioGroup compareWith', () => {
  function create() {
    const fixture = TestBed.createComponent(CompareHost);
    render(fixture);
    return { fixture, host: fixture.componentInstance };
  }

  it('selects the option equal to a written value that is a different object', () => {
    const { fixture, host } = create();
    host.control.setValue({ id: 2, name: 'from the server' });
    render(fixture);
    const inputs = inputsOf(fixture.nativeElement);

    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
    expect(itemsOf(fixture.nativeElement)[1].classList).toContain(
      'andes-radio--checked',
    );
  });

  it('exposes the comparison to the optionLabel context', () => {
    const { fixture, host } = create();
    host.control.setValue({ id: 1, name: 'x' });
    render(fixture);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.lbl'),
    ).map((node) => (node as HTMLElement).textContent);

    expect(labels).toEqual(['Free:true', 'Pro:false']);
  });

  it('matches by identity without compareWith', () => {
    const { fixture, host } = create();
    host.compare.set(undefined);
    host.control.setValue({ id: 2, name: 'Pro' });
    render(fixture);

    expect(inputsOf(fixture.nativeElement).some((input) => input.checked)).toBe(
      false,
    );

    host.control.setValue((host.plans[1] as { value: Plan }).value);
    render(fixture);
    expect(inputsOf(fixture.nativeElement)[1].checked).toBe(true);
  });

  it('reports the option object through the form control and selectionChange', () => {
    const { fixture, host } = create();
    host.control.setValue({ id: 1, name: 'from the server' });
    render(fixture);
    inputsOf(fixture.nativeElement)[1].click();
    render(fixture);

    const pro = (host.plans[1] as { value: Plan }).value;
    expect(host.control.value).toBe(pro);
    expect(host.changes).toHaveLength(1);
    expect(host.changes[0].value).toBe(pro);
    expect(inputsOf(fixture.nativeElement)[0].checked).toBe(false);
  });

  it('never calls the comparison while nothing is selected', () => {
    const { fixture, host } = create();
    const spy = vi.fn((a: Plan, b: Plan) => a.id === b.id);
    host.compare.set(spy);
    render(fixture);

    expect(spy).not.toHaveBeenCalled();
    expect(inputsOf(fixture.nativeElement).some((input) => input.checked)).toBe(
      false,
    );
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<div [attr.dir]="dir()">
    <andes-radio-group aria-label="Letter" [loop]="loop()">
      <andes-radio value="a">A</andes-radio>
      <andes-radio value="b">B</andes-radio>
      <andes-radio value="c">C</andes-radio>
      <andes-radio value="d" disabled>D</andes-radio>
    </andes-radio-group>
  </div>`,
})
class LoopHost {
  readonly loop = signal(true);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

describe('AndesRadioGroup loop', () => {
  function create(loop: boolean, dir: 'ltr' | 'rtl' = 'ltr') {
    const fixture = TestBed.createComponent(LoopHost);
    fixture.componentInstance.loop.set(loop);
    fixture.componentInstance.dir.set(dir);
    render(fixture);
    return { fixture, inputs: inputsOf(fixture.nativeElement) };
  }

  function press(
    input: HTMLInputElement,
    key: string,
    init: KeyboardEventInit = {},
  ): boolean {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    input.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('wraps by default (the native behavior is left alone)', () => {
    const { inputs } = create(true);

    expect(press(inputs[2], 'ArrowRight')).toBe(false);
    expect(press(inputs[2], 'ArrowDown')).toBe(false);
    expect(press(inputs[0], 'ArrowLeft')).toBe(false);
    expect(press(inputs[0], 'ArrowUp')).toBe(false);
  });

  it('stops at the last radio going forward when loop is off', () => {
    const { inputs } = create(false);

    // `d` is disabled, so `c` is the last radio that can take focus.
    expect(press(inputs[2], 'ArrowRight')).toBe(true);
    expect(press(inputs[2], 'ArrowDown')).toBe(true);
  });

  it('stops at the first radio going back when loop is off', () => {
    const { inputs } = create(false);

    expect(press(inputs[0], 'ArrowLeft')).toBe(true);
    expect(press(inputs[0], 'ArrowUp')).toBe(true);
  });

  it('lets the arrows through in the middle and in the other direction', () => {
    const { inputs } = create(false);

    expect(press(inputs[1], 'ArrowRight')).toBe(false);
    expect(press(inputs[1], 'ArrowLeft')).toBe(false);
    expect(press(inputs[0], 'ArrowRight')).toBe(false);
    expect(press(inputs[2], 'ArrowLeft')).toBe(false);
  });

  it('ignores other keys and modified arrows', () => {
    const { inputs } = create(false);

    expect(press(inputs[2], 'Tab')).toBe(false);
    expect(press(inputs[2], 'ArrowRight', { shiftKey: true })).toBe(false);
    expect(press(inputs[2], 'ArrowRight', { ctrlKey: true })).toBe(false);
  });

  it('follows the writing direction for Left and Right', () => {
    const { inputs } = create(false, 'rtl');

    // In right-to-left, ArrowLeft goes forward and ArrowRight goes back.
    expect(press(inputs[2], 'ArrowLeft')).toBe(true);
    expect(press(inputs[2], 'ArrowRight')).toBe(false);
    expect(press(inputs[0], 'ArrowRight')).toBe(true);
    expect(press(inputs[0], 'ArrowLeft')).toBe(false);
  });

  it('is switchable at runtime', () => {
    const { fixture, inputs } = create(true);
    expect(press(inputs[2], 'ArrowRight')).toBe(false);

    fixture.componentInstance.loop.set(false);
    render(fixture);
    expect(press(inputs[2], 'ArrowRight')).toBe(true);
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<button id="before">Before</button>
    <andes-radio-group
      aria-label="Letter"
      [value]="value()"
      (focused)="events.push('focused')"
      (blurred)="events.push('blurred')"
    >
      <andes-radio value="a" disabled>A</andes-radio>
      <andes-radio value="b">B</andes-radio>
      <andes-radio value="c">C</andes-radio>
    </andes-radio-group>
    <button id="after">After</button>`,
})
class FocusHost {
  readonly value = signal<string | null>(null);
  readonly events: string[] = [];
}

describe('AndesRadioGroup focus', () => {
  function create() {
    const fixture = TestBed.createComponent(FocusHost);
    document.body.appendChild(fixture.nativeElement);
    render(fixture);
    const group = fixture.debugElement.children[1]
      .componentInstance as AndesRadioGroup;
    return {
      fixture,
      host: fixture.componentInstance,
      group,
      inputs: inputsOf(fixture.nativeElement),
    };
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focus() lands on the first enabled radio when nothing is checked', () => {
    const { group, inputs } = create();
    group.focus();

    expect(document.activeElement).toBe(inputs[1]);
  });

  it('focus() lands on the checked radio', () => {
    const { fixture, host, group, inputs } = create();
    host.value.set('c');
    render(fixture);
    group.focus();

    expect(document.activeElement).toBe(inputs[2]);
  });

  it('fires focused once when focus enters the group', () => {
    const { host, group } = create();
    group.focus();

    expect(host.events).toEqual(['focused']);
  });

  it('does not fire between the radios of the group', () => {
    const { host, group, inputs } = create();
    group.focus();
    inputs[2].focus();
    inputs[1].focus();

    expect(host.events).toEqual(['focused']);
  });

  it('fires blurred when focus leaves the group', () => {
    const { host, group } = create();
    group.focus();
    (document.getElementById('after') as HTMLElement).focus();

    expect(host.events).toEqual(['focused', 'blurred']);
  });

  it('fires blurred for group.blur() and focused again on re-entry', () => {
    const { host, group } = create();
    group.focus();
    group.blur();
    group.focus();

    expect(host.events).toEqual(['focused', 'blurred', 'focused']);
  });

  it('treats a focus move inside the group as no entry or exit (relatedTarget)', () => {
    const { host, inputs } = create();
    inputs[1].dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, relatedTarget: inputs[2] }),
    );
    inputs[1].dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: inputs[2] }),
    );

    expect(host.events).toEqual([]);
  });
});

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group aria-label="Letter" [(value)]="selected">
    <andes-radio value="a">A</andes-radio>
    <andes-radio value="b">B</andes-radio>
    @for (extra of extras(); track extra) {
      <andes-radio [value]="extra">{{ extra }}</andes-radio>
    }
  </andes-radio-group>`,
})
class MotionHost {
  readonly selected = signal<string | null>(null);
  readonly extras = signal<string[]>([]);
}

/** The `animationend` the ring dispatches (its end bubbles up to the label). */
function ringEnd(name = 'andes-radio-ripple'): Event {
  return Object.assign(new Event('animationend', { bubbles: true }), {
    animationName: name,
  });
}

@Component({
  imports: [AndesRadioGroup, AndesRadio],
  template: `<andes-radio-group
    aria-label="Letter"
    [optionType]="optionType()"
    [variant]="variant()"
    [readOnly]="readOnly()"
    [(value)]="selected"
  >
    <andes-radio value="a">A</andes-radio>
    <andes-radio value="b" [disabled]="bDisabled()">B</andes-radio>
  </andes-radio-group>`,
})
class PressHost {
  readonly selected = signal<string | null>('a');
  readonly optionType = signal<'default' | 'button'>('default');
  readonly variant = signal<AndesRadioVariant>('default');
  readonly readOnly = signal(false);
  readonly bDisabled = signal(false);
}

describe('AndesRadio ring on every click', () => {
  function create(setup: (host: PressHost) => void = () => undefined): {
    fixture: ComponentFixture<PressHost>;
    labels: HTMLElement[];
    inputs: HTMLInputElement[];
  } {
    const fixture = TestBed.createComponent(PressHost);
    setup(fixture.componentInstance);
    render(fixture);
    return {
      fixture,
      labels: Array.from(
        fixture.nativeElement.querySelectorAll('.andes-radio__label'),
      ),
      inputs: inputsOf(fixture.nativeElement),
    };
  }

  it('rings a click on the radio that is already selected, and alternates the hook', async () => {
    const { fixture, labels, inputs } = create();
    await settle();

    inputs[0].click();
    render(fixture);
    expect(inputs[0].checked).toBe(true);
    expect(labels[0].getAttribute('data-motion')).toBe('press');

    // A second click while the ring still runs replays it under the other name.
    inputs[0].click();
    render(fixture);
    expect(labels[0].getAttribute('data-motion')).toBe('press-alt');

    inputs[0].click();
    render(fixture);
    expect(labels[0].getAttribute('data-motion')).toBe('press');
  });

  it('clears the hook only when the ring ends, not on another animation', async () => {
    const { fixture, labels, inputs } = create();
    await settle();

    inputs[0].click();
    render(fixture);
    labels[0].dispatchEvent(ringEnd('something-else'));
    render(fixture);
    expect(labels[0].getAttribute('data-motion')).toBe('press');

    labels[0].dispatchEvent(ringEnd('andes-radio-ripple-alt'));
    render(fixture);
    expect(labels[0].hasAttribute('data-motion')).toBe(false);

    // The next click rings again from a clean state.
    inputs[0].click();
    render(fixture);
    expect(labels[0].getAttribute('data-motion')).toBe('press');
  });

  it('still marks a radio that becomes selected with check, not press', async () => {
    const { fixture, labels, inputs } = create();
    await settle();

    inputs[1].click();
    render(fixture);

    expect(inputs[1].checked).toBe(true);
    expect(labels[1].getAttribute('data-motion')).toBe('check');
    expect(labels[0].hasAttribute('data-motion')).toBe(false);
  });

  it('does not ring before the hook is armed', () => {
    const { fixture, labels, inputs } = create();

    inputs[0].click();
    render(fixture);

    expect(labels[0].hasAttribute('data-motion')).toBe(false);
  });

  it('does not ring a read-only radio, whose click is cancelled', async () => {
    const { fixture, labels, inputs } = create((host) =>
      host.readOnly.set(true),
    );
    await settle();

    inputs[0].click();
    render(fixture);

    expect(labels[0].hasAttribute('data-motion')).toBe(false);
  });

  it('does not ring a disabled radio', async () => {
    const { fixture, labels, inputs } = create((host) => {
      host.selected.set('b');
      host.bDisabled.set(true);
    });
    await settle();

    inputs[1].click();
    render(fixture);

    expect(labels[1].hasAttribute('data-motion')).toBe(false);
  });

  it('rings a selected button option and a selected card the same way', async () => {
    for (const setup of [
      (host: PressHost) => host.optionType.set('button'),
      (host: PressHost) => host.variant.set('card'),
    ]) {
      const { fixture, labels, inputs } = create(setup);
      await settle();

      inputs[0].click();
      render(fixture);

      expect(labels[0].getAttribute('data-motion')).toBe('press');
      fixture.destroy();
    }
  });
});

describe('AndesRadio dot animation hook', () => {
  function labels(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>('.andes-radio__label'),
    );
  }

  it('does not animate a radio that starts checked', async () => {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.componentInstance.selected.set('a');
    render(fixture);
    await settle();
    render(fixture);

    for (const label of labels(fixture.nativeElement)) {
      expect(label.hasAttribute('data-motion')).toBe(false);
    }
  });

  it('marks only the radio that just became checked', async () => {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.componentInstance.selected.set('a');
    render(fixture);
    await settle();

    inputsOf(fixture.nativeElement)[1].click();
    render(fixture);
    const [first, second] = labels(fixture.nativeElement);

    expect(second.getAttribute('data-motion')).toBe('check');
    expect(first.hasAttribute('data-motion')).toBe(false);
  });

  it('drops the hook when the animation ends, and when the radio is unchecked', async () => {
    const fixture = TestBed.createComponent(MotionHost);
    render(fixture);
    await settle();

    inputsOf(fixture.nativeElement)[0].click();
    render(fixture);
    const [first] = labels(fixture.nativeElement);
    expect(first.getAttribute('data-motion')).toBe('check');

    first.dispatchEvent(ringEnd());
    render(fixture);
    expect(first.hasAttribute('data-motion')).toBe(false);

    // Without an animationend (reduced motion never runs one) the next uncheck still resets it.
    fixture.componentInstance.selected.set('b');
    render(fixture);
    fixture.componentInstance.selected.set('a');
    render(fixture);
    expect(first.getAttribute('data-motion')).toBe('check');
    fixture.componentInstance.selected.set('b');
    render(fixture);
    expect(first.hasAttribute('data-motion')).toBe(false);
  });

  it('ignores a selection made before the hook is armed', () => {
    const fixture = TestBed.createComponent(MotionHost);
    render(fixture);
    fixture.componentInstance.selected.set('a');
    render(fixture);

    expect(labels(fixture.nativeElement)[0].hasAttribute('data-motion')).toBe(
      false,
    );
  });

  it('does not animate a radio added later that is already the selection', async () => {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.componentInstance.selected.set('c');
    render(fixture);
    await settle();

    fixture.componentInstance.extras.set(['c']);
    render(fixture);
    await settle();
    render(fixture);

    const added = labels(fixture.nativeElement)[2];
    expect(inputsOf(fixture.nativeElement)[2].checked).toBe(true);
    expect(added.hasAttribute('data-motion')).toBe(false);
  });
});
