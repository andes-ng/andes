import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UploadCropDialog } from './upload-crop-demo';

@Component({
  imports: [UploadCropDialog],
  template: `<andes-story-upload-crop-dialog />`,
})
class CropHost {
  readonly dialog = viewChild.required(UploadCropDialog);
}

/** jsdom has no canvas: a recording 2D context and an encoder that echoes the type. */
function stubCanvas() {
  const canvases: HTMLCanvasElement[] = [];
  const context = {
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      canvases.push(this);
      return context as unknown as CanvasRenderingContext2D;
    } as unknown as HTMLCanvasElement['getContext'],
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback: BlobCallback, type?: string) =>
      callback(new Blob(['pixels'], { type })),
  );
  return { canvases, context };
}

describe('UploadCropDialog (story helper)', () => {
  let canvas: ReturnType<typeof stubCanvas>;
  const close = vi.fn();

  beforeEach(() => {
    canvas = stubCanvas();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 3000, close })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    close.mockClear();
  });

  async function open(type = 'image/jpeg') {
    const fixture = TestBed.createComponent(CropHost);
    fixture.detectChanges();
    const file = new File(['raw'], 'photo.jpg', { type });
    const result = fixture.componentInstance.dialog().crop(file);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const frame = () => document.querySelector<HTMLElement>('.crop__frame');
    const button = (text: string) =>
      [...document.querySelectorAll<HTMLElement>('button')].find(
        (element) => element.textContent?.trim() === text,
      ) as HTMLElement;
    // The toolbar has no text: its controls are found by their accessible names.
    const named = (name: string) =>
      document.querySelector(`button[aria-label="${name}"]`) as HTMLElement;
    const aspects = () => [
      ...document.querySelectorAll<HTMLElement>(
        '[aria-label="Crop shape"] [role="radio"]',
      ),
    ];
    const zoom = () =>
      parseFloat(
        document
          .querySelector('[role="slider"][aria-label="Zoom"]')
          ?.getAttribute('aria-valuenow') ?? '',
      );
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, result, frame, button, named, aspects, zoom, settle };
  }

  it('shows the picture with a focusable frame and eight handles', async () => {
    const { frame } = await open();

    expect(frame()?.getAttribute('tabindex')).toBe('0');
    expect(frame()?.querySelectorAll('[data-handle]')).toHaveLength(8);
    // A 1:1 frame to begin with.
    expect(frame()?.style.width).toBe(frame()?.style.height);
    // The on-screen copy is drawn once, scaled down from 4000px.
    expect(canvas.canvases[0].width).toBe(2048);
  });

  it('moves the frame with the arrow keys and resizes it with Shift', async () => {
    const { frame, settle } = await open();
    const left = parseFloat(frame()?.style.left ?? '');
    const width = parseFloat(frame()?.style.width ?? '');

    frame()?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    await settle();
    expect(parseFloat(frame()?.style.left ?? '')).toBeCloseTo(left - 4);

    frame()?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        shiftKey: true,
        bubbles: true,
      }),
    );
    await settle();
    expect(parseFloat(frame()?.style.width ?? '')).toBeCloseTo(width + 4);
    // The 1:1 shape is kept.
    expect(parseFloat(frame()?.style.height ?? '')).toBeCloseTo(width + 4);
  });

  it('resolves a cropped file of the same name and type', async () => {
    const { result, button, settle } = await open();

    button('Crop and upload').click();
    await settle();
    const file = await result;

    expect(file).toBeInstanceOf(File);
    expect(file).toMatchObject({ name: 'photo.jpg', type: 'image/jpeg' });
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.92,
    );
    // The cut is taken from the real pixels: a square well beyond the shown size.
    const cut = canvas.canvases.at(-1) as HTMLCanvasElement;
    expect(cut.width).toBe(cut.height);
    expect(cut.width).toBeGreaterThan(2000);
    const [, , , sourceWidth, sourceHeight] =
      canvas.context.drawImage.mock.calls.at(-1) ?? [];
    expect([sourceWidth, sourceHeight]).toEqual([cut.width, cut.height]);
  });

  it('turns the cut with the picture', async () => {
    const { result, button, named, settle } = await open('image/png');

    named('Rotate a quarter turn').click();
    await settle();
    // Redrawn once for the new turn, then the cut.
    expect(canvas.canvases.at(-1)?.width).toBe(1536);
    button('Crop and upload').click();
    await settle();
    const file = await result;

    expect(file).toMatchObject({ type: 'image/png' });
    expect(canvas.context.rotate).toHaveBeenLastCalledWith(Math.PI / 2);
  });

  it('keeps the dialog free of visible instructions and labels', async () => {
    const { frame } = await open();
    const visible = (selector: string) =>
      document.querySelector(`${selector}:not(.crop__sr)`);

    // The title stays; the description and the hint are for assistive tech only.
    expect(document.querySelector('.crop__sr')?.textContent).toContain(
      'Drag the frame',
    );
    expect(document.getElementById('andes-story-crop-hint')?.className).toBe(
      'crop__sr',
    );
    expect(visible('[andesDialogDescription]')).toBeNull();
    expect(frame()?.getAttribute('aria-describedby')?.split(' ') ?? []).toEqual(
      ['andes-story-crop-hint', 'andes-story-crop-size'],
    );
    // The toolbar is icons only.
    const toolbar = document.querySelector('.crop__toolbar') as HTMLElement;
    for (const control of toolbar.querySelectorAll('button, [role="radio"]')) {
      expect(control.textContent?.trim()).toBe('');
    }
    expect(toolbar.querySelectorAll('svg').length).toBeGreaterThanOrEqual(8);
  });

  it('names every control and gives it a tooltip', async () => {
    const { named, aspects } = await open();

    // The library's button has no tooltip of its own: `title` on it covers the inner button.
    const tooltip = (name: string) =>
      named(name).closest('andes-button')?.getAttribute('title');
    expect(tooltip('Zoom out')).toBe('Zoom out');
    expect(tooltip('Zoom in')).toBe('Zoom in');
    expect(tooltip('Rotate a quarter turn')).toBe('Rotate');
    expect(tooltip('Reset the crop')).toBe('Reset');
    expect(
      aspects().map((radio) => [radio.getAttribute('aria-label'), radio.title]),
    ).toEqual([
      ['Free shape', 'Free shape'],
      ['Square, 1:1', 'Square, 1:1'],
      ['Landscape, 4:3', 'Landscape, 4:3'],
      ['Wide, 16:9', 'Wide, 16:9'],
    ]);
  });

  it('shows the output size as a chip and reads it out once', async () => {
    const { settle } = await open();
    await settle();

    const chip = document.querySelector('.crop__size') as HTMLElement;
    // The square frame's size in the picture's own pixels; the chip is for the eye only.
    const [, size] = /^(\d+) × \1$/.exec(chip.textContent?.trim() ?? '') ?? [];
    expect(Number(size)).toBeGreaterThan(2000);
    expect(chip.getAttribute('aria-hidden')).toBe('true');
    const live = document.getElementById('andes-story-crop-size');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    expect(live?.textContent?.trim()).toBe(
      `Output size ${size} by ${size} pixels`,
    );
  });

  it('spaces out the announced size while the frame is resized', async () => {
    vi.useFakeTimers();
    try {
      const { frame, settle } = await open();
      const live = () =>
        document.getElementById('andes-story-crop-size')?.textContent?.trim();
      const first = live();

      for (let step = 0; step < 5; step++) {
        frame()?.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            shiftKey: true,
            bubbles: true,
          }),
        );
        await settle();
      }
      expect(live()).toBe(first);

      vi.advanceTimersByTime(900);
      await settle();
      expect(live()).not.toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });

  it('steps the zoom by 0.1 with the zoom buttons', async () => {
    const { named, zoom, settle } = await open();

    expect(zoom()).toBe(1);
    expect((named('Zoom out') as HTMLButtonElement).disabled).toBe(true);
    named('Zoom in').click();
    await settle();
    named('Zoom in').click();
    await settle();
    expect(zoom()).toBeCloseTo(1.2, 5);

    named('Zoom out').click();
    await settle();
    expect(zoom()).toBeCloseTo(1.1, 5);
  });

  it('stops zooming at the ends of the range', async () => {
    const { named, zoom, settle } = await open();

    for (let step = 0; step < 25; step++) {
      named('Zoom in').click();
      await settle();
    }
    expect(zoom()).toBe(3);
    expect((named('Zoom in') as HTMLButtonElement).disabled).toBe(true);
    expect((named('Zoom out') as HTMLButtonElement).disabled).toBe(false);
  });

  it('marks the chosen shape and keeps the arrow keys of a radio group', async () => {
    const { frame, aspects, settle } = await open();
    const checked = () =>
      aspects().map((radio) => radio.getAttribute('aria-checked'));

    // 1:1 to begin with.
    expect(checked()).toEqual(['false', 'true', 'false', 'false']);
    expect(aspects().map((radio) => radio.tabIndex)).toEqual([-1, 0, -1, -1]);

    aspects()[2].click();
    await settle();
    expect(checked()).toEqual(['false', 'false', 'true', 'false']);
    expect(
      parseFloat(frame()?.style.width ?? '') /
        parseFloat(frame()?.style.height ?? ''),
    ).toBeCloseTo(4 / 3, 1);

    aspects()[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    await settle();
    expect(checked()).toEqual(['false', 'false', 'false', 'true']);

    aspects()[3].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    aspects()[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    await settle();
    expect(checked()).toEqual(['false', 'true', 'false', 'false']);
  });

  it('puts the turn and the zoom back with Reset', async () => {
    const { named, zoom, settle } = await open();

    named('Zoom in').click();
    await settle();
    expect(zoom()).toBeCloseTo(1.1, 5);
    named('Rotate a quarter turn').click();
    await settle();
    // Turning the picture starts it unzoomed again.
    expect(zoom()).toBe(1);
    expect(canvas.canvases.at(-1)?.width).toBe(1536);

    named('Reset the crop').click();
    await settle();
    expect(canvas.canvases.at(-1)?.width).toBe(2048);
  });

  it('keeps the file out when the dialog is cancelled', async () => {
    const { result, button, settle } = await open();

    button('Cancel').click();
    await settle();

    await expect(result).resolves.toBe(false);
    expect(close).toHaveBeenCalled();
  });
});
