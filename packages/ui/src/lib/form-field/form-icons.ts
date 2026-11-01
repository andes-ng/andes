import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The icons the form parts and their stories draw. */
export type AndesFormIconName =
  | 'help'
  | 'minus'
  | 'minus-circle'
  | 'plus'
  | 'grip'
  | 'chevron-up'
  | 'chevron-down';

/**
 * A small inline SVG icon, 1em square and drawn in `currentColor`, so a button or a label
 * decides its size (font-size) and colour. The library has no icon component, so the few
 * glyphs the form needs live here: the question-circle of a label's `tooltip`, and the
 * minus-circle, plus, grip and chevrons of the dynamic list rows in the stories. Internal:
 * not exported from the package.
 */
@Component({
  selector: 'andes-form-icon',
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    @switch (name()) {
      @case ('help') {
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      }
      @case ('minus-circle') {
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      }
      @case ('minus') {
        <path d="M5 12h14" />
      }
      @case ('plus') {
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      }
      @case ('grip') {
        <g fill="currentColor" stroke="none">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </g>
      }
      @case ('chevron-up') {
        <path d="m18 15-6-6-6 6" />
      }
      @case ('chevron-down') {
        <path d="m6 9 6 6 6-6" />
      }
    }
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: 1em;
      height: 1em;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AndesFormIcon {
  readonly name = input.required<AndesFormIconName>();
}
