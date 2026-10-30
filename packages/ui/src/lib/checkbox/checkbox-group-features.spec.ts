import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';
import { AndesCheckboxSelectAll } from './checkbox-select-all';
import { AndesCheckboxOption } from './checkbox-option-label';
import type {
  AndesCheckboxGroupLimit,
  AndesCheckboxSize,
  AndesCheckboxStatus,
  AndesCheckboxVariant,
} from './checkbox-types';

@Component({
  imports: [AndesCheckbox, AndesCheckboxGroup, AndesCheckboxSelectAll],
  template: `<andes-checkbox-group
    aria-label="Toppings"
    [(value)]="picked"
    [size]="size()"
    [status]="status()"
    [variant]="variant()"
    [readOnly]="readOnly()"
    [required]="required()"
    [minCount]="minCount()"
    [maxCount]="maxCount()"
    [columns]="columns()"
    (limitReached)="limits.push($event)"
    (changed)="changes.push($event)"
  >
    @if (withSelectAll()) {
      <andes-checkbox andesSelectAll>All</andes-checkbox>
    }
    <andes-checkbox value="ham">Ham</andes-checkbox>
    <andes-checkbox value="olive" [size]="itemSize()">Olive</andes-checkbox>
    <andes-checkbox value="pepper">Pepper</andes-checkbox>
    <andes-checkbox value="onion">Onion</andes-checkbox>
  </andes-checkbox-group>`,
})
class LimitsHost {
  readonly picked = signal<readonly string[]>([]);
  readonly size = signal<AndesCheckboxSize | undefined>(undefined);
  readonly itemSize = signal<AndesCheckboxSize | undefined>(undefined);
  readonly status = signal<AndesCheckboxStatus | undefined>(undefined);
  readonly variant = signal<AndesCheckboxVariant | undefined>(undefined);
  readonly readOnly = signal(false);
  readonly required = signal(false);
  readonly minCount = signal<number | undefined>(undefined);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly columns = signal<number | undefined>(undefined);
  readonly withSelectAll = signal(false);
  readonly limits: AndesCheckboxGroupLimit<string>[] = [];
  readonly changes: (readonly string[])[] = [];
}

