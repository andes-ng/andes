import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesLayout } from './layout';
import { AndesLayoutContent } from './layout-content';
import { AndesLayoutSider } from './layout-sider';
import { AndesSidebarInset } from './sidebar-parts';
import { AndesSidebarProvider } from './sidebar-provider';
import { AndesSidebarTrigger } from './sidebar-trigger';

/*
  The layout draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic.
*/

@Component({
  imports: [AndesLayout, AndesLayoutContent, AndesLayoutSider],
  template: `
    <andes-layout>
      <andes-layout-sider
        collapsible
        [collapsedWidth]="0"
        [(collapsed)]="collapsed"
        >Menu</andes-layout-sider
      >
      <andes-layout-content>Body</andes-layout-content>
    </andes-layout>
  `,
})
class SiderHost {
  readonly collapsed = signal(false);
}

@Component({
  imports: [AndesSidebarProvider, AndesSidebarInset, AndesSidebarTrigger],
  template: `
    <andes-sidebar-provider>
      <andes-sidebar-inset><andes-sidebar-trigger /></andes-sidebar-inset>
    </andes-sidebar-provider>
  `,
})
class SidebarHost {}

/** The `name` of every drawn `<ng-icon>` under `root`, or of every one that drew nothing. */
function icons(root: ParentNode, drawn = true): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => (icon.querySelector('svg') !== null) === drawn)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

describe('layout icons', () => {
  it('draws the chevron of the sider trigger, and of the edge tab once it has collapsed to 0', () => {
    const fixture = TestBed.createComponent(SiderHost);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    const trigger = root.querySelector('.trigger') as HTMLElement;
    expect(icons(trigger)).toEqual(['lucideChevronLeft']);

    trigger.click();
    fixture.detectChanges();
    const tab = root.querySelector('.zero-trigger') as HTMLElement;
    expect(tab).not.toBeNull();
    expect(icons(tab)).toEqual(['lucideChevronLeft']);
    expect(icons(root, false)).toEqual([]);
  });

  it('draws the panel icon of the sidebar trigger', () => {
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(icons(root)).toEqual(['lucidePanelLeft']);
    expect(icons(root, false)).toEqual([]);
  });
});
