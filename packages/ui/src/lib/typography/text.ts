import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { AndesTypographyBase } from './typography-base';
import { TYPOGRAPHY_ICONS } from './typography-icons';
import { AndesTypographyTag } from './typography-types';

/** Inline text with colour types, modifiers, truncation, a copy button and click-to-edit. */
@Component({
  selector: 'andes-text',
  viewProviders: [TYPOGRAPHY_ICONS],
  imports: [NgIcon, NgTemplateOutlet],
  templateUrl: './typography.html',
  styleUrl: './typography.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'text',
    class: 'andes-typography andes-typography--text',
  },
})
export class AndesText extends AndesTypographyBase {
  protected readonly defaultTag = computed((): AndesTypographyTag => 'span');
}