function render(setup?: (host: LimitsHost) => void) {
  const fixture = TestBed.createComponent(LimitsHost);
  setup?.(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const group = root.querySelector('andes-checkbox-group') as HTMLElement;
  const inputs = () =>
    Array.from(root.querySelectorAll<HTMLInputElement>('input'));
  const labels = () =>
    Array.from(root.querySelectorAll<HTMLLabelElement>('.andes-checkbox'));
  /** A real click: the browser's own toggle, `preventDefault` and `change` all apply. */
  const click = (input: HTMLInputElement) => {
    input.click();
    fixture.detectChanges();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    group,
    inputs,
    labels,
    click,
  };
}

describe('AndesCheckboxGroup presentation inheritance', () => {
  it('hands its size to every item, and an item size wins', () => {
    const { fixture, host, labels } = render((h) => h.size.set('lg'));
    expect(
      labels().every((l) => l.classList.contains('andes-checkbox--lg')),
    ).toBe(true);

    host.itemSize.set('sm');
    fixture.detectChanges();
    const [ham, olive] = labels();
    expect(ham.classList.contains('andes-checkbox--lg')).toBe(true);
    expect(olive.classList.contains('andes-checkbox--sm')).toBe(true);
    expect(olive.classList.contains('andes-checkbox--lg')).toBe(false);
  });

  it('hands its status to every item: error is announced, warning only painted', () => {
    const { fixture, host, labels, inputs } = render((h) =>
      h.status.set('error'),
    );
    expect(
      inputs().every((i) => i.getAttribute('aria-invalid') === 'true'),
    ).toBe(true);

    host.status.set('warning');
    fixture.detectChanges();
    expect(
      labels().every((l) => l.classList.contains('andes-checkbox--warning')),
    ).toBe(true);
    expect(inputs().some((i) => i.hasAttribute('aria-invalid'))).toBe(false);
  });

  it('variant="card" makes every item a card and spaces the group for cards', () => {
    const { group, labels } = render((h) => h.variant.set('card'));

    expect(group.classList.contains('andes-checkbox-group--card')).toBe(true);
    expect(
      labels().every((l) => l.classList.contains('andes-checkbox--card')),
    ).toBe(true);
  });

  it('variant="button" joins the items into a horizontal segmented row', () => {
    const { group, labels } = render((h) => h.variant.set('button'));

    expect(group.classList.contains('andes-checkbox-group--button')).toBe(true);
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(
      labels().every(
        (l) =>
          l.classList.contains('andes-checkbox--button') &&
          l.classList.contains('andes-checkbox--segment') &&
          l.classList.contains('andes-checkbox--no-indicator'),
      ),
    ).toBe(true);
  });

  it('keeps the default vertical layout and markup when nothing new is set', () => {
    const { group, labels } = render();

    expect(group.className).toBe(
      'andes-checkbox-group andes-checkbox-group--vertical',
    );
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expect(group.hasAttribute('aria-required')).toBe(false);
    expect(group.hasAttribute('style')).toBe(false);
    expect(labels().every((l) => l.className === 'andes-checkbox')).toBe(true);
  });
});

describe('AndesCheckboxGroup columns', () => {
  it('switches to a grid with the column count as a custom property', () => {
    const { group } = render((h) => h.columns.set(3));

    expect(group.classList.contains('andes-checkbox-group--columns')).toBe(
      true,
    );
    expect(group.style.getPropertyValue('--andes-checkbox-group-columns')).toBe(
      '3',
    );
  });

  it('ignores a count below 1', () => {
    const { group } = render((h) => h.columns.set(0));

    expect(group.classList.contains('andes-checkbox-group--columns')).toBe(
      false,
    );
  });

  it('draws a button group in columns as separate buttons, not segments', () => {
    const { labels } = render((h) => {
      h.variant.set('button');
      h.columns.set(2);
    });

    expect(
      labels().some((l) => l.classList.contains('andes-checkbox--segment')),
    ).toBe(false);
  });
});

describe('AndesCheckboxGroup readOnly and required', () => {
  it('readOnly blocks every change but keeps the items enabled and announced', () => {
    const { host, inputs, click } = render((h) => {
      h.readOnly.set(true);
      h.picked.set(['ham']);
    });
    const [ham, olive] = inputs();

    click(olive);
    click(ham);

    expect(host.picked()).toEqual(['ham']);
    expect(olive.disabled).toBe(false);
    expect(
      inputs().every((i) => i.getAttribute('aria-readonly') === 'true'),
    ).toBe(true);
  });

  it('readOnly also freezes select-all', () => {
    const { host, inputs, click } = render((h) => {
      h.readOnly.set(true);
      h.withSelectAll.set(true);
    });

    click(inputs()[0]);

    expect(host.picked()).toEqual([]);
  });

  it('required sets aria-required on the group', () => {
    const { group } = render((h) => h.required.set(true));

    expect(group.getAttribute('aria-required')).toBe('true');
  });
});

describe('AndesCheckboxGroup maxCount', () => {
  it('disables the unchecked items once the limit is reached, and frees them again', () => {
    const { host, inputs, click, labels } = render((h) => h.maxCount.set(2));
    const [ham, olive, pepper, onion] = inputs();

    click(ham);
    click(olive);

    expect(host.picked()).toEqual(['ham', 'olive']);
    expect(pepper.disabled).toBe(true);
    expect(onion.disabled).toBe(true);
    expect(ham.disabled).toBe(false);
    expect(labels()[2].classList.contains('andes-checkbox--disabled')).toBe(
      true,
    );

    click(ham);
    expect(pepper.disabled).toBe(false);
  });

  it('emits limitReached once, when a user change hits the limit', () => {
    const { host, inputs, click } = render((h) => h.maxCount.set(2));
    const [ham, olive] = inputs();

    click(ham);
    expect(host.limits).toEqual([]);
    click(olive);

    expect(host.limits).toEqual([
      { limit: 'max', count: 2, value: ['ham', 'olive'] },
    ]);
  });

  it('does not emit for a programmatic value at the limit', () => {
    const { fixture, host, inputs } = render((h) => h.maxCount.set(2));
    host.picked.set(['ham', 'olive']);
    fixture.detectChanges();

    expect(host.limits).toEqual([]);
    expect(inputs()[2].disabled).toBe(true);
  });

  it('lets select-all fill only up to the limit, then clear', () => {
    const { host, inputs, click } = render((h) => {
      h.maxCount.set(2);
      h.withSelectAll.set(true);
    });
    const [all] = inputs();

    click(all);
    expect(host.picked()).toEqual(['ham', 'olive']);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    click(all);
    expect(host.picked()).toEqual([]);
    expect(all.checked).toBe(false);
  });

  it('keeps select-all usable (never disabled by the limit)', () => {
    const { host, inputs } = render((h) => {
      h.maxCount.set(1);
      h.withSelectAll.set(true);
      h.picked.set(['ham']);
    });

    expect(inputs()[0].disabled).toBe(false);
    expect(host.picked()).toEqual(['ham']);
  });
});

describe('AndesCheckboxGroup minCount', () => {
  it('blocks unchecking the last allowed item and reports it', () => {
    const { host, inputs, click } = render((h) => {
      h.minCount.set(1);
      h.picked.set(['ham']);
    });
    const [ham] = inputs();

    click(ham);

    expect(ham.checked).toBe(true);
    expect(host.picked()).toEqual(['ham']);
    expect(host.changes).toEqual([]);
    expect(host.limits).toEqual([{ limit: 'min', count: 1, value: ['ham'] }]);
  });

  it('allows unchecking while above the minimum', () => {
    const { host, inputs, click } = render((h) => {
      h.minCount.set(1);
      h.picked.set(['ham', 'olive']);
    });

    click(inputs()[0]);

    expect(host.picked()).toEqual(['olive']);
  });

  it('makes select-all keep the first minCount selections when clearing', () => {
    const { host, inputs, click } = render((h) => {
      h.minCount.set(1);
      h.withSelectAll.set(true);
      h.picked.set(['ham', 'olive', 'pepper', 'onion']);
    });
    const [all] = inputs();

    click(all);

    expect(host.picked()).toEqual(['ham']);
    expect(all.indeterminate).toBe(true);
  });

  it('snaps select-all back when its click changes nothing', () => {
    const { host, inputs, click } = render((h) => {
      h.minCount.set(4);
      h.withSelectAll.set(true);
      h.picked.set(['ham', 'olive', 'pepper', 'onion']);
    });
    const [all] = inputs();

    click(all);

    expect(host.picked()).toEqual(['ham', 'olive', 'pepper', 'onion']);
    expect(all.checked).toBe(true);
    expect(host.changes).toEqual([]);
  });
});

describe('AndesCheckboxGroup form validity', () => {
  @Component({
    imports: [AndesCheckbox, AndesCheckboxGroup, ReactiveFormsModule],
    template: `<andes-checkbox-group
      aria-label="Days"
      [formControl]="control"
      [required]="required()"
      [minCount]="minCount()"
      [maxCount]="maxCount()"
    >
      <andes-checkbox value="mon">Mon</andes-checkbox>
      <andes-checkbox value="tue">Tue</andes-checkbox>
      <andes-checkbox value="wed">Wed</andes-checkbox>
    </andes-checkbox-group>`,
  })
  class FormHost {
    readonly control = new FormControl<readonly string[]>([], {
      nonNullable: true,
    });
    readonly required = signal(false);
    readonly minCount = signal<number | undefined>(undefined);
    readonly maxCount = signal<number | undefined>(undefined);
  }

  function renderForm(setup?: (host: FormHost) => void) {
    const fixture = TestBed.createComponent(FormHost);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    const inputs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('input'),
    );
    return { fixture, host: fixture.componentInstance, inputs };
  }

  it('is invalid while required and empty, valid once something is checked', () => {
    const { fixture, host, inputs } = renderForm((h) => h.required.set(true));

    expect(host.control.errors).toEqual({ required: true });

    inputs[1].click();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['tue']);
    expect(host.control.valid).toBe(true);
  });

  it('re-validates when required is switched on later', () => {
    const { fixture, host } = renderForm();
    expect(host.control.valid).toBe(true);

    host.required.set(true);
    fixture.detectChanges();

    expect(host.control.hasError('required')).toBe(true);
  });

  it('reports a written value outside minCount / maxCount', () => {
    const { fixture, host } = renderForm((h) => {
      h.minCount.set(2);
      h.maxCount.set(2);
    });
    host.control.setValue(['mon']);
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ minCount: { min: 2, actual: 1 } });

    host.control.setValue(['mon', 'tue', 'wed']);
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ maxCount: { max: 2, actual: 3 } });
  });

  it('still disables a limit-reached item under a form control', () => {
    const { fixture, host, inputs } = renderForm((h) => h.maxCount.set(1));
    host.control.setValue(['mon']);
    fixture.detectChanges();

    expect(inputs[1].disabled).toBe(true);
    host.control.disable();
    fixture.detectChanges();
    expect(inputs.every((i) => i.disabled)).toBe(true);
    host.control.enable();
    fixture.detectChanges();
    expect(inputs[0].disabled).toBe(false);
    expect(inputs[1].disabled).toBe(true);
  });
});

