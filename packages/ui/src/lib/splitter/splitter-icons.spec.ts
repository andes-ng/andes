import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesSplitter } from './splitter';
import { AndesSplitterPanel } from './splitter-panel';

/*
  The splitter draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic.
*/

@Component({
  imports: [AndesSplitter, AndesSplitterPanel],
  template: `
    <andes-splitter>
      <andes-splitter-panel collapsible>First</andes-splitter-panel>
      <andes-splitter-panel collapsible>Second</andes-splitter-panel>
    </andes-splitter>
  `,
})
class Host {}

describe('splitter icons', () => {
  it('draws a lucide chevron in each collapse button of the handle', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const icons = Array.from(root.querySelectorAll('ng-icon'));

    expect(icons.map((icon) => icon.getAttribute('name'))).toEqual([
      'lucideChevronLeft',
      'lucideChevronLeft',
    ]);
    expect(icons.every((icon) => icon.querySelector('svg') !== null)).toBe(
      true,
    );
    expect(
      root.querySelectorAll('.andes-splitter__collapse ng-icon'),
    ).toHaveLength(2);
  });
});
