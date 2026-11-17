import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  lucideDownload,
  lucideFile,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideImage,
  lucideLoaderCircle,
  lucideMaximize,
  lucideMinimize,
  lucidePaperclip,
  lucideRotateCcw,
  lucideRotateCw,
  lucideSquareMinus,
  lucideSquarePlus,
  lucideUndo2,
  lucideZoomIn,
  lucideZoomOut,
} from '@ng-icons/lucide';

import { lucideName } from '../../testing/lucide';

import {
  AndesAccordion,
  AndesAccordionItem,
  AndesAccordionTrigger,
} from '../accordion';
import { AndesAvatarFaceGrid } from '../avatar/avatar-face-grid';
import { AndesCalendar } from '../calendar';
import { AndesCascader } from '../cascader';
import { AndesColorPickerPanel } from '../color-picker';
import { AndesCombobox } from '../combobox';
import { AndesDatePicker } from '../date-picker';
import {
  AndesDialog,
  AndesDialogContent,
  AndesDialogContentTemplate,
} from '../dialog';
import {
  AndesDropdownButton,
  AndesDropdownMenu,
  AndesDropdownMenuCheckboxItem,
  AndesDropdownMenuContent,
  AndesDropdownMenuRadioGroup,
  AndesDropdownMenuRadioItem,
  AndesDropdownMenuSub,
  AndesDropdownMenuSubContent,
  AndesDropdownMenuSubTrigger,
  AndesDropdownMenuTrigger,
} from '../dropdown-menu';
import { AndesImagePreview } from '../image';
import { AndesInputPassword } from '../input';
import { AndesInputNumber } from '../input-number';
import { AndesMentions } from '../mentions';
import { AndesRate } from '../rate';
import { AndesSelect } from '../select';
import { AndesTree } from '../tree';
import { AndesTreeSelect } from '../tree-select';

/*
  Every family draws lucide icons through `<ng-icon>` and registers them itself: none of these
  test beds calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic, inside the component's own view and inside its overlay panels alike.
*/

/** The icons the components bind with `[name]` (an input, not an attribute). */
const BOUND = {
  lucideDownload,
  lucideFile,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideImage,
  lucideLoaderCircle,
  lucideMaximize,
  lucideMinimize,
  lucidePaperclip,
  lucideRotateCcw,
  lucideRotateCw,
  lucideSquareMinus,
  lucideSquarePlus,
  lucideUndo2,
  lucideZoomIn,
  lucideZoomOut,
};

/** The lucide name of every `<ng-icon>` under `root` whose svg was drawn. */
function drawnIcons(root: ParentNode = document): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') !== null)
    .map((icon) => icon.getAttribute('name') ?? lucideName(icon, BOUND) ?? '?');
}

/** The `name` of every `<ng-icon>` under `root` that drew nothing (an unregistered name). */
function blankIcons(root: ParentNode = document): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') === null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

async function render<T>(host: Type<T>) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

afterEach(() => {
  expect(blankIcons()).toEqual([]);
});

