import { signal } from '@angular/core';

import { ANDES_IMAGE_IDENTITY_TRANSFORM } from './image-transform';
import type { AndesImageTransformEvent } from './image-types';
import {
  AndesImageViewerController,
  type AndesImageViewerLimits,
} from './image-viewer';

function setup(limits: Partial<AndesImageViewerLimits> = {}, rtl = false) {
  const stage = document.createElement('div');
  const image = document.createElement('div');
  stage.append(image);
  Object.defineProperty(stage, 'clientWidth', { value: 400 });
  Object.defineProperty(stage, 'clientHeight', { value: 300 });
  Object.defineProperty(image, 'offsetWidth', { value: 400 });
  Object.defineProperty(image, 'offsetHeight', { value: 300 });
  stage.getBoundingClientRect = () => new DOMRect(0, 0, 400, 300);
  const events: AndesImageTransformEvent[] = [];
  const swipes: number[] = [];
  const transform = signal(ANDES_IMAGE_IDENTITY_TRANSFORM);
  const viewer = new AndesImageViewerController(transform, {
    limits: () => ({
      scaleStep: 0.5,
      minScale: 1,
      maxScale: 10,
      movable: true,
      wheel: true,
      ...limits,
    }),
    stage: () => stage,
    image: () => image,
    isEmptyArea: (event) => event.target === stage,
    rtl: () => rtl,
    changed: (event) => events.push(event),
    swipe: (direction) => swipes.push(direction),
  });
  return { viewer, transform, events, swipes, stage, image };
}

function pointer(
  type: string,
  id: number,
  x: number,
  y: number,
  target: EventTarget,
): PointerEvent {
  const event = new PointerEvent(type, {
    pointerId: id,
    pointerType: 'touch',
    clientX: x,
    clientY: y,
    bubbles: true,
  });
  Object.defineProperty(event, 'target', { value: target });
  Object.defineProperty(event, 'currentTarget', { value: target });
  return event;
}

describe('AndesImageViewerController', () => {
  it('zooms by steps within the limits and reports each change', () => {
    const { viewer, transform, events } = setup({ maxScale: 2 });
    viewer.zoomIn();
    expect(transform().scale).toBe(1.5);
    viewer.zoomIn();
    viewer.zoomIn();
    expect(transform().scale).toBe(2);
    viewer.zoomOut();
    expect(events.map((event) => event.action)).toEqual([
      'zoomIn',
      'zoomIn',
      'zoomOut',
    ]);
  });

  it('rotates, flips and resets', () => {
    const { viewer, transform } = setup();
    viewer.rotate(1);
    viewer.rotate(1);
    viewer.flip('x');
    expect(transform()).toMatchObject({ rotate: 180, flipX: true });
    viewer.reset();
    expect(transform()).toEqual(ANDES_IMAGE_IDENTITY_TRANSFORM);
  });

  it('pans only a zoomed, movable picture, and keeps it on the stage', () => {
    const { viewer, transform } = setup();
    expect(viewer.panBy(50, 0, 'keyboard')).toBe(false);
    viewer.zoomAt(2, 'zoomIn');
    expect(viewer.panBy(5000, 0, 'keyboard')).toBe(true);
    // 400px wide at 2x is 800px: it may move 200px either way.
    expect(transform().x).toBe(200);
  });

  it('pinches with two fingers about their midpoint, reporting once on release', () => {
    const { viewer, transform, events, stage } = setup();
    viewer.onPointerDown(pointer('pointerdown', 1, 150, 150, stage));
    viewer.onPointerDown(pointer('pointerdown', 2, 250, 150, stage));
    viewer.onPointerMove(pointer('pointermove', 2, 350, 150, stage));
    // The fingers spread from 100px to 200px apart: twice the scale.
    expect(transform().scale).toBe(2);
    expect(viewer.dragging()).toBe(true);
    expect(events).toHaveLength(0);
    viewer.onPointerEnd(pointer('pointerup', 1, 150, 150, stage));
    expect(viewer.dragging()).toBe(false);
    expect(events.map((event) => event.action)).toEqual(['pinch']);
    // The lifted pinch is not a click on the stage.
    expect(viewer.takeClick().suppressed).toBe(true);
  });

  it('swipes a fitted picture, mirrored in right-to-left', () => {
    const ltr = setup();
    ltr.viewer.onPointerDown(pointer('pointerdown', 1, 300, 100, ltr.stage));
    ltr.viewer.onPointerMove(pointer('pointermove', 1, 200, 100, ltr.stage));
    ltr.viewer.onPointerEnd(pointer('pointerup', 1, 200, 100, ltr.stage));
    expect(ltr.swipes).toEqual([1]);

    const rtl = setup({}, true);
    rtl.viewer.onPointerDown(pointer('pointerdown', 1, 300, 100, rtl.stage));
    rtl.viewer.onPointerMove(pointer('pointermove', 1, 200, 100, rtl.stage));
    rtl.viewer.onPointerEnd(pointer('pointerup', 1, 200, 100, rtl.stage));
    expect(rtl.swipes).toEqual([-1]);
  });

  it('tells a plain click from the end of a drag, once', () => {
    const { viewer, stage, image } = setup();
    viewer.onPointerDown(pointer('pointerdown', 1, 10, 10, image));
    viewer.onPointerEnd(pointer('pointerup', 1, 10, 10, image));
    expect(viewer.takeClick()).toEqual({
      suppressed: false,
      pressedOnEmptyArea: false,
    });
    expect(viewer.takeClick().pressedOnEmptyArea).toBe(true);
    viewer.onPointerDown(pointer('pointerdown', 1, 10, 10, stage));
    viewer.onPointerMove(pointer('pointermove', 1, 30, 10, stage));
    viewer.onPointerEnd(pointer('pointerup', 1, 30, 10, stage));
    expect(viewer.takeClick().suppressed).toBe(true);
  });

  it('zooms with the wheel about the pointer, unless the wheel is off', () => {
    const { viewer, transform } = setup();
    viewer.onWheel(
      new WheelEvent('wheel', { deltaY: -200, clientX: 200, clientY: 150 }),
    );
    expect(transform().scale).toBe(1.5);
    const off = setup({ wheel: false });
    off.viewer.onWheel(new WheelEvent('wheel', { deltaY: -200 }));
    expect(off.transform().scale).toBe(1);
  });

  it('double click zooms in to 2x and back to fit', () => {
    const { viewer, transform } = setup();
    viewer.onDoubleClick(
      new MouseEvent('dblclick', { clientX: 200, clientY: 150 }),
    );
    expect(transform().scale).toBe(2);
    viewer.onDoubleClick(new MouseEvent('dblclick'));
    expect(transform().scale).toBe(1);
  });
});
