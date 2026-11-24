import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { andesOverlayPreset } from './overlay-config';
import { AndesOverlayContentPrimitive } from './overlay-content-primitive';
import {
  AndesOverlayPrimitive,
  provideAndesOverlay,
} from './overlay-primitive';

/**
 * Renders its projected content as the overlay's content, the way Dropdown Menu and
 * Popover do. Projected nodes, and the directives on them, belong to the consumer's view:
 * they are created once and the same element is moved into every new pane.
 */
@Component({
  selector: 'andes-test-projecting-overlay',
  providers: [provideAndesOverlay()],
  template: `<ng-template #content><ng-content /></ng-template>`,
})
class ProjectingOverlay {
  readonly overlay = inject(AndesOverlayPrimitive);
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
}

@Component({
  imports: [ProjectingOverlay, AndesOverlayContentPrimitive],
  template: `
    <andes-test-projecting-overlay>
      <div andesOverlayContent class="projected">Projected</div>
    </andes-test-projecting-overlay>
    <button type="button" id="anchor">Anchor</button>
  `,
})
class ProjectedContentHost {
  readonly projecting = viewChild.required(ProjectingOverlay);
}

describe('AndesOverlayPrimitive with projected overlay content', () => {
  function createHost() {
    const fixture = TestBed.createComponent(ProjectedContentHost);
    fixture.detectChanges();
    const { overlay, content } = fixture.componentInstance.projecting();
    const open = () => {
      overlay.open(content());
      fixture.detectChanges();
    };
    const close = () => {
      overlay.close();
      fixture.detectChanges();
    };
    return { fixture, overlay, open, close };
  }

  it('reports the projected element as the content element every time it opens', () => {
    const { overlay, open, close } = createHost();

    open();
    const projected = overlay.panelElement()?.querySelector('.projected');
    expect(projected).not.toBeNull();
    expect(overlay.contentElement()).toBe(projected);

    for (let cycle = 0; cycle < 3; cycle++) {
      close();
      expect(overlay.panelElement()).toBeNull();
      expect(overlay.contentElement()).toBeNull();

      // The directive on the projected node is not created again, so nothing but the
      // overlay itself can register the element once the pane has it.
      open();
      expect(overlay.panelElement()?.querySelector('.projected')).toBe(
        projected,
      );
      expect(overlay.contentElement()).toBe(projected);
    }
  });

  it('keeps the projected element wired to the open state across openings', () => {
    const { overlay, open, close } = createHost();

    open();
    const projected = overlay.contentElement() as HTMLElement;
    expect(projected.getAttribute('data-state')).toBe('open');
    expect(projected.id).toBe(overlay.contentId);

    close();
    open();
    expect(overlay.contentElement()).toBe(projected);
    expect(projected.getAttribute('data-state')).toBe('open');
  });

  it('does not carry the side it was placed on into the next pane', async () => {
    const { fixture, overlay, open, close } = createHost();
    overlay.configure(andesOverlayPreset('popover'));
    overlay.registerAnchor(
      (fixture.nativeElement as HTMLElement).querySelector('#anchor'),
    );

    open();
    await fixture.whenStable();
    const projected = overlay.contentElement() as HTMLElement;
    expect(overlay.placedSide()).toBe('bottom');
    expect(projected.getAttribute('data-placed-side')).toBe('bottom');

    close();
    expect(overlay.panelElement()).toBeNull();
    // The element outlives the pane; a leftover side would style the next opening, on
    // whatever side it lands, until the new placement is measured.
    expect(projected.hasAttribute('data-placed-side')).toBe(false);

    open();
    await fixture.whenStable();
    expect(projected.getAttribute('data-placed-side')).toBe('bottom');
    close();
    expect(projected.hasAttribute('data-placed-side')).toBe(false);
  });
});
