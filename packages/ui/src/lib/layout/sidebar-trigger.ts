import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePanelLeft } from '@ng-icons/lucide';

import { AndesSidebarProvider } from './sidebar-provider';

/**
 * The button that opens and closes the sidebar (the overlay on mobile, the desktop state
 * otherwise). Shows lucide's panel icon; project your own content to replace it.
 */
@Component({
  selector: 'andes-sidebar-trigger',
  viewProviders: [provideIcons({ lucidePanelLeft })],
  imports: [NgIcon],
  template: `
    <button
      type="button"
      class="andes-sidebar-trigger__button"
      [attr.aria-label]="label()"
      [attr.aria-expanded]="provider.expanded()"
      [attr.aria-controls]="provider.sidebarId()"
      (click)="provider.toggle()"
    >
      <ng-content>
        <ng-icon
          class="andes-sidebar-trigger__icon"
          name="lucidePanelLeft"
          size="16"
        />
      </ng-content>
    </button>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'andes-sidebar-trigger', 'data-slot': 'sidebar-trigger' },
})
export class AndesSidebarTrigger {
  protected readonly provider = inject(AndesSidebarProvider);

  readonly label = input('Toggle sidebar');
}