interface Plan {
  readonly id: number;
  readonly name: string;
}

describe('AndesCheckboxGroup compareWith', () => {
  @Component({
    imports: [AndesCheckboxGroup, FormsModule],
    template: `<andes-checkbox-group
      aria-label="Plans"
      [options]="plans"
      [compareWith]="byId"
      [(ngModel)]="picked"
    />`,
  })
  class ObjectHost {
    readonly plans: AndesCheckboxOption<Plan>[] = [
      { label: 'Basic', value: { id: 1, name: 'Basic' } },
      {
        label: 'Pro',
        value: { id: 2, name: 'Pro' },
        description: 'Everything in Basic',
      },
      { label: 'Team', value: { id: 3, name: 'Team' } },
    ];
    /** Fresh objects, as if fetched separately from the option list. */
    picked: readonly Plan[] = [{ id: 3, name: 'Team (saved)' }];
    readonly byId = (a: Plan, b: Plan) => a.id === b.id;
  }

  async function renderObjects() {
    const fixture = TestBed.createComponent(ObjectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const inputs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('input'),
    );
    return { fixture, host: fixture.componentInstance, inputs };
  }

  it('matches object values that are not the same references', async () => {
    const { inputs } = await renderObjects();

    expect(inputs.map((i) => i.checked)).toEqual([false, false, true]);
  });

  it('emits the parent objects for matches and the option objects for new picks', async () => {
    const { fixture, host, inputs } = await renderObjects();

    inputs[0].click();
    fixture.detectChanges();

    expect(host.picked).toEqual([
      { id: 1, name: 'Basic' },
      { id: 3, name: 'Team (saved)' },
    ]);
  });

  it('unchecks the matching entry even though it is a different object', async () => {
    const { fixture, host, inputs } = await renderObjects();

    inputs[2].click();
    fixture.detectChanges();

    expect(host.picked).toEqual([]);
  });

  it('renders an option description and links it to its checkbox', async () => {
    const { fixture } = await renderObjects();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const pro = root.querySelectorAll('andes-checkbox')[1];
    const description = pro.querySelector(
      '.andes-checkbox__description',
    ) as HTMLElement;

    expect(description.textContent?.trim()).toBe('Everything in Basic');
    expect(pro.querySelector('input')?.getAttribute('aria-describedby')).toBe(
      description.id,
    );
  });
});

