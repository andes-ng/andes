import {
  ApplicationRef,
  type ComponentRef,
  createComponent,
  EnvironmentInjector,
  type Injector,
  type Renderer2,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Internal (not exported from the package). Renders the lucide icon `name` - registered with
 * `provideIcons` on the directive that owns `injector` - in a new `<ng-icon>` element with
 * `className`, and returns the component so the caller can place
 * `ref.location.nativeElement` and destroy it.
 *
 * For attribute directives applied to the consumer's own element (a combobox item, a
 * breadcrumb separator): a directive has no template to declare an `<ng-icon>` in, so the
 * icon it adds around the projected content is created here instead, attached to the
 * application so it takes part in change detection.
 */
export function renderAndesIcon(
  renderer: Renderer2,
  injector: Injector,
  name: string,
  className: string,
): ComponentRef<NgIcon> {
  const hostElement: HTMLElement = renderer.createElement('ng-icon');
  renderer.addClass(hostElement, className);
  // Reflected like a template's `<ng-icon name="...">`, which the input alone would not do.
  renderer.setAttribute(hostElement, 'name', name);
  const ref = createComponent(NgIcon, {
    environmentInjector: injector.get(EnvironmentInjector),
    elementInjector: injector,
    hostElement,
  });
  ref.setInput('name', name);
  injector.get(ApplicationRef).attachView(ref.hostView);
  ref.changeDetectorRef.detectChanges();
  return ref;
}
