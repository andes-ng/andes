import type { AndesOverlayCloseReason } from '@andes-ng/primitives';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import {
  ANDES_IMAGE_GROUP,
  type AndesImageGroupContext,
  type AndesImageGroupMember,
} from './image-group-context';
import { AndesImagePreview } from './image-preview';
import {
  normalizePreviewInput,
  normalizePreviewItems,
  type AndesImageClassNames,
  type AndesImageLabels,
  type AndesImagePreviewConfig,
  type AndesImagePreviewItem,
  type AndesImagePreviewSource,
  type AndesImageStyles,
  type AndesImageTransformEvent,
} from './image-types';

/**
 * Collects the `andes-image` elements inside it so one viewer can step through all of them.
 *
 * Clicking any thumbnail opens the viewer on that image; previous / next buttons, the
 * arrow keys, `PageUp` / `PageDown`, `Home` and `End` move between them, with a
 * "2 / 5" counter. Images are ordered as they appear in the document, and an image
 * with `[preview]="false"` (or one that failed to load) is left out.
 *
 * ```html
 * <andes-image-group [preview]="{ loop: true }">
 *   <andes-image src="/a.jpg" alt="First" [width]="120" [height]="80" />
 *   <andes-image src="/b.jpg" alt="Second" [width]="120" [height]="80" />
 * </andes-image-group>
 * ```
 *
 * The group has no box of its own (`display: contents`): lay the thumbnails out around it.
 *
 * With `items` the viewer browses that list instead of the thumbnails: one cover image can
 * open a whole album, and pictures that have no thumbnail on the page still appear in the
 * viewer. A thumbnail then opens the item with its own preview URL, or the first one.
 */
@Component({
  selector: 'andes-image-group',
  imports: [AndesImagePreview],
  template: `
    <ng-content />
    @if (config(); as previewConfig) {
      <andes-image-preview
        [items]="viewerItems()"
        [config]="previewConfig"
        [labels]="labels()"
        [classNames]="classNames()"
        [styles]="styles()"
        [origin]="origin()"
        [(open)]="open"
        [(current)]="current"
        (transformChange)="transformChange.emit($event)"
        (closed)="onClosed($event)"
      />
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ANDES_IMAGE_GROUP, useExisting: AndesImageGroup }],
  host: { '[attr.data-slot]': '"image-group"' },
})
export class AndesImageGroup implements AndesImageGroupContext {
  /**
   * Viewer configuration shared by every image in the group, or `false` to turn previews
   * off for all of them. A bare `preview` attribute means the defaults.
   */
  readonly preview = input<boolean | AndesImagePreviewConfig | ''>(true);
  /** Localised strings for the thumbnails' labels and the viewer. */
  readonly labels = input<AndesImageLabels | null>(null);
  /**
   * The images the viewer browses, when they are not (all) on the page as thumbnails: bare
   * URLs or items with their own `alt`, `fallback` and download `name`.
   */
  readonly items = input<readonly AndesImagePreviewSource[] | null>(null);
  /** Classes for the shared viewer's parts (`viewer`, `toolbar`, `viewerImage`, `counter`). */
  readonly classNames = input<AndesImageClassNames | null>(null);
  /** Inline styles for the same parts. */
  readonly styles = input<AndesImageStyles | null>(null);

  /** Whether the viewer is open (`[(open)]`). */
  readonly open = model(false);
  /** 0-based index of the shown image (`[(current)]`). */
  readonly current = model(0);

  /** The viewer's pan / zoom / rotate / flip changed. */
  readonly transformChange = output<AndesImageTransformEvent>();
  /** The viewer closed; `reason` says how. */
  readonly closed = output<AndesOverlayCloseReason>();

  readonly config = computed(() => normalizePreviewInput(this.preview()));

  private readonly members = signal<readonly AndesImageGroupMember[]>([]);
  /** Bumped when the DOM order may have changed without any member coming or going. */
  private readonly orderVersion = signal(0);
  private openedMember: AndesImageGroupMember | null = null;

  private readonly previewable = computed(() => {
    this.orderVersion();
    return this.members()
      .filter((member) => member.previewItem() !== null)
      .sort((a, b) =>
        a.element.compareDocumentPosition(b.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
  });

  private readonly customItems = computed(() => {
    const items = this.items();
    return items ? normalizePreviewItems(items) : null;
  });

  /** What the viewer browses: `items`, or the thumbnails in document order. */
  protected readonly viewerItems = computed<readonly AndesImagePreviewItem[]>(
    () =>
      this.customItems() ??
      this.previewable().map(
        (member) => member.previewItem() as AndesImagePreviewItem,
      ),
  );

  /**
   * The thumbnail the viewer grows out of and shrinks back into: the one of the shown image,
   * or with custom `items` the one that opened it.
   */
  protected readonly origin = computed<HTMLElement | null>(() => {
    if (this.customItems()) {
      return this.openedElement();
    }
    return this.previewable()[this.current()]?.element ?? null;
  });

  private readonly openedElement = signal<HTMLElement | null>(null);

  register(member: AndesImageGroupMember): void {
    this.members.update((members) => [...members, member]);
  }

  unregister(member: AndesImageGroupMember): void {
    this.members.update((members) =>
      members.filter((entry) => entry !== member),
    );
  }

  /** Opens the viewer on `member` (an image of this group). */
  openMember(member: AndesImageGroupMember): void {
    this.orderVersion.update((version) => version + 1);
    const custom = this.customItems();
    if (custom) {
      const src = member.previewItem()?.src;
      const index = custom.findIndex((item) => item.src === src);
      this.openAt(Math.max(0, index), member);
      return;
    }
    const index = this.previewable().indexOf(member);
    if (index >= 0) {
      this.openAt(index, member);
    }
  }

  /** Opens the viewer on the image at `index`. */
  show(index = 0): void {
    this.openAt(
      index,
      this.customItems() ? null : (this.previewable()[index] ?? null),
    );
  }

  private openAt(index: number, member: AndesImageGroupMember | null): void {
    this.openedMember = member;
    this.openedElement.set(member?.element ?? null);
    this.current.set(index);
    this.open.set(true);
  }

  /** Closes the viewer. */
  hide(): void {
    this.open.set(false);
  }

  protected onClosed(reason: AndesOverlayCloseReason): void {
    // Focus returns to the thumbnail that opened the viewer; if the user paged to another
    // image since, the one they were last looking at is the better place to land.
    const shown = this.customItems()
      ? null
      : this.previewable()[this.current()];
    if (shown && shown !== this.openedMember) {
      shown.focusTrigger();
    }
    this.openedMember = null;
    this.closed.emit(reason);
  }
}