describe('AndesCheckboxGroup option variants', () => {
  @Component({
    imports: [AndesCheckboxGroup],
    template: `<andes-checkbox-group
      aria-label="Add-ons"
      [options]="addOns"
      variant="card"
      [columns]="2"
    />`,
  })
  class CardOptionsHost {
    readonly addOns: AndesCheckboxOption[] = [
      { label: 'Backups', value: 'backups', description: 'Daily snapshots' },
      { label: 'Support', value: 'support', variant: 'default' },
    ];
  }

  it('lets one option override the group variant', () => {
    const fixture = TestBed.createComponent(CardOptionsHost);
    fixture.detectChanges();
    const [backups, support] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.andes-checkbox',
      ),
    );

    expect(backups.classList.contains('andes-checkbox--card')).toBe(true);
    expect(support.classList.contains('andes-checkbox--card')).toBe(false);
  });
});

describe('AndesCheckboxGroup in RTL', () => {
  @Component({
    imports: [AndesCheckbox, AndesCheckboxGroup],
    template: `<div dir="rtl">
      <andes-checkbox-group aria-label="Segments" variant="button">
        <andes-checkbox value="a">A</andes-checkbox>
        <andes-checkbox value="b">B</andes-checkbox>
      </andes-checkbox-group>
    </div>`,
  })
  class RtlHost {}

  it('keeps the same segment classes (logical properties do the mirroring)', () => {
    const fixture = TestBed.createComponent(RtlHost);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.andes-checkbox',
      ),
    );

    expect(
      labels.every((l) => l.classList.contains('andes-checkbox--segment')),
    ).toBe(true);
  });
});