describe('lucide icons, registered by each component', () => {
  it('tree: folders, files, the switcher chevron, the grip and the empty tray', async () => {
    @Component({
      imports: [AndesTree],
      template: `
        <andes-tree
          aria-label="Files"
          showIcon
          draggable
          [nodes]="nodes"
          [expandedKeys]="['src']"
        />
        <andes-tree aria-label="Nothing" [nodes]="[]" />
      `,
    })
    class Host {
      readonly nodes = [
        { key: 'src', title: 'src', children: [{ key: 'a', title: 'a.ts' }] },
        { key: 'lib', title: 'lib', children: [{ key: 'b', title: 'b.ts' }] },
      ];
    }
    const fixture = await render(Host);
    const icons = drawnIcons(fixture.nativeElement);

    expect(icons).toContain('lucideFolderOpen');
    expect(icons).toContain('lucideFolder');
    expect(icons).toContain('lucideFile');
    expect(icons).toContain('lucideChevronRight');
    expect(icons).toContain('lucideGripVertical');
    expect(icons).toContain('lucideInbox');
  });

  it('cascader: the trigger chevron and the expand arrow in the panel', async () => {
    @Component({
      imports: [AndesCascader],
      template: `<andes-cascader
        aria-label="Place"
        [options]="options"
        [open]="true"
      />`,
    })
    class Host {
      readonly options = [
        {
          value: 'pe',
          label: 'Peru',
          children: [{ value: 'cusco', label: 'Cusco' }],
        },
      ];
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideChevronDown');
    expect(
      drawnIcons(document.querySelector('.cdk-overlay-container') ?? document),
    ).toContain('lucideChevronRight');
  });

  it('select: the trigger chevron and the selected check in the panel', async () => {
    @Component({
      imports: [AndesSelect],
      template: `<andes-select
        aria-label="Fruit"
        [options]="options"
        [value]="'apple'"
        [open]="true"
      />`,
    })
    class Host {
      readonly options = [
        { value: 'apple', label: 'Apple' },
        { value: 'pear', label: 'Pear' },
      ];
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideChevronDown');
    expect(
      drawnIcons(document.querySelector('.cdk-overlay-container') ?? document),
    ).toContain('lucideCheck');
  });

  it('tree-select: the trigger chevron', async () => {
    @Component({
      imports: [AndesTreeSelect],
      template: `<andes-tree-select aria-label="Folder" [nodes]="nodes" />`,
    })
    class Host {
      readonly nodes = [{ key: 'a', title: 'A' }];
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideChevronDown');
  });

  it('combobox: the check on the chosen option, added by the item directive', async () => {
    @Component({
      imports: [AndesCombobox],
      template: `<andes-combobox
        aria-label="Fruit"
        [options]="options"
        [value]="'apple'"
        [open]="true"
      />`,
    })
    class Host {
      readonly options = [
        { value: 'apple', label: 'Apple' },
        { value: 'pear', label: 'Pear' },
      ];
    }
    await render(Host);
    const check = document.querySelector('ng-icon.andes-combobox-item__check');

    expect(check?.getAttribute('name')).toBe('lucideCheck');
    expect(check?.querySelector('svg')).not.toBeNull();
  });

  it('date picker: the calendar icon, and the calendar chevrons in its panel', async () => {
    @Component({
      imports: [AndesDatePicker],
      template: `<andes-date-picker locale="en-US" [open]="open()" />`,
    })
    class Host {
      readonly open = signal(true);
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideCalendar');
    const panel = drawnIcons(
      document.querySelector('.cdk-overlay-container') ?? document,
    );
    expect(panel).toContain('lucideChevronLeft');
    expect(panel).toContain('lucideChevronsRight');
  });

  it('calendar: the month and year chevrons', async () => {
    @Component({
      imports: [AndesCalendar],
      template: `<andes-calendar locale="en-US" />`,
    })
    class Host {}
    const fixture = await render(Host);
    const icons = drawnIcons(fixture.nativeElement);

    expect(icons).toContain('lucideChevronLeft');
    expect(icons).toContain('lucideChevronRight');
    expect(icons).toContain('lucideChevronsLeft');
    expect(icons).toContain('lucideChevronsRight');
  });

  it('input number: the stepper chevrons, and the minus / plus of the spinner mode', async () => {
    @Component({
      imports: [AndesInputNumber],
      template: `
        <andes-input-number aria-label="Count" />
        <andes-input-number aria-label="Seats" mode="spinner" />
      `,
    })
    class Host {}
    const fixture = await render(Host);
    const icons = drawnIcons(fixture.nativeElement);

    expect(icons).toEqual(
      expect.arrayContaining([
        'lucideChevronUp',
        'lucideChevronDown',
        'lucideMinus',
        'lucidePlus',
      ]),
    );
  });

  it('input password: the eye, and the crossed eye once the password shows', async () => {
    @Component({
      imports: [AndesInputPassword],
      template: `<andes-input-password aria-label="Password" />`,
    })
    class Host {}
    const fixture = await render(Host);
    const root = fixture.nativeElement as HTMLElement;

    expect(drawnIcons(root)).toContain('lucideEye');
    (
      root.querySelector('.andes-input__password-toggle') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(drawnIcons(root)).toContain('lucideEyeOff');
  });

  it('mentions: the clear glyph', async () => {
    @Component({
      imports: [AndesMentions],
      template: `<andes-mentions
        aria-label="Note"
        allowClear
        [value]="'Hi @ana'"
      />`,
    })
    class Host {}
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideCircleX');
  });

  it('rate: a star per character, in both layers', async () => {
    @Component({
      imports: [AndesRate],
      template: `<andes-rate aria-label="Score" [value]="3" />`,
    })
    class Host {}
    const fixture = await render(Host);
    const stars = drawnIcons(fixture.nativeElement);

    expect(stars.length).toBeGreaterThanOrEqual(5);
    expect(new Set(stars)).toEqual(new Set(['lucideStar']));
  });

  it('accordion: the trigger chevron', async () => {
    @Component({
      imports: [AndesAccordion, AndesAccordionItem, AndesAccordionTrigger],
      template: `<andes-accordion>
        <andes-accordion-item value="a">
          <andes-accordion-trigger>Section</andes-accordion-trigger>
        </andes-accordion-item>
      </andes-accordion>`,
    })
    class Host {}
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toEqual(['lucideChevronDown']);
  });

  it('avatar face grid: the person glyph of a face without a photo or text', async () => {
    @Component({
      imports: [AndesAvatarFaceGrid],
      template: `<andes-avatar-face-grid label="People" [faces]="faces" />`,
    })
    class Host {
      readonly faces = [{ name: '', icon: true }];
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toEqual(['lucideUserRound']);
  });

  it('color picker panel: the copy button', async () => {
    @Component({
      imports: [AndesColorPickerPanel],
      template: `<andes-color-picker-panel
        aria-label="Colour"
        [value]="'#2563eb'"
      />`,
    })
    class Host {}
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideCopy');
  });

  it('dialog: the close and maximize glyphs', async () => {
    @Component({
      imports: [AndesDialog, AndesDialogContent, AndesDialogContentTemplate],
      template: `<andes-dialog [open]="true" maximizable>
        <andes-dialog-content *andesDialogContent>Body</andes-dialog-content>
      </andes-dialog>`,
    })
    class Host {}
    await render(Host);
    const icons = drawnIcons();

    expect(icons).toContain('lucideX');
    expect(icons).toContain('lucideMaximize');
  });

  it('dropdown menu: the check, the radio dot and the submenu chevron', async () => {
    @Component({
      imports: [
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuCheckboxItem,
        AndesDropdownMenuRadioGroup,
        AndesDropdownMenuRadioItem,
        AndesDropdownMenuSub,
        AndesDropdownMenuSubTrigger,
        AndesDropdownMenuSubContent,
      ],
      template: `<andes-dropdown-menu [open]="true">
        <button type="button" andesDropdownMenuTrigger>Options</button>
        <andes-dropdown-menu-content>
          <andes-dropdown-menu-checkbox-item [checked]="true"
            >Bold</andes-dropdown-menu-checkbox-item
          >
          <andes-dropdown-menu-radio-group [value]="'a'">
            <andes-dropdown-menu-radio-item value="a"
              >A</andes-dropdown-menu-radio-item
            >
          </andes-dropdown-menu-radio-group>
          <andes-dropdown-menu-sub>
            <andes-dropdown-menu-sub-trigger
              >More</andes-dropdown-menu-sub-trigger
            >
            <andes-dropdown-menu-sub-content>
              <andes-dropdown-menu-checkbox-item
                >Italic</andes-dropdown-menu-checkbox-item
              >
            </andes-dropdown-menu-sub-content>
          </andes-dropdown-menu-sub>
        </andes-dropdown-menu-content>
      </andes-dropdown-menu>`,
    })
    class Host {}
    await render(Host);
    const icons = drawnIcons(
      document.querySelector('.cdk-overlay-container') ?? document,
    );

    expect(icons).toContain('lucideCheck');
    expect(icons).toContain('lucideCircleSmall');
    expect(icons).toContain('lucideChevronRight');
  });

  it('dropdown button: the caret', async () => {
    @Component({
      imports: [AndesDropdownButton],
      template: `<andes-dropdown-button [items]="items"
        >Save</andes-dropdown-button
      >`,
    })
    class Host {
      readonly items = [{ key: 'draft', label: 'Save as draft' }];
    }
    const fixture = await render(Host);

    expect(drawnIcons(fixture.nativeElement)).toContain('lucideChevronDown');
  });

  it('image preview: the toolbar, the close and the step chevrons', async () => {
    @Component({
      imports: [AndesImagePreview],
      template: `<andes-image-preview [items]="items" [open]="true" />`,
    })
    class Host {
      readonly items = [{ src: 'a.png' }, { src: 'b.png' }];
    }
    await render(Host);
    const icons = drawnIcons();

    expect(icons).toEqual(
      expect.arrayContaining([
        'lucideX',
        'lucideChevronLeft',
        'lucideChevronRight',
        'lucideZoomOut',
        'lucideZoomIn',
        'lucideRotateCcw',
        'lucideRotateCw',
        'lucideFlipHorizontal2',
        'lucideFlipVertical2',
        'lucideUndo2',
      ]),
    );
  });
});
