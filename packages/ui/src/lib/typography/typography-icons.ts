import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy, lucidePencil } from '@ng-icons/lucide';

/**
 * The lucide icons of the copy and edit actions, registered by `andes-text`, `andes-paragraph`
 * and `andes-title` (which share one template) in their own view, so applications need no
 * `provideIcons`.
 */
export const TYPOGRAPHY_ICONS = provideIcons({
  lucideCheck,
  lucideCopy,
  lucidePencil,
});
