import {
  booleanAttribute,
  computed,
  Directive,
  forwardRef,
  input,
} from '@angular/core';

import {
  ANDES_TOOLTIP_CONFIG,
  type AndesTooltipConfig,
  type AndesTooltipConfigSource,
} from './tooltip-config';
import { AndesTooltipGroup } from './tooltip-group';

/**
 * Shares defaults, and a "grouping" clock, between the tooltips inside the element it
 * is put on:
 *
 * ```html
 * <div andesTooltipProvider unique [openDelay]="300">
 *   <andes-tooltip content="Cut"><button andesTooltipTrigger>Cut</button></andes-tooltip>
 *   <andes-tooltip content="Copy"><button andesTooltipTrigger>Copy</button></andes-tooltip>
 * </div>
 * ```
 *
 * With `unique`, one tooltip is shown at a time and it glides from trigger to trigger
 * (Ant Design's "Smooth Transition"). Without it the provider only changes the timing
 * defaults, the way shadcn's `TooltipProvider` does, and the tooltips inside it share an
 * "instant reopen" window apart from the rest of the page. A tooltip's own `openDelay`,
 * `closeDelay` or `instantReopenWindow` still wins.
 */
@Directive({
  selector: '[andesTooltipProvider]',
  exportAs: 'andesTooltipProvider',
  providers: [
    AndesTooltipGroup,
    {
      provide: ANDES_TOOLTIP_CONFIG,
      useExisting: forwardRef(() => AndesTooltipProvider),
    },
  ],
})
export class AndesTooltipProvider implements AndesTooltipConfigSource {
  /** Show one tooltip at a time and glide it between triggers. Default `false`. */
  readonly unique = input(false, { transform: booleanAttribute });
  /** Default `openDelay`, in ms, for the tooltips inside. */
  readonly openDelay = input<number | undefined>(undefined);
  /** Default `closeDelay`, in ms, for the tooltips inside. */
  readonly closeDelay = input<number | undefined>(undefined);
  /** Default `instantReopenWindow`, in ms, for the tooltips inside. */
  readonly instantReopenWindow = input<number | undefined>(undefined);

  readonly config = computed<AndesTooltipConfig>(() => ({
    unique: this.unique(),
    openDelay: this.openDelay(),
    closeDelay: this.closeDelay(),
    instantReopenWindow: this.instantReopenWindow(),
  }));
}
