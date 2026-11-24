/**
 * Helpers for the unit tests of components that open through the overlay primitive and
 * animate their exit.
 *
 * jsdom has no Web Animations, so without these every close is synchronous: the overlay
 * never marks anything `data-andes-closing` and the path a browser takes - mark, wait for
 * the exit animation, detach - is never exercised. That path is where content projected
 * from the consumer's view matters: the same element is moved into every new pane, so
 * whatever the exit left on it is still there when the overlay opens again.
 *
 * Internal to the unit tests: excluded from the library build in `tsconfig.lib.json`.
 */
import {
  ANDES_OVERLAY_CLOSING_ATTRIBUTE,
  ANDES_OVERLAY_PANE_CLASS,
} from '@andes-ng/primitives';

/** A Web Animations `Animation` stand-in whose end the test decides. */
export class FakeExitAnimation {
  playState: AnimationPlayState = 'running';
  readonly effect = { getComputedTiming: () => ({ endTime: 120 }) };
  readonly finished: Promise<FakeExitAnimation>;
  private resolveFinished!: () => void;

  constructor() {
    this.finished = new Promise((resolve) => {
      this.resolveFinished = () => resolve(this);
    });
  }

  finish(): void {
    this.playState = 'finished';
    this.resolveFinished();
  }
}

/** Whether the overlay has marked the element as closing. */
export const isClosing = (element: Element | null | undefined): boolean =>
  !!element?.hasAttribute(ANDES_OVERLAY_CLOSING_ATTRIBUTE);

/**
 * jsdom reports zero geometry for every element, which makes CDK's
 * `InteractivityChecker` treat them all as invisible and therefore untabbable; a
 * nominal size lets the overlay move focus inside as it would in a browser.
 */
export function withElementGeometry(): void {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );

  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });

  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

/**
 * Installs `Element.prototype.getAnimations` so that a pane marked closing reports one
 * running exit animation - what a `[data-andes-closing]` rule starts in a browser. Call
 * it inside a `describe`; it is installed before and removed after each test.
 */
export function withExitAnimations(): {
  /** Ends every exit animation started so far. */
  finishAll: () => void;
} {
  const running: FakeExitAnimation[] = [];
  let byPane = new WeakMap<Element, FakeExitAnimation>();

  beforeEach(() => {
    running.length = 0;
    byPane = new WeakMap();
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      writable: true,
      value(this: Element) {
        if (
          !this.classList.contains(ANDES_OVERLAY_PANE_CLASS) ||
          !isClosing(this)
        ) {
          return [];
        }
        let animation = byPane.get(this);
        if (!animation) {
          animation = new FakeExitAnimation();
          byPane.set(this, animation);
          running.push(animation);
        }
        return [animation];
      },
    });
  });

  afterEach(() => {
    delete (Element.prototype as unknown as Record<string, unknown>)[
      'getAnimations'
    ];
  });

  return {
    finishAll: () =>
      running.splice(0).forEach((animation) => animation.finish()),
  };
}
