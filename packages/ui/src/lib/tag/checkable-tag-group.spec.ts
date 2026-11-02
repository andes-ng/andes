import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesCheckableTagGroup,
  AndesCheckableTagGroupValue,
  AndesCheckableTagOption,
  AndesCheckableTagValue,
} from './checkable-tag-group';
import {
  AndesCheckableTagGroupClassNames,
  AndesCheckableTagGroupSemantic,
  AndesCheckableTagGroupSemanticInfo,
  AndesCheckableTagGroupStyles,
} from './tag-semantic';

@Component({
  imports: [AndesCheckableTagGroup],
  template: `<andes-checkable-tag-group
    aria-label="Categories"
    [options]="options()"
    [multiple]="multiple()"
    [disabled]="disabled()"
    [(value)]="value"
  />`,
})
class HostComponent {
  readonly options = signal<
    readonly (AndesCheckableTagOption | AndesCheckableTagValue)[]
  >([
    { value: 'movies', label: 'Movies' },
    { value: 'books', label: 'Books' },
    { value: 'music', label: 'Music', disabled: true },
    'sports',
  ]);
  readonly multiple = signal(false);
  readonly disabled = signal(false);
  readonly value = signal<AndesCheckableTagGroupValue>(null);
}

describe('AndesCheckableTagGroup', () => {
  function create(apply: (host: HostComponent) => void = () => undefined) {
    const fixture = TestBed.createComponent(HostComponent);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    const tags = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('[data-slot="tag"]'),
      ) as HTMLButtonElement[];
    const click = (index: number) => {
      tags()[index].click();
      fixture.detectChanges();
    };
    const pressed = () => tags().map((t) => t.getAttribute('aria-pressed'));
    return { fixture, tags, click, pressed };
  }

  it('renders one checkable toggle button per option, bare values labelled by themselves', () => {
    const { tags } = create();

    expect(tags().map((t) => t.tagName)).toEqual([
      'BUTTON',
      'BUTTON',
      'BUTTON',
      'BUTTON',
    ]);
    expect(tags().map((t) => t.textContent?.trim())).toEqual([
      'Movies',
      'Books',
      'Music',
      'sports',
    ]);
  });

  it('exposes role=group with the consumer aria-label', () => {
    const { fixture } = create();
    const group = fixture.nativeElement.querySelector(
      'andes-checkable-tag-group',
    );

    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Categories');
  });

  it('reflects the initial value', () => {
    const { pressed } = create((host) => host.value.set('books'));

    expect(pressed()).toEqual(['false', 'true', 'false', 'false']);
  });

  it('single mode: selecting a tag replaces the previous selection', () => {
    const { fixture, click, pressed } = create();
    click(0);

    expect(fixture.componentInstance.value()).toBe('movies');

    click(1);

    expect(fixture.componentInstance.value()).toBe('books');
    expect(pressed()).toEqual(['false', 'true', 'false', 'false']);
  });

  it('single mode: clicking the selected tag clears the selection to null', () => {
    const { fixture, click, pressed } = create((host) =>
      host.value.set('books'),
    );
    click(1);

    expect(fixture.componentInstance.value()).toBeNull();
    expect(pressed()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('multiple mode: toggles values in and out, keeping option order', () => {
    const { fixture, click, pressed } = create((host) =>
      host.multiple.set(true),
    );
    click(3);
    click(0);

    expect(fixture.componentInstance.value()).toEqual(['movies', 'sports']);
    expect(pressed()).toEqual(['true', 'false', 'false', 'true']);

    click(3);

    expect(fixture.componentInstance.value()).toEqual(['movies']);
  });

  it('reflects external value writes', () => {
    const { fixture, pressed } = create((host) => host.multiple.set(true));
    fixture.componentInstance.value.set(['books', 'sports']);
    fixture.detectChanges();

    expect(pressed()).toEqual(['false', 'true', 'false', 'true']);
  });

  it('a disabled option cannot be toggled', () => {
    const { fixture, tags, click } = create();

    expect(tags()[2].disabled).toBe(true);
    click(2);

    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('disabled disables every tag and marks the group aria-disabled', () => {
    const { fixture, tags } = create((host) => host.disabled.set(true));

    expect(tags().every((t) => t.disabled)).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('andes-checkable-tag-group')
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });
});

describe('AndesCheckableTagGroup option icon and className', () => {
  @Component({
    imports: [AndesCheckableTagGroup],
    template: `<ng-template #icon><i class="opt-icon">i</i></ng-template>
      <andes-checkable-tag-group
        aria-label="Categories"
        [options]="[
          { value: 'a', label: 'Alpha', icon: icon, className: 'is-alpha' },
          { value: 'b', label: 'Beta' },
        ]"
      />`,
  })
  class OptionHost {}

  it('passes each option icon to its tag and its className to the tag host', () => {
    const fixture = TestBed.createComponent(OptionHost);
    fixture.detectChanges();
    const hosts = Array.from(
      fixture.nativeElement.querySelectorAll('andes-tag'),
    ) as HTMLElement[];

    expect(hosts[0].classList).toContain('is-alpha');
    expect(hosts[0].querySelector('.opt-icon')).toBeTruthy();
    expect(hosts[1].querySelector('.opt-icon')).toBeNull();
    expect(hosts[0].textContent?.trim()).toBe('iAlpha');
  });
});

describe('AndesCheckableTagGroup classNames and styles', () => {
  @Component({
    imports: [AndesCheckableTagGroup],
    template: `<andes-checkable-tag-group
      aria-label="Styled"
      [options]="options()"
      [multiple]="multiple()"
      [classNames]="classNames()"
      [styles]="styles()"
    />`,
  })
  class StyledHost {
    readonly options = signal<readonly AndesCheckableTagOption[]>([
      { value: 'a', label: 'A' },
      {
        value: 'b',
        label: 'B',
        style: { fontWeight: 700, paddingInline: 10 },
      },
    ]);
    readonly multiple = signal(false);
    readonly classNames = signal<
      | AndesCheckableTagGroupSemantic<AndesCheckableTagGroupClassNames>
      | undefined
    >(undefined);
    readonly styles = signal<
      AndesCheckableTagGroupSemantic<AndesCheckableTagGroupStyles> | undefined
    >(undefined);
  }

  function setup(apply: (host: StyledHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(StyledHost);
    apply(fixture.componentInstance);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      'andes-checkable-tag-group',
    ) as HTMLElement;
    const tags = () =>
      Array.from(group.querySelectorAll('[data-slot="tag"]')) as HTMLElement[];
    return { fixture, group, tags };
  }

  it('adds the root class to the group and the item class to every tag', () => {
    const { group, tags } = setup((host) =>
      host.classNames.set({ root: 'g-root', item: 'g-item' }),
    );

    expect(group.classList).toContain('g-root');
    expect(tags().every((tag) => tag.classList.contains('g-item'))).toBe(true);
  });

  it('applies root and item styles, with px on numbers', () => {
    const { group, tags } = setup((host) =>
      host.styles.set({
        root: { gap: 12, padding: '8px 12px', backgroundColor: 'rgb(1, 2, 3)' },
        item: { color: 'rgb(82, 196, 26)' },
      }),
    );

    expect(group.style.gap).toBe('12px');
    expect(group.style.padding).toBe('8px 12px');
    expect(group.style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(tags()[0].style.color).toBe('rgb(82, 196, 26)');
  });

  it("layers an option's own style over the item style", () => {
    const { tags } = setup((host) =>
      host.styles.set({ item: { color: 'rgb(1, 1, 1)', fontWeight: 400 } }),
    );

    expect(tags()[0].style.fontWeight).toBe('400');
    expect(tags()[1].style.fontWeight).toBe('700');
    expect(tags()[1].style.paddingInline).toBe('10px');
    expect(tags()[1].style.color).toBe('rgb(1, 1, 1)');
  });

  it('resolves a function against the group props', () => {
    const fn = (info: AndesCheckableTagGroupSemanticInfo) =>
      info.props.multiple
        ? { root: { gap: 16 }, item: { color: 'rgb(143, 135, 241)' } }
        : {};
    const { fixture, group, tags } = setup((host) => host.styles.set(fn));

    expect(group.style.gap).toBe('');

    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();

    expect(group.style.gap).toBe('16px');
    expect(tags()[0].style.color).toBe('rgb(143, 135, 241)');
  });

  it('keeps the plain look without classNames or styles', () => {
    const { group, tags } = setup();

    expect(group.getAttribute('style')).toBeNull();
    expect(tags()[0].getAttribute('style')).toBeNull();
  });
});
