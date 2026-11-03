import { TestBed } from '@angular/core/testing';

import { AndesSpinner } from './spinner';

/*
  The spinner draws lucide's loader circle through `<ng-icon>` and registers it itself: this
  test bed never calls `provideIcons`, so an icon whose svg is drawn proves the registration is
  automatic.
*/

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(AndesSpinner);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('spinner icons', () => {
  it("turns lucide's loader circle as the indeterminate ring", () => {
    const icon = render().querySelector('ng-icon');

    expect(icon?.getAttribute('name')).toBe('lucideLoaderCircle');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(icon?.classList).toContain('andes-spinner__ring');
  });

  it('draws the determinate ring as a gauge, not an icon', () => {
    const host = render({ percent: 40 });

    expect(host.querySelector('ng-icon')).toBeNull();
    expect(host.querySelector('svg.andes-spinner__ring')).not.toBeNull();
  });

  it('draws no svg for the dots and the bars', () => {
    expect(render({ variant: 'dots' }).querySelector('svg')).toBeNull();
    expect(render({ variant: 'bars' }).querySelector('svg')).toBeNull();
  });
});
