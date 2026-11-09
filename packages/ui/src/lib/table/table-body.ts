import { Directive, inject } from '@angular/core';

import { AndesTable } from './table';

/** Styles a native `<tbody>`, keeping its implicit `rowgroup` role. */
@Directive({
  selector: 'tbody[andesTableBody]',
  host: {
    class: 'andes-table__body',
    '[class]': "table?.partClass('body')",
    '[style]': "table?.partStyle('body')",
  },
})
export class AndesTableBody {
  protected readonly table = inject(AndesTable, { optional: true });
}
