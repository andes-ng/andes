import {
  AndesTreeNavigation,
  AndesTreeNavigationItemRef,
  AndesTreeNavigationKey,
} from '@andes-ng/primitives';
import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  input,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';

import type { AndesOrgChartKey } from './org-chart-layout';

/** What a card needs from the chart that renders it. */
export interface OrgChartNodeHost {
  /** Pans the view just enough to bring the card into view. */
  revealNode(key: AndesOrgChartKey): void;
}

export const ORG_CHART_NODE_HOST = new InjectionToken<OrgChartNodeHost>(
  'ORG_CHART_NODE_HOST',
);

let nextId = 0;

/**
 * Registers a card with the chart's tree navigation (roving tabindex, arrow keys, typeahead).
 *
 * It implements the navigation's item contract itself instead of using the generic item
 * directive for one reason: the cards live on a panned and zoomed canvas, so moving focus must
 * never let the browser scroll the clipped viewport. Focus is moved with `preventScroll` and
 * the chart pans the card into view instead.
 *
 * @internal Not part of the public API.
 */
@Directive({
  selector: '[andesOrgChartNodeItem]',
  host: {
    '[attr.id]': 'itemId',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.data-active]': 'active() ? "" : null',
    '(focusin)': 'onFocusin()',
    '(focusout)': 'onFocusout($event)',
  },
})
export class AndesOrgChartNodeItem
  implements AndesTreeNavigationItemRef, OnInit, OnDestroy
{
  readonly key = input.required<AndesOrgChartKey>({
    alias: 'andesOrgChartNodeItem',
  });
  readonly parentKey = input<AndesOrgChartKey | null>(null);
  readonly label = input('');
  readonly nodeDisabled = input(false);

  private readonly navigation = inject(AndesTreeNavigation);
  private readonly host = inject(ORG_CHART_NODE_HOST);

  readonly element: HTMLElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly itemId = `andes-org-chart-node-${nextId++}`;

  readonly itemKey: Signal<AndesTreeNavigationKey> = this.key;
  readonly itemParentKey: Signal<AndesTreeNavigationKey | null> =
    this.parentKey;
  readonly isDisabled: Signal<boolean> = this.nodeDisabled;
  readonly isExpandable: Signal<boolean | undefined> = computed(
    () => undefined,
  );

  protected readonly active = computed(
    () => this.navigation.activeKey() === this.key(),
  );
  protected readonly tabIndex = computed(() =>
    this.navigation.tabbableKey() === this.key() ? 0 : -1,
  );

  constructor() {
    afterNextRender(() => this.navigation.onItemRendered(this));
  }

  ngOnInit(): void {
    this.navigation.register(this);
  }

  ngOnDestroy(): void {
    this.navigation.unregister(this);
  }

  getLabel(): string {
    return this.label();
  }

  focus(): void {
    this.host.revealNode(this.key());
    this.element.focus({ preventScroll: true });
  }

  reveal(): void {
    this.host.revealNode(this.key());
  }

  protected onFocusin(): void {
    this.navigation.onItemFocusin(this);
  }

  protected onFocusout(event: FocusEvent): void {
    this.navigation.onItemFocusout(this, event);
  }
}
