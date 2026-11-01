import { Directive, inject, TemplateRef } from '@angular/core';

import type {
  AndesOrgChartKey,
  AndesOrgChartLinkKind,
} from './org-chart-layout';

/** What a node template, a badge template and every node event receive about a node. */
export interface AndesOrgChartNodeContext<T = unknown> {
  /** The consumer's own data item, so `let-person` gives it directly. */
  readonly $implicit: T;
  /** The data item again, under a name. */
  readonly data: T;
  readonly key: AndesOrgChartKey;
  /** 1 for a root, as announced through `aria-level`. */
  readonly level: number;
  readonly name: string;
  readonly title: string;
  readonly avatar: string | null;
  /** One or two letters from the name, for an avatar without a photo. */
  readonly initials: string;
  /** The node's accent color: its own `color` field, else the level color, else `null`. */
  readonly color: string | null;
  /** Direct reports known so far (assistants included). */
  readonly childCount: number;
  /** Everyone below the node, at any depth (known nodes only). */
  readonly descendantCount: number;
  readonly expanded: boolean;
  /** Has reports, or reports that `loadChildren` can still fetch. */
  readonly expandable: boolean;
  /** `loadChildren` is fetching this node's reports. */
  readonly loading: boolean;
  readonly selected: boolean;
  /** Matches the current `search`. */
  readonly matched: boolean;
  /** Lies on the path from a search match up to the root. */
  readonly highlighted: boolean;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly assistant: boolean;
  /** Expands or collapses the node, as the badge does. */
  readonly toggle: () => void;
  /** Selects or deselects the node, as a click does. */
  readonly select: () => void;
}

/** What a connector template receives. */
export interface AndesOrgChartConnectorContext<T = unknown> {
  /** The SVG path data of the connector, ready for `<svg:path [attr.d]="d">`. */
  readonly $implicit: string;
  readonly d: string;
  readonly from: AndesOrgChartKey;
  readonly to: AndesOrgChartKey;
  /** `tree`, `assistant`, `stack`, or `secondary` for a dotted-line link. */
  readonly kind: AndesOrgChartLinkKind | 'secondary';
  readonly fromData: T;
  readonly toData: T;
  /** Lies on a search path. */
  readonly highlighted: boolean;
}

/*
 * The template directives below deliberately have no context guard: the chart's data type is
 * not known to a template declared inside it, so `let-` variables are left untyped (as on a plain
 * `<ng-template>`) instead of `unknown`, which would make `person.name` a type error.
 */

/**
 * Replaces the content of every card. The card itself (size, position, focus ring, selection
 * and the count badge) stays the chart's.
 *
 * ```html
 * <ng-template andesOrgChartNode let-person let-initials="initials">…</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[andesOrgChartNode]' })
export class AndesOrgChartNodeTemplate<T = unknown> {
  readonly template =
    inject<TemplateRef<AndesOrgChartNodeContext<T>>>(TemplateRef);
}

/** Replaces the content of the count badge that expands and collapses a card. */
@Directive({ selector: 'ng-template[andesOrgChartBadge]' })
export class AndesOrgChartBadgeTemplate<T = unknown> {
  readonly template =
    inject<TemplateRef<AndesOrgChartNodeContext<T>>>(TemplateRef);
}

/**
 * Extra controls floating in the chart's top start corner (a search field, export or
 * expand-all buttons). The context is the chart, so its methods are at hand.
 */
@Directive({ selector: 'ng-template[andesOrgChartToolbar]' })
export class AndesOrgChartToolbarTemplate {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Shown instead of the chart when there is no data. */
@Directive({ selector: 'ng-template[andesOrgChartEmpty]' })
export class AndesOrgChartEmptyTemplate {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Replaces the drawing of every connector. Its content is SVG, so prefix the elements with the
 * `svg:` namespace:
 *
 * ```html
 * <ng-template andesOrgChartConnector let-d>
 *   <svg:path [attr.d]="d" stroke="currentColor" fill="none" />
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[andesOrgChartConnector]' })
export class AndesOrgChartConnectorTemplate<T = unknown> {
  readonly template =
    inject<TemplateRef<AndesOrgChartConnectorContext<T>>>(TemplateRef);
}
