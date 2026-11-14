import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTable } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCell } from './table-cell';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';

/*
 * Resizing follows the pointer: the width is the width at the start of the drag plus the pointer
 * distance from where it started, clamped to the limits - never the clamped width of the previous
 * event - and the first resize pins every column to the width it is drawn at, so that a fixed
 * layout cannot share spare width among the columns and make the drag run against a moving target.
 */

/** The width each header is drawn at when nothing has been resized: more than it was given. */
const DRAWN: Record<string, number> = { name: 210, role: 175, email: 350 };
/** The width each header was given in the template. */
const GIVEN: Record<string, number> = { name: 160, role: 140, email: 260 };

@Component({
  imports: [
    AndesTable,
    AndesTableBody,
    AndesTableCell,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
  ],
  template: `<andes-table
    resizable
    tableLayout="fixed"
    [(columnWidths)]="widths"
  >
    <thead andesTableHeader>
      <tr andesTableRow>
        <th
          andesTableHead
          columnKey="name"
          [width]="160"
          [minWidth]="120"
          [maxWidth]="240"
        >
          Name
        </th>
        <th
          andesTableHead
          columnKey="role"
          [width]="140"
          [minWidth]="100"
          [maxWidth]="180"
        >
          Role
        </th>
        <th andesTableHead columnKey="email" [width]="260" [minWidth]="160">
          Email
        </th>
      </tr>
    </thead>
    <tbody andesTableBody>
      <tr andesTableRow>
        <td andesTableCell>Ada</td>
        <td andesTableCell>Admin</td>
        <td andesTableCell>ada@example.com</td>
      </tr>
    </tbody>
  </andes-table>`,
})
class Host {
  readonly widths = signal<Readonly<Record<string, number>>>({});
}

describe('column resizing follows the pointer', () => {
  let original: typeof HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    original = HTMLElement.prototype.getBoundingClientRect;
    // No layout in jsdom: a header is as wide as its inline width, else as it is first drawn.
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const key = this.getAttribute('data-column-key');
      const set = key ? parseFloat(this.style.width) : 0;
      const width = key
        ? set === GIVEN[key]
          ? DRAWN[key]
          : set || DRAWN[key]
        : 0;
      return {
        width,
        height: 40,
        left: 0,
        top: 0,
        right: width,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = original;
  });

  function setup(dir: 'ltr' | 'rtl' = 'ltr') {
    document.documentElement.dir = dir;
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const handle = (index: number) =>
      root.querySelectorAll('.andes-table__resize-handle')[
        index
      ] as HTMLElement;
    const drag = (index: number, path: number[]) => {
      const widths: number[] = [];
      const start = handle(index);
      start.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 500,
          button: 0,
          bubbles: true,
        }),
      );
      for (const x of path) {
        document.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 500 + x }),
        );
        fixture.detectChanges();
        widths.push(
          fixture.componentInstance.widths()[['name', 'role', 'email'][index]],
        );
      }
      document.dispatchEvent(new PointerEvent('pointerup'));
      return widths;
    };
    return { fixture, root, drag };
  }

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('shrinks smoothly from the drawn width, clamps at the minimum and comes back from there', () => {
    const { drag } = setup();
    // Drawn at 210px (the layout shared spare width): left 8px at a time past the minimum (120).
    const left = drag(0, [-8, -16, -24, -48, -80, -120, -160]);

    expect(left).toEqual([202, 194, 186, 162, 130, 120, 120]);
    // Dragging back to the right follows from the start width again, not from the clamp.
    const back = drag(0, [0, 8, 16, 24]);
    expect(back).toEqual(
      [120, 120, 120, 120].map((_, i) => [120, 128, 136, 144][i]),
    );
  });

  it('grows with the pointer and stops at the maximum', () => {
    const { drag } = setup();
    // The first drag started from 210: the maximum is 240, so 30px of growth is allowed.
    expect(drag(0, [8, 16, 30, 31, 80, 24])).toEqual([
      218, 226, 240, 240, 240, 234,
    ]);
  });

  it('never moves a width by a jump, in either direction', () => {
    const { drag } = setup();
    const path = Array.from({ length: 40 }, (_, i) => -i * 4).concat(
      Array.from({ length: 80 }, (_, i) => -156 + i * 4),
    );
    const widths = drag(1, path);

    for (let i = 1; i < widths.length; i++) {
      expect(Math.abs(widths[i] - widths[i - 1])).toBeLessThanOrEqual(4);
    }
    expect(Math.min(...widths)).toBe(100);
    expect(Math.max(...widths)).toBeLessThanOrEqual(180);
  });

  it('pins every column to the width it is drawn at, and the table to their sum', () => {
    const { fixture, root, drag } = setup();
    drag(0, [-10]);
    const table = root.querySelector('table') as HTMLElement;

    expect(fixture.componentInstance.widths()).toEqual({
      name: 200,
      role: 175,
      email: 350,
    });
    expect(table.style.width).toBe('725px');
    drag(2, [50]);
    expect(table.style.width).toBe('775px');
  });

  it('mirrors the drag in right-to-left', () => {
    const { drag } = setup('rtl');
    // The handle is on the left of an end-aligned column: moving the pointer right shrinks.
    expect(drag(0, [8, 16, 400])).toEqual([202, 194, 120]);
  });

  it('moves in steps from the keyboard and stops at the limits', () => {
    const { fixture, root } = setup();
    const handle = root.querySelectorAll(
      '.andes-table__resize-handle',
    )[0] as HTMLElement;
    const press = (key: string, shiftKey = false) => {
      handle.dispatchEvent(
        new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }),
      );
      fixture.detectChanges();
      return fixture.componentInstance.widths()['name'];
    };

    expect(press('ArrowLeft')).toBe(202);
    expect(press('ArrowLeft', true)).toBe(170);
    expect(press('Home')).toBe(120);
    expect(press('ArrowLeft')).toBe(120);
    expect(press('End')).toBe(240);
    expect(press('ArrowRight')).toBe(240);
  });
});
